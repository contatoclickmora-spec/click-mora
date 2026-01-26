import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Siren } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "@/components/utils/authUtils";
import { createPageUrl } from "@/utils";

import MoradorHeader from "../components/shared/MoradorHeader";
import OperationalFooter from "../components/shared/OperationalFooter";

export default function SOS() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

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
      setErro("Erro ao carregar dados do usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = () => {
    navigate(createPageUrl('TipoEmergencia'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f7f7f7]">
        <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  const isMorador = userType === 'morador';

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Emergência" userType={userType} />

      <div className="pt-28 pb-24 px-4 flex flex-col items-center justify-center min-h-screen">
        <AnimatePresence>
          {sucesso && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mb-6"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Alerta de emergência enviado com sucesso!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {erro && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mb-6"
            >
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-md text-center space-y-8">
          {/* Ícone de Alerta */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-200">
              <Siren className="w-20 h-20 text-red-600" />
            </div>
          </motion.div>

          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Emergência
            </h1>
            <p className="text-gray-600 text-lg">
              Pressione o botão abaixo em caso de situação de emergência
            </p>
          </div>

          {/* Informativo */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Ao acionar o SOS, todos os síndicos e porteiros do condomínio serão notificados imediatamente via WhatsApp.
            </p>
          </div>

          {/* Botão SOS */}
          <motion.div
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleSOS}
              disabled={enviando}
              className="w-full h-20 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-2xl shadow-2xl border-4 border-red-700"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Siren className="w-8 h-8 mr-3" />
                  ACIONAR SOS
                </>
              )}
            </Button>
          </motion.div>

          {/* Observação */}
          <p className="text-xs text-gray-500 mt-8">
            Use apenas em situações reais de emergência
          </p>
        </div>
      </div>

      {userType !== 'morador' && <OperationalFooter />}
    </div>
  );
}