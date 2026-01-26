import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const hoje = new Date();
    const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0');
    const diaHoje = String(hoje.getDate()).padStart(2, '0');

    const configs = await base44.asServiceRole.entities.WhatsAppConfig.list();
    const configsAtivas = configs.filter(c => c.ativo && c.auto_aniversario);

    let enviados = 0;
    let erros = 0;

    for (const config of configsAtivas) {
      try {
        const moradores = await base44.asServiceRole.entities.Morador.filter({
          condominio_id: config.condominio_id,
          tipo_usuario: 'morador',
          status: 'ativo'
        });

        const aniversariantes = moradores.filter(m => {
          if (!m.data_nascimento || !m.telefone) return false;
          const dataNasc = m.data_nascimento.split('T')[0];
          const [ano, mes, dia] = dataNasc.split('-');
          return mes === mesHoje && dia === diaHoje;
        });

        for (const morador of aniversariantes) {
          try {
            const telefone = morador.telefone.replace(/\D/g, '');
            const phone = telefone.startsWith('55') ? telefone : `55${telefone}`;

            let mensagem = config.mensagem_aniversario || 'Olá, {nome_do_morador}.\nParabéns pelo seu aniversário 🎉🎂';
            mensagem = mensagem.replace(/{nome_do_morador}/g, morador.nome);

            const apiUrl = `https://api.z-api.io/instances/${config.z_api_instance_id}/token/${config.z_api_token}/send-text`;

            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: phone,
                message: mensagem
              })
            });

            const result = await response.json();

            await base44.asServiceRole.entities.MensagemWhatsApp.create({
              condominio_id: config.condominio_id,
              destinatario_nome: morador.nome,
              destinatario_telefone: morador.telefone,
              destinatario_id: morador.id,
              mensagem: mensagem,
              tipo_mensagem: 'aniversario',
              status_envio: response.ok ? 'enviado' : 'erro',
              data_envio: new Date().toISOString(),
              erro_mensagem: response.ok ? null : JSON.stringify(result),
              enviado_por: 'sistema'
            });

            if (response.ok) {
              enviados++;
            } else {
              erros++;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (err) {
            console.error(`Erro ao enviar para ${morador.nome}:`, err);
            erros++;
          }
        }

      } catch (err) {
        console.error(`Erro ao processar condomínio ${config.condominio_id}:`, err);
        erros++;
      }
    }

    return Response.json({
      success: true,
      enviados: enviados,
      erros: erros,
      data: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});