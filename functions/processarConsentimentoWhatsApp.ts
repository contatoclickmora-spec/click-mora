import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { phone, buttonId, moradorId } = await req.json();

    if (!phone || !buttonId || !moradorId) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const consentimento = buttonId === "1" ? "aceito" : "recusado";

    await base44.asServiceRole.entities.Morador.update(moradorId, {
      whatsapp_notificacoes: consentimento
    });

    return Response.json({
      success: true,
      consentimento: consentimento
    });

  } catch (error) {
    console.error('Erro ao processar consentimento:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});