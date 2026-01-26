import { SessionCache, safeAuthCall, safeEntityCall } from "./apiCache";

/**
 * SISTEMA MULTI-CONDOMÍNIO - Utilitário Central
 * Otimizado com retry automático e cache para evitar Network Errors
 * 
 * Este módulo garante o isolamento completo de dados entre condomínios.
 * NUNCA acesse dados sem usar estas funções.
 */

let _cachedCondominioId = null;
let _cachedUserType = null;
let _cachedUserId = null;

/**
 * Obtém o condomínio do usuário logado com retry automático
 * Esta é a função PRINCIPAL para identificar o contexto do condomínio
 */
export async function getCondominioContext() {
  try {
    // Verificar cache de sessão primeiro
    const cachedContext = SessionCache.get('condominio_context');
    if (cachedContext) {
      _cachedCondominioId = cachedContext.condominioId;
      _cachedUserType = cachedContext.userType;
      _cachedUserId = cachedContext.userId;
      return cachedContext;
    }

    // Buscar usuário logado com retry
    let user;
    try {
      user = await safeAuthCall('me');
    } catch (err) {
      throw new Error("Erro de conexão ao buscar usuário. Tente novamente.");
    }

    if (!user || !user.email) {
      throw new Error("Usuário não autenticado");
    }

    // Admin Master tem acesso global (mas deve ser tratado separadamente)
    if (user.role === 'admin') {
      const context = {
        userId: user.email,
        userEmail: user.email,
        userName: user.full_name,
        userType: 'admin_master',
        condominioId: null,
        isAdminMaster: true
      };
      
      SessionCache.set('condominio_context', context, 10); // 10 minutos
      return context;
    }

    // Buscar morador para obter condomínio com retry
    let todosMoradores;
    try {
      todosMoradores = await safeEntityCall('Morador', 'list');
    } catch (err) {
      throw new Error("Erro de conexão ao buscar dados. Tente recarregar a página.");
    }

    const moradorLogado = todosMoradores.find(
      m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );

    if (!moradorLogado) {
      throw new Error("Cadastro não encontrado no sistema");
    }

    if (!moradorLogado.condominio_id) {
      throw new Error("Usuário não está vinculado a nenhum condomínio");
    }

    // Cache do contexto
    _cachedCondominioId = moradorLogado.condominio_id;
    _cachedUserType = moradorLogado.tipo_usuario;
    _cachedUserId = moradorLogado.id;

    const context = {
      userId: moradorLogado.id,
      userEmail: user.email,
      userName: user.full_name || moradorLogado.nome,
      userType: moradorLogado.tipo_usuario,
      condominioId: moradorLogado.condominio_id,
      moradorStatus: moradorLogado.status,
      isAdminMaster: false
    };

    // Salvar em cache de sessão
    SessionCache.set('condominio_context', context, 10); // 10 minutos

    return context;
  } catch (error) {
    throw error;
  }
}

/**
 * Valida se o usuário pertence ao condomínio especificado
 */
export async function validateCondominioAccess(condominioId) {
  const context = await getCondominioContext();
  
  // Admin master tem acesso a tudo
  if (context.isAdminMaster) {
    return true;
  }

  if (context.condominioId !== condominioId) {
    throw new Error("Acesso negado: você não tem permissão para acessar dados deste condomínio");
  }

  return true;
}

/**
 * Filtra lista de entidades pelo condomínio do usuário
 * USO: const filtrados = await filterByCondominio(todosItens)
 */
export async function filterByCondominio(items, condominioField = 'condominio_id') {
  const context = await getCondominioContext();
  
  // Admin master vê tudo
  if (context.isAdminMaster) {
    return items;
  }

  const filtered = items.filter(item => {
    // Se o item tem condominio_id direto
    if (item[condominioField]) {
      return item[condominioField] === context.condominioId;
    }
    return false;
  });
  
  return filtered;
}

/**
 * Adiciona condominio_id aos dados antes de criar
 */
export async function addCondominioId(data) {
  const context = await getCondominioContext();
  
  if (context.isAdminMaster) {
    // Admin master deve especificar o condomínio manualmente
    if (!data.condominio_id) {
      throw new Error("Admin master deve especificar o condominio_id");
    }
    return data;
  }

  return {
    ...data,
    condominio_id: context.condominioId
  };
}

/**
 * Valida operação de update
 */
export async function validateUpdate(itemId, currentItem) {
  const context = await getCondominioContext();
  
  if (context.isAdminMaster) {
    return true;
  }

  if (!currentItem) {
    throw new Error("Item não encontrado");
  }

  if (currentItem.condominio_id !== context.condominioId) {
    throw new Error("Você não tem permissão para modificar este item");
  }

  return true;
}

/**
 * Limpa cache (usar ao fazer logout)
 */
export function clearCondominioCache() {
  _cachedCondominioId = null;
  _cachedUserType = null;
  _cachedUserId = null;
  SessionCache.remove('condominio_context');
}