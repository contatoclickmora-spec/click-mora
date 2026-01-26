/**
 * MIDDLEWARE DE SEGURANÇA MULTI-TENANT
 * Garante isolamento absoluto de dados entre condomínios
 * 
 * REGRA ABSOLUTA: Nenhum usuário pode acessar dados de outro condomínio
 */

import { base44 } from "@/api/base44Client";

/**
 * Obtém o contexto de segurança do usuário autenticado
 * Retorna condominio_id e valida permissões
 */
export async function getSecurityContext() {
  try {
    const user = await base44.auth.me();
    
    if (!user || !user.email) {
      throw new Error('SECURITY_BREACH: Usuário não autenticado');
    }

    // Admin Master tem acesso global (exceção controlada)
    if (user.role === 'admin') {
      return {
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin_master',
        condominioId: null, // Null = acesso global
        isAdminMaster: true
      };
    }

    // Buscar morador vinculado ao email
    const todosMoradores = await base44.entities.Morador.list();
    const moradorLogado = todosMoradores.find(
      m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );

    if (!moradorLogado) {
      throw new Error('SECURITY_BREACH: Morador não encontrado no sistema');
    }

    if (!moradorLogado.condominio_id) {
      throw new Error('SECURITY_BREACH: Condomínio não identificado');
    }

    return {
      userId: moradorLogado.id,
      userEmail: user.email,
      userName: moradorLogado.nome,
      userRole: moradorLogado.tipo_usuario,
      condominioId: moradorLogado.condominio_id,
      isAdminMaster: false
    };

  } catch (error) {
    console.error('[SECURITY] Erro ao obter contexto:', error);
    throw error;
  }
}

/**
 * Filtra lista de entidades pelo condomínio do usuário
 * PROTEÇÃO: Remove dados de outros condomínios
 */
export function filterByUserCondominio(items, condominioId) {
  if (!condominioId) {
    // Admin Master - retorna tudo
    return items;
  }

  return items.filter(item => {
    // Verificar se o item pertence ao condomínio do usuário
    if (item.condominio_id === condominioId) {
      return true;
    }

    // LOG DE TENTATIVA DE ACESSO NÃO AUTORIZADO
    console.warn('[SECURITY] Tentativa de acesso a dados de outro condomínio bloqueada', {
      itemId: item.id,
      itemCondominioId: item.condominio_id,
      userCondominioId: condominioId
    });

    return false;
  });
}

/**
 * Valida se o usuário pode acessar um registro específico
 * PROTEÇÃO: Bloqueia acesso cruzado via ID direto
 */
export async function validateAccess(entityType, entityId) {
  try {
    const context = await getSecurityContext();

    // Admin Master pode acessar tudo
    if (context.isAdminMaster) {
      return { authorized: true, context };
    }

    // Buscar o registro
    let entity;
    switch (entityType) {
      case 'Encomenda':
        entity = await base44.entities.Encomenda.get(entityId);
        break;
      case 'Morador':
        entity = await base44.entities.Morador.get(entityId);
        break;
      case 'Chamado':
        entity = await base44.entities.Chamado.get(entityId);
        break;
      case 'Enquete':
        entity = await base44.entities.Enquete.get(entityId);
        break;
      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    if (!entity) {
      throw new Error('SECURITY_BREACH: Registro não encontrado');
    }

    // Validar condomínio
    if (entity.condominio_id !== context.condominioId) {
      console.error('[SECURITY] TENTATIVA DE ACESSO NÃO AUTORIZADO', {
        entityType,
        entityId,
        entityCondominioId: entity.condominio_id,
        userCondominioId: context.condominioId,
        userEmail: context.userEmail
      });

      return { 
        authorized: false, 
        error: 'Acesso negado: você não tem permissão para acessar este recurso' 
      };
    }

    return { authorized: true, context, entity };

  } catch (error) {
    console.error('[SECURITY] Erro na validação de acesso:', error);
    return { 
      authorized: false, 
      error: 'Erro ao validar permissões' 
    };
  }
}

/**
 * Carrega dados com filtro de condomínio IMEDIATO
 * PROTEÇÃO: Nunca carrega dados de outros condomínios
 */
export async function secureLoadEntity(entityName, condominioId, options = {}) {
  try {
    if (!condominioId) {
      // Admin Master - carrega tudo
      return await base44.entities[entityName].list(options.sort, options.limit);
    }

    // Filtrar por condomínio NA QUERY
    const filter = {
      condominio_id: condominioId,
      ...(options.additionalFilters || {})
    };

    const items = await base44.entities[entityName].filter(filter, options.sort, options.limit);

    console.log(`[SECURITY] Carregados ${items.length} ${entityName}(s) do condomínio ${condominioId}`);

    return items;

  } catch (error) {
    console.error(`[SECURITY] Erro ao carregar ${entityName}:`, error);
    throw error;
  }
}

/**
 * Valida criação de novo registro
 * PROTEÇÃO: Injeta condominio_id automaticamente
 */
export async function secureCreate(entityName, data) {
  try {
    const context = await getSecurityContext();

    // Admin Master deve especificar condominio_id manualmente
    if (context.isAdminMaster && !data.condominio_id) {
      throw new Error('Admin Master deve especificar o condominio_id');
    }

    // Usuários normais: injetar condominio_id automaticamente
    if (!context.isAdminMaster) {
      data.condominio_id = context.condominioId;
    }

    // Validar que não está tentando criar em outro condomínio
    if (!context.isAdminMaster && data.condominio_id !== context.condominioId) {
      throw new Error('SECURITY_BREACH: Tentativa de criar registro em outro condomínio');
    }

    return await base44.entities[entityName].create(data);

  } catch (error) {
    console.error('[SECURITY] Erro ao criar registro:', error);
    throw error;
  }
}

/**
 * Valida atualização de registro
 * PROTEÇÃO: Valida ownership antes de atualizar
 */
export async function secureUpdate(entityName, entityId, data) {
  try {
    const validation = await validateAccess(entityName, entityId);

    if (!validation.authorized) {
      throw new Error(validation.error || 'Acesso negado');
    }

    // Impedir mudança de condominio_id
    if (data.condominio_id && data.condominio_id !== validation.entity.condominio_id) {
      throw new Error('SECURITY_BREACH: Não é permitido alterar o condomínio');
    }

    return await base44.entities[entityName].update(entityId, data);

  } catch (error) {
    console.error('[SECURITY] Erro ao atualizar registro:', error);
    throw error;
  }
}

/**
 * Valida exclusão de registro
 * PROTEÇÃO: Valida ownership antes de deletar
 */
export async function secureDelete(entityName, entityId) {
  try {
    const validation = await validateAccess(entityName, entityId);

    if (!validation.authorized) {
      throw new Error(validation.error || 'Acesso negado');
    }

    return await base44.entities[entityName].delete(entityId);

  } catch (error) {
    console.error('[SECURITY] Erro ao deletar registro:', error);
    throw error;
  }
}