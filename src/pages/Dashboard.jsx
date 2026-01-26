import React, { useState, useEffect, useCallback } from "react";
import { getUserRole, getUserRoleSync, clearAuthCache } from "../components/utils/authUtils";
import { base44 } from "@/api/base44Client";
import AuthGuard from "../components/utils/AuthGuard";
import {
  Package,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Megaphone,
  UserCheck,
  ClipboardList,
  QrCode,
  PackageCheck,
  ThumbsUp,
  Wrench,
  FileText,
  ShoppingBag,
  Shield,
  MessageCircle,
  Siren
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from "@/utils";
import { Link } from 'react-router-dom';
import { useChamados } from "../components/utils/chamadosContext";
import FixedFooter from "../components/shared/FixedFooter";
import DashboardHeader from "../components/shared/DashboardHeader";
import { getPermissoesVersion } from "../components/utils/permissoesUtils";

export default function Dashboard() {
  const [roleInfo, setRoleInfo] = useState(null);
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [condominioAtual, setCondominioAtual] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [stats, setStats] = useState({
    aguardando: 0,
    chamadosPendentes: 0
  });
  const [ultimasAtualizacoes, setUltimasAtualizacoes] = useState([]);
  const [acessosRecentes, setAcessosRecentes] = useState([]);
  const [permissoesSindico, setPermissoesSindico] = useState(() => {
    // INSTANTÂNEO: Tentar cache local no primeiro render
    try {
      const cached = localStorage.getItem('permissoes_cache_v2');
      if (cached) {
        const data = JSON.parse(cached);
        return data.permissoes?.sindico || {};
      }
    } catch (e) {}
    return {};
  });
  const [permissoesVersion, setPermissoesVersion] = useState(getPermissoesVersion());
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(true); // Sempre true - usamos cache

  const { chamadosPendentes } = useChamados();

  const todasFuncionalidades = [
    {
      icon: QrCode,
      titulo: 'Registrar',
      subtitulo: 'Nova encomenda',
      path: createPageUrl('RegistrarEncomenda'),
      color: '#10b981',
      key: 'registrar'
    },
    {
      icon: Package,
      titulo: 'Encomendas',
      subtitulo: 'Gerenciar entregas',
      path: createPageUrl('GerenciamentoEncomendas'),
      color: '#3b82f6',
      key: 'encomendas'
    },
    {
      icon: PackageCheck,
      titulo: 'Retirar',
      subtitulo: 'Processar retirada',
      path: createPageUrl('RetirarEncomenda'),
      color: '#f59e0b',
      key: 'retirar'
    },
    {
      icon: MessageSquare,
      titulo: 'Chamados',
      subtitulo: 'Gerenciar solicitações',
      path: createPageUrl('ChamadosPortaria'),
      color: '#ec4899',
      key: 'chamados'
    },
    {
      icon: ClipboardList,
      titulo: 'Visitantes',
      subtitulo: 'Controlar acesso',
      path: createPageUrl('VisitantesPortaria'),
      color: '#8b5cf6',
      key: 'visitantes'
    },
    {
      icon: Users,
      titulo: 'Entregadores',
      subtitulo: 'Registrar entregas',
      path: createPageUrl('Entregadores'),
      color: '#06b6d4',
      key: 'entregadores'
    },
    {
      icon: Users,
      titulo: 'Moradores',
      subtitulo: 'Consultar cadastro',
      path: createPageUrl('Moradores'),
      color: '#6366f1',
      key: 'moradores'
    },
    {
      icon: ThumbsUp,
      titulo: 'Enquetes',
      subtitulo: 'Gerenciar enquetes',
      path: createPageUrl('Enquetes'),
      color: '#8b5cf6',
      key: 'enquetes'
    },
    {
      icon: Wrench,
      titulo: 'Manutenções',
      subtitulo: 'Programar manutenções',
      path: createPageUrl('Manutencoes'),
      color: '#f59e0b',
      key: 'manutencoes'
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

  useEffect(() => {
    const acessos = JSON.parse(localStorage.getItem('acessos_recentes') || '[]');
    setAcessosRecentes(acessos);
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
          if (cond?.permissoes_perfis?.sindico) {
            setPermissoesSindico(cond.permissoes_perfis.sindico);
          }
        } catch (err) {
          // Silently fail
        }
      }
    };

    window.addEventListener('permissoes_updated', handlePermissoesUpdate);
    
    // Também verificar periodicamente se versão mudou (para WebView/outros tabs)
    const checkInterval = setInterval(() => {
      const currentVersion = getPermissoesVersion();
      if (currentVersion !== permissoesVersion) {
        handlePermissoesUpdate({ detail: { version: currentVersion } });
      }
    }, 2000); // Verificar a cada 2 segundos

    return () => {
      window.removeEventListener('permissoes_updated', handlePermissoesUpdate);
      clearInterval(checkInterval);
    };
  }, [moradorLogado?.condominio_id, permissoesVersion]);

  const registrarAcesso = (funcionalidadeKey) => {
    const acessos = JSON.parse(localStorage.getItem('acessos_recentes') || '[]');
    const agora = new Date().getTime();

    const novosAcessos = [
      { key: funcionalidadeKey, timestamp: agora },
      ...acessos.filter(a => a.key !== funcionalidadeKey)
    ].slice(0, 10);

    localStorage.setItem('acessos_recentes', JSON.stringify(novosAcessos));
    setAcessosRecentes(novosAcessos);
  };

  // Mapeamento de keys para permissões (duplicado aqui para usar antes da função deveExibirNoMenu)
  const keyToPermissaoMapLocal = {
    'registrar': 'registrar_encomenda',
    'encomendas': 'gerenciamento_encomendas',
    'retirar': 'retirar_encomenda',
    'chamados': 'chamados_portaria',
    'visitantes': 'visitantes_portaria',
    'manutencoes': 'manutencoes',
    'documentos': 'documentos',
    'marketplace': 'marketplace',
    'entregadores': 'entregadores',
    'moradores': 'moradores',
    'enquetes': 'enquetes',
    'avisos': 'enviar_avisos',
    'notificacoes_whatsapp': 'notificacoes_whatsapp',
    'permissoes': 'permissoes'
  };

  // Função para filtrar funcionalidades baseado nas permissões do síndico
  const filtrarPorPermissao = (itemKey) => {
    if (userType !== 'administrador') return true;
    // Usar cache instantâneo - nunca bloquear
    if (!permissoesSindico || Object.keys(permissoesSindico).length === 0) return true;
    const permissaoKey = keyToPermissaoMapLocal[itemKey] || itemKey;
    if (permissoesSindico[permissaoKey] === false) return false;
    return true;
  };

  // Filtrar todasFuncionalidades baseado nas permissões
  const funcionalidadesVisiveis = todasFuncionalidades.filter(f => filtrarPorPermissao(f.key));

  const getAcessoRapidoDinamico = () => {
    if (acessosRecentes.length === 0) {
      return [
        funcionalidadesVisiveis.find(f => f.key === 'registrar'),
        funcionalidadesVisiveis.find(f => f.key === 'encomendas')
      ].filter(Boolean);
    }

    const maisUsadas = acessosRecentes
      .slice(0, 2)
      .map(a => funcionalidadesVisiveis.find(f => f.key === a.key))
      .filter(Boolean);

    while (maisUsadas.length < 2) {
      const falta = funcionalidadesVisiveis.find(f => !maisUsadas.some(mu => mu.key === f.key));
      if (falta) maisUsadas.push(falta);
      else break;
    }

    return maisUsadas;
  };

  const acessoRapido = getAcessoRapidoDinamico();

  const loadDashboardData = useCallback(async (role, signal) => {
    try {
      if (signal?.aborted) return;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (signal?.aborted) return;
      
      const condominioId = role.morador?.condominio_id;
      
      // VALIDAÇÃO: Condomínio obrigatório
      if (!condominioId) {
        console.warn('[SECURITY] Condomínio não identificado no dashboard');
        setStats({ aguardando: 0, chamadosPendentes: chamadosPendentes || 0 });
        return;
      }

      let allCondominios = [];

      try {
        allCondominios = await base44.entities.Condominio.list();
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('[DATA_INTEGRITY] Erro ao carregar condomínios:', err);
      }

      if (signal?.aborted) return;

      try {
        // PROTEÇÃO: Carregar apenas dados do condomínio do usuário
        const [encomendasDoCondominio, logsDoCondominio] = await Promise.all([
          base44.entities.Encomenda.filter({ condominio_id: condominioId }, '-created_date', 30).catch(err => {
            console.error('[DATA_INTEGRITY] Erro ao carregar encomendas:', err);
            return [];
          }),
          base44.entities.LogSistema.filter({ condominio_id: condominioId }, '-timestamp', 5).catch(err => {
            console.error('[DATA_INTEGRITY] Erro ao carregar logs:', err);
            return [];
          })
        ]);

        if (signal?.aborted) return;

        const currentCondominio = allCondominios.find(c => c.id === condominioId);

        // VALIDAÇÃO FINAL: Garantir isolamento absoluto
        const encomendasValidadas = Array.isArray(encomendasDoCondominio) 
          ? encomendasDoCondominio.filter(e => e?.condominio_id === condominioId)
          : [];
          
        const logsValidados = Array.isArray(logsDoCondominio)
          ? logsDoCondominio.filter(l => l?.condominio_id === condominioId)
          : [];

        setCondominioAtual(currentCondominio || null);
        
        if (currentCondominio?.permissoes_perfis?.sindico) {
          setPermissoesSindico(currentCondominio.permissoes_perfis.sindico);
        }
        setMoradorLogado(role.morador || null);
        setUltimasAtualizacoes(logsValidados);

        // PROTEÇÃO: Cálculo seguro de aguardando
        const aguardando = encomendasValidadas.filter(e => e?.status === "aguardando").length || 0;
        setStats({ aguardando, chamadosPendentes: chamadosPendentes || 0 });

        console.log(`[SECURITY] Dashboard carregado - Condomínio: ${condominioId}, Encomendas: ${encomendasValidadas.length}`);

      } catch (filterErr) {
        if (signal?.aborted) return;
        console.error('[DATA_INTEGRITY] Erro ao carregar dashboard:', filterErr);
        setStats({ aguardando: 0, chamadosPendentes: chamadosPendentes || 0 });
      }

    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('[DATA_INTEGRITY] Erro crítico no dashboard:', error);
      setStats({ aguardando: 0, chamadosPendentes: 0 });
    }
  }, [chamadosPendentes]);

  useEffect(() => {
    const abortController = new AbortController();
    
    const checkAccess = async () => {
      try {
        let role = getUserRoleSync();
        
        if (!role) {
          try {
            const [roleData] = await Promise.all([
              getUserRole(),
              new Promise(resolve => setTimeout(resolve, 200))
            ]);
            role = roleData;
          } catch (err) {
            if (abortController.signal.aborted) return;
            clearAuthCache();
            window.location.href = '/login';
            return;
          }
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

        if (role.userType === 'morador') {
          window.location.href = createPageUrl('DashboardMorador');
          return;
        }

        if (abortController.signal.aborted) return;
        setRoleInfo(role);
        setUserType(role.userType);
        setCurrentUser(role.user);
        setMoradorLogado(role.morador);
        
        loadDashboardData(role, abortController.signal).catch(err => {
          if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
          // Silently fail
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!abortController.signal.aborted) {
          setIsInitializing(false);
        }

      } catch (error) {
        if (abortController.signal.aborted) return;
        setAccessDenied(true);
        setIsInitializing(false);
      }
    };

    checkAccess();

    return () => {
      abortController.abort();
    };
  }, [loadDashboardData]);

  useEffect(() => {
    setStats(prevStats => ({
      ...prevStats,
      chamadosPendentes: chamadosPendentes 
    }));
  }, [chamadosPendentes]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  const getAtualizacaoIcon = (tipoAcao) => {
    const icons = {
      registrar_encomenda: Package,
      retirar_encomenda: PackageCheck,
      enviar_aviso: Megaphone,
      criar_morador: UserCheck,
      aprovar_morador: UserCheck
    };
    return icons[tipoAcao] || Package;
  };

  const getAtualizacaoColor = (tipoAcao) => {
    const colors = {
      registrar_encomenda: '#3b82f6',
      retirar_encomenda: '#10b981',
      enviar_aviso: '#8b5cf6',
      criar_morador: '#f59e0b',
      aprovar_morador: '#10b981'
    };
    return colors[tipoAcao] || '#6b7280';
  };

  // Mostrar loading apenas durante inicialização básica
  if (isInitializing) {
    return <div className="min-h-screen bg-[#f7f7f7]" />;
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">X</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar este painel.</p>
          <Button
            onClick={() => window.location.href = createPageUrl('DashboardMorador')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir para Meu Painel
          </Button>
        </div>
      </div>
    );
  }

  // Mapeamento de keys do menu para keys das permissões (IDs usados em Permissoes.jsx)
  const keyToPermissaoMap = {
    'registrar': 'registrar_encomenda',
    'encomendas': 'gerenciamento_encomendas',
    'retirar': 'retirar_encomenda',
    'chamados': 'chamados_portaria',
    'visitantes': 'visitantes_portaria',
    'manutencoes': 'manutencoes',
    'documentos': 'documentos',
    'marketplace': 'marketplace',
    'entregadores': 'entregadores',
    'moradores': 'moradores',
    'enquetes': 'enquetes',
    'avisos': 'enviar_avisos',
    'notificacoes_whatsapp': 'notificacoes_whatsapp',
    'permissoes': 'permissoes'
  };

  // Função para verificar se o item deve aparecer no menu do síndico
  const deveExibirNoMenu = (itemKey) => {
    // Se não é administrador (síndico), mostra tudo
    if (userType !== 'administrador') return true;
    
    // Usar cache instantâneo - nunca bloquear
    if (!permissoesSindico || Object.keys(permissoesSindico).length === 0) return true;
    
    // Mapear a key do menu para a key das permissões
    const permissaoKey = keyToPermissaoMap[itemKey] || itemKey;
    
    // Verificar diretamente no objeto de permissões
    if (permissoesSindico[permissaoKey] === false) return false;
    
    return true;
  };

  let menuCompleto = [
    { icon: PackageCheck, titulo: 'Retirar', path: createPageUrl('RetirarEncomenda'), key: 'retirar' },
    { icon: QrCode, titulo: 'Registrar', path: createPageUrl('RegistrarEncomenda'), key: 'registrar' },
    { icon: Users, titulo: 'Entregadores', path: createPageUrl('Entregadores'), key: 'entregadores' },
    { icon: Package, titulo: 'Encomendas', path: createPageUrl('GerenciamentoEncomendas'), key: 'encomendas' },
    { icon: MessageSquare, titulo: 'Chamados', path: createPageUrl('ChamadosPortaria'), key: 'chamados' },
    { icon: ClipboardList, titulo: 'Visitantes', path: createPageUrl('VisitantesPortaria'), key: 'visitantes' },
    { icon: Wrench, titulo: 'Manutenções', path: createPageUrl('Manutencoes'), key: 'manutencoes' },
    { icon: FileText, titulo: 'Documentos', path: createPageUrl('Documentos'), key: 'documentos' },
    { icon: ShoppingBag, titulo: 'Marketplace', path: createPageUrl('Marketplace'), key: 'marketplace' },
    { icon: Users, titulo: 'Moradores', path: createPageUrl('Moradores'), key: 'moradores' },
    { icon: ThumbsUp, titulo: 'Enquetes', path: createPageUrl('Enquetes'), key: 'enquetes' },
    { icon: Siren, titulo: 'SOS', path: createPageUrl('SOS'), key: 'sos' }
  ];

  if (userType === 'administrador') {
    menuCompleto.splice(3, 0, {
      icon: MessageCircle,
      titulo: 'WhatsApp',
      path: createPageUrl('NotificacoesWhatsApp'),
      key: 'notificacoes_whatsapp'
    });
    menuCompleto.push({
      icon: Megaphone,
      titulo: 'Avisos',
      path: createPageUrl('EnviarAvisos'),
      key: 'avisos'
    });
    menuCompleto.push({
      icon: Shield,
      titulo: 'Permissões',
      path: createPageUrl('Permissoes'),
      key: 'permissoes'
    });
  }

  // Filtrar o menu baseado nas permissões do síndico
  menuCompleto = menuCompleto.filter(item => deveExibirNoMenu(item.key));

  const footerItems = [
    {
      icon: QrCode,
      label: 'Registrar',
      path: createPageUrl('RegistrarEncomenda'),
      key: 'registrar',
      onClick: () => registrarAcesso('registrar')
    },
    {
      icon: MessageSquare,
      label: 'Chamados',
      path: createPageUrl('ChamadosPortaria'),
      key: 'chamados',
      badge: stats.chamadosPendentes,
      onClick: () => registrarAcesso('chamados')
    },
    {
      icon: Package,
      label: 'Encomendas',
      path: createPageUrl('GerenciamentoEncomendas'),
      key: 'encomendas',
      onClick: () => registrarAcesso('encomendas')
    }
  ];

  return (
    <AuthGuard>
    <div
      className="min-h-screen bg-[#f7f7f7] pb-24"
    >
      <DashboardHeader 
        currentUser={currentUser}
        condominio={condominioAtual}
        userType={userType}
        morador={moradorLogado}
      />

      <div className="pt-32 pb-4 px-3 max-w-7xl mx-auto">
        {/* Acesso Rápido Dinâmico */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {acessoRapido.map((item) => (
              <div key={item.key}>
                <Link
                  to={item.path}
                  onClick={() => registrarAcesso(item.key)}
                >
                  <Card className="bg-white hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]">
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
                </Link>
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
                {menuCompleto.slice(0, menuExpanded ? menuCompleto.length : 3).map((item, index) => (
                  <div key={item.key || index}>
                    <Link
                      to={item.path}
                      onClick={() => registrarAcesso(item.key)}
                    >
                      <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f7f7f7] transition-all duration-200 cursor-pointer">
                        <div className="w-11 h-11 bg-[#dfe3ee] rounded-xl flex items-center justify-center">
                          <item.icon className={`w-5 h-5 ${item.key === 'sos' ? 'text-black' : 'text-[#3b5998]'}`} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-900 text-center">{item.titulo}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {menuCompleto.length > 3 && (
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
                  <p className="text-[#C2185B] font-semibold text-xs">Chamados Pendentes</p>
                  <p className="text-2xl font-bold text-[#C2185B]">{stats.chamadosPendentes}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Últimas Atualizações */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Últimas Atualizações
            </h2>
          </div>

          <Card className="bg-white">
            <CardContent className="p-3">
              {ultimasAtualizacoes.length === 0 ? (
                <p className="text-gray-600 text-center py-4 text-xs">Nenhuma atualização recente</p>
              ) : (
                <div className="space-y-2">
                  {ultimasAtualizacoes.slice(0, 5).map((log, index) => {
                    const Icon = getAtualizacaoIcon(log.tipo_acao);
                    const color = getAtualizacaoColor(log.tipo_acao);

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-2 pb-2 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#3b5998] text-xs">{log.descricao}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            {log.usuario_nome || log.usuario_email}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">
                          {format(new Date(log.timestamp), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <FixedFooter items={footerItems} />
    </div>
    </AuthGuard>
  );
}