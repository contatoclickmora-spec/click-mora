import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * RETRY AUTOMÁTICO - NOTIFICAÇÕES WHATSAPP FALHADAS
 * 
 * Executa a cada 5 minutos via scheduled automation
 * Busca encomendas com whatsapp_sent=false e tenta reenviar
 * Máximo de 3 tentativas por encomenda
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[RETRY_WHATSAPP] Iniciando verificação de notificações pendentes...');

    // BUSCAR: Encomendas com falha de envio
    const encomendasPendentes = await base44.asServiceRole.entities.Encomenda.filter({
      whatsapp_sent: false,
      status: 'aguardando'
    });

    console.log(`[RETRY_WHATSAPP] Encontradas ${encomendasPendentes.length} encomendas pendentes`);

    if (encomendasPendentes.length === 0) {
      return Response.json({ 
        message: 'Nenhuma notificação pendente',
        processed: 0 
      });
    }

    const resultados = {
      total: encomendasPendentes.length,
      enviados: 0,
      falhas: 0,
      limite_atingido: 0
    };

    // PROCESSAR: Cada encomenda pendente
    for (const encomenda of encomendasPendentes) {
      try {
        const tentativas = encomenda.whatsapp_tentativas || 0;

        // LIMITE: Máximo 3 tentativas
        if (tentativas >= 3) {
          console.log(`[RETRY_WHATSAPP] Limite de tentativas atingido para encomenda ${encomenda.id}`);
          
          // Marcar como enviado para parar tentativas
          await base44.asServiceRole.entities.Encomenda.update(encomenda.id, {
            whatsapp_sent: true,
            whatsapp_erro: 'Limite de tentativas excedido (3 tentativas)'
          });
          
          resultados.limite_atingido++;
          continue;
        }

        // DELAY: Aguardar 5 minutos desde última tentativa
        if (encomenda.whatsapp_ultima_tentativa) {
          const ultimaTentativa = new Date(encomenda.whatsapp_ultima_tentativa);
          const agora = new Date();
          const diffMinutos = (agora - ultimaTentativa) / 1000 / 60;

          if (diffMinutos < 5) {
            console.log(`[RETRY_WHATSAPP] Aguardando intervalo mínimo para encomenda ${encomenda.id}`);
            continue;
          }
        }

        // CARREGAR: Dados do morador
        const morador = await base44.asServiceRole.entities.Morador.filter({ 
          id: encomenda.morador_id 
        }).then(list => list[0]);

        if (!morador || !morador.telefone) {
          console.warn(`[RETRY_WHATSAPP] Morador sem telefone: ${encomenda.morador_id}`);
          
          await base44.asServiceRole.entities.Encomenda.update(encomenda.id, {
            whatsapp_sent: true,
            whatsapp_erro: 'Morador sem telefone'
          });
          
          resultados.falhas++;
          continue;
        }

        // VALIDAÇÃO: Ownership
        if (morador.condominio_id !== encomenda.condominio_id) {
          console.error('[RETRY_WHATSAPP] SECURITY_BREACH detectado');
          resultados.falhas++;
          continue;
        }

        // PREPARAR: Payload
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

        // ENVIAR: Para Clickmora
        const response = await fetch('https://clickmora.com.br/NotificacoesWhatsApp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(notificacaoPayload),
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Clickmora erro ${response.status}: ${errorText}`);
        }

        const clickmoraResult = await response.json();

        // MARCAR: Como enviado
        await base44.asServiceRole.entities.Encomenda.update(encomenda.id, {
          whatsapp_sent: true,
          whatsapp_tentativas: tentativas + 1,
          whatsapp_ultima_tentativa: new Date().toISOString(),
          whatsapp_erro: null
        });

        console.log(`[RETRY_WHATSAPP] ✅ Enviado com sucesso: ${encomenda.codigo}`);
        resultados.enviados++;

      } catch (encErr) {
        console.error(`[RETRY_WHATSAPP] Erro ao processar encomenda ${encomenda.id}:`, encErr);

        // REGISTRAR: Erro para próxima tentativa
        await base44.asServiceRole.entities.Encomenda.update(encomenda.id, {
          whatsapp_tentativas: (encomenda.whatsapp_tentativas || 0) + 1,
          whatsapp_erro: encErr.message,
          whatsapp_ultima_tentativa: new Date().toISOString()
        });

        resultados.falhas++;
      }
    }

    console.log('[RETRY_WHATSAPP] Processamento concluído:', resultados);

    return Response.json({ 
      success: true,
      message: 'Retry concluído',
      resultados
    });

  } catch (error) {
    console.error('[RETRY_WHATSAPP] ❌ Erro crítico:', error);
    
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});