import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { clearAuthCache } from "../utils/authUtils";
import { logAction } from "../utils/logger";

export default function ExcluirContaModal({ onClose, morador }) {
  const [confirmando, setConfirmando] = useState(false);

  const handleExcluirConta = async () => {
    setConfirmando(true);

    try {
      console.log('[EXCLUIR CONTA] Iniciando exclusão para morador:', morador?.id);

      // 1. Registrar log de exclusão antes de deletar
      if (morador?.condominio_id) {
        await logAction('deletar_morador', `Conta excluída pelo próprio usuário: ${morador.nome}`, {
          condominio_id: morador.condominio_id,
          dados_anteriores: { morador_id: morador.id, nome: morador.nome, email: morador.email },
          sucesso: true
        });
      }

      // 2. Deletar o registro do Morador
      if (morador?.id) {
        await base44.entities.Morador.delete(morador.id);
        console.log('[EXCLUIR CONTA] Morador deletado com sucesso');
      }

      // 3. Limpar cache de autenticação
      clearAuthCache();

      // 4. Fazer logout
      await base44.auth.logout();

      // 5. Redirecionar para login com mensagem
      sessionStorage.setItem('conta_excluida', 'true');
      window.location.href = '/login';

    } catch (error) {
      console.error('[EXCLUIR CONTA] Erro ao excluir conta:', error);
      alert('Erro ao excluir conta. Por favor, tente novamente ou entre em contato com o suporte.');
      setConfirmando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Excluir minha conta
          </h3>

          <p className="text-gray-700 mb-2">
            Você tem certeza que deseja excluir sua conta permanentemente?
          </p>

          <p className="text-sm text-red-600 font-medium mb-6">
            ⚠️ Esta ação não pode ser desfeita.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={confirmando}
              variant="outline"
              className="flex-1 h-12"
            >
              Não
            </Button>

            <Button
              onClick={handleExcluirConta}
              disabled={confirmando}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
            >
              {confirmando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, excluir'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}