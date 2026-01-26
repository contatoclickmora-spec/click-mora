import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import AuthGuard from '../components/utils/AuthGuard';
import { Package, AlertTriangle, Users, MessageSquare, ShoppingBag, Megaphone, Home, ChevronDown, ChevronUp, ThumbsUp, Wrench, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from '@/utils';
import { getUserRole, getUserRoleSync } from "../components/utils/authUtils";
import DashboardHeader from '@/components/shared/DashboardHeader';
import MoradorHeader from '@/components/shared/MoradorHeader';
import GerenciarVisitantes from '../components/moradores/GerenciarVisitantes';
import GerenciarChamados from '../components/moradores/GerenciarChamados';
import { filtrarItensPorPermissao, getPermissoesVersion } from '../components/utils/permissoesUtils';

export default function DashboardMorador() {
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [encomendas, setEncomendas] = useState([]);
  const [chamados, setChamados] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState('');
  const [roleInfo, setRoleInfo] = useState(getUserRoleSync());
  const [accessDenied, setAccessDenied] = useState(false);
  const [condominioAtual, setCondominioAtual] = useState(null);
  const [userType, setUserType] = useState('morador');
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [permissoesMorador, setPermissoesMorador] = useState(() => {
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

  const todasFuncionalidades = [
    {
      icon: Package,
      titulo: 'Encomendas',
      subtitulo: 'Minhas entregas',
      path: createPageUrl('EncomendasMorador'),
      color: '#3b82f6',
      key: 'encomendas'
    },
    {
      icon: MessageSquare,
      titulo: 'Chamados',
      subtitulo: 'Minhas solicitações',
      color: '#ec4899',
      key: 'chamados',
      onClick: 'handleVerChamados'
    },
    {
      icon: Users,
      titulo: 'Visitantes',
      subtitulo: 'Autorizar acesso',
      color: '#8b5cf6',
      key: 'visitantes',
      onClick: 'handleVerVisitantes'
    },
    {
      icon: Megaphone,
      titulo: 'Avisos',
      subtitulo: 'Comunicados',
      path: createPageUrl('AvisosMorador'),
      color: '#f59e0b',
      key: 'avisos'
    },
    {
      icon: ThumbsUp,
      titulo: 'Enquetes',
      subtitulo: 'Votar em enquetes',
      path: createPageUrl('Enquetes'),
      color: '#8b5cf6',
      key: 'enquetes'
    },
    {
      icon: ShoppingBag,
      titulo: 'Marketplace',
      subtitulo: 'Comprar e vender',
      path: createPageUrl('Marketplace'),
      color: '#10b981',
      key: 'marketplace'
    },
    {
      icon: Home,
      titulo: 'Vistoria',
      subtitulo: 'Meus imóveis',
      path: createPageUrl('VistoriaImoveis'),
      color: '#06b6d4',
      key: 'vistoria'
    },
    {
      icon: Siren,
      titulo: 'SOS',
      subtitulo: 'Emergência',
      path: createPageUrl('SOS'),
      color: '#000000',
      key: 'sos'
    }
    ];

  const loadDashboardData = useCallback(async (user, morador, signal) => {
    try {
      setError('');

      if (!user || !morador) {
        throw new Error("Dados de morador incompletos.");
      }

      if (signal?.aborted) return;

      const [todasEncomendas, todosChamados, todosCondominios] = await Promise.all([
        base44.entities.Encomenda.list('-data_entrada'),
        base44.entities.Chamado.list('-created_date'),
        base44.entities.Condominio.list()
      ]);
      
      if (signal?.aborted) return;
      
      const encomendasDoMorador = todasEncomendas
        .filter(e => e && e.morador_id === morador.id)
        .sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada));
      
      const chamadosDoMorador = todosChamados.filter(c => c && c.morador_id === morador.id);
      
      const condominio = todosCondominios.find(c => c && c.id === morador.condominio_id);
      if (condominio) {
        setCondominioAtual(condominio);
        if (condominio.permissoes_perfis) {
          setPermissoesMorador(condominio.permissoes_perfis);
        }
      }

      if (signal?.aborted) return;

      setEncomendas(encomendasDoMorador);
      setChamados(chamadosDoMorador);

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return;
      }
      setError("Erro ao carregar dados. Tente recarregar a página.");
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const checkAccess = async () => {
      setError('');
      setAccessDenied(false);

      try {
        let role = getUserRoleSync();
        
        if (!role || !role.isAuthenticated) {
          const [roleData] = await Promise.all([
            getUserRole(),
            new Promise(resolve => setTimeout(resolve, 200))
          ]);
          role = roleData;
        } else {
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        if (abortController.signal.aborted) return;

        if (!role || !role.isAuthenticated) {
          window.location.href = '/login';
          return;
        }

        if (role.userType === 'admin_master') {
          window.location.href = createPageUrl('AdminMaster');
          return;
        }

        if (role.userType === 'porteiro' || role.userType === 'administrador') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }

        if (role.userType !== 'morador') {
          if (!abortController.signal.aborted) {
            setAccessDenied(true);
            setIsInitializing(false);
          }
          return;
        }
        
        if (!role.morador) {
          if (!abortController.signal.aborted) {
            setError("Cadastro não encontrado ou pendente de aprovação.");
            setIsInitializing(false);
          }
          return;
        }

        if (!abortController.signal.aborted) {
            setCurrentUser(role.user);
            setMoradorLogado(role.morador);
            setUserType(role.userType);
            setRoleInfo(role);
        }
        
        await loadDashboardData(role.user, role.morador, abortController.signal);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!abortController.signal.aborted) {
          setIsInitializing(false);
        }

      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        if (!abortController.signal.aborted) {
          setError("Erro ao carregar dados. Verifique sua conexão.");
          setIsInitializing(false);
        }
      }
    };

    checkAccess();

    return () => {
      abortController.abort();
    };
  }, [loadDashboardData]);

  // Ler query params da URL ao montar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    
    if (view === 'chamados') {
      setCurrentView('chamados');
    } else if (view === 'visitantes') {
      setCurrentView('visitantes');
    } else {
      setCurrentView('dashboard');
    }
  }, []);

  // Escutar atualizações de permissões em tempo real
  useEffect(() => {
    const handlePermissoesUpdate = async (event) => {
      setPermissoesVersion(event.detail?.version || Date.now());
      
      // Recarregar permissões do servidor
      if (moradorLogado?.condominio_id) {
        try {
          const condominios = await base44.entities.Condominio.list();
          const cond = condominios.find(c => c.id === moradorLogado.condominio_id);
          if (cond?.permissoes_perfis) {
            setPermissoesMorador(cond.permissoes_perfis);
          }
        } catch (err) {
          // Silently fail
        }
      }
    };

    window.addEventListener('permissoes_updated', handlePermissoesUpdate);
    
    // Verificar periodicamente se versão mudou (WebView/outros tabs)
    const PERMISSION_CHECK_INTERVAL = 1000; // 1 segundo
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
  }, [moradorLogado?.condominio_id, permissoesVersion]);

  const handleNavigation = (item) => {
    if (item.onClick === 'handleVerChamados') {
      setCurrentView('chamados');
    } else if (item.onClick === 'handleVerVisitantes') {
      setCurrentView('visitantes');
    } else if (item.path) {
      window.location.href = item.path;
    }
  };

  const handleVoltarDashboard = () => {
    setCurrentView('dashboard');
    // Limpar query params da URL
    window.history.replaceState({}, '', createPageUrl('DashboardMorador'));
  };

  // Mostrar loading apenas durante inicialização básica
  if (isInitializing) {
    return <div className="min-h-screen bg-[#f7f7f7]" />;
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar este painel.</p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir para Meu Painel
          </Button>
        </div>
      </div>
    );
  }

  if (error && !moradorLogado) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{error}</h3>
            <p className="text-gray-600 mt-2 mb-4">
              Verifique sua conexão com a internet e tente novamente.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar view de Visitantes
  if (currentView === 'visitantes' && moradorLogado) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Visitantes" onBack={handleVoltarDashboard} />
        
        <div className="pt-28 pb-24 px-4">
          <GerenciarVisitantes moradorLogado={moradorLogado} />
        </div>
      </div>
    );
  }

  // Renderizar view de Chamados
  if (currentView === 'chamados' && moradorLogado) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Chamados" onBack={handleVoltarDashboard} />

        <div className="pt-16 pb-6 px-4">
          <GerenciarChamados moradorId={moradorLogado.id} />
        </div>
      </div>
    );
  }

  // Dashboard principal - Protegido por AuthGuard
  const encomendasAguardando = encomendas.filter(e => e.status === 'aguardando');
  const chamadosAbertosArray = chamados.filter(c => c.status === 'aberto' || c.status === 'em_andamento');
  const chamadosRespondidosArray = chamados.filter(c => 
    c.status === 'resolvido' && 
    c.resposta_portaria && 
    !c.lido_pelo_morador
  );

  const stats = {
    aguardando: encomendasAguardando.length,
    chamadosAbertos: chamadosAbertosArray.length,
  };

  // Filtrar funcionalidades baseado nas permissões do perfil morador
  // Usar cache instantâneo - nunca bloquear
  const funcionalidadesVisiveis = filtrarItensPorPermissao(todasFuncionalidades.filter(f => f.key !== 'manutencoes'), permissoesMorador, 'morador', 'key');

  // Acesso Rápido Dinâmico (2 principais que estejam visíveis)
  const acessoRapido = [
    funcionalidadesVisiveis.find(f => f.key === 'encomendas'),
    funcionalidadesVisiveis.find(f => f.key === 'chamados')
  ].filter(Boolean);

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#f7f7f7]">
      <DashboardHeader 
        currentUser={currentUser}
        condominio={condominioAtual}
        userType={userType}
        morador={moradorLogado}
      />
      
      <div className="pt-32 pb-4 px-3 max-w-7xl mx-auto">
        {/* Alertas */}
        {encomendasAguardando.length > 0 && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <Package className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              Você tem {encomendasAguardando.length} encomenda(s) aguardando retirada!
            </AlertDescription>
          </Alert>
        )}

        {chamadosRespondidosArray.length > 0 && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Você tem {chamadosRespondidosArray.length} chamado(s) com resposta da portaria/síndico.
            </AlertDescription>
          </Alert>
        )}

        {/* Acesso Rápido */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {acessoRapido.map((item) => (
              <div key={item.key}>
                <div
                  onClick={() => handleNavigation(item)}
                  className="cursor-pointer"
                >
                  <Card className="bg-white hover:shadow-lg transition-all duration-200 active:scale-[0.98]">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <item.icon className="w-6 h-6" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{item.titulo}</h3>
                        <p className="text-xs text-gray-600">{item.subtitulo}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Completo */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Menu Completo
          </h2>
          <Card className="bg-white">
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {funcionalidadesVisiveis.slice(0, menuExpanded ? funcionalidadesVisiveis.length : 3).map((item) => (
                  <div key={item.key}>
                    <div
                      onClick={() => handleNavigation(item)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f7f7f7] transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-11 h-11 bg-[#dfe3ee] rounded-xl flex items-center justify-center">
                        <item.icon className={`w-5 h-5 ${item.key === 'sos' ? 'text-black' : 'text-[#3b5998]'}`} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-900 text-center">{item.titulo}</span>
                    </div>
                  </div>
                ))}
              </div>

              {funcionalidadesVisiveis.length > 3 && (
                <button
                  onClick={() => setMenuExpanded(!menuExpanded)}
                  className="w-full mt-2 pt-2 border-t border-gray-200 flex items-center justify-center gap-2 text-[#3b5998] hover:text-[#2d4373] transition-colors"
                >
                  {menuExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Recolher</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span className="text-xs font-medium">Ver todos</span>
                    </>
                  )}
                </button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Cards de Estatísticas */}
        <section className="mb-5">
          <div className="space-y-2">
            <Card className="bg-gradient-to-r from-[#FFF3E0] to-[#FFE0B2] border-[#FFB74D]">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-11 h-11 bg-[#FFB74D] rounded-full flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[#E65100] font-semibold text-xs">Aguardando Retirada</p>
                  <p className="text-2xl font-bold text-[#E65100]">{stats.aguardando}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-[#FCE4EC] to-[#F8BBD0] border-[#EC407A]">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-11 h-11 bg-[#EC407A] rounded-full flex items-center justify-center shadow-md">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[#C2185B] font-semibold text-xs">Chamados em Andamento</p>
                  <p className="text-2xl font-bold text-[#C2185B]">{stats.chamadosAbertos}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        </div>
        </div>
        </AuthGuard>
        );
        }