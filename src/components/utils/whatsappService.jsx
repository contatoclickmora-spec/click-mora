// Safe Mode: WhatsApp service is disabled globally

// Minimal stubs to avoid any outbound calls or entity reads
export async function sendWhatsAppNotification(condominioId, telefone, mensagem, nomeDestinatario = "Destinatário") {
  return { success: false, error: "WhatsApp temporarily disabled (safe mode)" };
}

export function substituirVariaveisTemplate(template, vars) {
  // Keep this pure helper available if needed
  let mensagem = template || "";
  if (!vars) return mensagem;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    mensagem = mensagem.replace(regex, vars[key] ?? '');
  });
  return mensagem;
}

export async function notificarNovaEncomenda(morador, codigoEncomenda, condominioId) {
  return { success: false, error: "WhatsApp temporarily disabled (safe mode)" };
}