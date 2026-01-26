import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, LogOut, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ExcluirContaModal from "./ExcluirContaModal";

export default function DashboardHeader({ currentUser, condominio, userType, morador }) {
  const [showExcluirModal, setShowExcluirModal] = useState(false);

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = '/';
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      window.location.href = '/';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  const getCargoLabel = (tipo) => {
    switch(tipo) {
      case 'administrador': return 'Síndico';
      case 'porteiro': return 'Porteiro';
      case 'morador': return 'Morador';
      case 'admin_master': return 'Administração';
      default: return 'Usuário';
    }
  };

  // Pegar foto do morador/funcionário se disponível
  const fotoUrl = morador?.foto_url || null;
  const nomeExibicao = morador?.nome || currentUser?.full_name || 'Usuário';

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: '#3b5998' }}
    >
      {/* Safe Area Spacer for iOS */}
      <div style={{ height: 'env(safe-area-inset-top)', backgroundColor: '#3b5998' }} />
      
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-end justify-between">
          {/* Foto e Info do Usuário */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-16 h-16 flex-shrink-0">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nomeExibicao}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/20"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <span className="text-white font-bold text-xl">
                    {getInitials(nomeExibicao)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-lg leading-tight truncate">
                Olá, {nomeExibicao.split(' ')[0] || 'Usuário'}
              </h2>
              <p className="text-white/90 text-sm leading-tight mt-1 truncate">
                {condominio?.nome || 'Carregando...'}
              </p>
              <p className="text-white/70 text-xs leading-tight mt-0.5">
                {getCargoLabel(userType)}
              </p>
            </div>
          </div>

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

          {showExcluirModal && (
            <ExcluirContaModal 
              onClose={() => setShowExcluirModal(false)} 
              morador={morador}
            />
          )}
        </div>
      </div>
    </div>
  );
}