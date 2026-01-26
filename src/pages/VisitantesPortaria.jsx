import React, { useState, useEffect } from 'react';
import { Visitante } from "@/entities/Visitante";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Home,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Truck,
  Wrench,
  Repeat
} from "lucide-react";
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import MoradorHeader from '../components/shared/MoradorHeader';
import MoradorFooter from '../components/shared/MoradorFooter';

const tiposVisitante = {
  'visitante': { label: 'Visitante', icon: UserIcon, color: '#3b5998' },
  'delivery': { label: 'Delivery', icon: Truck, color: '#10b981' },
  'servico': { label: 'Serviço', icon: Wrench, color: '#f59e0b' },
  'outros': { label: 'Outros', icon: Users, color: '#8b5cf6' }
};

export default function VisitantesPortariaPage() {
  const [visitantes, setVisitantes] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLiberadosHoje, setShowLiberadosHoje] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = await User.me();
      
      if (!user || !user.email) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      const todosMoradores = await Morador.list();
      const moradorLogado = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (!moradorLogado || !moradorLogado.condominio_id) {
        setError("Condomínio não identificado.");
        setLoading(false);
        return;
      }

      const condominioId = moradorLogado.condominio_id;
      setUserCondominioId(condominioId);

      // PROTEÇÃO: Carregar APENAS moradores do condomínio
      const moradoresDoCondominio = await Morador.filter({ condominio_id: condominioId });
      
      // VALIDAÇÃO: Garantir isolamento
      const moradoresValidados = moradoresDoCondominio.filter(m => m.condominio_id === condominioId);
      setMoradores(moradoresValidados);

      // PROTEÇÃO: Carregar visitantes - filtrar pelo ID dos moradores validados
      const moradoresIds = moradoresValidados.map(m => m.id);
      const todosVisitantes = await Visitante.list('-created_date');
      
      // VALIDAÇÃO: Filtro duplo - por morador E por validação cruzada
      const visitantesDoCondominio = todosVisitantes.filter(v => {
        if (!moradoresIds.includes(v.morador_id)) return false;
        
        const morador = moradoresValidados.find(m => m.id === v.morador_id);
        
        // PROTEÇÃO CRÍTICA: Garantir que o morador do visitante pertence ao condomínio
        if (!morador || morador.condominio_id !== condominioId) {
          console.warn('[SECURITY] Tentativa de acesso a visitante de outro condomínio bloqueada');
          return false;
        }
        
        return true;
      });

      setVisitantes(visitantesDoCondominio);

      console.log(`[SECURITY] Visitantes carregados - Condomínio: ${condominioId}, Total: ${visitantesDoCondominio.length}`);

    } catch (err) {
      console.error("[SECURITY] Erro ao carregar visitantes:", err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEntrada = async (visitanteId) => {
    try {
      // VALIDAÇÃO: Visitante existe e está agendado
      const visitante = visitantes.find(v => v.id === visitanteId);
      
      if (!visitante) {
        setError("Visitante não encontrado");
        setTimeout(() => setError(''), 3000);
        return;
      }

      // PROTEÇÃO: Evitar confirmar entrada duplicada
      if (visitante.status === 'entrou') {
        setError("Entrada já foi confirmada anteriormente");
        setTimeout(() => setError(''), 3000);
        return;
      }

      // VALIDAÇÃO: Ownership (visitante pertence a morador do condomínio)
      const morador = moradores.find(m => m.id === visitante.morador_id);
      if (!morador || morador.condominio_id !== userCondominioId) {
        console.error('[SECURITY] Tentativa de confirmar visitante de outro condomínio');
        setError("Erro de segurança: visitante não pertence a este condomínio");
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      await Visitante.update(visitanteId, { 
        status: 'entrou',
        data_entrada_real: new Date().toISOString()
      });
      
      setSuccess("Entrada confirmada com sucesso!");
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao confirmar entrada:", err);
      setError("Erro ao confirmar entrada");
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleNaoCompareceu = async (visitanteId) => {
    if (!confirm("Confirmar que o visitante não compareceu?")) return;
    
    try {
      // VALIDAÇÃO: Visitante existe
      const visitante = visitantes.find(v => v.id === visitanteId);
      
      if (!visitante) {
        setError("Visitante não encontrado");
        setTimeout(() => setError(''), 3000);
        return;
      }

      // PROTEÇÃO: Evitar cancelar visitante que já entrou
      if (visitante.status === 'entrou') {
        setError("Não é possível cancelar visitante que já entrou");
        setTimeout(() => setError(''), 3000);
        return;
      }

      // VALIDAÇÃO: Ownership
      const morador = moradores.find(m => m.id === visitante.morador_id);
      if (!morador || morador.condominio_id !== userCondominioId) {
        console.error('[SECURITY] Tentativa de cancelar visitante de outro condomínio');
        setError("Erro de segurança");
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      await Visitante.update(visitanteId, { status: 'cancelado' });
      setSuccess("Status atualizado");
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao atualizar:", err);
      setError("Erro ao atualizar status");
      setTimeout(() => setError(''), 3000);
    }
  };

  const getMoradorNome = (moradorId) => {
    const morador = moradores.find(m => m.id === moradorId);
    return morador ? morador.nome : "Não encontrado";
  };

  const getMoradorEndereco = (moradorId) => {
    const morador = moradores.find(m => m.id === moradorId);
    return morador ? morador.apelido_endereco : "";
  };

  const getStatusBadge = (visitante) => {
    if (visitante.status === 'entrou') {
      return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Entrada Confirmada</Badge>;
    }
    if (visitante.status === 'cancelado') {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Não Compareceu</Badge>;
    }
    if (visitante.status === 'saiu') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Saiu</Badge>;
    }
    
    const dataInicio = parseISO(visitante.data_inicio);
    const hoje = startOfDay(new Date());
    
    if (isSameDay(dataInicio, hoje) || (visitante.recorrencia === 'semanal' && isLiberadoHoje(visitante))) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Liberado Hoje</Badge>;
    }
    
    return <Badge className="bg-[#dfe3ee] text-gray-700 text-xs">Agendado</Badge>;
  };

  const isLiberadoHoje = (visitante) => {
    if (visitante.recorrencia !== 'semanal' || !visitante.dias_semana) return false;
    
    const hoje = new Date();
    const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaHoje = diasMap[hoje.getDay()];
    
    return visitante.dias_semana.includes(diaHoje);
  };

  const visitantesLiberadosHoje = visitantes.filter(v => 
    v.status === 'agendado' && (
      isSameDay(parseISO(v.data_inicio), startOfDay(new Date())) ||
      isLiberadoHoje(v)
    )
  );

  const visitantesFuturos = visitantes.filter(v => 
    v.status === 'agendado' && !visitantesLiberadosHoje.includes(v)
  );

  const filteredLiberados = searchTerm
    ? visitantesLiberadosHoje.filter(v =>
        v.nome_visitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMoradorNome(v.morador_id).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : visitantesLiberadosHoje;

  const filteredFuturos = searchTerm
    ? visitantesFuturos.filter(v =>
        v.nome_visitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMoradorNome(v.morador_id).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : visitantesFuturos;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] overflow-x-hidden">
        <MoradorHeader title="Visitantes" />
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] overflow-x-hidden w-full">
      <MoradorHeader title="Visitantes" />

      <div className="pt-28 pb-24 px-3 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto space-y-3 mt-3">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Bar */}
          <Card className="border-0 shadow-sm w-full">
            <CardContent className="p-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 flex-shrink-0" />
                <Input
                  placeholder="Encontrar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-0 bg-[#dfe3ee] w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => setShowLiberadosHoje(true)}
              className={`flex-1 h-12 rounded-lg font-semibold text-sm ${
                showLiberadosHoje 
                  ? 'bg-[#3b5998] text-white' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Liberados Hoje ({filteredLiberados.length})
            </Button>
            <Button
              onClick={() => setShowLiberadosHoje(false)}
              className={`flex-1 h-12 rounded-lg font-semibold text-sm ${
                !showLiberadosHoje 
                  ? 'bg-[#3b5998] text-white' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Futuros ({filteredFuturos.length})
            </Button>
          </div>

          {/* Lista de Visitantes */}
          <div className="space-y-3 w-full">
            {(showLiberadosHoje ? filteredLiberados : filteredFuturos).length === 0 ? (
              <Card className="border-0 shadow-sm w-full">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? "Nenhum visitante encontrado" : `Nenhum visitante ${showLiberadosHoje ? 'para hoje' : 'agendado'}`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              (showLiberadosHoje ? filteredLiberados : filteredFuturos).map(visitante => {
                const tipoInfo = tiposVisitante[visitante.tipo_visitante] || tiposVisitante.visitante;
                const TipoIcon = tipoInfo.icon;
                
                return (
                  <Card key={visitante.id} className="hover:shadow-lg transition-shadow border-0 shadow-sm bg-white w-full overflow-hidden">
                    <CardContent className="p-3 w-full">
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 w-full min-w-0">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div 
                              className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${tipoInfo.color}20` }}
                            >
                              <TipoIcon className="w-5 h-5" style={{ color: tipoInfo.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {visitante.nome_visitante}
                              </h3>
                              <p className="text-xs text-gray-600">{tipoInfo.label}</p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                                <Home className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {getMoradorNome(visitante.morador_id)}
                                  {getMoradorEndereco(visitante.morador_id) && 
                                    ` - ${getMoradorEndereco(visitante.morador_id)}`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(visitante)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600 bg-[#f7f7f7] p-2 rounded-lg">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{format(parseISO(visitante.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{format(parseISO(visitante.data_inicio), "HH:mm", { locale: ptBR })}</span>
                          </div>
                        </div>

                        {visitante.recorrencia === 'semanal' && visitante.dias_semana && visitante.dias_semana.length > 0 && (
                          <div className="flex items-start gap-1.5 text-xs bg-[#8b9dc3] bg-opacity-10 p-2 rounded-lg">
                            <Repeat className="w-3.5 h-3.5 text-[#3b5998] mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {visitante.dias_semana.map((dia) => (
                                <span key={dia} className="text-[10px] bg-[#8b9dc3] text-white px-1.5 py-0.5 rounded">
                                  {dia}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {visitante.documento_visitante && (
                          <div className="text-xs bg-gray-100 px-2 py-1.5 rounded">
                            <strong>Doc:</strong> {visitante.documento_visitante}
                          </div>
                        )}

                        {visitante.observacoes && (
                          <p className="text-xs text-gray-500 italic line-clamp-2 bg-gray-50 p-2 rounded">
                            {visitante.observacoes}
                          </p>
                        )}

                        {/* Actions */}
                        {visitante.status === 'agendado' && (
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Button
                              onClick={() => handleConfirmarEntrada(visitante.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 text-xs"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmar Entrada
                            </Button>
                            <Button
                              onClick={() => handleNaoCompareceu(visitante.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 h-10 border-gray-300 text-xs"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Não Compareceu
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      <MoradorFooter />
    </div>
  );
}