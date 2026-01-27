// Safe mode: WhatsApp service disabled globally
// Original WhatsAppConfig import removed to avoid runtime errors

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
  // Safe mode: no outbound calls
  return { success: false, error: "WhatsApp temporarily disabled (safe mode)" };
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
  return { success: false, error: "WhatsApp temporarily disabled (safe mode)" };
}