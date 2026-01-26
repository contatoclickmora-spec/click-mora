import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Flame, 
  ShieldAlert, 
  UserX, 
  AlertCircle,
  Loader2,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "@/components/utils/authUtils";
import { createPageUrl } from "@/utils";
import { enviarAlertaSOS } from "@/functions/enviarAlertaSOS";

import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import OperationalFooter from "../components/shared/OperationalFooter";

export default function TipoEmergencia() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tiposEmergencia = [
    {
      id: 'medica',
      icon: Heart,
      titulo: 'Emergência Médica',
      descricao: 'Necessidade de atendimento médico urgente',
      color: '#ef4444'
    },
    {
      id: 'incendio',
      icon: Flame,
      titulo: 'Incêndio',
      descricao: 'Fogo ou risco de incêndio no local',
      color: '#f97316'
    },
    {
      id: 'seguranca',
      icon: ShieldAlert,
      titulo: 'Ameaça / Segurança',
      descricao: 'Situação de risco ou ameaça à segurança',
      color: '#dc2626'
    },
    {
      id: 'mal_estar',
      icon: UserX,
      titulo: 'Pessoa Passando Mal',
      descricao: 'Alguém com mal-estar ou desmaio',
      color: '#ea580c'
    },
    {
      id: 'outra',
      icon: AlertCircle,
      titulo: 'Outra Emergência',
      descricao: 'Situação de emergência não listada acima',
      color: '#f59e0b'
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const roleInfo = await getUserRole();
      if (!roleInfo.isAuthenticated) {
        navigate(createPageUrl('Login'));
        return;
      }
      setUserType(roleInfo.userType);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTipo = async (tipo) => {
    if (sending) return;

    setSending(true);
    setError('');

    try {
      const response = await enviarAlertaSOS({
        tipo_emergencia: tipo.titulo
      });

      if (response.data.success) {
        setSuccessMessage(`Alerta enviado para ${response.data.mensagens_enviadas} pessoa(s)`);
        setShowSuccessModal(true);
      } else if (response.data.warning) {
        setError(response.data.error);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('Erro ao enviar alerta:', err);
      setError(err.response?.data?.error || 'Erro ao enviar alerta. Tente novamente.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f7f7f7]">
        <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Tipo de Emergência" userType={userType} />

      <div className="pt-28 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Alerta de erro */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          {tiposEmergencia.map((tipo, index) => (
            <motion.div
              key={tipo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handleSelectTipo(tipo)}
                disabled={sending}
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  {/* Ícone */}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${tipo.color}15` }}
                  >
                    <tipo.icon 
                      className="w-8 h-8" 
                      style={{ color: tipo.color }}
                    />
                  </div>

                  {/* Texto */}
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-bold text-gray-900 mb-0.5">
                      {tipo.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 leading-snug">
                      {tipo.descricao}
                    </p>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-800 text-center">
              {sending ? 'Enviando alerta de emergência...' : 'Ao selecionar o tipo de emergência, síndicos e porteiros serão notificados imediatamente'}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full p-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Alerta Enviado!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              
              <Button
                onClick={() => navigate(createPageUrl(userType === 'morador' ? 'DashboardMorador' : 'Dashboard'))}
                className="w-full h-12 bg-[#3b5998] hover:bg-[#2d4373]"
              >
                Voltar ao Início
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {userType === 'morador' ? <MoradorFooter /> : <OperationalFooter />}
    </div>
  );
}