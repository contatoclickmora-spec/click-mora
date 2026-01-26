/**
 * INTEGRIDADE REFERENCIAL E DELEÇÃO EM CASCADE
 * Garante consistência de dados ao deletar entidades pai
 */

import { base44 } from "@/api/base44Client";

/**
 * Deleta condomínio e todos os dados relacionados (Cascade)
 * ATENÇÃO: Operação irreversível
 */
export async function cascadeDeleteCondominio(condominioId) {
  if (!condominioId) {
    throw new Error('ID do condomínio é obrigatório');
  }

  console.log(`[DATA_INTEGRITY] Iniciando cascade delete para condomínio ${condominioId}`);

  try {
    // 1. Deletar todas as encomendas
    const encomendas = await base44.entities.Encomenda.filter({ condominio_id: condominioId });
    for (const enc of encomendas) {
      await base44.entities.Encomenda.delete(enc.id);
    }
    console.log(`[CASCADE] Deletadas ${encomendas.length} encomendas`);

    // 2. Deletar todos os chamados
    const chamados = await base44.entities.Chamado.list();
    const chamadosDoCondominio = chamados.filter(c => {
      // Chamados não têm condominio_id direto, filtrar por morador
      return c.condominio_id === condominioId;
    });
    for (const chamado of chamadosDoCondominio) {
      await base44.entities.Chamado.delete(chamado.id);
    }
    console.log(`[CASCADE] Deletados ${chamadosDoCondominio.length} chamados`);

    // 3. Deletar visitantes
    const moradores = await base44.entities.Morador.filter({ condominio_id: condominioId });
    const moradoresIds = moradores.map(m => m.id);
    const visitantes = await base44.entities.Visitante.list();
    const visitantesDoCondominio = visitantes.filter(v => moradoresIds.includes(v.morador_id));
    for (const visitante of visitantesDoCondominio) {
      await base44.entities.Visitante.delete(visitante.id);
    }
    console.log(`[CASCADE] Deletados ${visitantesDoCondominio.length} visitantes`);

    // 4. Deletar avisos
    const avisos = await base44.entities.Aviso.filter({ condominio_id: condominioId });
    for (const aviso of avisos) {
      await base44.entities.Aviso.delete(aviso.id);
    }
    console.log(`[CASCADE] Deletados ${avisos.length} avisos`);

    // 5. Deletar enquetes
    const enquetes = await base44.entities.Enquete.filter({ condominio_id: condominioId });
    for (const enquete of enquetes) {
      // Deletar perguntas da enquete
      const perguntas = await base44.entities.PerguntaEnquete.filter({ enquete_id: enquete.id });
      for (const pergunta of perguntas) {
        await base44.entities.PerguntaEnquete.delete(pergunta.id);
      }
      // Deletar votos
      const votos = await base44.entities.VotoEnquete.filter({ enquete_id: enquete.id });
      for (const voto of votos) {
        await base44.entities.VotoEnquete.delete(voto.id);
      }
      await base44.entities.Enquete.delete(enquete.id);
    }
    console.log(`[CASCADE] Deletadas ${enquetes.length} enquetes`);

    // 6. Deletar funcionários
    const funcionarios = await base44.entities.Funcionario.filter({ condominio_id: condominioId });
    for (const func of funcionarios) {
      await base44.entities.Funcionario.delete(func.id);
    }
    console.log(`[CASCADE] Deletados ${funcionarios.length} funcionários`);

    // 7. Deletar entregadores e registros
    const entregadores = await base44.entities.Entregador.filter({ condominio_id: condominioId });
    for (const ent of entregadores) {
      await base44.entities.Entregador.delete(ent.id);
    }
    const registros = await base44.entities.RegistroEntrega.filter({ condominio_id: condominioId });
    for (const reg of registros) {
      await base44.entities.RegistroEntrega.delete(reg.id);
    }
    console.log(`[CASCADE] Deletados ${entregadores.length} entregadores e ${registros.length} registros`);

    // 8. Deletar residências
    const residencias = await base44.entities.Residencia.filter({ condominio_id: condominioId });
    for (const res of residencias) {
      await base44.entities.Residencia.delete(res.id);
    }
    console.log(`[CASCADE] Deletadas ${residencias.length} residências`);

    // 9. Deletar moradores
    for (const morador of moradores) {
      await base44.entities.Morador.delete(morador.id);
    }
    console.log(`[CASCADE] Deletados ${moradores.length} moradores`);

    // 10. Deletar logs
    const logs = await base44.entities.LogSistema.filter({ condominio_id: condominioId });
    for (const log of logs) {
      await base44.entities.LogSistema.delete(log.id);
    }
    console.log(`[CASCADE] Deletados ${logs.length} logs`);

    // 11. Finalmente, deletar o condomínio
    await base44.entities.Condominio.delete(condominioId);
    console.log(`[CASCADE] Condomínio ${condominioId} deletado com sucesso`);

    return { success: true };

  } catch (error) {
    console.error(`[DATA_INTEGRITY] Erro no cascade delete:`, error);
    throw new Error(`Falha ao deletar condomínio: ${error.message}`);
  }
}

/**
 * Valida integridade antes de deletar morador
 * Verifica dependências e previne órfãos
 */
export async function validateMoradorDelete(moradorId) {
  try {
    // Buscar dependências
    const [encomendas, chamados, visitantes] = await Promise.all([
      base44.entities.Encomenda.filter({ morador_id: moradorId }),
      base44.entities.Chamado.filter({ morador_id: moradorId }),
      base44.entities.Visitante.filter({ morador_id: moradorId })
    ]);

    const hasEncomendas = encomendas.length > 0;
    const hasChamados = chamados.length > 0;
    const hasVisitantes = visitantes.length > 0;

    if (hasEncomendas || hasChamados || hasVisitantes) {
      return {
        canDelete: false,
        reason: 'restricted',
        message: `Este morador possui registros vinculados: ${encomendas.length} encomenda(s), ${chamados.length} chamado(s), ${visitantes.length} visitante(s)`,
        dependencies: {
          encomendas: encomendas.length,
          chamados: chamados.length,
          visitantes: visitantes.length
        }
      };
    }

    return { canDelete: true };

  } catch (error) {
    console.error('[DATA_INTEGRITY] Erro ao validar deleção:', error);
    return {
      canDelete: false,
      reason: 'error',
      message: 'Erro ao validar dependências'
    };
  }
}

/**
 * Deleta morador com cascade opcional
 */
export async function deleteMoradorWithCascade(moradorId, cascade = false) {
  try {
    const validation = await validateMoradorDelete(moradorId);

    if (!validation.canDelete && !cascade) {
      return validation;
    }

    if (cascade) {
      // Deletar dependências primeiro
      const [encomendas, chamados, visitantes] = await Promise.all([
        base44.entities.Encomenda.filter({ morador_id: moradorId }),
        base44.entities.Chamado.filter({ morador_id: moradorId }),
        base44.entities.Visitante.filter({ morador_id: moradorId })
      ]);

      for (const enc of encomendas) {
        await base44.entities.Encomenda.delete(enc.id);
      }
      for (const cham of chamados) {
        await base44.entities.Chamado.delete(cham.id);
      }
      for (const vis of visitantes) {
        await base44.entities.Visitante.delete(vis.id);
      }

      console.log(`[CASCADE] Deletadas dependências do morador ${moradorId}`);
    }

    // Deletar morador
    await base44.entities.Morador.delete(moradorId);
    
    return { success: true, canDelete: true };

  } catch (error) {
    console.error('[DATA_INTEGRITY] Erro ao deletar morador:', error);
    throw error;
  }
}

/**
 * Verifica consistência de dados
 * Encontra registros órfãos
 */
export async function auditDataIntegrity(condominioId) {
  try {
    console.log(`[AUDIT] Iniciando auditoria de integridade para condomínio ${condominioId}`);

    const results = {
      orphans: [],
      inconsistencies: [],
      warnings: []
    };

    // 1. Verificar encomendas órfãs (sem morador)
    const encomendas = await base44.entities.Encomenda.filter({ condominio_id: condominioId });
    const moradores = await base44.entities.Morador.filter({ condominio_id: condominioId });
    const moradoresIds = moradores.map(m => m.id);

    const encomendasOrfas = encomendas.filter(e => !moradoresIds.includes(e.morador_id));
    if (encomendasOrfas.length > 0) {
      results.orphans.push({
        type: 'Encomenda',
        count: encomendasOrfas.length,
        ids: encomendasOrfas.map(e => e.id)
      });
    }

    // 2. Verificar visitantes órfãos
    const visitantes = await base44.entities.Visitante.list();
    const visitantesOrfaos = visitantes.filter(v => 
      moradoresIds.includes(v.morador_id) && 
      !moradores.find(m => m.id === v.morador_id && m.condominio_id === condominioId)
    );
    if (visitantesOrfaos.length > 0) {
      results.orphans.push({
        type: 'Visitante',
        count: visitantesOrfaos.length,
        ids: visitantesOrfaos.map(v => v.id)
      });
    }

    // 3. Verificar residências órfãs
    const residencias = await base44.entities.Residencia.filter({ condominio_id: condominioId });
    const residenciasComMoradores = residencias.filter(r =>
      moradores.some(m => m.residencia_id === r.id)
    );
    if (residenciasComMoradores.length < residencias.length) {
      results.warnings.push({
        type: 'Residência',
        message: `${residencias.length - residenciasComMoradores.length} residências sem moradores`
      });
    }

    console.log('[AUDIT] Auditoria concluída:', results);
    return results;

  } catch (error) {
    console.error('[AUDIT] Erro na auditoria:', error);
    throw error;
  }
}