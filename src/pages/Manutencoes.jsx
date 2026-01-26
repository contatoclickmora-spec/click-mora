import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MoradorHeader from '../components/shared/MoradorHeader';
import AuthGuard from '../components/utils/AuthGuard';
import MoradorFooter from '../components/shared/MoradorFooter';
import { getUserRole } from "../components/utils/authUtils";
import { filterByCondominio } from "../components/utils/condominioContext";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Wrench,
  Plus,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function Manutencoes() {
  const navigate = useNavigate();
  const [manutencoes, setManutencoes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('morador');
  const [currentUser, setCurrentUser] = useState(null);
  const [condominioAtual, setCondominioAtual] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const role = await getUserRole();
      
      setUserType(role.userType);
      setCurrentUser(role.user);
      setMoradorLogado(role.morador);

      const todasManutencoes = await base44.entities.Manutencao.list('-data_inicio');
      const manutencoesDoCondominio = await filterByCondominio(todasManutencoes);
      
      // Atualizar status das manutenções
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const manutencoesPorCondominio = manutencoesDoCondominio;

      setManutencoes(manutencoesPorCondominio);

      if (role.morador?.condominio_id) {
        const allCondominios = await base44.entities.Condominio.list();
        const condominio = allCondominios.find(c => c.id === role.morador.condominio_id);
        setCondominioAtual(condominio);
      }

      setLoading(false);
    } catch (error) {
      console.error('[MANUTENCOES] Erro ao carregar:', error);
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getFirstDayOfWeek = () => {
    const start = startOfMonth(currentDate);
    return start.getDay();
  };

  const hasMaintenance = (day) => {
    return manutencoes.some((m) => {
      const inicio = m?.data_inicio ? parseISO(m.data_inicio) : null;
      const fim = m?.data_fim ? parseISO(m.data_fim) : null;
      if (!inicio || isNaN(inicio.getTime()) || !fim || isNaN(fim.getTime())) return false;
      try {
        return isWithinInterval(day, { start: inicio, end: fim });
      } catch (_) {
        return false;
      }
    });
  };

  const getMaintenancesForDay = (day) => {
    return manutencoes.filter((m) => {
      const inicio = m?.data_inicio ? parseISO(m.data_inicio) : null;
      const fim = m?.data_fim ? parseISO(m.data_fim) : null;
      if (!inicio || isNaN(inicio.getTime()) || !fim || isNaN(fim.getTime())) return false;
      try {
        return isWithinInterval(day, { start: inicio, end: fim });
      } catch (_) {
        return false;
      }
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const previousYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()));
  };

  const nextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()));
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'bg-orange-100 text-orange-700' },
      em_andamento: { label: 'Em andamento', color: 'bg-green-100 text-green-700' }
    };
    return badges[status] || badges.pendente;
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f7f7f7]" />;
  }

  const dias = getDaysInMonth();
  const primeiroDia = getFirstDayOfWeek();
  const manutencoesDodia = getMaintenancesForDay(selectedDate);

  const isMorador = userType === 'morador';

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#f7f7f7] pb-24">
        {isMorador ? (
          <MoradorHeader title="Manutenções" userType={userType} />
        ) : (
          <div 
            className="fixed top-0 left-0 right-0 z-40 shadow-md"
            style={{ backgroundColor: '#3b5998' }}
          >
            {/* Safe Area Spacer for iOS */}
            <div style={{ height: 'env(safe-area-inset-top)', backgroundColor: '#3b5998' }} />
            
            <div className="flex items-end justify-between h-24 px-4 pb-3">
              <button
                onClick={() => {
                  if (window.history.length > 2) {
                    navigate(-1);
                  } else {
                    navigate(createPageUrl('Dashboard'), { replace: true });
                  }
                }}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h1 className="flex-1 text-xl font-semibold text-center text-white">
                Manutenções
              </h1>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}

        <div className={`pt-28 pb-6 px-4 max-w-7xl mx-auto`}>
          {/* Calendário */}
          <Card className="bg-white mb-6">
            <CardContent className="p-6">
              {/* Header do Calendário */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousYear}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousMonth}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextMonth}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextYear}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => (
                  <div key={idx} className="text-center font-semibold text-gray-600 text-sm py-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-2">
                {/* Espaços vazios antes do primeiro dia */}
                {Array.from({ length: primeiroDia }).map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}

                {/* Dias do mês */}
                {dias.map((dia, idx) => {
                  const temManutencao = hasMaintenance(dia);
                  const isSelected = isSameDay(dia, selectedDate);
                  const isToday = isSameDay(dia, new Date());

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(dia)}
                      className={`
                        relative h-12 rounded-lg flex flex-col items-center justify-center
                        transition-all duration-200
                        ${isSelected ? 'bg-[#3b5998] text-white font-bold' : 'hover:bg-gray-100'}
                        ${isToday && !isSelected ? 'ring-2 ring-[#3b5998]' : ''}
                      `}
                    >
                      <span className="text-sm">{format(dia, 'd')}</span>
                      {temManutencao && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3b5998] mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botão Hoje */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="text-sm"
                >
                  Hoje
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Manutenções do Dia */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Manutenções - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              {userType === 'administrador' && (
                <Button
                  size="sm"
                  onClick={() => navigate(createPageUrl('CriarManutencao'))}
                  className="bg-[#3b5998] hover:bg-[#2d4373]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova
                </Button>
              )}
            </div>

            {manutencoesDodia.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-8 text-center">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhuma manutenção programada para este dia</p>
                </CardContent>
              </Card>
            ) : (
              manutencoesDodia.map((manutencao) => {
                const statusInfo = getStatusBadge(manutencao.status);
                
                return (
                  <Card 
                    key={manutencao.id} 
                    className="bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(createPageUrl('ManutencaoDetalhes') + `?id=${manutencao.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#dfe3ee] rounded-xl flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-6 h-6 text-[#3b5998]" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">{manutencao.titulo}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {(() => { try { const d = manutencao?.data_inicio ? parseISO(manutencao.data_inicio) : null; return d && !isNaN(d.getTime()) ? format(d, 'dd/MM/yyyy') : '-'; } catch { return '-'; } })()} até{' '}
                            {(() => { try { const d = manutencao?.data_fim ? parseISO(manutencao.data_fim) : null; return d && !isNaN(d.getTime()) ? format(d, 'dd/MM/yyyy') : '-'; } catch { return '-'; } })()}
                          </p>
                          {manutencao.descricao && (
                            <p className="text-sm text-gray-700 mb-2">{manutencao.descricao}</p>
                          )}
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Botão Nova Manutenção - Apenas para Síndico */}
          {userType === 'administrador' && (
            <div className="mt-8 flex justify-center pb-8">
              <button
                onClick={() => navigate(createPageUrl('CriarManutencao'))}
                className="w-full max-w-md bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-6 h-6" />
                Nova manutenção
              </button>
            </div>
          )}
        </div>

        {!isMorador && <MoradorFooter />}
      </div>
    </AuthGuard>
  );
}