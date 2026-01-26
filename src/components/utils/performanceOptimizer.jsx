/**
 * OTIMIZAÇÃO DE PERFORMANCE
 * Previne queries lentas e gargalos
 */

/**
 * Cache inteligente com expiração e invalidação
 */
class SmartCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, value, ttlMinutes = 5) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + (ttlMinutes * 60 * 1000));
  }

  get(key) {
    const expiry = this.timestamps.get(key);
    
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  invalidate(pattern) {
    if (typeof pattern === 'string') {
      this.cache.delete(pattern);
      this.timestamps.delete(pattern);
      return;
    }
    
    // Regex pattern
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

export const queryCache = new SmartCache();

/**
 * Wrapper para queries com cache automático
 */
export async function cachedQuery(cacheKey, queryFn, ttlMinutes = 5) {
  const cached = queryCache.get(cacheKey);
  
  if (cached) {
    console.log(`[PERFORMANCE] Cache hit: ${cacheKey}`);
    return cached;
  }
  
  console.log(`[PERFORMANCE] Cache miss: ${cacheKey}, executando query...`);
  const startTime = Date.now();
  
  const result = await queryFn();
  
  const duration = Date.now() - startTime;
  if (duration > 2000) {
    console.warn(`[PERFORMANCE] Query lenta detectada: ${cacheKey} - ${duration}ms`);
  }
  
  queryCache.set(cacheKey, result, ttlMinutes);
  
  return result;
}

/**
 * Invalidar cache quando dados mudam
 */
export function invalidateRelatedCache(entityName) {
  const patterns = {
    'Morador': /morador|residencia|visitante|encomenda/i,
    'Encomenda': /encomenda|dashboard/i,
    'Chamado': /chamado/i,
    'Condominio': /.*/  // Invalida tudo
  };
  
  const pattern = patterns[entityName] || new RegExp(entityName, 'i');
  queryCache.invalidate(pattern);
  
  console.log(`[PERFORMANCE] Cache invalidado para padrão: ${pattern}`);
}

/**
 * Batch requests para reduzir número de chamadas
 */
export class RequestBatcher {
  constructor(batchDelay = 50) {
    this.queue = [];
    this.batchDelay = batchDelay;
    this.processing = false;
  }

  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      
      if (!this.processing) {
        this.processBatch();
      }
    });
  }

  async processBatch() {
    this.processing = true;
    
    await new Promise(resolve => setTimeout(resolve, this.batchDelay));
    
    const batch = [...this.queue];
    this.queue = [];
    
    const results = await Promise.allSettled(
      batch.map(item => item.request())
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batch[index].resolve(result.value);
      } else {
        batch[index].reject(result.reason);
      }
    });
    
    this.processing = false;
    
    if (this.queue.length > 0) {
      this.processBatch();
    }
  }
}

/**
 * Monitor de performance para detectar operações lentas
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.maxMetrics = 100;
  }

  start(operationName) {
    return {
      operationName,
      startTime: performance.now(),
      end: () => {
        const duration = performance.now() - this.startTime;
        this.record(operationName, duration);
        return duration;
      }
    };
  }

  record(operationName, duration) {
    this.metrics.push({
      operation: operationName,
      duration,
      timestamp: Date.now()
    });
    
    // Limitar tamanho do array
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Alertar se operação demorou muito
    if (duration > 2000) {
      console.warn(`[PERFORMANCE] ⚠️ Operação lenta: ${operationName} - ${duration.toFixed(0)}ms`);
    } else if (duration > 1000) {
      console.log(`[PERFORMANCE] Operação moderada: ${operationName} - ${duration.toFixed(0)}ms`);
    }
  }

  getStats() {
    if (this.metrics.length === 0) return null;
    
    const sorted = [...this.metrics].sort((a, b) => b.duration - a.duration);
    const avg = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    
    return {
      total: this.metrics.length,
      average: avg.toFixed(0),
      slowest: sorted[0],
      fastest: sorted[sorted.length - 1]
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Lazy loading de dados pesados
 */
export function useLazyLoad(data, itemsPerPage = 20) {
  const [visibleCount, setVisibleCount] = React.useState(itemsPerPage);
  
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + itemsPerPage, data.length));
  };
  
  const hasMore = visibleCount < data.length;
  
  return {
    visibleData: data.slice(0, visibleCount),
    loadMore,
    hasMore,
    totalCount: data.length,
    visibleCount
  };
}

/**
 * Compressão de imagens antes de upload
 */
export async function compressImage(file, maxSizeMB = 2, maxWidthOrHeight = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar se necessário
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height / width) * maxWidthOrHeight;
            width = maxWidthOrHeight;
          } else {
            width = (width / height) * maxWidthOrHeight;
            height = maxWidthOrHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir
        let quality = 0.9;
        const targetSize = maxSizeMB * 1024 * 1024;
        
        canvas.toBlob(
          (blob) => {
            if (blob.size <= targetSize || quality <= 0.5) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              // Reduzir qualidade se ainda muito grande
              quality -= 0.1;
              canvas.toBlob(
                (newBlob) => resolve(new File([newBlob], file.name, { type: 'image/jpeg' })),
                'image/jpeg',
                quality
              );
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}