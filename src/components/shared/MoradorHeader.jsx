import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, LogOut, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import ExcluirContaModal from "./ExcluirContaModal";
import { createPageUrl } from "@/utils";

export default function MoradorHeader({ title, onBack, userType }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExcluirModal, setShowExcluirModal] = useState(false);
  const [moradorLogado, setMoradorLogado] = useState(null);

  useEffect(() => {
    const loadMorador = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.email) {
          const todosMoradores = await base44.entities.Morador.list();
          const morador = todosMoradores.find(
            m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
          );
          setMoradorLogado(morador);
        }
      } catch (error) {
        // Silently fail
      }
    };
    loadMorador();
  }, []);

  const getDefaultDashboard = () => {
    // Determinar dashboard baseado no tipo de usuário
    if (userType === 'administrador' || userType === 'porteiro') {
      return createPageUrl('Dashboard');
    }
    return createPageUrl('DashboardMorador');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    
    // Sempre navegar para o dashboard apropriado
    navigate(getDefaultDashboard(), { replace: true });
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = '/';
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      window.location.href = '/';
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 shadow-md"
      style={{ backgroundColor: '#3b5998' }}
    >
      {/* Safe Area Spacer for iOS */}
      <div style={{ height: 'env(safe-area-inset-top)', backgroundColor: '#3b5998' }} />
      
      <div className="flex items-end justify-between h-24 px-4 pb-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-xl font-semibold text-center text-white">
          {title}
        </h1>

        {/* Menu Três Pontos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="flex-shrink-0 h-10 w-10 hover:bg-white/10 text-white"
            >
              <MoreVertical className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowExcluirModal(true)} 
              className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir minha conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showExcluirModal && moradorLogado && (
          <ExcluirContaModal 
            onClose={() => setShowExcluirModal(false)} 
            morador={moradorLogado}
          />
        )}
      </div>
    </div>
  );
}