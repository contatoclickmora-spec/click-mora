import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function nowIso() { return new Date().toISOString(); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const residentIds = Array.isArray(body.resident_ids) ? body.resident_ids.filter(Boolean) : [];
    if (residentIds.length === 0) return Response.json({ error: 'Nenhum morador selecionado' }, { status: 400 });

    // Descobrir contexto do usuário
    const moradoresAll = await base44.entities.Morador.list();
    const callerMorador = moradoresAll.find(m => (m.email || '').toLowerCase() === (user.email || '').toLowerCase());
    const callerTipo = callerMorador?.tipo_usuario || null;
    const canAccess = user.role === 'admin' || ['porteiro', 'administrador'].includes(callerTipo);
    if (!canAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const condominioId = callerMorador?.condominio_id || null;

    // Carregar encomendas pendentes para computar counts
    const encomendas = condominioId
      ? await base44.entities.Encomenda.filter({ condominio_id: condominioId }, '-created_date', 1000)
      : await base44.entities.Encomenda.list('-created_date');

    const pendentesPorMorador = new Map();
    for (const e of (encomendas || [])) {
      if (e?.status === 'aguardando' && e?.morador_id) {
        const c = pendentesPorMorador.get(e.morador_id) || 0;
        pendentesPorMorador.set(e.morador_id, c + 1);
      }
    }

    const moradoresMap = new Map(moradoresAll.map(m => [m.id, m]));
    const batchId = `batch_${Date.now()}`;

    const logsToCreate = [];
    for (const rid of residentIds) {
      const pkgCount = pendentesPorMorador.get(rid) || 0;
      const morador = moradoresMap.get(rid);
      const phoneRaw = (morador?.telefone || '').toString();
      const phoneDigits = phoneRaw.replace(/\D/g, '');
      let phone = null;
      if (phoneDigits.startsWith('55')) phone = `+${phoneDigits}`;
      else if (phoneDigits.length >= 10 && phoneDigits.length <= 13) phone = `+55${phoneDigits}`;

      if (!pkgCount || !phone) continue; // Ignorar inválidos

      logsToCreate.push({
        resident_id: rid,
        condominio_id: condominioId || morador?.condominio_id || '',
        package_count: pkgCount,
        phone,
        status: 'pending',
        attempts: 0,
        batch_id: batchId,
        triggered_by: user.email,
        triggered_by_name: user.full_name || user.email,
        created_at: nowIso(),
        updated_at: nowIso()
      });
    }

    if (logsToCreate.length === 0) return Response.json({ error: 'Nada a enviar' }, { status: 400 });

    // Criar logs
    const created = await base44.entities.WhatsAppDispatchLog.bulkCreate(logsToCreate);
    const logIds = (created || []).map(c => c.id).filter(Boolean);

    // Disparar processamento em paralelo (não aguardado)
    base44.asServiceRole.functions.invoke('processWhatsAppQueue', { log_ids: logIds, batch_id: batchId }).catch(() => {});

    return Response.json({ ok: true, batch_id: batchId, log_ids: logIds, created_count: logIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});