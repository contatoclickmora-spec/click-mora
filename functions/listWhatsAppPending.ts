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
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = await getRoleInfo(base44, user.email);
    const canAccess = user.role === 'admin' || ['porteiro', 'administrador'].includes(role.tipo_usuario);
    if (!canAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (!role.condominio_id) return Response.json({ items: [] });

    const [encomendas, moradores] = await Promise.all([
      base44.entities.Encomenda.filter({ condominio_id: role.condominio_id }, '-created_date', 500),
      base44.entities.Morador.filter({ condominio_id: role.condominio_id }, 'nome', 1000)
    ]);

    const moradoresMap = new Map(moradores.map(m => [m.id, m]));
    const pendentes = (encomendas || []).filter(e => e?.status === 'aguardando' && e?.morador_id);

    const grouped = new Map();
    for (const enc of pendentes) {
      const rid = enc.morador_id;
      if (!grouped.has(rid)) grouped.set(rid, []);
      grouped.get(rid).push(enc);
    }

    const items = [];
    for (const [resident_id, list] of grouped.entries()) {
      const morador = moradoresMap.get(resident_id);
      const phone = toE164(morador?.telefone || '');
      if (!morador || !phone) continue;
      items.push({
        resident_id,
        name: morador.nome || 'Morador',
        phone,
        package_count: list.length
      });
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    return Response.json({ items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});