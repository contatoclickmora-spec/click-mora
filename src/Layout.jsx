import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { getUserRole, clearAuthCache } from "@/components/utils/authUtils";
import {
    Package,
    LayoutDashboard,
    QrCode,
    PackageCheck,
    Users,
    Settings,
    MessageSquare,
    BarChart3,
    Building2,
    UserCheck,
    ClipboardList,
    LogOut,
    Crown,
    DollarSign,
    FileText,
    Activity,
    MessageCircle,
              Shield,
    MapPin,
    Siren,
    } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";


import { ChamadosProvider, useChamados } from "@/components/utils/chamadosContext";
import { deveExibirItem, getPermissoesVersion } from "@/components/utils/permissoesUtils";

const pageTitles = {
  Dashboard: "Dashboard",
  AdminMaster: "Dashboard Master",
  GerenciamentoUsuarios: "Gerenciamento de Usuários",
  RelatoriosFinanceiros: "Relatórios Financeiros",
  LogsAuditoria: "Logs de Auditoria",
  ConfiguracoesSistema: "Configurações do Sistema",
  MonitoramentoSistema: "Monitoramento do Sistema",
  GestaoCondominios: "Gestão de Condomínios",
  ConfiguracoesWhatsAppAdmin: "Configurações WhatsApp",
  RegistrarEncomenda: "Registrar Nova Encomenda",
  RetirarEncomenda: "Retirar Encomenda",
  VisitantesPortaria: "Controle de Visitantes",
  ChamadosPortaria: "Gestão de Chamados",
  EnviarAvisos: "Enviar Avisos",
  ConfiguracoesWhatsApp: "Configurações de WhatsApp",
  Relatorios: "Relatórios e Métricas",
  Moradores: "Gestão de Pessoas",
  AprovacaoMoradores: "Aprovar Moradores",
  Funcionarios: "Gestão de Funcionários",
  Templates: "Templates de Notificação",
  ComoUsar: "Como Usar o Sistema",
  Default: "PackageManager"
};

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissoesPerfis, setPermissoesPerfis] = useState(() => {
    // INSTANTÂNEO: Tentar cache local no primeiro render
    try {
      const cached = localStorage.getItem('permissoes_cache_v2');
      if (cached) {
        const data = JSON.parse(cached);
        return data.permissoes || {};
      }
    } catch (e) {}
    return {};
  });
  const [permissoesVersion, setPermissoesVersion] = useState(getPermissoesVersion());
  const { chamadosPendentes } = useChamados();

  useEffect(() => {
    const abortController = new AbortController();

    const fetchUserData = async () => {
        try {
          setLoading(true);

          if (abortController.signal.aborted) return;
        
        const role = await getUserRole();
        if (abortController.signal.aborted) return;
        
        setRoleInfo(role);

        if (!role.isAuthenticated) {
          setLoading(false);
          return;
        }
        
        if (role.morador?.condominio_id) {
          try {
            const condominios = await base44.entities.Condominio.list();
            if (abortController.signal.aborted) return;
            
            const condominio = condominios.find(c => c.id === role.morador.condominio_id);
            if (condominio?.permissoes_perfis) {
              setPermissoesPerfis(condominio.permissoes_perfis);
              try {
                localStorage.setItem('permissoes_cache_v2', JSON.stringify({
                  condominioId: role.morador.condominio_id,
                  permissoes: condominio.permissoes_perfis,
                  timestamp: Date.now(),
                  version: getPermissoesVersion()
                }));
              } catch (e) {}
            }
          } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            // Silently fail
          }
        }
        
        if (!abortController.signal.aborted) {
          setLoading(false);
        }

      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      abortController.abort();
    };
  }, [location.pathname]);

  // Escutar atualizações de permissões em tempo real
  useEffect(() => {
    const handlePermissoesUpdate = async (event) => {
      setPermissoesVersion(event.detail?.version || Date.now());
      
      // Recarregar permissões do servidor
      if (roleInfo?.morador?.condominio_id) {
        try {
          const condominios = await base44.entities.Condominio.list();
          const cond = condominios.find(c => c.id === roleInfo.morador.condominio_id);
          if (cond?.permissoes_perfis) {
            setPermissoesPerfis(cond.permissoes_perfis);
            }
            } catch (err) {
            // Silently fail
            }
      }
    };

    window.addEventListener('permissoes_updated', handlePermissoesUpdate);
    
    // Verificar periodicamente se versão mudou (WebView/outros tabs)
    const PERMISSION_CHECK_INTERVAL = 1000; // 1 segundo para sincronização mais rápida
    const checkInterval = setInterval(() => {
      const currentVersion = getPermissoesVersion();
      if (currentVersion !== permissoesVersion) {
        handlePermissoesUpdate({ detail: { version: currentVersion } });
      }
    }, PERMISSION_CHECK_INTERVAL);

    return () => {
      window.removeEventListener('permissoes_updated', handlePermissoesUpdate);
      clearInterval(checkInterval);
    };
  }, [roleInfo?.morador?.condominio_id, permissoesVersion]);

  const handleLogout = async () => {
    try {
      clearAuthCache();
      await base44.auth.logout();
      window.location.href = '/';
    } catch (err) {
      clearAuthCache(); 
      window.location.href = '/'; 
    }
  };

  // Mostrar loading apenas durante autenticação inicial
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // Se não está autenticado ou é morador, não mostra sidebar
  if (!roleInfo || !roleInfo.isAuthenticated || roleInfo.userType === 'morador') {
    return React.cloneElement(children, { userType: roleInfo?.userType || 'morador' });
  }

  // Mapeamento de títulos do menu para IDs de permissões
  const menuToPermissaoMap = {
    'Dashboard': 'dashboard',
    'Registrar Encomenda': 'registrar_encomenda',
    'Retirar Encomenda': 'retirar_encomenda',
    'Visitantes': 'visitantes_portaria',
    
    'Chamados': 'chamados_portaria',
    'Aprovar Moradores': 'aprovacao_moradores',
    'Enviar Avisos': 'enviar_avisos',
    'WhatsApp': 'notificacoes_whatsapp',
    'Relatórios': 'relatorios',
    'Moradores': 'moradores',
    'Funcionários': 'funcionarios',
    'Templates': 'templates',
    'Permissões': 'permissoes'
  };

  // Função para verificar se item deve aparecer no menu
  const itemDeveAparecer = (titulo, perfilId) => {
    // Usar cache instantâneo - nunca bloquear
    const permissaoKey = menuToPermissaoMap[titulo];
    if (!permissaoKey) return true;
    return deveExibirItem(permissoesPerfis, perfilId, permissaoKey);
  };

  const getNavigationItems = () => {
    const baseItems = [];
    const currentUserType = roleInfo.userType;

    if (currentUserType === 'admin_master') {
      return [
        {
          title: "Dashboard Master",
          url: createPageUrl("AdminMaster"),
          icon: Crown,
          description: "Visão geral da plataforma"
        },
        {
          title: "Gerenciamento de Usuários",
          url: createPageUrl("GerenciamentoUsuarios"),
          icon: Users,
          description: "Controle total de usuários"
        },
        {
          title: "Gestão de Condomínios",
          url: createPageUrl("GestaoCondominios"),
          icon: Building2,
          description: "Gerenciar condomínios"
        },

        {
          title: "Financeiro",
          url: createPageUrl("RelatoriosFinanceiros"),
          icon: DollarSign,
          description: "Relatórios e faturamento"
        },
        {
          title: "Logs de Auditoria",
          url: createPageUrl("LogsAuditoria"),
          icon: FileText,
          description: "Histórico de ações"
        },
        {
          title: "Configurações",
          url: createPageUrl("ConfiguracoesSistema"),
          icon: Settings,
          description: "Configurações globais"
        },
        {
          title: "Configurações WhatsApp",
          url: createPageUrl("ConfiguracoesWhatsAppAdmin"),
          icon: MessageCircle,
          description: "Z-API e envios"
        },
        {
          title: "Monitoramento",
          url: createPageUrl("MonitoramentoSistema"),
          icon: Activity,
          description: "Status do sistema"
        },
        {
          title: "Como Usar",
          url: createPageUrl("ComoUsar"),
          icon: Settings,
          description: "Guia do sistema"
        },
        {
          title: "Potenciais Condomínios",
          url: createPageUrl("PotenciaisCondominios"),
          icon: MapPin,
          description: "Identificar novos condomínios"
        }
      ];
    }

    baseItems.push(
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard }
    );

    if (currentUserType === 'porteiro' || currentUserType === 'administrador') {
      const itensPorteiro = [
        { title: "Registrar Encomenda", url: createPageUrl("RegistrarEncomenda"), icon: QrCode },
        { title: "Retirar Encomenda", url: createPageUrl("RetirarEncomenda"), icon: PackageCheck },
        { title: "Visitantes", url: createPageUrl("VisitantesPortaria"), icon: ClipboardList },
                { 
          title: "Chamados", 
          url: createPageUrl("ChamadosPortaria"), 
          icon: MessageSquare,
          badge: chamadosPendentes > 0 ? chamadosPendentes : null
        },

        { 
          title: "SOS", 
          url: createPageUrl("SOS"), 
          icon: Shield,
          iconColor: "text-black"
        },
        {
          title: "WhatsApp",
          url: createPageUrl("WhatsApp"),
          icon: MessageCircle
        }
      ];

      // Filtrar baseado nas permissões do perfil
      const perfilParaFiltrar = currentUserType === 'administrador' ? 'sindico' : 'porteiro';
      itensPorteiro.forEach(item => {
        if (itemDeveAparecer(item.title, perfilParaFiltrar)) {
          baseItems.push(item);
        }
      });
    }

    if (currentUserType === 'administrador') {
      const itensAdmin = [
        { title: "Aprovar Moradores", url: createPageUrl("AprovacaoMoradores"), icon: UserCheck },
        { title: "Enviar Avisos", url: createPageUrl("EnviarAvisos"), icon: MessageSquare },
        { title: "Relatórios", url: createPageUrl("Relatorios"), icon: BarChart3 },
        { title: "Moradores", url: createPageUrl("Moradores"), icon: Users },
        { title: "Funcionários", url: createPageUrl("Funcionarios"), icon: UserCheck },
        { title: "Templates", url: createPageUrl("Templates"), icon: MessageSquare },
        { title: "Permissões", url: createPageUrl("Permissoes"), icon: Shield },
        { 
          title: "SOS", 
          url: createPageUrl("SOS"), 
          icon: Siren,
          iconColor: "text-black"
        }
        ];

        // Filtrar baseado nas permissões do síndico
      itensAdmin.forEach(item => {
        if (itemDeveAparecer(item.title, 'sindico')) {
          baseItems.push(item);
        }
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  };

  const getUserTypeLabel = (type) => {
    switch(type) {
      case 'admin_master': return 'Admin Master';
      case 'administrador': return 'Síndico';
      case 'porteiro': return 'Porteiro';
      case 'morador': return 'Morador';
      default: return type;
    }
  };

  const getUserTypeBadgeColor = (type) => {
    switch(type) {
      case 'admin_master': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'administrador': return 'bg-purple-100 text-purple-700';
      case 'porteiro': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 bg-white hidden lg:flex flex-col">
          <SidebarHeader className="border-b border-gray-100 p-4">
            <Link to={createPageUrl(roleInfo.userType === 'admin_master' ? "AdminMaster" : "Dashboard")} className="flex items-center gap-3">
              <div className={`w-10 h-10 ${roleInfo.userType === 'admin_master' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' : 'bg-gradient-to-br from-blue-600 to-blue-700'} rounded-xl flex items-center justify-center shadow-lg`}>
                {roleInfo.userType === 'admin_master' ? (
                  <Crown className="w-6 h-6 text-white" />
                ) : (
                  <Package className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">PackageManager</h2>
                <p className="text-xs text-gray-500">
                  {roleInfo.userType === 'admin_master' ? 'Painel Master' : 'Gestão de Encomendas'}
                </p>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-4 flex-1">
            {roleInfo.userType === 'admin_master' && (
              <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-bold text-yellow-900">ACESSO TOTAL</span>
                </div>
                <p className="text-xs text-yellow-800">
                  Você tem controle completo sobre todo o sistema
                </p>
              </div>
            )}

            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg p-3 ${
                    location.pathname === item.url ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold' : 'text-gray-600'
                  }`}>
                    <Link to={item.url} className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <item.icon className={`w-5 h-5 ${
                          item.iconColor || (location.pathname === item.url ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600')
                        } transition-colors`} />
                        {item.badge && item.badge > 0 && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-[10px] font-bold">{item.badge > 9 ? '9+' : item.badge}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="block">{item.title}</span>
                        {item.description && roleInfo.userType === 'admin_master' && (
                          <span className="text-xs text-gray-400 block">{item.description}</span>
                        )}
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start p-3 hover:bg-gray-50"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-600">Sair</span>
              </div>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 overflow-auto bg-gray-50">
            {React.cloneElement(children, { userType: roleInfo.userType })}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ChamadosProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ChamadosProvider>
  );
}