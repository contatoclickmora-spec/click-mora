import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Home, ShoppingBag, LogOut, MoreVertical } from 'lucide-react';
import { User } from "@/entities/User";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LayoutMorador({ children, currentUser, totalNotificacoes = 0 }) {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      window.location.href = '/';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name[0];
  };

  const footerItems = [
    {
      icon: Home,
      label: 'Início',
      path: createPageUrl('DashboardMorador'),
      key: 'inicio'
    },
    {
      icon: ShoppingBag,
      label: 'Marketplace',
      path: createPageUrl('Marketplace'),
      key: 'marketplace'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-24">
      {/* Cabeçalho Padronizado */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Card className="bg-gradient-to-r from-blue-50 to-white border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 border-2 border-blue-500 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                    {getInitials(currentUser?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {currentUser?.full_name || 'Usuário'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      🏠 Morador
                    </Badge>
                    {totalNotificacoes > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Badge className="bg-red-500 text-white text-xs px-2">
                          {totalNotificacoes} {totalNotificacoes === 1 ? 'nova' : 'novas'}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="w-full">
        {children}
      </main>

      {/* Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            {footerItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 py-2 transition-colors relative ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}