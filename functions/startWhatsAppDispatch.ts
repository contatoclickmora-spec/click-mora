import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function nowIso() { return new Date().toISOString(); }

Deno.serve(async (req) => {
  return Response.json({ ok: true, note: 'WhatsApp dispatch disabled (safe mode)', log_ids: [], created_count: 0 });
});