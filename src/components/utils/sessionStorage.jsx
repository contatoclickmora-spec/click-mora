/**
 * Utilitário para salvar/restaurar rascunhos de formulários
 * Previne perda de dados em caso de perda de conexão ou crash
 */

const DRAFT_PREFIX = 'draft_';
const DRAFT_EXPIRY = 3600000; // 1 hora

export function saveDraft(formId, data) {
  try {
    const draftData = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(`${DRAFT_PREFIX}${formId}`, JSON.stringify(draftData));
  } catch (e) {
    // Silently fail
  }
}

export function getDraft(formId) {
  try {
    const stored = sessionStorage.getItem(`${DRAFT_PREFIX}${formId}`);
    if (!stored) return null;
    
    const draft = JSON.parse(stored);
    
    // Verificar se expirou
    if (Date.now() - draft.timestamp > DRAFT_EXPIRY) {
      clearDraft(formId);
      return null;
    }
    
    return draft.data;
  } catch (e) {
    return null;
  }
}

export function clearDraft(formId) {
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${formId}`);
  } catch (e) {
    // Silently fail
  }
}