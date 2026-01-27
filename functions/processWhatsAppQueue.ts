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
  return Response.json({ ok: true, processed: 0, note: 'WhatsApp dispatch disabled (safe mode)' });
});