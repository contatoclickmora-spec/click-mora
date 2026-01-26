/**
 * SISTEMA DE IDEMPOTÊNCIA
 * Previne duplicação de dados por cliques múltiplos
 */

/**
 * Cache de operações em andamento
 * Previne submissões duplicadas
 */
class OperationLock {
  constructor() {
    this.locks = new Map();
  }

  /**
   * Tenta adquirir lock para operação
   * Retorna false se já está em andamento
   */
  acquire(operationId) {
    if (this.locks.has(operationId)) {
      const lockTime = this.locks.get(operationId);
      const elapsed = Date.now() - lockTime;
      
      // Lock expira após 30 segundos (timeout)
      if (elapsed < 30000) {
        console.warn(`[IDEMPOTENCY] Operação ${operationId} já em andamento`);
        return false;
      }
      
      // Lock expirado, pode prosseguir
      console.log(`[IDEMPOTENCY] Lock expirado para ${operationId}, liberando...`);
    }
    
    this.locks.set(operationId, Date.now());
    return true;
  }

  /**
   * Libera lock após conclusão
   */
  release(operationId) {
    this.locks.delete(operationId);
    console.log(`[IDEMPOTENCY] Lock liberado: ${operationId}`);
  }

  /**
   * Limpa locks expirados
   */
  cleanup() {
    const now = Date.now();
    for (const [id, time] of this.locks.entries()) {
      if (now - time > 30000) {
        this.locks.delete(id);
      }
    }
  }
}

// Instância global
export const operationLock = new OperationLock();

// Cleanup periódico
setInterval(() => operationLock.cleanup(), 60000); // A cada minuto

/**
 * Wrapper para operações idempotentes
 * Garante execução única mesmo com cliques múltiplos
 */
export async function idempotentOperation(operationId, operation) {
  // Tentar adquirir lock
  if (!operationLock.acquire(operationId)) {
    console.warn(`[IDEMPOTENCY] Operação ${operationId} ignorada (duplicada)`);
    return { 
      success: false, 
      duplicate: true,
      message: 'Operação já está sendo processada' 
    };
  }

  try {
    // Executar operação
    const result = await operation();
    
    return { 
      success: true, 
      duplicate: false,
      data: result 
    };

  } catch (error) {
    console.error(`[IDEMPOTENCY] Erro na operação ${operationId}:`, error);
    throw error;

  } finally {
    // Sempre liberar lock
    operationLock.release(operationId);
  }
}

/**
 * Hook React para prevenir submissões duplicadas
 */
export function useIdempotentSubmit(submitFunction, operationPrefix = 'submit') {
  let isSubmitting = false;
  let submitCount = 0;

  return async (...args) => {
    if (isSubmitting) {
      console.warn('[IDEMPOTENCY] Submissão duplicada ignorada');
      return { duplicate: true };
    }

    try {
      isSubmitting = true;
      submitCount++;
      
      const operationId = `${operationPrefix}_${Date.now()}_${submitCount}`;
      
      const result = await idempotentOperation(operationId, async () => {
        return await submitFunction(...args);
      });

      return result;

    } finally {
      // Delay para prevenir cliques muito rápidos
      setTimeout(() => {
        isSubmitting = false;
      }, 500);
    }
  };
}

/**
 * Debounce específico para formulários
 * Aguarda usuário parar de digitar antes de validar
 */
export class FormDebouncer {
  constructor(delay = 300) {
    this.delay = delay;
    this.timers = new Map();
  }

  debounce(fieldName, callback) {
    if (this.timers.has(fieldName)) {
      clearTimeout(this.timers.get(fieldName));
    }

    const timer = setTimeout(() => {
      callback();
      this.timers.delete(fieldName);
    }, this.delay);

    this.timers.set(fieldName, timer);
  }

  cancel(fieldName) {
    if (this.timers.has(fieldName)) {
      clearTimeout(this.timers.get(fieldName));
      this.timers.delete(fieldName);
    }
  }

  cancelAll() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

/**
 * Previne race conditions em atualizações
 */
export class UpdateSequencer {
  constructor() {
    this.queue = new Map();
  }

  async enqueue(entityId, updateFunction) {
    // Se já existe update em andamento, aguardar
    if (this.queue.has(entityId)) {
      await this.queue.get(entityId);
    }

    // Criar nova promise de update
    const updatePromise = updateFunction();
    this.queue.set(entityId, updatePromise);

    try {
      const result = await updatePromise;
      return result;
    } finally {
      this.queue.delete(entityId);
    }
  }
}

export const updateSequencer = new UpdateSequencer();