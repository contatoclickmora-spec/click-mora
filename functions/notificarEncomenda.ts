import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('🔔 [WHATSAPP] ==================== INÍCIO ====================');
  console.log('🔔 [WHATSAPP] Timestamp:', new Date().toISOString());

  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    console.log('📦 [WHATSAPP] Payload recebido:', JSON.stringify(body, null, 2));

    const { event, data } = body;

    if (!event || !data) {
      console.error('❌ [WHATSAPP] Payload inválido');
      return Response.json({ error: 'Payload inválido' }, { status: 400 });
    }

    if (event.type !== 'create') {
      console.log('ℹ️ [WHATSAPP] Evento ignorado (não é create):', event.type);
      return Response.json({ skipped: true, reason: 'Não é criação' });
    }

    const encomenda = data;
    console.log(`✅ [WHATSAPP] Encomenda detectada: ${encomenda.id}`);

    // Buscar morador
    console.log('🔍 [WHATSAPP] Buscando morador:', encomenda.morador_id);
    const moradores = await base44.asServiceRole.entities.Morador.filter({ id: encomenda.morador_id });
    const morador = moradores[0];

    if (!morador) {
      console.error('❌ [WHATSAPP] Morador não encontrado');
      return Response.json({ error: 'Morador não encontrado' }, { status: 404 });
    }

    console.log('✅ [WHATSAPP] Morador encontrado:', {
      nome: morador.nome,
      telefone: morador.telefone
    });

    if (!morador.telefone) {
      console.warn('⚠️ [WHATSAPP] Morador sem telefone');
      return Response.json({ skipped: true, reason: 'Sem telefone' });
    }

    // Preparar telefone E.164
    const telefone = morador.telefone.replace(/\D/g, '');
    const phone = telefone.startsWith('55') ? telefone : `55${telefone}`;
    console.log('📞 [WHATSAPP] Telefone formatado:', phone);

    // Verificar se morador já fez opt-in
    console.log('🔍 [WHATSAPP] Verificando opt-in status...');
    const moradorOptIn = morador.whatsapp_optin;
    const isPrimeiraNotificacao = moradorOptIn === undefined;
    
    console.log(`ℹ️  [WHATSAPP] Opt-in status: ${moradorOptIn === true ? 'ACEITO' : moradorOptIn === false ? 'RECUSADO' : 'PENDENTE'}`);

    // Se morador recusou, não enviar
    if (moradorOptIn === false) {
      console.log('⏭️  [WHATSAPP] Morador recusou notificações');
      return Response.json({ skipped: true, reason: 'Morador recusou notificações' });
    }

    // Buscar configuração WhatsApp
    console.log('⚙️ [WHATSAPP] Buscando configuração WhatsApp...');
    let whatsappConfig = await base44.asServiceRole.entities.WhatsAppConfig.filter({ 
      condominio_id: encomenda.condominio_id 
    });
    whatsappConfig = whatsappConfig[0];

    if (!whatsappConfig || !whatsappConfig.ativo) {
      console.warn('⚠️ [WHATSAPP] WhatsApp não configurado ou inativo');
      return Response.json({ skipped: true, reason: 'WhatsApp não ativo' });
    }

    console.log('✅ [WHATSAPP] Config encontrada:', {
      instance: whatsappConfig.zapi_instance_id,
      ativo: whatsappConfig.ativo
    });

    // Buscar todas as encomendas pendentes do morador (do novo para o antigo)
    let encomendasPendentes = await base44.asServiceRole.entities.Encomenda.filter({ 
      morador_id: morador.id,
      status: 'aguardando'
    });

    // Ordenar por data_entrada decrescente (mais recentes primeiro)
    encomendasPendentes = encomendasPendentes.sort((a, b) => {
      const dateA = new Date(a.data_entrada);
      const dateB = new Date(b.data_entrada);
      return dateB - dateA;
    });

    const total = encomendasPendentes.length;

    // Enumerar encomendas com códigos em negrito
    const listaEncomendas = encomendasPendentes
      .map((enc, index) => `*Encomenda ${index + 1}:* ${enc.codigo}`)
      .join('\n');

    console.log('💬 [WHATSAPP] Total de encomendas:', total);
    console.log('💬 [WHATSAPP] Lista formatada:', listaEncomendas);

    // Usar template diferente conforme é primeira notificação ou não
    let templateMensagem;
    if (isPrimeiraNotificacao) {
      templateMensagem = whatsappConfig.mensagem_primeira_entrega || 
        'Olá {nome_do_morador}!\n\nVocê possui {total_encomendas} encomenda(s) aguardando retirada:\n\n{lista_encomendas}\n\nDeseja continuar recebendo notificações de entrega pelo WhatsApp?';
    } else {
      // Notificações subsequentes: apenas a lista de encomendas
      templateMensagem = 'Olá {nome_do_morador}!\n\nVocê possui {total_encomendas} encomenda(s) aguardando retirada:\n\n{lista_encomendas}';
    }

    // Renderizar placeholders
    const mensagem = templateMensagem
      .replace('{nome_do_morador}', morador.nome)
      .replace('{total_encomendas}', total.toString())
      .replace('{lista_encomendas}', listaEncomendas);

    console.log('💬 [WHATSAPP] Mensagem renderizada:', mensagem);

    // ENVIAR VIA Z-API com client-token
    const baseUrl = whatsappConfig.zapi_base_url || 'https://api.z-api.io';
    let endpoint;
    let payload;

    if (isPrimeiraNotificacao) {
      // Primeira notificação: usar /send-button-list para opt-in
      endpoint = '/send-button-list';
      payload = {
        phone: phone,
        message: mensagem,
        buttonList: {
          buttons: [
            { id: 'whatsapp_optin_yes', label: 'Sim' },
            { id: 'whatsapp_optin_no', label: 'Não' }
          ]
        }
      };
    } else {
      // Notificações subsequentes: apenas texto
      endpoint = whatsappConfig.zapi_send_text_endpoint || '/send-text';
      payload = {
        phone: phone,
        message: mensagem
      };
    }

    const apiUrl = `${baseUrl}/instances/${whatsappConfig.zapi_instance_id}/token/${whatsappConfig.zapi_token}${endpoint}`;

    console.log('📤 [WHATSAPP] Enviando para Z-API...');
    console.log('📤 [WHATSAPP] URL:', apiUrl);
    console.log('📤 [WHATSAPP] Payload:', JSON.stringify(payload, null, 2));

    let response;
    let result;

    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'client-token': whatsappConfig.zapi_client_token
        },
        body: JSON.stringify(payload)
      });

      result = await response.json();

      console.log('📥 [WHATSAPP] Resposta Z-API:');
      console.log('📥 [WHATSAPP] Status:', response.status);
      console.log('📥 [WHATSAPP] Status OK?:', response.ok);
      console.log('📥 [WHATSAPP] Body:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(`Z-API retornou ${response.status}: ${JSON.stringify(result)}`);
      }

    } catch (fetchError) {
      console.error('❌ [WHATSAPP] Erro ao chamar Z-API:', fetchError.message);
      console.error('❌ [WHATSAPP] Stack:', fetchError.stack);

      // Salvar erro
      await base44.asServiceRole.entities.MensagemWhatsApp.create({
        condominio_id: encomenda.condominio_id,
        destinatario_nome: morador.nome,
        destinatario_telefone: morador.telefone,
        destinatario_id: morador.id,
        mensagem: mensagem,
        tipo_mensagem: 'encomenda',
        status_envio: 'erro',
        data_envio: new Date().toISOString(),
        erro_mensagem: fetchError.message,
        enviado_por: 'SISTEMA_AUTO'
      });

      return Response.json({ 
        success: false, 
        error: 'Erro Z-API',
        details: fetchError.message 
      }, { status: 500 });
    }

    // Salvar log de sucesso
    console.log('💾 [WHATSAPP] Salvando log de sucesso...');

    await base44.asServiceRole.entities.MensagemWhatsApp.create({
      condominio_id: encomenda.condominio_id,
      destinatario_nome: morador.nome,
      destinatario_telefone: morador.telefone,
      destinatario_id: morador.id,
      mensagem: mensagem,
      tipo_mensagem: 'encomenda',
      status_envio: 'enviado',
      data_envio: new Date().toISOString(),
      erro_mensagem: null,
      enviado_por: 'SISTEMA_AUTO'
    });

    console.log('✅ [WHATSAPP] ==================== FIM ====================');

    return Response.json({
      success: true,
      status: response.status,
      message: 'Notificação enviada com sucesso'
    });

  } catch (error) {
    console.error('❌ [WHATSAPP] ERRO CRÍTICO:', error.message);
    console.error('❌ [WHATSAPP] Stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});