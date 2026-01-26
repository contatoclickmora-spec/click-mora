import React, { useState, useEffect } from 'react';
import { getUserRole, getDashboardPath } from './authUtils';
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

/**
 * Componente de roteamento inteligente de dashboards
 * Garante que cada usuário seja direcionado ao dashboard correto
 */
export default function DashboardRouter() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        console.log("🔄 [ROUTER] Determinando dashboard correto...");
        
        const roleInfo = await getUserRole();

        if (!roleInfo.isAuthenticated) {
          console.log("🚫 [ROUTER] Usuário não autenticado, redirecionando para login");
          window.location.href = '/login';
          return;
        }

        if (roleInfo.error) {
          console.error("❌ [ROUTER] Erro na autenticação:", roleInfo.error);
          setError(roleInfo.error);
          setLoading(false);
          return;
        }

        const dashboardPath = getDashboardPath(roleInfo.userType);
        console.log(`✅ [ROUTER] Redirecionando ${roleInfo.userType} para ${dashboardPath}`);

        window.location.href = createPageUrl(dashboardPath.replace('/', ''));

      } catch (err) {
        console.error("❌ [ROUTER] Erro fatal no roteamento:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    redirect();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Autenticação</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fazer Login Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Carregando seu painel...</p>
      </div>
    </div>
  );
}