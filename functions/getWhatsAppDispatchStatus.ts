import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.log_ids) ? body.log_ids.filter(Boolean) : [];
    if (ids.length === 0) return Response.json({ items: [] });

    const all = await base44.entities.WhatsAppDispatchLog.list('-updated_date', 500);
    const set = new Set(ids);
    const items = all
      .filter(l => set.has(l.id))
      .map(l => ({ id: l.id, resident_id: l.resident_id, status: l.status, attempts: l.attempts || 0, error_message: l.error_message || null }));

    return Response.json({ items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});