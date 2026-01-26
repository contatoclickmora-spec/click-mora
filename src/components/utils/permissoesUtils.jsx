// Utilitário centralizado para verificar permissões de perfis
// OTIMIZADO: Cache local instantâneo + refresh em background

const CACHE_KEY = 'permissoes_cache_v2';
const CACHE_TTL = 300000; // 5 minutos
const FETCH_TIMEOUT = 500; // 500ms timeout para não bloquear UI

// Mapeamento de keys do menu/funcionalidades para IDs de permissões
// IMPORTANTE: Cada key mapeia para seu próprio ID - não compartilhar IDs entre perfis diferentes
export const keyToPermissaoMap = {
  // Dashboard Síndico/Porteiro
  'registrar': 'registrar_encomenda',
  'retirar': 'retirar_encomenda',
  'chamados': 'chamados_portaria',
  'visitantes': 'visitantes_portaria',
  'manutencoes': 'manutencoes',
  'documentos': 'documentos',
  'marketplace': 'marketplace',
  'entregadores': 'entregadores',
  'moradores': 'moradores',
  'enquetes': 'enquetes',
  'avisos': 'avisos',
  'permissoes': 'permissoes',
  'vistoria': 'vistoria_imoveis',
  
  // Dashboard Morador - keys específicas do menu do morador
  'encomendas': 'encomendas', // NÃO mapear para gerenciamento_encomendas (que é do síndico)
  
  // IDs diretos (mesma key = mesmo ID)
  'vistoria_imoveis': 'vistoria_imoveis',
  'dashboard': 'dashboard',
  'registrar_encomenda': 'registrar_encomenda',
  'retirar_encomenda': 'retirar_encomenda',
  'gerenciamento_encomendas': 'gerenciamento_encomendas',
  'visitantes_portaria': 'visitantes_portaria',
  'chamados_portaria': 'chamados_portaria',
  'enviar_avisos': 'enviar_avisos',
  'criar_manutencao': 'criar_manutencao',
  'nova_enquete': 'nova_enquete',
  'aprovacao_moradores': 'aprovacao_moradores',
  'funcionarios': 'funcionarios',
  'relatorios': 'relatorios',
  'templates': 'templates',
  'whatsapp': 'whatsapp',
  'como_usar': 'como_usar'
};

// ============ CACHE LOCAL (INSTANTÂNEO) ============

// Ler cache do localStorage INSTANTANEAMENTE
export function getPermissoesFromCache(condominioId) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    if (data.condominioId !== condominioId) return null;
    
    // Verificar versão (outro tab pode ter atualizado)
    const currentVersion = getPermissoesVersion();
    if (data.version && data.version < currentVersion) {
      return null;
    }
    
    return data.permissoes;
  } catch (e) {
    return null;
  }
}

// Salvar no cache local
export function savePermissoesToCache(condominioId, permissoes) {
  try {
    const data = {
      condominioId,
      permissoes,
      timestamp: Date.now(),
      version: getPermissoesVersion()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    // Silently fail
  }
}

// Verificar se cache está dentro do TTL
export function isCacheValid(condominioId) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;
    
    const data = JSON.parse(cached);
    if (data.condominioId !== condominioId) return false;
    if (Date.now() - data.timestamp > CACHE_TTL) return false;
    
    const currentVersion = getPermissoesVersion();
    if (data.version && data.version < currentVersion) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

// ============ FETCH COM TIMEOUT (NÃO BLOQUEIA) ============

// Buscar permissões do servidor com timeout curto
export async function fetchPermissoesComTimeout(base44, condominioId, timeoutMs = FETCH_TIMEOUT) {
  return new Promise(async (resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(null);
    }, timeoutMs);
    
    try {
      const condominios = await base44.entities.Condominio.list();
      clearTimeout(timeoutId);
      
      const condominio = condominios.find(c => c.id === condominioId);
      if (condominio?.permissoes_perfis) {
        savePermissoesToCache(condominioId, condominio.permissoes_perfis);
        resolve(condominio.permissoes_perfis);
      } else {
        resolve({});
      }
    } catch (err) {
      clearTimeout(timeoutId);
      resolve(null);
    }
  });
}

// ============ FUNÇÃO PRINCIPAL: CARREGAR PERMISSÕES ============

// Retorna permissões INSTANTANEAMENTE do cache, e atualiza em background
export function carregarPermissoesInstantaneo(condominioId) {
  // 1. Tentar cache local primeiro (INSTANTÂNEO)
  const cached = getPermissoesFromCache(condominioId);
  if (cached) {
    return { permissoes: cached, fromCache: true };
  }
  
  // 2. Sem cache - retornar vazio (será preenchido pelo background)
  return { permissoes: null, fromCache: false };
}

// Atualizar em background (chamar depois do render inicial)
export async function atualizarPermissoesBackground(base44, condominioId, onUpdate) {
  // Se cache ainda é válido, não precisa atualizar
  if (isCacheValid(condominioId)) {
    return;
  }
  
  const permissoes = await fetchPermissoesComTimeout(base44, condominioId, 2000); // 2s para background
  
  if (permissoes && onUpdate) {
    onUpdate(permissoes);
  }
}

// ============ LIMPAR CACHE (APÓS SALVAR) ============

export function limparCachePermissoes() {
  localStorage.removeItem(CACHE_KEY);
  
  const newVersion = Date.now();
  localStorage.setItem('permissoes_version', newVersion.toString());
  
  window.dispatchEvent(new CustomEvent('permissoes_updated', { detail: { version: newVersion } }));
}

// ============ FUNÇÕES DE VERIFICAÇÃO ============

/**
 * Verifica se um item deve ser exibido para um perfil específico
 * IMPORTANTE: Cada perfil tem suas próprias permissões - não compartilham entre si
 * 
 * @param {Object} permissoes - Objeto com todas as permissões { morador: {...}, sindico: {...}, ... }
 * @param {string} perfilId - ID do perfil a verificar ('morador', 'sindico', 'porteiro', etc)
 * @param {string} itemKey - Key do item/funcionalidade a verificar
 * @returns {boolean} - true se deve exibir, false se deve ocultar
 */
export function deveExibirItem(permissoes, perfilId, itemKey) {
  // Se não tem objeto de permissões ou não tem permissões para este perfil específico, mostrar tudo
  if (!permissoes || !permissoes[perfilId]) {
    return true;
  }
  
  // Mapear a key para o ID de permissão
  const permissaoKey = keyToPermissaoMap[itemKey] || itemKey;
  
  // Verificar permissão APENAS para este perfil específico
  const permissaoDoPerfil = permissoes[perfilId][permissaoKey];
  
  // Se a permissão está explicitamente como false para ESTE perfil, ocultar
  if (permissaoDoPerfil === false) {
    return false;
  }
  
  // Caso contrário (undefined ou true), mostrar
  return true;
}

/**
 * Filtra lista de itens baseado nas permissões de um perfil específico
 * IMPORTANTE: Usa APENAS as permissões do perfil informado, não afeta outros perfis
 * 
 * @param {Array} itens - Lista de itens a filtrar
 * @param {Object} permissoes - Objeto com todas as permissões { morador: {...}, sindico: {...}, ... }
 * @param {string} perfilId - ID do perfil a verificar ('morador', 'sindico', 'porteiro', etc)
 * @param {string} keyField - Nome do campo que contém a key do item
 * @returns {Array} - Lista filtrada de itens
 */
export function filtrarItensPorPermissao(itens, permissoes, perfilId, keyField = 'key') {
  // Se não tem permissões para este perfil, retornar todos os itens
  if (!permissoes || !permissoes[perfilId]) {
    return itens;
  }
  
  const itensFiltrados = itens.filter(item => {
    const itemKey = item[keyField];
    return deveExibirItem(permissoes, perfilId, itemKey);
  });
  
  return itensFiltrados;
}

export function getPermissoesVersion() {
  return parseInt(localStorage.getItem('permissoes_version') || '0');
}

// Função legada para compatibilidade
export async function carregarPermissoes(base44, condominioId, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getPermissoesFromCache(condominioId);
    if (cached) return cached;
  }
  
  return await fetchPermissoesComTimeout(base44, condominioId, 2000);
}