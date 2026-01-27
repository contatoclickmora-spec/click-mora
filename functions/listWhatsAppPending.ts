import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function toE164(brPhone) {
  try {
    if (!brPhone || typeof brPhone !== 'string') return null;
    let digits = brPhone.replace(/\D/g, '');
    if (digits.startsWith('55')) return `+${digits}`;
    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
    if (digits.length >= 10 && digits.length <= 13) return `+55${digits}`;
    if (digits.length >= 12 && digits.length <= 14) return `+${digits}`;
    return null;
  } catch { return null; }
}

async function getRoleInfo(base44, userEmail) {
  const moradores = await base44.entities.Morador.list();
  const morador = moradores.find(m => (m.email || '').toLowerCase() === (userEmail || '').toLowerCase());
  return {
    tipo_usuario: morador?.tipo_usuario || null,
    condominio_id: morador?.condominio_id || null,
    morador_id: morador?.id || null,
    nome: morador?.nome || null
  };
}

Deno.serve(async (req) => {
  return Response.json({ items: [], note: 'WhatsApp pending list disabled (safe mode)' });
});