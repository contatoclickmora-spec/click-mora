import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('🎂 [ANIVERSÁRIOS] ==================== INÍCIO ====================');
  console.log('🎂 [ANIVERSÁRIOS] Timestamp:', new Date().toISOString());

  try {
    const base44 = createClientFromRequest(req);
    
    // Obter parâmetro opcional de condomínio (se não for chamado por automação)
    const body = req.method === 'POST' ? await req.json() : {};
    const condominioId = body.condominio_id;

    // Buscar todos os moradores com aniversário hoje
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');

    console.log(`🎂 [ANIVERSÁRIOS] Buscando aniversários de ${dia}/${mes}`);

    let moradores;
    if (condominioId) {
      moradores = await base44.asServiceRole.entities.Morador.filter({ 
        condominio_id: condominioId 
      });
    } else {
      moradores = await base44.asServiceRole.entities.Morador.list();
    }

    // Filtrar moradores com aniversário hoje
    const aniversariantes = moradores.filter(m => {
      if (!m.data_nascimento) return false;
      const dataNasc = new Date(m.data_nascimento);
      const diaMes = String(dataNasc.getDate()).padStart(2, '0') + '/' + 
                     String(dataNasc.getMonth() + 1).padStart(2, '0');
      return diaMes === `${dia}/${mes}`;
    });

    console.log(`🎂 [ANIVERSÁRIOS] Found ${aniversariantes.length} aniversariantes`);

    const resultados = {
      timestamp: new Date().toISOString(),
      total_aniversariantes: aniversariantes.length,
      enviadas: 0,
      falhadas: 0,
      detalhes: []
    };

    // Processar cada aniversariante
    for (const morador of aniversariantes) {
      try {
        console.log(`🎂 [ANIVERSÁRIOS] Processando: ${morador.nome}`);

        // Verificar consentimento e telefone
        if (!morador.telefone) {
          console.warn(`⚠️ [ANIVERSÁRIOS] ${morador.nome} sem telefone`);
          resultados.falhadas++;
          resultados.detalhes.push({
            morador_id: morador.id,
            morador_nome: morador.nome,
            status: 'FALHOU',
            motivo: 'Sem telefone'
          });
          continue;
        }

        if (morador.whatsapp_notificacoes === 'recusado') {
          console.log(`⏭️  [ANIVERSÁRIOS] ${morador.nome} recusou notificações`);
          resultados.falhadas++;
          resultados.detalhes.push({
            morador_id: morador.id,
            morador_nome: morador.nome,
            status: 'PULADO',
            motivo: 'Recusou notificações'
          });
          continue;
        }

        // Buscar configuração WhatsApp
        const configs = await base44.asServiceRole.entities.WhatsAppConfig.filter({ 
          condominio_id: morador.condominio_id 
        });
        const config = configs[0];

        if (!config || !config.ativo) {
          console.warn(`⚠️ [ANIVERSÁRIOS] WhatsApp não ativo para condomínio ${morador.condominio_id}`);
          resultados.falhadas++;
          resultados.detalhes.push({
            morador_id: morador.id,
            morador_nome: morador.nome,
            status: 'FALHOU',
            motivo: 'WhatsApp não configurado'
          });
          continue;
        }

        // Preparar mensagem
        const mensagem = `🎉 Olá ${morador.nome}!\n\nA equipe do condomínio deseja um feliz aniversário! 🥳🎂\nQue seu dia seja incrível!`;
        const telefone = morador.telefone.replace(/\D/g, '');
        const phone = telefone.startsWith('55') ? telefone : `55${telefone}`;

        // Enviar via Z-API
        const baseUrl = config.zapi_base_url || 'https://api.z-api.io';
        const endpoint = config.zapi_send_text_endpoint || '/send-text';
        const apiUrl = `${baseUrl}/instances/${config.zapi_instance_id}/token/${config.zapi_token}${endpoint}`;

        console.log(`📤 [ANIVERSÁRIOS] Enviando para ${morador.nome} (${phone})`);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'client-token': config.zapi_client_token
          },
          body: JSON.stringify({
            phone: phone,
            message: mensagem
          })
        });

        if (response.ok) {
          resultados.enviadas++;
          console.log(`✅ [ANIVERSÁRIOS] Enviada para ${morador.nome}`);
          resultados.detalhes.push({
            morador_id: morador.id,
            morador_nome: morador.nome,
            status: 'ENVIADA',
            telefone: phone
          });

          // Salvar log
          await base44.asServiceRole.entities.MensagemWhatsApp.create({
            condominio_id: morador.condominio_id,
            destinatario_nome: morador.nome,
            destinatario_telefone: morador.telefone,
            destinatario_id: morador.id,
            mensagem: mensagem,
            tipo_mensagem: 'aniversario',
            status_envio: 'enviado',
            data_envio: new Date().toISOString(),
            enviado_por: 'SISTEMA_ANIVERSARIOS'
          });
        } else {
          const result = await response.json();
          resultados.falhadas++;
          console.error(`❌ [ANIVERSÁRIOS] Erro ao enviar para ${morador.nome}: ${response.status}`);
          resultados.detalhes.push({
            morador_id: morador.id,
            morador_nome: morador.nome,
            status: 'FALHOU',
            motivo: result.error || `HTTP ${response.status}`
          });

          // Salvar erro
          await base44.asServiceRole.entities.MensagemWhatsApp.create({
            condominio_id: morador.condominio_id,
            destinatario_nome: morador.nome,
            destinatario_telefone: morador.telefone,
            destinatario_id: morador.id,
            mensagem: mensagem,
            tipo_mensagem: 'aniversario',
            status_envio: 'erro',
            data_envio: new Date().toISOString(),
            erro_mensagem: result.error || `HTTP ${response.status}`,
            enviado_por: 'SISTEMA_ANIVERSARIOS'
          });
        }
      } catch (error) {
        console.error(`❌ [ANIVERSÁRIOS] Erro ao processar ${morador.nome}:`, error.message);
        resultados.falhadas++;
        resultados.detalhes.push({
          morador_id: morador.id,
          morador_nome: morador.nome,
          status: 'FALHOU',
          motivo: error.message
        });
      }
    }

    console.log('🎂 [ANIVERSÁRIOS] Resumo:', resultados);
    console.log('🎂 [ANIVERSÁRIOS] ==================== FIM ====================');

    return Response.json(resultados);

  } catch (error) {
    console.error('❌ [ANIVERSÁRIOS] ERRO CRÍTICO:', error.message);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});