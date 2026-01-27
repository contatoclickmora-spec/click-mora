import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  return Response.json({ items: [], note: 'WhatsApp status polling disabled (safe mode)' });
});