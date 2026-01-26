import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * INTEGRAÇÃO WHATSAPP - CLICKMORA
 * Envia notificação de nova encomenda via WhatsApp
 * 
 * Gatilho: Automação de entidade (onCreate)
 * Retry: Automático com intervalo de 5 minutos
 * Idempotência: Campo whatsapp_sent previne duplicação
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('[WHATSAPP] Processando notificação de encomenda:', payload);

    // VALIDAÇÃO: Payload obrigatório
    if (!payload || !payload.event || !payload.data) {
      return Response.json({ 
        error: 'Payload inválido' 
      }, { status: 400 });
    }

    const { event, data: encomenda } = payload;

    // PROTEÇÃO: Processar apenas criações e status aguardando
    if (event.type !== 'create') {
      console.log('[WHATSAPP] Ignorando evento não-create:', event.type);
      return Response.json({ 
        message: 'Evento ignorado (não é criação)',
        skipped: true 
      });
    }

    if (!encomenda || encomenda.status !== 'aguardando') {
      console.log('[WHATSAPP] Ignorando encomenda com status:', encomenda?.status);
      return Response.json({ 
        message: 'Status não requer notificação',
        skipped: true 
      });
    }

    // IDEMPOTÊNCIA: Verificar se já foi enviado
    if (encomenda.whatsapp_sent === true) {
      console.log('[WHATSAPP] Notificação já enviada anteriormente');
      return Response.json({ 
        message: 'Notificação já enviada',
        duplicate: true 
      });
    }

    // VALIDAÇÃO: Dados obrigatórios
    if (!encomenda.morador_id || !encomenda.condominio_id || !encomenda.codigo) {
      throw new Error('Dados obrigatórios ausentes na encomenda');
    }

    // PROTEÇÃO: Carregar morador com service role
    const morador = await base44.asServiceRole.entities.Morador.filter({ 
      id: encomenda.morador_id 
    }).then(list => list[0]);

    if (!morador) {
      throw new Error(`Morador ${encomenda.morador_id} não encontrado`);
    }

    // VALIDAÇÃO CRÍTICA: Ownership (morador pertence ao condomínio)
    if (morador.condominio_id !== encomenda.condominio_id) {
      throw new Error('SECURITY_BREACH: Morador não pertence ao condomínio da encomenda');
    }

    // VALIDAÇÃO: Telefone disponível
    if (!morador.telefone) {
      console.warn('[WHATSAPP] Morador sem telefone cadastrado:', morador.nome);
      
      // Marcar como enviado para não tentar novamente
      await base44.asServiceRole.entities.Encomenda.update(encomenda.id, {
        whatsapp_sent: true,
        whatsapp_erro: 'Morador sem telefone cadastrado',
        whatsapp_ultima_tentativa: new Date().toISOString()
      });

      return Response.json({ 
        message: 'Morador sem telefone',
        skipped: true 
      });
    }

    // PREPARAR PAYLOAD PARA CLICKMORA
    const notificacaoPayload = {
      condominio_id: encomenda.condominio_id,
      morador_nome: morador.nome,
      morador_telefone: morador.telefone,
      apartamento_bloco: morador.apelido_endereco || morador.abreviacao || morador.endereco,
      tipo_encomenda: encomenda.remetente || 'Encomenda',
      codigo_retirada: encomenda.codigo,
      link_para_retirada: `https://app.base44.com/encomendas/${encomenda.id}`,
      data_chegada: encomenda.data_entrada,
      observacoes: encomenda.observacoes || ''
    };

    console.log('[WHATSAPP] Enviando para Clickmora:', notificacaoPayload);

    // ENVIAR PARA CLICKMORA
    const clickmoraResponse = await fetch('https://clickmora.com.br/NotificacoesWhatsApp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(notificacaoPayload),
      signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
    });

    if (!clickmoraResponse.ok) {
      const errorText = await clickmoraResponse.text();
      throw new Error(`Clickmora retornou erro ${clickmoraResponse.status}: ${errorText}`);
    }

    const clickmoraResult = await clickmoraResponse.json();
    console.log('[WHATSAPP] ✅ Resposta Clickmora:', clickmoraResult);

    // MARCAR COMO ENVIADO
    await base44.asServiceRole.entities.Encomenda.update(encomenda.id, {
      whatsapp_sent: true,
      whatsapp_tentativas: (encomenda.whatsapp_tentativas || 0) + 1,
      whatsapp_ultima_tentativa: new Date().toISOString(),
      whatsapp_erro: null
    });

    // REGISTRAR LOG DE SUCESSO
    await base44.asServiceRole.entities.LogSistema.create({
      tipo_acao: 'enviar_notificacao_whatsapp',
      usuario_email: 'system@packagemanager.com',
      usuario_nome: 'Sistema Automático',
      condominio_id: encomenda.condominio_id,
      descricao: `Notificação WhatsApp enviada para ${morador.nome} - Encomenda ${encomenda.codigo}`,
      dados_novos: {
        encomenda_id: encomenda.id,
        morador_id: morador.id,
        telefone: morador.telefone,
        clickmora_response: clickmoraResult
      },
      sucesso: true,
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: 'Notificação WhatsApp enviada com sucesso',
      encomenda_id: encomenda.id,
      morador_nome: morador.nome,
      clickmora_response: clickmoraResult
    });

  } catch (error) {
    console.error('[WHATSAPP] ❌ Erro ao processar notificação:', error);

    // TENTAR EXTRAIR ENCOMENDA_ID DO PAYLOAD
    let encomendaId = null;
    let condominioId = null;
    
    try {
      const payload = await req.clone().json();
      encomendaId = payload?.data?.id;
      condominioId = payload?.data?.condominio_id;
    } catch (e) {
      // Ignorar erro de parse
    }

    // REGISTRAR ERRO PARA RETRY
    if (encomendaId) {
      try {
        const base44 = createClientFromRequest(req);
        
        await base44.asServiceRole.entities.Encomenda.update(encomendaId, {
          whatsapp_sent: false,
          whatsapp_tentativas: (encomenda?.whatsapp_tentativas || 0) + 1,
          whatsapp_erro: error.message || 'Erro desconhecido',
          whatsapp_ultima_tentativa: new Date().toISOString()
        });

        // LOG DE ERRO
        if (condominioId) {
          await base44.asServiceRole.entities.LogSistema.create({
            tipo_acao: 'erro_sistema',
            usuario_email: 'system@packagemanager.com',
            usuario_nome: 'Sistema Automático',
            condominio_id: condominioId,
            descricao: `Erro ao enviar notificação WhatsApp - Encomenda ${encomendaId}`,
            erro_mensagem: error.message,
            sucesso: false,
            timestamp: new Date().toISOString()
          });
        }

        console.log('[WHATSAPP] Erro registrado para retry futuro');
        
      } catch (updateErr) {
        console.error('[WHATSAPP] Erro ao registrar falha:', updateErr);
      }
    }

    return Response.json({ 
      error: error.message,
      success: false,
      retry_scheduled: true
    }, { status: 500 });
  }
});