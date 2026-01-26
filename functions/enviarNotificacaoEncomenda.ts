import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { condominioId, moradorId, encomendas } = await req.json();

    if (!condominioId || !moradorId || !encomendas || encomendas.length === 0) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const configs = await base44.asServiceRole.entities.WhatsAppConfig.filter({ condominio_id: condominioId });
    const config = configs.find(c => c.ativo);

    if (!config || !config.z_api_instance_id || !config.z_api_token) {
      return Response.json({ error: 'WhatsApp não configurado para este condomínio' }, { status: 400 });
    }

    if (!config.auto_encomendas) {
      return Response.json({ error: 'Notificações automáticas de encomendas estão desativadas' }, { status: 400 });
    }

    const moradores = await base44.asServiceRole.entities.Morador.filter({ id: moradorId });
    const morador = moradores[0];

    if (!morador || !morador.telefone) {
      return Response.json({ error: 'Morador não encontrado ou sem telefone' }, { status: 400 });
    }

    const telefone = morador.telefone.replace(/\D/g, '');
    if (telefone.length < 10) {
      return Response.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const phone = telefone.startsWith('55') ? telefone : `55${telefone}`;
    
    const quantidade = encomendas.length;
    const codigos = encomendas.map(e => e.codigo).join(', ');

    let mensagem = config.mensagem_padrao || 'ola: {nome_do_morador}\ntem {quantidade_de_encomendas} encomendas aguardando retirada\ncodigo de retirada: {codigo_qrcode}';
    
    mensagem = mensagem
      .replace(/{nome_do_morador}/g, morador.nome)
      .replace(/{quantidade_de_encomendas}/g, quantidade.toString())
      .replace(/{codigo_qrcode}/g, codigos);

    const apiUrl = `https://api.z-api.io/instances/${config.z_api_instance_id}/token/${config.z_api_token}/send-text`;

    const payload = {
      phone: phone,
      message: mensagem
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Detectar se WhatsApp foi desconectado
    if (!response.ok && result.error?.includes('disconnected')) {
      console.error('❌ WhatsApp desconectado! Atualizando status...');
      await base44.asServiceRole.entities.WhatsAppConfig.update(config.id, {
        status_conexao: 'desconectado'
      });
    }

    let erroMensagem = null;
    if (!response.ok) {
      if (result.error?.includes('disconnected')) {
        erroMensagem = '❌ WhatsApp DESCONECTADO. Reconecte seu WhatsApp escaneando o QR Code em Configurações > WhatsApp.';
      } else {
        erroMensagem = `Erro Z-API: ${result.error || result.message || JSON.stringify(result)}`;
      }
    }

    await base44.asServiceRole.entities.MensagemWhatsApp.create({
      condominio_id: condominioId,
      destinatario_nome: morador.nome,
      destinatario_telefone: morador.telefone,
      destinatario_id: morador.id,
      mensagem: mensagem,
      tipo_mensagem: 'encomenda',
      status_envio: response.ok ? 'enviado' : 'erro',
      data_envio: new Date().toISOString(),
      erro_mensagem: erroMensagem,
      enviado_por: user.email
    });

    const primeiraEncomenda = !morador.whatsapp_primeira_encomenda_enviada;

    if (primeiraEncomenda && response.ok) {
      await base44.asServiceRole.entities.Morador.update(morador.id, {
        whatsapp_primeira_encomenda_enviada: true
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const consentPayload = {
        phone: phone,
        message: "Deseja continuar recebendo notificações de entrega pelo WhatsApp?",
        optionButtons: [
          { id: "1", label: "SIM" },
          { id: "2", label: "NÃO" }
        ]
      };

      const consentUrl = `https://api.z-api.io/instances/${config.z_api_instance_id}/token/${config.z_api_token}/send-option-list`;

      await fetch(consentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentPayload)
      });
    }

    if (response.ok) {
      await base44.asServiceRole.entities.WhatsAppConfig.update(config.id, {
        mensagens_enviadas: (config.mensagens_enviadas || 0) + 1,
        ultima_sincronizacao: new Date().toISOString()
      });
    }

    return Response.json({
      success: response.ok,
      primeiraEncomenda: primeiraEncomenda,
      result: result,
      erro: !response.ok ? (result.error?.includes('disconnected') ? 'WhatsApp desconectado. Reconecte nas configurações.' : result.error || result.message) : null
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});