import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function fetchZapi(config, phone, message) {
  const baseUrl = (config.zapi_base_url || '').replace(/\/$/, '');
  const endpoint = config.zapi_send_text_endpoint || '/send-text';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  if (config.zapi_client_token) headers.set('Client-Token', config.zapi_client_token);
  if (config.zapi_token) headers.set('Authorization', `Bearer ${config.zapi_token}`);

  const payload = { phone, message };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const text = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body: text };
}

function shortText(t, max = 1000) { try { return (t || '').slice(0, max); } catch { return ''; } }
function nowIso() { return new Date().toISOString(); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Pode ser chamado via service role (sem usuário final)
    let body = {};
    try { body = await req.json(); } catch {}

    const logIds = Array.isArray(body.log_ids) ? body.log_ids.filter(Boolean) : [];
    const batchId = body.batch_id || null;

    let logs = [];
    if (logIds.length > 0) {
      const all = await base44.asServiceRole.entities.WhatsAppDispatchLog.list();
      const set = new Set(logIds);
      logs = all.filter(l => set.has(l.id));
    } else {
      // Processar primeiros 25 pendentes
      const all = await base44.asServiceRole.entities.WhatsAppDispatchLog.list('-created_date', 200);
      logs = all.filter(l => l.status === 'pending' || (l.status === 'error' && (l.attempts || 0) < 3)).slice(0, 25);
    }

    // Agrupar por condomínio para obter config certa
    const byCondo = new Map();
    for (const log of logs) {
      const list = byCondo.get(log.condominio_id || 'global') || [];
      list.push(log);
      byCondo.set(log.condominio_id || 'global', list);
    }

    for (const [condoId, list] of byCondo.entries()) {
      // Buscar config ativa do condomínio
      let cfg = null;
      try {
        const configs = condoId ? await base44.asServiceRole.entities.WhatsAppConfig.filter({ condominio_id: condoId }) : await base44.asServiceRole.entities.WhatsAppConfig.list();
        cfg = (configs || []).find(c => c?.ativo);
      } catch {}

      for (const log of list) {
        // Atualizar para sending
        await base44.asServiceRole.entities.WhatsAppDispatchLog.update(log.id, { status: 'sending', attempts: (log.attempts || 0) + 1, updated_at: nowIso() }).catch(()=>{});

        // Validar dados
        const pkgCount = Number(log.package_count || 0);
        if (!cfg || !pkgCount || !log.phone) {
          await base44.asServiceRole.entities.WhatsAppDispatchLog.update(log.id, { status: 'error', error_message: !cfg ? 'Configuração Z-API não encontrada/ativa' : (!pkgCount ? 'Sem encomendas' : 'Telefone inválido'), updated_at: nowIso() }).catch(()=>{});
          continue;
        }

        const message = `Você possui ${pkgCount} encomenda(s) aguardando retirada na portaria.`;

        let result;
        try {
          result = await fetchZapi(cfg, log.phone, message);
        } catch (err) {
          await base44.asServiceRole.entities.WhatsAppDispatchLog.update(log.id, {
            status: (log.attempts || 0) + 1 >= 3 ? 'error' : 'pending',
            error_message: shortText(err?.message || 'Falha ao chamar Z-API'),
            zapi_response: '',
            updated_at: nowIso()
          }).catch(()=>{});
          continue;
        }

        if (result.ok) {
          await base44.asServiceRole.entities.WhatsAppDispatchLog.update(log.id, { status: 'sent', zapi_response: shortText(result.body, 1500), updated_at: nowIso() }).catch(()=>{});
        } else {
          const nextStatus = (log.attempts || 0) + 1 >= 3 ? 'error' : 'pending';
          await base44.asServiceRole.entities.WhatsAppDispatchLog.update(log.id, { status: nextStatus, error_message: `HTTP ${result.status}`, zapi_response: shortText(result.body, 1500), updated_at: nowIso() }).catch(()=>{});
        }
      }
    }

    return Response.json({ ok: true, processed: logs.length, batch_id: batchId || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});