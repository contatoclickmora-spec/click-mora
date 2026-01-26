/**
 * Sistema de Cache e Retry para API
 * Previne Network Errors com retry automático e cache inteligente
 * VERSÃO OTIMIZADA COM EXPONENTIAL BACKOFF ROBUSTO
 */

// Global flag para auth.me - evitar múltiplas chamadas simultâneas
let _authMeInProgress = false;
let _authMePromise = null;

/**
 * Wrapper seguro para chamadas de entidade com retry automático
 */
export async function safeEntityCall(entityName, method, ...args) {
  const maxRetries = 5;
  const baseDelay = 3000; // 3s base

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Sempre dar um tempo antes de cada tentativa
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms inicial
      } else {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 3s, 6s, 12s, 24s
        console.log(`[SAFE ENTITY] ⏰ Aguardando ${delay}ms antes da tentativa ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`[SAFE ENTITY] 🔄 ${entityName}.${method} - Tentativa ${attempt + 1}/${maxRetries}`);
      
      const { base44 } = await import('@/api/base44Client');
      
      if (!base44.entities[entityName]) {
        throw new Error(`Entidade ${entityName} não encontrada`);
      }
      
      if (!base44.entities[entityName][method]) {
        throw new Error(`Método ${method} não encontrado em ${entityName}`);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 60000) // 60s timeout
      );
      
      const requestPromise = base44.entities[entityName][method](...args);
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      console.log(`[SAFE ENTITY] ✅ ${entityName}.${method} - Sucesso na tentativa ${attempt + 1}`);
      return result;

    } catch (error) {
      const errorMsg = error.message || 'Erro desconhecido';
      const errorStr = error.toString();
      console.error(`[SAFE ENTITY] ❌ ${entityName}.${method} - Tentativa ${attempt + 1} falhou:`, errorMsg);

      if (attempt === maxRetries - 1) {
        console.error(`[SAFE ENTITY] 🚫 ${entityName}.${method} - Todas as ${maxRetries} tentativas falharam`);
        throw error;
      }
      
      // Delay extra após erro de network ou axios
      const isNetworkError = errorMsg.toLowerCase().includes('network') || 
                             errorStr.toLowerCase().includes('network') ||
                             errorStr.includes('AxiosError');
      
      if (isNetworkError) {
        console.log(`[SAFE ENTITY] 🌐 Network/Axios Error detectado, aguardando extra 3s...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
}

/**
 * Wrapper seguro para chamadas de autenticação com retry automático
 * PROTEÇÃO GLOBAL: apenas uma chamada auth.me por vez em todo o app
 */
export async function safeAuthCall(method, ...args) {
  // PROTEÇÃO ESPECIAL para auth.me
  if (method === 'me') {
    if (_authMeInProgress && _authMePromise) {
      console.log('[SAFE AUTH] ⏳ Aguardando auth.me em andamento...');
      try {
        return await _authMePromise;
      } catch (err) {
        console.log('[SAFE AUTH] ⚠️ Chamada anterior falhou, resetando...');
        _authMeInProgress = false;
        _authMePromise = null;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s antes de retry
      }
    }

    _authMeInProgress = true;
    _authMePromise = executeAuthCall(method, ...args);

    try {
      const result = await _authMePromise;
      return result;
    } finally {
      setTimeout(() => {
        _authMeInProgress = false;
        _authMePromise = null;
      }, 3000); // 3s
    }
  }

  return executeAuthCall(method, ...args);
}

/**
 * Função interna que executa a chamada de auth com retry
 */
async function executeAuthCall(method, ...args) {
  const maxRetries = 5;
  const baseDelay = 3000; // 3s base

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Sempre dar um tempo antes de cada tentativa
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms inicial
      } else {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 3s, 6s, 12s, 24s
        console.log(`[SAFE AUTH] ⏰ Aguardando ${delay}ms antes da tentativa ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`[SAFE AUTH] 🔄 auth.${method} - Tentativa ${attempt + 1}/${maxRetries}`);
      
      const { base44 } = await import('@/api/base44Client');
      
      if (!base44.auth || !base44.auth[method]) {
        throw new Error(`Método auth.${method} não encontrado`);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 60000) // 60s timeout
      );
      
      const requestPromise = base44.auth[method](...args);
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      console.log(`[SAFE AUTH] ✅ auth.${method} - Sucesso na tentativa ${attempt + 1}`);
      return result;

    } catch (error) {
      const errorMsg = error.message || 'Erro desconhecido';
      const errorStr = error.toString();
      console.error(`[SAFE AUTH] ❌ auth.${method} - Tentativa ${attempt + 1} falhou:`, errorMsg);

      // Se é erro de autenticação (não logado), não fazer retry
      const isAuthError = errorMsg.includes('must be logged in') || 
                         errorMsg.includes('not authenticated') ||
                         errorMsg.includes('Unauthorized');
      
      if (isAuthError) {
        console.log(`[SAFE AUTH] 🔒 Erro de autenticação detectado - usuário não logado`);
        throw error; // Lançar imediatamente sem retry
      }

      if (attempt === maxRetries - 1) {
        console.error(`[SAFE AUTH] 🚫 auth.${method} - Todas as ${maxRetries} tentativas falharam`);
        throw error;
      }
      
      // Delay extra após erro de network ou axios
      const isNetworkError = errorMsg.toLowerCase().includes('network') || 
                             errorStr.toLowerCase().includes('network') ||
                             errorStr.includes('AxiosError');
      
      if (isNetworkError) {
        console.log(`[SAFE AUTH] 🌐 Network/Axios Error detectado, aguardando extra 4s...`);
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }
  }
}

/**
 * Cache de sessão com expiração
 */
export class SessionCache {
  static set(key, value, expirationMinutes = 15) {
    const item = {
      value,
      expiry: Date.now() + (expirationMinutes * 60000)
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(item));
      console.log(`[SESSION CACHE] 💾 Salvou: ${key} (expira em ${expirationMinutes}min)`);
    } catch (error) {
      console.error('[SESSION CACHE] Erro ao salvar:', error);
    }
  }

  static get(key) {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      if (Date.now() > item.expiry) {
        console.log(`[SESSION CACHE] ⏰ Expirou: ${key}`);
        sessionStorage.removeItem(key);
        return null;
      }
      
      console.log(`[SESSION CACHE] ✅ Cache hit: ${key}`);
      return item.value;
    } catch (error) {
      console.error('[SESSION CACHE] Erro ao ler:', error);
      return null;
    }
  }

  static remove(key) {
    try {
      sessionStorage.removeItem(key);
      console.log(`[SESSION CACHE] 🗑️ Removeu: ${key}`);
    } catch (error) {
      console.error('[SESSION CACHE] Erro ao remover:', error);
    }
  }

  static clear() {
    try {
      sessionStorage.clear();
      console.log('[SESSION CACHE] 🧹 Cache limpo completamente');
    } catch (error) {
      console.error('[SESSION CACHE] Erro ao limpar:', error);
    }
  }
}

/**
 * Cache em memória simples
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttlMs = 600000) { // 10 minutos padrão
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
    console.log(`[MEMORY CACHE] 💾 Salvou: ${key}`);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      console.log(`[MEMORY CACHE] ⏰ Expirou: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[MEMORY CACHE] ✅ Cache hit: ${key}`);
    return item.value;
  }

  remove(key) {
    this.cache.delete(key);
    console.log(`[MEMORY CACHE] 🗑️ Removeu: ${key}`);
  }

  clear() {
    this.cache.clear();
    console.log('[MEMORY CACHE] 🧹 Cache limpo');
  }
}

export const memoryCache = new MemoryCache();

/**
 * Debounce para evitar chamadas múltiplas
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle para limitar frequência de chamadas
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Wrapper para requisições com cache automático
 */
export async function cachedEntityCall(entityName, method, args = [], options = {}) {
  const {
    cacheKey = `${entityName}_${method}_${JSON.stringify(args)}`,
    cacheTtl = 600000, // 10 minutos
    useCache = true,
    forceRefresh = false
  } = options;

  if (useCache && !forceRefresh) {
    const cached = memoryCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const result = await safeEntityCall(entityName, method, ...args);

  if (useCache) {
    memoryCache.set(cacheKey, result, cacheTtl);
  }

  return result;
}

/**
 * Limpar todos os caches
 */
export function clearAllCaches() {
  memoryCache.clear();
  SessionCache.clear();
  _authMeInProgress = false;
  _authMePromise = null;
  console.log('[CACHE] 🧹 Todos os caches foram limpos');
}

export default {
  safeEntityCall,
  safeAuthCall,
  SessionCache,
  memoryCache,
  cachedEntityCall,
  clearAllCaches,
  debounce,
  throttle
};