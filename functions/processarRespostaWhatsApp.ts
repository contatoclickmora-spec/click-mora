import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Webhook para processar respostas dos botões do WhatsApp
 * Chamado quando morador clica em "Sim" ou "Não" na primeira mensagem
 * Z-API envia: { event_type, button_id, phone, ... }
 */
Deno.serve(async (req) => {
  console.log('🔘 [RESPOSTA WHATSAPP] ==================== INÍCIO ====================');
  console.log('🔘 [RESPOSTA WHATSAPP] Timestamp:', new Date().toISOString());

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    console.log('📦 [RESPOSTA WHATSAPP] Payload recebido:', JSON.stringify(body, null, 2));

    // Z-API envia: { event_type, phone, button_id, message_id, timestamp, ... }
    const { event_type, phone, button_id } = body;

    if (!phone || !button_id) {
      console.error('❌ [RESPOSTA WHATSAPP] Payload inválido');
      return Response.json({ error: 'Faltam phone ou button_id' }, { status: 400 });
    }

    if (event_type !== 'message_button_clicked') {
      console.log('ℹ️  [RESPOSTA WHATSAPP] Evento ignorado:', event_type);
      return Response.json({ skipped: true });
    }

    // Formatar telefone para busca (remover caracteres especiais)
    const telefoneNormalizado = phone.replace(/\D/g, '');
    console.log(`🔍 [RESPOSTA WHATSAPP] Buscando morador com telefone: ${telefoneNormalizado}`);

    // Buscar morador por telefone - usando filter com limite
    let moradores = await base44.asServiceRole.entities.Morador.filter({}, '-updated_date', 100);
    const morador = moradores.find(m => 
      m.telefone && m.telefone.replace(/\D/g, '') === telefoneNormalizado
    );

    if (!morador) {
      console.warn('⚠️  [RESPOSTA WHATSAPP] Morador não encontrado para telefone:', telefoneNormalizado);
      return Response.json({ skipped: true, reason: 'Morador não encontrado' });
    }

    console.log(`✅ [RESPOSTA WHATSAPP] Morador encontrado: ${morador.nome}`);

    // Determinar opt-in baseado no button_id
    let optIn = null;
    if (button_id === 'whatsapp_optin_yes') {
      optIn = true;
      console.log('👍 [RESPOSTA WHATSAPP] Morador ACEITOU notificações');
    } else if (button_id === 'whatsapp_optin_no') {
      optIn = false;
      console.log('👎 [RESPOSTA WHATSAPP] Morador RECUSOU notificações');
    } else {
      console.warn('⚠️  [RESPOSTA WHATSAPP] Button ID desconhecido:', button_id);
      return Response.json({ error: 'Button ID desconhecido' }, { status: 400 });
    }

    // Atualizar morador com opt-in e salvar log em paralelo
    console.log(`💾 [RESPOSTA WHATSAPP] Atualizando morador com whatsapp_optin = ${optIn}`);
    
    await Promise.all([
      base44.asServiceRole.entities.Morador.update(morador.id, {
        whatsapp_optin: optIn,
        whatsapp_optin_data: new Date().toISOString()
      }),
      base44.asServiceRole.entities.LogSistema.create({
        tipo_acao: 'configurar_whatsapp',
        usuario_email: morador.email,
        usuario_nome: morador.nome,
        condominio_id: morador.condominio_id,
        descricao: `WhatsApp Opt-in: ${optIn ? 'ACEITO' : 'RECUSADO'}`,
        dados_novos: {
          whatsapp_optin: optIn,
          button_id: button_id,
          timestamp: new Date().toISOString()
        },
        sucesso: true,
        timestamp: new Date().toISOString()
      })
    ]);

    console.log('✅ [RESPOSTA WHATSAPP] Morador atualizado com sucesso');

    console.log('🔘 [RESPOSTA WHATSAPP] ==================== FIM ====================');

    return Response.json({
      success: true,
      morador_id: morador.id,
      whatsapp_optin: optIn,
      message: `Preferência ${optIn ? 'aceita' : 'recusada'} com sucesso`
    });

  } catch (error) {
    console.error('❌ [RESPOSTA WHATSAPP] ERRO CRÍTICO:', error.message);
    console.error('❌ [RESPOSTA WHATSAPP] Stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});