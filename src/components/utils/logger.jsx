import { LogSistema } from "@/entities/LogSistema";
import { User } from "@/entities/User";
import { Morador } from "@/entities/Morador";

/**
 * SISTEMA DE LOGS MULTI-CONDOMÍNIO
 * Registra todas as ações com contexto de condomínio
 */

export async function logAction(
  tipoAcao,
  descricao,
  dadosAdicionais = {}
) {
  try {
    const user = await User.me();
    
    if (!user || !user.email) {
      return;
    }

    // Buscar contexto do morador para obter condomínio
    let condominioId = null;
    let condominioNome = null;
    let moradorId = null;

    if (user.role !== 'admin') {
      const todosMoradores = await Morador.list();
      const moradorLogado = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (moradorLogado) {
        condominioId = moradorLogado.condominio_id || dadosAdicionais.condominio_id;
        moradorId = moradorLogado.id;
        
        // Buscar nome do condomínio se necessário
        if (condominioId && !dadosAdicionais.condominio_nome) {
          try {
            const { Condominio } = await import("@/entities/Condominio");
            const condominios = await Condominio.list();
            const cond = condominios.find(c => c.id === condominioId);
            condominioNome = cond?.nome;
          } catch (err) {
            // Silently fail
          }
        }
      }
    }

    const logData = {
      tipo_acao: tipoAcao,
      usuario_id: moradorId,
      usuario_email: user.email,
      usuario_nome: user.full_name || "Usuário",
      condominio_id: condominioId,
      condominio_nome: condominioNome || dadosAdicionais.condominio_nome,
      descricao: descricao,
      dados_anteriores: dadosAdicionais.dados_anteriores || null,
      dados_novos: dadosAdicionais.dados_novos || null,
      ip_address: dadosAdicionais.ip_address || null,
      user_agent: navigator?.userAgent || null,
      sucesso: dadosAdicionais.sucesso !== false,
      erro_mensagem: dadosAdicionais.erro_mensagem || null,
      timestamp: new Date().toISOString()
    };

    await LogSistema.create(logData);

  } catch (error) {
    // Silently fail
  }
}

/**
 * Log com validação de condomínio
 */
export async function logActionWithValidation(
  tipoAcao,
  descricao,
  condominioId,
  dadosAdicionais = {}
) {
  const { getCondominioContext } = await import("./condominioContext");
  
  try {
    const context = await getCondominioContext();
    
    // Validar que o log é para o condomínio correto
    if (!context.isAdminMaster && context.condominioId !== condominioId) {
      return;
    }

    await logAction(tipoAcao, descricao, {
      ...dadosAdicionais,
      condominio_id: condominioId
    });
  } catch (error) {
    // Silently fail
  }
}