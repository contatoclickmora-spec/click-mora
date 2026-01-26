import { SessionCache, safeAuthCall, safeEntityCall } from "./apiCache";

/**
 * SISTEMA DE AUTENTICAÇÃO E ROLE - UTILITÁRIO CENTRAL
 * Otimizado para carregamento rápido com proteção contra Network Errors
 * VERSÃO OTIMIZADA - delays reduzidos
 */

let _cachedUserRole = null;
let _cachedTimestamp = null;
const CACHE_DURATION = 600000; // 10 minutos

// Flag para evitar múltiplas chamadas simultâneas
let _isLoading = false;
let _loadingPromise = null;

/**
 * Obtém o tipo de usuário com retry automático e cache
 */
export async function getUserRole(forceRefresh = false) {
  try {
    // Se já está carregando, aguardar a promessa existente
    if (_isLoading && _loadingPromise && !forceRefresh) {
      console.log('[AUTH] ⏳ Aguardando carregamento em andamento...');
      return await _loadingPromise;
    }

    // Cache em memória
    const now = Date.now();
    if (!forceRefresh && _cachedUserRole && _cachedTimestamp && (now - _cachedTimestamp < CACHE_DURATION)) {
      console.log('[AUTH] ✅ Usando cache em memória (válido por mais', Math.floor((CACHE_DURATION - (now - _cachedTimestamp)) / 1000), 'segundos)');
      return _cachedUserRole;
    }

    // Cache de sessão (sobrevive a reloads)
    if (!forceRefresh) {
      const sessionCached = SessionCache.get('user_role');
      if (sessionCached) {
        console.log('[AUTH] ✅ Usando cache de sessão');
        _cachedUserRole = sessionCached;
        _cachedTimestamp = now;
        return sessionCached;
      }
    }

    // Iniciar carregamento
    _isLoading = true;
    _loadingPromise = loadUserRoleFromServer();

    const result = await _loadingPromise;
    
    // Finalizar carregamento
    _isLoading = false;
    _loadingPromise = null;

    return result;

  } catch (error) {
    console.error("❌ [AUTH] Erro ao obter role:", error);
    _isLoading = false;
    _loadingPromise = null;
    return {
      isAuthenticated: false,
      userType: null,
      error: error.message
    };
  }
}

/**
 * Função auxiliar para carregar role do servidor
 */
async function loadUserRoleFromServer() {
  try {
    console.log('[AUTH] 🔄 Carregando role do servidor...');

    // Delay inicial reduzido
    await new Promise(resolve => setTimeout(resolve, 300)); // 300ms inicial

    // Usar safeAuthCall para retry automático
    let user;
    try {
      user = await safeAuthCall('me');
    } catch (err) {
      console.error('[AUTH] ❌ Erro ao obter usuário:', err);
      
      // Se é erro de autenticação, redirecionar para login
      const errorMsg = err?.message || '';
      if (errorMsg.includes('must be logged in') || errorMsg.includes('Unauthorized')) {
        console.log('[AUTH] 🔐 Redirecionando para login...');
        try {
          const { base44 } = await import('@/api/base44Client');
          await base44.auth.redirectToLogin();
        } catch (redirectErr) {
          window.location.href = '/login';
        }
      }
      
      return { 
        isAuthenticated: false, 
        userType: null,
        needsLogin: true,
        error: errorMsg.includes('must be logged in') ? 'Sessão expirada' : 'Erro de conexão'
      };
    }
    
    if (!user || !user.email) {
      return { 
        isAuthenticated: false, 
        userType: null,
        needsLogin: true 
      };
    }

    // Admin Master - retorno rápido
    if (user.role === 'admin') {
      const role = {
        isAuthenticated: true,
        userType: 'admin_master',
        user: user,
        email: user.email,
        name: user.full_name,
        isAdminMaster: true
      };
      cacheRole(role);
      return role;
    }

    // Delay entre requisições reduzido
    await new Promise(resolve => setTimeout(resolve, 300)); // 300ms

    // Buscar morador com retry
    let todosMoradores;
    try {
      todosMoradores = await safeEntityCall('Morador', 'list');
    } catch (err) {
      console.error('[AUTH] ❌ Erro ao carregar moradores após todas as tentativas:', err);
      return {
        isAuthenticated: true,
        userType: 'erro_carregar',
        user: user,
        error: 'Erro ao carregar dados. Por favor, recarregue a página.'
      };
    }

    const moradorLogado = todosMoradores.find(
      m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );

    if (!moradorLogado) {
      return {
        isAuthenticated: true,
        userType: 'sem_cadastro',
        user: user,
        error: 'Cadastro não encontrado no sistema'
      };
    }

    // Verificações de status
    if (moradorLogado.status === 'pendente') {
      return {
        isAuthenticated: true,
        userType: 'pendente_aprovacao',
        user: user,
        morador: moradorLogado,
        error: 'Cadastro aguardando aprovação'
      };
    }

    if (moradorLogado.status === 'inativo') {
      return {
        isAuthenticated: true,
        userType: 'inativo',
        user: user,
        morador: moradorLogado,
        error: 'Cadastro inativo'
      };
    }

    if (!moradorLogado.condominio_id) {
      return {
        isAuthenticated: true,
        userType: 'sem_condominio',
        user: user,
        morador: moradorLogado,
        error: 'Usuário não está vinculado a nenhum condomínio'
      };
    }

    // Role válida
    const userType = moradorLogado.tipo_usuario;
    
    const role = {
      isAuthenticated: true,
      userType: userType,
      user: user,
      morador: moradorLogado,
      condominioId: moradorLogado.condominio_id,
      isAdminMaster: false
    };

    // Cache agressivo
    cacheRole(role);

    console.log('[AUTH] ✅ Role carregada com sucesso:', userType);

    return role;

  } catch (error) {
    console.error("❌ [AUTH] Erro crítico ao carregar do servidor:", error);
    throw error;
  }
}

/**
 * Função auxiliar para salvar role em cache
 */
function cacheRole(role) {
  _cachedUserRole = role;
  _cachedTimestamp = Date.now();
  SessionCache.set('user_role', role, 15); // 15 minutos
  console.log('[AUTH] 💾 Role salva em cache com expiração de 15 minutos');
}

/**
 * Versão síncrona que retorna cache imediatamente
 */
export function getUserRoleSync() {
  const now = Date.now();
  
  if (_cachedUserRole && _cachedTimestamp && (now - _cachedTimestamp < CACHE_DURATION)) {
    return _cachedUserRole;
  }
  
  // Tentar cache de sessão
  const sessionCached = SessionCache.get('user_role');
  if (sessionCached) {
    _cachedUserRole = sessionCached;
    _cachedTimestamp = now;
    return sessionCached;
  }
  
  return null;
}

/**
 * Pré-carregar role em background
 */
export async function preloadUserRole() {
  try {
    await getUserRole(true);
  } catch (error) {
    console.error("Erro ao pré-carregar role:", error);
  }
}

export function getDashboardPath(userType) {
  const dashboardMap = {
    'admin_master': '/AdminMaster',
    'administrador': '/Dashboard',
    'porteiro': '/Dashboard',
    'morador': '/DashboardMorador'
  };

  return dashboardMap[userType] || '/DashboardMorador';
}

export function canAccessDashboard(userType, dashboardType) {
  if (userType === 'admin_master') return true;

  const permissions = {
    'morador': ['morador'],
    'porteiro': ['porteiro', 'morador'],
    'administrador': ['administrador', 'porteiro', 'morador']
  };

  return permissions[userType]?.includes(dashboardType) || false;
}

export function clearAuthCache() {
  _cachedUserRole = null;
  _cachedTimestamp = null;
  _isLoading = false;
  _loadingPromise = null;
  SessionCache.remove('user_role');
  console.log('[AUTH] 🧹 Cache de autenticação limpo');
}