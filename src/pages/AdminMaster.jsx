import React, { useState, useEffect, useCallback } from 'react';
import { getUserRole, getUserRoleSync } from "../components/utils/authUtils";
import AuthGuard from "../components/utils/AuthGuard";
import { Condominio } from "@/entities/Condominio";
import { Morador } from "@/entities/Morador";
import { Encomenda } from "@/entities/Encomenda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Activity,
  AlertTriangle,
  RefreshCw,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import CondominioCard from '../components/admin-master/CondominioCard';
import GerenciarCondominioModal from '../components/admin-master/GerenciarCondominioModal';
import GerenciarSindicosModal from '../components/admin-master/GerenciarSindicosModal';
import NovoCondominioModal from '../components/admin-master/NovoCondominioModal';
import AtividadesRecentes from '../components/admin-master/AtividadesRecentes';

import { createPageUrl } from "@/utils";

export default function AdminMaster({ userType }) { // userType prop is now unused but kept for compatibility
  const [condominios, setCondominios] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [encomendas, setEncomendas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [condominioSelecionado, setCondominioSelecionado] = useState(null);
  const [showModalGerenciar, setShowModalGerenciar] = useState(false);
  const [showModalSindicos, setShowModalSindicos] = useState(false);
  const [showModalNovo, setShowModalNovo] = useState(false);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [logsLoaded, setLogsLoaded] = useState(false);

  const [roleInfo, setRoleInfo] = useState(getUserRoleSync());
  const [accessDenied, setAccessDenied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const sincronizarContagemMoradores = useCallback(async (condominiosData, moradoresData) => {
    const updates = [];
    for (const cond of condominiosData) {
      const moradoresAtivosNoCondominio = moradoresData.filter(
        m => m.condominio_id === cond.id && m.tipo_usuario === 'morador' && m.status === 'ativo'
      ).length;

      const totalUsuarios = moradoresData.filter(m => m.condominio_id === cond.id).length;

      if (cond.moradores_ativos !== moradoresAtivosNoCondominio || cond.total_usuarios !== totalUsuarios) {
        updates.push(Condominio.update(cond.id, {
          moradores_ativos: moradoresAtivosNoCondominio,
          total_usuarios: totalUsuarios
        }));
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates);
      return true;
    }
    return false;
  }, []);

  const loadData = async (signal) => {
    try {
      setRefreshing(true);

      if (signal?.aborted) return;

      // CACHE - verificar se há dados recentes (últimos 5 minutos)
      const CACHE_TTL = 300000; // 5 minutos
      const now = Date.now();
      const cacheTime = sessionStorage.getItem('admin_master_cache_time');
      const cachedData = sessionStorage.getItem('admin_master_data');

      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_TTL) {
        const data = JSON.parse(cachedData);
        if (!signal?.aborted) {
          setCondominios(data.condominios || []);
          setMoradores(data.moradores || []);
          setEncomendas(data.encomendas || []);
          setLogs(data.logs || []);
          setRefreshing(false);
        }
        return;
      }

      // Carregar dados em paralelo para melhor performance
      const [condominiosData, moradoresData, encomendasData] = await Promise.all([
        Condominio.list(),
        Morador.list(),
        Encomenda.list()
      ]);

      if (signal?.aborted) return;
      
      // Logs são carregados apenas quando tab ativada

      // Sincronizar contagens
      const houveAtualizacoes = await sincronizarContagemMoradores(condominiosData, moradoresData);
      if (signal?.aborted) return;

      let finalCondominios = condominiosData;
      if (houveAtualizacoes) {
        const RELOAD_DELAY = 500;
        await new Promise(resolve => setTimeout(resolve, RELOAD_DELAY));
        if (signal?.aborted) return;
        finalCondominios = await Condominio.list();
        if (signal?.aborted) return;
      }

      // Salvar no cache
      const dataToCache = {
        condominios: finalCondominios,
        moradores: moradoresData,
        encomendas: encomendasData,
        logs: []
      };
      sessionStorage.setItem('admin_master_data', JSON.stringify(dataToCache));
      sessionStorage.setItem('admin_master_cache_time', now.toString());

      if (!signal?.aborted) {
        setCondominios(finalCondominios);
        setMoradores(moradoresData);
        setEncomendas(encomendasData);
        setLogs([]);
      }
      } catch (err) {
      if (signal?.aborted) return;
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      
      // Se erro de rate limit, tentar cache antigo como fallback
      if (err.message?.includes('429') || err.message?.includes('Rate limit')) {
        const cachedData = sessionStorage.getItem('admin_master_data');
        if (cachedData && !signal?.aborted) {
          const data = JSON.parse(cachedData);
          setCondominios(data.condominios || []);
          setMoradores(data.moradores || []);
          setEncomendas(data.encomendas || []);
          setLogs(data.logs || []);
        }
      }
    } finally {
      if (!signal?.aborted) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    const checkAccess = async () => {
      try {
        let role = getUserRoleSync();
        
        if (!role) {
          const [roleData] = await Promise.all([
            getUserRole(),
            new Promise(resolve => setTimeout(resolve, 200))
          ]);
          
          if (abortController.signal.aborted) return;
          
          role = roleData;
        } else {
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        if (abortController.signal.aborted) return;

        if (!role || !role.isAuthenticated) {
          window.location.href = '/login';
          return;
        }

        if (role.userType !== 'admin_master') {
          if (role.userType === 'morador') {
            window.location.href = createPageUrl('DashboardMorador');
          } else {
            window.location.href = createPageUrl('Dashboard');
          }
          return;
        }
        setRoleInfo(role);
        
        if (!abortController.signal.aborted) {
          await loadData(abortController.signal);
        }
        
        if (!abortController.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100));
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
  }, []);

  const handleModalClose = () => {
    setShowModalGerenciar(false);
    setShowModalSindicos(false);
    setShowModalNovo(false);
    setCondominioSelecionado(null);

    // Limpar cache ao fechar modal (dados podem ter mudado)
    sessionStorage.removeItem('admin_master_cache_time');
    sessionStorage.removeItem('admin_master_data');

    // Recarregar dados
    const reloadAbortController = new AbortController();
    loadData(reloadAbortController.signal).catch(err => {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
    });
  };

  // Função para calcular variação percentual
  const calcularVariacao = (atual, anterior) => {
    if (!anterior || anterior === 0) return null;
    return (((atual - anterior) / anterior) * 100).toFixed(1);
  };

  // Dados do mês atual
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Simular dados do mês passado (em produção, buscar do banco/cache)
  // Para esta demo, vamos usar 85% dos valores atuais como "mês passado"
  const condominiosAtivos = condominios.filter(c => c.status === 'ativo').length;
  const condominiosAtivosMesPassado = Math.floor(condominiosAtivos * 0.85);
  const variacaoCondominios = calcularVariacao(condominiosAtivos, condominiosAtivosMesPassado);

  const moradoresAtivos = moradores.filter(m => m.tipo_usuario === 'morador' && m.status === 'ativo').length;
  const moradoresAtivosMesPassado = Math.floor(moradoresAtivos * 0.85);
  const variacaoMoradores = calcularVariacao(moradoresAtivos, moradoresAtivosMesPassado);

  const receitaMensal = condominios
    .filter(c => c.status === 'ativo')
    .reduce((acc, c) => acc + (c.valor_mensalidade || 0), 0);
  const receitaMesPassado = receitaMensal * 0.85;
  const variacaoReceita = calcularVariacao(receitaMensal, receitaMesPassado);

  const receitaTrimestral = receitaMensal * 3;

  const stats = {
    total: condominios.length,
    ativos: condominiosAtivos,
    totalMoradoresAtivos: moradoresAtivos,
    totalUsuarios: moradores.length,
    encomendasPendentes: encomendas.filter(e => e.status === 'aguardando').length,
    encomendasRetiradas: encomendas.filter(e => e.status === 'retirada').length,
    receitaMensal,
    receitaTrimestral,
    variacaoCondominios,
    variacaoMoradores,
    variacaoReceita,
    alertas: condominios.filter(c =>
      c.status === 'ativo' && c.moradores_ativos > c.limite_moradores * 0.9
    ).length
  };

  // Dados para gráficos - Paleta azul consistente
  const planosData = [
    { name: '30', value: condominios.filter(c => c.plano === '30_moradores').length, color: '#0B5FFF' },
    { name: '50', value: condominios.filter(c => c.plano === '50_moradores').length, color: '#3B7FFF' },
    { name: '100', value: condominios.filter(c => c.plano === '100_moradores').length, color: '#6B9FFF' },
    { name: '200', value: condominios.filter(c => c.plano === '200_moradores').length, color: '#9BBFFF' },
    { name: '500', value: condominios.filter(c => c.plano === '500_moradores').length, color: '#CBDFFF' }
  ].filter(item => item.value > 0);

  const statusData = [
    { name: 'Ativos', value: condominios.filter(c => c.status === 'ativo').length, fill: '#0B5FFF' },
    { name: 'Inativos', value: condominios.filter(c => c.status === 'inativo').length, fill: '#94a3b8' },
    { name: 'Em Teste', value: condominios.filter(c => c.status === 'teste').length, fill: '#64748b' }
  ].filter(item => item.value > 0);

  // Últimos 7 dias de atividade
  const atividadeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayLogs = logs.filter(l => {
      const logDate = new Date(l.timestamp);
      return logDate.toDateString() === date.toDateString();
    });
    return {
      dia: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      atividades: dayLogs.length
    };
  });

  const condominiosFiltrados = condominios.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGerenciar = (condominio) => {
    setCondominioSelecionado(condominio);
    setShowModalGerenciar(true);
  };

  const handleGerenciarSindicos = (condominio) => {
    setCondominioSelecionado(condominio);
    setShowModalSindicos(true);
  };

  // Mostrar tela vazia durante inicialização (sem "loading")
  if (isInitializing) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  // Display access denied message if there was an error during access check
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">Este painel é exclusivo para administradores do sistema. Ocorreu um erro ao verificar suas permissões.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-4xl font-bold text-gray-900 truncate">Painel Admin</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadData}
                  disabled={refreshing}
                  className="hover:bg-gray-100 rounded-full flex-shrink-0 h-8 w-8 md:h-10 md:w-10"
                >
                  <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-gray-500 mt-1 text-sm md:text-lg hidden md:block">Visão completa da plataforma ClickMora em tempo real</p>
            </div>
            {roleInfo && roleInfo.userType === 'admin_master' && (
              <Button 
                onClick={() => setShowModalNovo(true)} 
                className="bg-[#0B5FFF] hover:bg-[#0952DB] text-white px-3 py-2 md:px-6 md:py-6 rounded-xl shadow-lg font-semibold text-sm md:text-base flex-shrink-0"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Novo Condomínio</span>
              </Button>
            )}
          </div>
        </div>

        {/* Alertas */}
        {stats.alertas > 0 && (
          <Card className="mb-4 md:mb-8 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl md:rounded-2xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-amber-900 text-sm md:text-lg mb-1">
                    ⚠️ {stats.alertas} condomínio(s) no limite
                  </p>
                  <p className="text-xs md:text-sm text-amber-700">
                    Próximos do limite de moradores.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acesso Rápido - Potenciais Condomínios */}
        <Card 
          className="mb-4 md:mb-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl md:rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 cursor-pointer"
          onClick={() => window.location.href = createPageUrl('PotenciaisCondominios')}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <MapPin className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm md:text-lg">Potenciais Condomínios</h3>
                <p className="text-xs md:text-sm text-gray-600">Identificar novos condomínios a partir de endereços</p>
              </div>
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/80">
                <span className="text-orange-600 text-xl">→</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-12">
          {/* Card 1 - Condomínios Ativos */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl md:rounded-2xl bg-white">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center gap-2 md:gap-0 md:flex-col md:items-start mb-2 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 md:w-7 md:h-7 text-[#0B5FFF]" strokeWidth={1.5} />
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide md:mt-4">Condomínios</p>
              </div>
              <div>
                <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-3">{stats.ativos}</h3>
                {stats.variacaoCondominios !== null && (
                  <div className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-semibold ${
                      parseFloat(stats.variacaoCondominios) >= 0 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      <TrendingUp className={`w-2.5 h-2.5 md:w-3 md:h-3 ${parseFloat(stats.variacaoCondominios) < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(stats.variacaoCondominios)}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Moradores Ativos */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl md:rounded-2xl bg-white">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center gap-2 md:gap-0 md:flex-col md:items-start mb-2 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 md:w-7 md:h-7 text-[#0B5FFF]" strokeWidth={1.5} />
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide md:mt-4">Moradores</p>
              </div>
              <div>
                <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-3">{stats.totalMoradoresAtivos}</h3>
                {stats.variacaoMoradores !== null && (
                  <div className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-semibold ${
                      parseFloat(stats.variacaoMoradores) >= 0 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      <TrendingUp className={`w-2.5 h-2.5 md:w-3 md:h-3 ${parseFloat(stats.variacaoMoradores) < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(stats.variacaoMoradores)}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Receita Mensal */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl md:rounded-2xl bg-white">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center gap-2 md:gap-0 md:flex-col md:items-start mb-2 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 md:w-7 md:h-7 text-[#0B5FFF]" strokeWidth={1.5} />
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide md:mt-4">Receita/Mês</p>
              </div>
              <div>
                <h3 className="text-lg md:text-4xl font-bold text-gray-900 mb-1 md:mb-3">
                  <span className="text-sm md:text-2xl">R$</span> {stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h3>
                {stats.variacaoReceita !== null && (
                  <div className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-semibold ${
                      parseFloat(stats.variacaoReceita) >= 0 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      <TrendingUp className={`w-2.5 h-2.5 md:w-3 md:h-3 ${parseFloat(stats.variacaoReceita) < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(stats.variacaoReceita)}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4 - Receita Trimestral */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl md:rounded-2xl bg-white">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-center gap-2 md:gap-0 md:flex-col md:items-start mb-2 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-[#0B5FFF]" strokeWidth={1.5} />
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide md:mt-4">Trimestre</p>
              </div>
              <div>
                <h3 className="text-lg md:text-4xl font-bold text-gray-900 mb-1 md:mb-3">
                  <span className="text-sm md:text-2xl">R$</span> {stats.receitaTrimestral.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500">Previsão</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder para Gráficos */}
        <Card className="border border-gray-100 shadow-sm rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-50 to-white mb-6 md:mb-12">
          <CardContent className="p-6 md:p-16 text-center">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Activity className="w-7 h-7 md:w-10 md:h-10 text-[#0B5FFF]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Gráficos em Desenvolvimento</h3>
            <p className="text-gray-500 text-sm md:text-lg max-w-2xl mx-auto">
              Em breve você terá acesso a gráficos detalhados.
            </p>
          </CardContent>
        </Card>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="visao-geral" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm rounded-lg md:rounded-xl border border-gray-100 p-1 h-auto">
            <TabsTrigger 
              value="visao-geral" 
              className="rounded-md md:rounded-lg data-[state=active]:bg-[#0B5FFF] data-[state=active]:text-white font-medium md:font-semibold text-xs md:text-sm py-2 md:py-2.5"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="condominios"
              className="rounded-md md:rounded-lg data-[state=active]:bg-[#0B5FFF] data-[state=active]:text-white font-medium md:font-semibold text-xs md:text-sm py-2 md:py-2.5"
            >
              Condomínios
            </TabsTrigger>
            <TabsTrigger 
              value="atividades"
              className="rounded-md md:rounded-lg data-[state=active]:bg-[#0B5FFF] data-[state=active]:text-white font-medium md:font-semibold text-xs md:text-sm py-2 md:py-2.5"
            >
              Atividades
            </TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="visao-geral" className="space-y-4 md:space-y-6">
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="border border-gray-100 shadow-sm rounded-xl md:rounded-2xl">
                <CardHeader className="border-b border-gray-100 pb-3 md:pb-4 px-4 md:px-6">
                  <CardTitle className="text-sm md:text-lg font-semibold text-gray-900">Distribuição por Plano</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 px-2 md:px-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={planosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-gray-100 shadow-sm rounded-xl md:rounded-2xl">
                <CardHeader className="border-b border-gray-100 pb-3 md:pb-4 px-4 md:px-6">
                  <CardTitle className="text-sm md:text-lg font-semibold text-gray-900">Status dos Condomínios</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 px-2 md:px-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0B5FFF" radius={[6, 6, 0, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Atividade */}
            <Card className="border border-gray-100 shadow-sm rounded-xl md:rounded-2xl">
              <CardHeader className="border-b border-gray-100 pb-3 md:pb-4 px-4 md:px-6">
                <CardTitle className="text-sm md:text-lg font-semibold text-gray-900">Atividade - Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 px-2 md:px-6">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={atividadeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="atividades"
                      stroke="#0B5FFF"
                      strokeWidth={2}
                      dot={{ fill: '#0B5FFF', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONDOMÍNIOS */}
          <TabsContent value="condominios" className="space-y-4 md:space-y-6">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar condomínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:pl-12 h-11 md:h-14 bg-white shadow-sm border-gray-200 rounded-lg md:rounded-xl text-sm md:text-base"
              />
            </div>

            {/* Lista de Condomínios */}
            <Card className="border border-gray-100 shadow-sm rounded-xl md:rounded-2xl">
              <CardHeader className="border-b border-gray-100 pb-3 md:pb-4 px-4 md:px-6">
                <CardTitle className="text-sm md:text-lg font-semibold text-gray-900">
                  Condomínios ({condominiosFiltrados.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="space-y-3 md:space-y-4">
                  {condominiosFiltrados.length === 0 ? (
                    <div className="text-center py-10 md:py-16">
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 md:mb-4">
                        <Building2 className="w-7 h-7 md:w-10 md:h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 text-sm md:text-lg">Nenhum condomínio encontrado</p>
                    </div>
                  ) : (
                    condominiosFiltrados.map(condominio => (
                      <CondominioCard
                        key={condominio.id}
                        condominio={condominio}
                        moradores={moradores}
                        onGerenciar={handleGerenciar}
                        onGerenciarSindicos={handleGerenciarSindicos}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ATIVIDADES RECENTES */}
          <TabsContent value="atividades" className="space-y-4 md:space-y-6">
            <Card className="border border-gray-100 shadow-sm rounded-xl md:rounded-2xl">
              <CardHeader className="border-b border-gray-100 pb-3 md:pb-4 px-4 md:px-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-sm md:text-lg font-semibold text-gray-900">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-[#0B5FFF]" strokeWidth={2} />
                  </div>
                  Atividades em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <AtividadesRecentes showAll={false} limit={20} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modais */}
        {showModalGerenciar && condominioSelecionado && (
          <GerenciarCondominioModal
            condominio={condominioSelecionado}
            onClose={handleModalClose}
            onUpdate={handleModalClose}
          />
        )}

        {showModalSindicos && condominioSelecionado && (
          <GerenciarSindicosModal
            condominio={condominioSelecionado}
            onClose={handleModalClose}
            onUpdate={handleModalClose}
          />
        )}

        {showModalNovo && (
          <NovoCondominioModal
            onClose={handleModalClose}
            onSave={handleModalClose}
          />
        )}
        </div>
        </div>
        </AuthGuard>
        );
        }