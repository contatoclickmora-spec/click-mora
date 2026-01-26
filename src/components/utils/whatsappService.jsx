import { WhatsAppConfig } from "@/entities/WhatsAppConfig";

/**
 * Serviço de envio de WhatsApp
 * Suporta múltiplos provedores (Z-API, WhatsApp Cloud API, etc.)
 */

/**
 * Envia mensagem via Z-API
 */
async function enviarViaZAPI(config, telefone, mensagem) {
  try {
    // Validar configuração
    if (!config.z_api_instance_id) {
      throw new Error("Instance ID não configurado");
    }
    if (!config.z_api_token) {
      throw new Error("Token não configurado");
    }
    if (!config.z_api_client_token) {
      throw new Error("Client Token não configurado");
    }

    const instanceId = config.z_api_instance_id.trim();
    const token = config.z_api_token.trim();
    const clientToken = config.z_api_client_token.trim();

    // Limpar telefone (remover +, espaços, traços)
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    if (!telefoneLimpo || telefoneLimpo.length < 10) {
      throw new Error("Número de telefone inválido");
    }

    const endpoint = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

    console.log("[Z-API] Configuração:", {
      endpoint: endpoint.replace(token, 'TOKEN_OCULTO'),
      telefone: telefoneLimpo,
      mensagemLength: mensagem.length,
      temClientToken: !!clientToken
    });

    const requestBody = {
      phone: telefoneLimpo,
      message: mensagem
    };

    console.log("[Z-API] Body da requisição:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-token': clientToken
      },
      body: JSON.stringify(requestBody)
    });

    console.log("[Z-API] Status da resposta:", response.status);

    let result;
    try {
      const textResponse = await response.text();
      console.log("[Z-API] Resposta raw:", textResponse);
      
      if (textResponse) {
        result = JSON.parse(textResponse);
      } else {
        result = {};
      }
    } catch (parseError) {
      console.error("[Z-API] Erro ao parsear resposta:", parseError);
      throw new Error(`Erro ao processar resposta da Z-API (Status ${response.status})`);
    }

    console.log("[Z-API] Resposta parseada:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      // Extrair mensagem de erro de forma mais robusta
      let errorMessage = 'Erro desconhecido';
      
      if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (typeof result.error === 'object' && result.error.message) {
          errorMessage = result.error.message;
        } else {
          errorMessage = JSON.stringify(result.error);
        }
      } else if (result.statusText) {
        errorMessage = result.statusText;
      } else if (result.status) {
        errorMessage = `Status: ${result.status}`;
      }

      console.error("[Z-API] Erro detalhado:", {
        status: response.status,
        statusText: response.statusText,
        result: result,
        errorMessage: errorMessage
      });
      
      throw new Error(`Z-API retornou erro: ${errorMessage}`);
    }

    // Z-API pode retornar diferentes formatos de sucesso/erro
    // Verificar se tem campo de erro explícito
    if (result.error === true) {
      const errorMsg = result.message || result.statusText || 'Erro desconhecido';
      throw new Error(`Z-API: ${errorMsg}`);
    }

    // Verificar status textual
    if (result.status && result.status.toLowerCase() === 'error') {
      const errorMsg = result.message || result.statusText || 'Erro desconhecido';
      throw new Error(`Z-API: ${errorMsg}`);
    }

    console.log("[Z-API] ✅ Mensagem enviada com sucesso!");
    return { success: true, data: result };

  } catch (error) {
    console.error("[Z-API] ❌ Erro completo:", {
      message: error.message,
      stack: error.stack,
      config: {
        hasInstanceId: !!config.z_api_instance_id,
        hasToken: !!config.z_api_token,
        hasClientToken: !!config.z_api_client_token
      }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Envia mensagem via WhatsApp Cloud API (Meta)
 */
async function enviarViaWhatsAppCloudAPI(config, telefone, mensagem) {
  try {
    if (!config.api_key) {
      throw new Error("Token de API não configurado");
    }

    if (!config.numero_whatsapp) {
      throw new Error("Phone Number ID não configurado");
    }

    const phoneNumberId = config.numero_whatsapp.replace(/\D/g, '');
    const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const telefoneLimpo = telefone.replace(/\D/g, '');

    console.log("[WhatsApp Cloud API] Enviando mensagem para:", telefoneLimpo);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefoneLimpo,
        type: "text",
        text: { body: mensagem }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error?.message || result.message || response.statusText;
      throw new Error(`WhatsApp Cloud API: ${errorMessage}`);
    }

    console.log("[WhatsApp Cloud API] Mensagem enviada com sucesso:", result);
    return { success: true, data: result };

  } catch (error) {
    console.error("[WhatsApp Cloud API] Erro ao enviar mensagem:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Função principal para enviar notificação WhatsApp
 * @param {string} condominioId - ID do condomínio
 * @param {string} telefone - Número do telefone no formato internacional (+5511999999999)
 * @param {string} mensagem - Mensagem a ser enviada
 * @param {string} nomeDestinatario - Nome do destinatário (para logs)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendWhatsAppNotification(condominioId, telefone, mensagem, nomeDestinatario = "Destinatário") {
  try {
    console.log(`[WhatsApp] 📤 Preparando envio para ${nomeDestinatario} (${telefone})`);

    // Buscar configuração do condomínio
    const configs = await WhatsAppConfig.filter({ condominio_id: condominioId });
    
    if (configs.length === 0) {
      console.warn(`[WhatsApp] ⚠️ Nenhuma configuração encontrada para condomínio ${condominioId}`);
      return { success: false, error: "WhatsApp não configurado para este condomínio" };
    }

    const config = configs[0];

    // Verificar se está ativo
    if (!config.ativo) {
      console.warn(`[WhatsApp] ⚠️ Configuração inativa para condomínio ${condominioId}`);
      return { success: false, error: "WhatsApp está desativado para este condomínio" };
    }

    // Validar telefone
    if (!telefone || telefone.trim() === '') {
      console.warn(`[WhatsApp] ⚠️ Telefone vazio para ${nomeDestinatario}`);
      return { success: false, error: "Número de telefone não informado" };
    }

    // Formatar telefone (garantir formato correto)
    let telefoneFormatado = telefone.replace(/\D/g, '');
    
    // Adicionar código do Brasil se não tiver
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    console.log("[WhatsApp] 📱 Telefone formatado:", telefoneFormatado);
    console.log("[WhatsApp] 🔌 Provedor:", config.api_provider);

    // Enviar via provedor configurado
    let resultado;
    
    switch (config.api_provider) {
      case 'z_api':
        resultado = await enviarViaZAPI(config, telefoneFormatado, mensagem);
        break;
      
      case 'whatsapp_cloud_api':
        resultado = await enviarViaWhatsAppCloudAPI(config, telefoneFormatado, mensagem);
        break;
      
      default:
        console.warn(`[WhatsApp] ⚠️ Provedor não suportado: ${config.api_provider}`);
        return { success: false, error: `Provedor ${config.api_provider} não implementado` };
    }

    // Atualizar contador de mensagens
    if (resultado.success) {
      try {
        await WhatsAppConfig.update(config.id, {
          mensagens_enviadas: (config.mensagens_enviadas || 0) + 1,
          ultima_sincronizacao: new Date().toISOString(),
          status_conexao: 'conectado'
        });
        console.log("[WhatsApp] ✅ Contador atualizado");
      } catch (updateError) {
        console.warn("[WhatsApp] ⚠️ Erro ao atualizar contador:", updateError);
        // Não falhar o envio por causa disso
      }
    } else {
      // Atualizar status de erro
      try {
        await WhatsAppConfig.update(config.id, {
          status_conexao: 'erro'
        });
      } catch (updateError) {
        console.warn("[WhatsApp] ⚠️ Erro ao atualizar status:", updateError);
      }
    }

    return resultado;

  } catch (error) {
    console.error("[WhatsApp] ❌ Erro geral ao enviar notificação:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Substitui variáveis no template de mensagem
 * @param {string} template - Template com variáveis {{var}}
 * @param {object} vars - Objeto com as variáveis {nome: "João", codigo: "12345"}
 * @returns {string}
 */
export function substituirVariaveisTemplate(template, vars) {
  let mensagem = template;
  
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    mensagem = mensagem.replace(regex, vars[key] || '');
  });
  
  return mensagem;
}

/**
 * Envia notificação de nova encomenda
 * @param {object} morador - Dados do morador
 * @param {string} codigoEncomenda - Código da encomenda
 * @param {string} condominioId - ID do condomínio
 * @returns {Promise<{success: boolean}>}
 */
export async function notificarNovaEncomenda(morador, codigoEncomenda, condominioId) {
  try {
    // Buscar template da mensagem
    const configs = await WhatsAppConfig.filter({ condominio_id: condominioId });
    
    if (configs.length === 0 || !configs[0].ativo) {
      return { success: false, error: "WhatsApp não configurado" };
    }

    const template = configs[0].mensagem_template || 
      "📦 Olá {{nome}}, sua entrega chegou na portaria! Código: {{codigo}}. Por favor, retire assim que possível. Obrigado!";

    // Preparar variáveis
    const vars = {
      nome: morador.nome,
      codigo: codigoEncomenda,
      endereco: morador.endereco || morador.apelido_endereco || ''
    };

    // Substituir variáveis
    const mensagem = substituirVariaveisTemplate(template, vars);

    // Enviar notificação
    return await sendWhatsAppNotification(
      condominioId,
      morador.telefone,
      mensagem,
      morador.nome
    );

  } catch (error) {
    console.error("[WhatsApp] Erro ao notificar nova encomenda:", error);
    return { success: false, error: error.message };
  }
}