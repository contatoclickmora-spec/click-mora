import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { tipo_emergencia } = await req.json();

    if (!tipo_emergencia) {
      return Response.json({ error: 'Tipo de emergência não informado' }, { status: 400 });
    }

    // Buscar dados do usuário
    const moradores = await base44.asServiceRole.entities.Morador.list();
    const usuarioLogado = moradores.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());

    if (!usuarioLogado || !usuarioLogado.condominio_id) {
      return Response.json({ error: 'Usuário não encontrado ou sem condomínio' }, { status: 400 });
    }

    const condominioId = usuarioLogado.condominio_id;

    // Formatar telefone
    let telefoneFormatado = usuarioLogado.telefone || 'Não informado';
    if (telefoneFormatado !== 'Não informado' && !telefoneFormatado.startsWith('+55')) {
      telefoneFormatado = `+55${telefoneFormatado.replace(/\D/g, '')}`;
    }

    // Determinar cargo
    const cargoMap = {
      'morador': 'Morador',
      'administrador': 'Síndico',
      'porteiro': 'Porteiro'
    };
    const cargo = cargoMap[usuarioLogado.tipo_usuario] || 'Usuário';

    // Buscar síndicos e porteiros do condomínio
    const destinatarios = moradores.filter(m => 
      m.condominio_id === condominioId && 
      (m.tipo_usuario === 'administrador' || m.tipo_usuario === 'porteiro') &&
      m.status === 'ativo' &&
      m.telefone
    );

    if (destinatarios.length === 0) {
      return Response.json({ 
        error: 'Nenhum síndico ou porteiro disponível para receber o alerta',
        warning: true 
      }, { status: 400 });
    }

    // Buscar configuração WhatsApp
    const configs = await base44.asServiceRole.entities.WhatsAppConfig.list();
    const config = configs.find(c => c.condominio_id === condominioId && c.ativo);

    if (!config) {
      return Response.json({ 
        error: 'WhatsApp não configurado para este condomínio',
        warning: true 
      }, { status: 400 });
    }

    // Montar mensagem
    const mensagem = `🚨 *URGENTE* 🚨
O ${cargo} *${usuarioLogado.nome}* solicita ajuda.

Tipo de emergência: *${tipo_emergencia}*

Tome a melhor decisão possível.

Número da vítima: ${telefoneFormatado}`;

    // Enviar mensagens via Z-API
    let enviosComSucesso = 0;
    const destinatariosIds = [];

    for (const destinatario of destinatarios) {
      try {
        const telefoneDestinatario = destinatario.telefone.replace(/\D/g, '');
        
        const response = await fetch(`${config.zapi_base_url}/instances/${config.zapi_instance_id}${config.zapi_send_text_endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': config.zapi_client_token
          },
          body: JSON.stringify({
            phone: telefoneDestinatario,
            message: mensagem
          })
        });

        if (response.ok) {
          enviosComSucesso++;
          destinatariosIds.push(destinatario.id);

          // Registrar mensagem
          await base44.asServiceRole.entities.MensagemWhatsApp.create({
            condominio_id: condominioId,
            destinatario_nome: destinatario.nome,
            destinatario_telefone: destinatario.telefone,
            destinatario_id: destinatario.id,
            mensagem: mensagem,
            tipo_mensagem: 'outro',
            status_envio: 'enviado',
            data_envio: new Date().toISOString(),
            enviado_por: user.email
          });
        }
      } catch (err) {
        console.error(`Erro ao enviar para ${destinatario.nome}:`, err);
      }
    }

    // Registrar alerta SOS
    const alertaSOS = await base44.asServiceRole.entities.AlertaSOS.create({
      usuario_id: usuarioLogado.id,
      usuario_nome: usuarioLogado.nome,
      usuario_cargo: usuarioLogado.tipo_usuario,
      usuario_telefone: telefoneFormatado,
      condominio_id: condominioId,
      tipo_emergencia: tipo_emergencia,
      data_hora: new Date().toISOString(),
      mensagens_enviadas: enviosComSucesso,
      destinatarios: destinatariosIds,
      status_envio: enviosComSucesso === destinatarios.length ? 'sucesso' : (enviosComSucesso > 0 ? 'parcial' : 'erro')
    });

    return Response.json({
      success: true,
      mensagens_enviadas: enviosComSucesso,
      total_destinatarios: destinatarios.length,
      alerta_id: alertaSOS.id
    });

  } catch (error) {
    console.error('Erro ao enviar alerta SOS:', error);
    return Response.json({ 
      error: error.message || 'Erro ao enviar alerta de emergência'
    }, { status: 500 });
  }
});