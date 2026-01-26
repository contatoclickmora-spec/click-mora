/**
 * UTILITÁRIOS DE VALIDAÇÃO E SANITIZAÇÃO
 * Garante integridade dos dados antes de persistência
 */

/**
 * Sanitiza string removendo caracteres perigosos
 * Previne XSS e SQL Injection
 */
export function sanitizeString(input, maxLength = 500) {
  if (!input) return '';
  
  let sanitized = String(input).trim();
  
  // Limitar tamanho
  sanitized = sanitized.slice(0, maxLength);
  
  // Remover tags HTML/scripts
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
  
  return sanitized;
}

/**
 * Valida e sanitiza email
 */
export function validateEmail(email) {
  if (!email) return { valid: false, sanitized: '' };
  
  const sanitized = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return {
    valid: emailRegex.test(sanitized),
    sanitized: sanitized
  };
}

/**
 * Valida e sanitiza telefone
 * Remove caracteres não numéricos
 */
export function validatePhone(phone) {
  if (!phone) return { valid: false, sanitized: '' };
  
  const sanitized = String(phone).replace(/[^\d]/g, '');
  
  return {
    valid: sanitized.length >= 10 && sanitized.length <= 11,
    sanitized: sanitized
  };
}

/**
 * Valida e sanitiza número
 * Previne NaN e valores inválidos
 */
export function validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, sanitized: min };
  }
  
  const clamped = Math.max(min, Math.min(max, num));
  
  return {
    valid: true,
    sanitized: clamped
  };
}

/**
 * Sanitiza objeto de formulário
 * Remove campos vazios e sanitiza strings
 */
export function sanitizeFormData(data, schema = {}) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Pular se undefined ou null
    if (value === undefined || value === null) continue;
    
    // Strings
    if (typeof value === 'string') {
      const maxLength = schema[key]?.maxLength || 500;
      sanitized[key] = sanitizeString(value, maxLength);
      continue;
    }
    
    // Números
    if (typeof value === 'number') {
      const validated = validateNumber(value);
      if (validated.valid) {
        sanitized[key] = validated.sanitized;
      }
      continue;
    }
    
    // Arrays e objetos mantém
    sanitized[key] = value;
  }
  
  return sanitized;
}

/**
 * Valida campos obrigatórios
 */
export function validateRequiredFields(data, requiredFields = []) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missingFields: missing
  };
}

/**
 * Previne valores nulos em cálculos
 */
export function safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}

/**
 * Calcula soma segura de array
 */
export function safeSum(array, field = null) {
  if (!Array.isArray(array)) return 0;
  
  return array.reduce((sum, item) => {
    const value = field ? item[field] : item;
    return sum + safeNumber(value, 0);
  }, 0);
}

/**
 * Calcula média segura
 */
export function safeAverage(array, field = null) {
  if (!Array.isArray(array) || array.length === 0) return 0;
  
  const sum = safeSum(array, field);
  return sum / array.length;
}

/**
 * Formata valores monetários com segurança
 */
export function formatCurrency(value) {
  const num = safeNumber(value, 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

/**
 * Valida arquivo antes de upload
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB padrão
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options;
  
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `Arquivo muito grande (máximo ${Math.round(maxSize / 1024 / 1024)}MB)` 
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo não permitido. Use: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Debounce para prevenir cliques múltiplos
 */
export function createDebounce(fn, delay = 300) {
  let timeoutId = null;
  
  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle para limitar taxa de execução
 */
export function createThrottle(fn, limit = 1000) {
  let inThrottle = false;
  
  return function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}