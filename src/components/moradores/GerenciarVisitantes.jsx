
import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  User as UserIcon,
  Truck,
  Wrench,
  Users,
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  Loader2,
  ChevronDown,
  Repeat,
  Search,
  AlertCircle
} from "lucide-react";
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from "framer-motion";

const tiposVisitante = [
  { value: 'visitante', label: 'Visitante', icon: UserIcon },
  { value: 'delivery', label: 'Delivery', icon: Truck },
  { value: 'servico', label: 'Serviço', icon: Wrench },
  { value: 'outros', label: 'Outros', icon: Users }
];

const recorrenciaOpcoes = [
  { value: 'nenhuma', label: 'Nenhuma', icon: X },
  { value: 'semanal', label: 'Semanalmente', icon: Repeat }
];

const diasSemana = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' }
];

export default function GerenciarVisitantes({ moradorLogado: moradorLogadoProp }) {
  const [moradorLogado, setMoradorLogado] = useState(moradorLogadoProp);
  const [loadingMorador, setLoadingMorador] = useState(!moradorLogadoProp);
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showRecorrenciaModal, setShowRecorrenciaModal] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    nome_visitante: '',
    tipo_visitante: '',
    documento_visitante: '',
    data_inicio: '',
    hora_inicio: '',
    observacoes: '',
    recorrencia: 'nenhuma',
    dias_semana: [],
    data_termino_recorrencia: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadMorador = async () => {
      if (moradorLogadoProp) {
        console.log('[VISITANTES] Morador recebido via props:', moradorLogadoProp);
        setMoradorLogado(moradorLogadoProp);
        setLoadingMorador(false);
        loadVisitantes(moradorLogadoProp.id);
        return;
      }

      try {
        console.log('[VISITANTES] Carregando dados do morador...');
        setLoadingMorador(true);

        const user = await base44.auth.me();
        console.log('[VISITANTES] Usuário autenticado:', user?.email);

        if (!user || !user.email) {
          setError('Usuário não autenticado.');
          setLoadingMorador(false);
          setLoading(false);
          return;
        }

        const todosMoradores = await base44.entities.Morador.list();
        const morador = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        console.log('[VISITANTES] Morador encontrado:', morador);

        if (!morador) {
          setError('Cadastro de morador não encontrado.');
          setLoadingMorador(false);
          setLoading(false);
          return;
        }

        if (!morador.condominio_id) {
          setError('Usuário não vinculado a nenhum condomínio.');
          setLoadingMorador(false);
          setLoading(false);
          return;
        }

        setMoradorLogado(morador);
        setLoadingMorador(false);
        loadVisitantes(morador.id);

      } catch (err) {
        console.error('[VISITANTES] Erro ao carregar morador:', err);
        setError('Erro ao carregar dados do usuário.');
        setLoadingMorador(false);
        setLoading(false);
      }
    };

    loadMorador();
  }, [moradorLogadoProp]);

  const loadVisitantes = async (moradorId) => {
    if (!moradorId) {
      console.error('[VISITANTES] ID do morador não disponível para carregar visitantes');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[VISITANTES] Carregando visitantes do morador:', moradorId);
      const todosVisitantes = await base44.entities.Visitante.list('-created_date');
      const meusVisitantes = todosVisitantes.filter(v => v.morador_id === moradorId);
      console.log('[VISITANTES] Visitantes carregados:', meusVisitantes.length);
      setVisitantes(meusVisitantes);
    } catch (err) {
      console.error('[VISITANTES] Erro ao carregar visitantes:', err);
      setError("Erro ao carregar visitantes");
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getTipoInfo = (tipo) => {
    return tiposVisitante.find(t => t.value === tipo) || tiposVisitante[0];
  };

  const getRecorrenciaInfo = (tipo) => {
    return recorrenciaOpcoes.find(r => r.value === tipo) || recorrenciaOpcoes[0];
  };

  const toggleDiaSemana = (dia) => {
    setFormData(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia]
    }));
  };

  const handleSubmit = async () => {
    console.log('[VISITANTES] Validando dados antes do envio...');
    console.log('[VISITANTES] moradorLogado:', moradorLogado);

    if (!moradorLogado || !moradorLogado.id) {
      console.error('[VISITANTES] ERRO CRÍTICO: moradorLogado.id não disponível!');
      console.error('[VISITANTES] moradorLogado completo:', moradorLogado);
      setError("Erro: dados do usuário não carregados. Recarregue a página.");
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!formData.nome_visitante.trim()) {
      setError("Nome do visitante é obrigatório");
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!formData.tipo_visitante) {
      setError("Selecione o tipo de acesso");
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!formData.data_inicio || !formData.hora_inicio) {
      setError("Data e hora são obrigatórias");
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (formData.recorrencia === 'semanal' && formData.dias_semana.length === 0) {
      setError("Selecione pelo menos um dia da semana");
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      console.log('[VISITANTES] Criando visitante...');

      const dataHoraInicio = `${formData.data_inicio}T${formData.hora_inicio}`;
      const dataFim = formData.recorrencia === 'nenhuma' 
        ? dataHoraInicio 
        : formData.data_termino_recorrencia || addDays(new Date(dataHoraInicio), 365).toISOString();

      const dadosVisitante = {
        morador_id: moradorLogado.id,
        nome_visitante: formData.nome_visitante.trim(),
        tipo_visitante: formData.tipo_visitante,
        documento_visitante: formData.documento_visitante.trim() || '',
        data_inicio: dataHoraInicio,
        data_fim: dataFim,
        recorrencia: formData.recorrencia,
        dias_semana: formData.recorrencia === 'semanal' ? formData.dias_semana : [],
        data_termino_recorrencia: formData.data_termino_recorrencia || null,
        observacoes: formData.observacoes.trim() || '',
        status: 'agendado'
      };

      console.log('[VISITANTES] Dados do visitante:', JSON.stringify(dadosVisitante, null, 2));

      await base44.entities.Visitante.create(dadosVisitante);

      console.log('[VISITANTES] Visitante criado com sucesso!');

      setSuccess("Visitante autorizado com sucesso!");
      setFormData({
        nome_visitante: '',
        tipo_visitante: '',
        documento_visitante: '',
        data_inicio: '',
        hora_inicio: '',
        observacoes: '',
        recorrencia: 'nenhuma',
        dias_semana: [],
        data_termino_recorrencia: ''
      });
      setShowForm(false);
      loadVisitantes(moradorLogado.id);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('[VISITANTES] Erro ao autorizar visitante:', err);
      console.error('[VISITANTES] Stack trace:', err.stack);
      setError("Erro ao autorizar visitante");
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (visitanteId) => {
    if (!confirm("Deseja cancelar esta autorização?")) return;

    try {
      await base44.entities.Visitante.update(visitanteId, { status: 'cancelado' });
      setSuccess("Autorização cancelada");
      if (moradorLogado && moradorLogado.id) {
        loadVisitantes(moradorLogado.id);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('[VISITANTES] Erro ao cancelar:', err);
      setError("Erro ao cancelar autorização");
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (visitante) => {
    if (visitante.status === 'entrou') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Entrada Confirmada</Badge>;
    }
    if (visitante.status === 'cancelado') {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelado</Badge>;
    }
    if (visitante.status === 'saiu') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Saiu</Badge>;
    }
    if (visitante.recorrencia === 'semanal') {
      return <Badge className="bg-[#8b9dc3] text-white border-0">Recorrente</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Agendado</Badge>;
  };

  const visitantesFiltrados = visitantes.filter(visitante =>
    visitante.nome_visitante.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visitante.documento_visitante?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getTipoInfo(visitante.tipo_visitante).label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const podeEnviar = !loading && !loadingMorador && moradorLogado && moradorLogado.id;

  if (loadingMorador) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#3b5998]" />
        </div>
      </div>
    );
  }

  if (error && !moradorLogado) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="p-4 pt-20 pb-24">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="mt-4 w-full">
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campo Tipo */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Tipo</label>
          <button
            onClick={() => setShowTipoModal(true)}
            disabled={loadingMorador}
            className="w-full h-14 bg-[#dfe3ee] rounded-lg px-4 flex items-center justify-between text-left border-2 border-[#8b9dc3] disabled:opacity-50"
          >
            <span className={formData.tipo_visitante ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {formData.tipo_visitante ? getTipoInfo(formData.tipo_visitante).label : 'Tipo'}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Nome */}
        <Input
          placeholder="Pessoa/Empresa"
          value={formData.nome_visitante}
          onChange={(e) => setFormData(prev => ({ ...prev, nome_visitante: e.target.value }))}
          disabled={loadingMorador}
          className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
        />

        {/* Documento */}
        <Input
          placeholder="Documento (opcional)"
          value={formData.documento_visitante}
          onChange={(e) => setFormData(prev => ({ ...prev, documento_visitante: e.target.value }))}
          disabled={loadingMorador}
          className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
        />

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Dia</label>
            <div className="relative">
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                disabled={loadingMorador}
                className="h-14 bg-[#dfe3ee] border-0 rounded-lg pr-12"
              />
              <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Hora</label>
            <Input
              type="time"
              value={formData.hora_inicio}
              onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
              disabled={loadingMorador}
              className="h-14 bg-[#dfe3ee] border-0 rounded-lg"
            />
          </div>
        </div>

        {/* Observações */}
        <Textarea
          placeholder="Observações"
          value={formData.observacoes}
          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
          disabled={loadingMorador}
          rows={4}
          className="bg-[#dfe3ee] border-0 rounded-lg text-base p-4 resize-none"
        />

        {/* Campo Recorrência */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Recorrência</label>
          <button
            onClick={() => setShowRecorrenciaModal(true)}
            disabled={loadingMorador}
            className="w-full h-14 bg-[#dfe3ee] rounded-lg px-4 flex items-center justify-between text-left border-2 border-[#8b9dc3] disabled:opacity-50"
          >
            <span className="text-gray-900 font-medium">
              {getRecorrenciaInfo(formData.recorrencia).label}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Dias da Semana */}
        {formData.recorrencia === 'semanal' && (
          <>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Dias</label>
              <div className="bg-[#dfe3ee] rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {diasSemana.map((dia) => (
                    <button
                      key={dia.value}
                      onClick={() => toggleDiaSemana(dia.value)}
                      disabled={loadingMorador}
                      className={`h-12 rounded-lg flex items-center justify-center font-medium transition-colors disabled:opacity-50 ${
                        formData.dias_semana.includes(dia.value)
                          ? 'bg-[#3b5998] text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Término Recorrência */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Termina em</label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.data_termino_recorrencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_termino_recorrencia: e.target.value }))}
                  min={formData.data_inicio}
                  disabled={loadingMorador}
                  className="h-14 bg-[#dfe3ee] border-0 rounded-lg pr-12"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setEditingVisitante(null);
            }}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!podeEnviar}
            className="flex-1 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : loadingMorador ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>

        {/* Modal Tipo */}
        <AnimatePresence>
          {showTipoModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end"
              onClick={() => setShowTipoModal(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full bg-white rounded-t-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#3b5998]">Tipo</h2>
                  <button onClick={() => setShowTipoModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  {tiposVisitante.map((tipo) => (
                    <button
                      key={tipo.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, tipo_visitante: tipo.value }));
                        setShowTipoModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <tipo.icon className="w-6 h-6 text-[#3b5998]" />
                        <span className="text-lg text-gray-900 font-semibold">{tipo.label}</span>
                      </div>
                      {formData.tipo_visitante === tipo.value && (
                        <Check className="w-5 h-5 text-[#3b5998]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Recorrência */}
        <AnimatePresence>
          {showRecorrenciaModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end"
              onClick={() => setShowRecorrenciaModal(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full bg-white rounded-t-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#3b5998]">Recorrência</h2>
                  <button onClick={() => setShowRecorrenciaModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  {recorrenciaOpcoes.map((opc) => (
                    <button
                      key={opc.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, recorrencia: opc.value, dias_semana: [], data_termino_recorrencia: '' }));
                        setShowRecorrenciaModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <opc.icon className="w-6 h-6 text-[#3b5998]" />
                        <span className="text-lg text-gray-900 font-semibold">{opc.label}</span>
                      </div>
                      {formData.recorrencia === opc.value && (
                        <Check className="w-5 h-5 text-[#3b5998]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-24 pb-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Input
            placeholder="Buscar visitante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 bg-white border-0 rounded-lg text-base px-4 shadow-sm pl-12"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        </div>

        {visitantesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum visitante encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visitantesFiltrados.map((visitante) => {
              const TipoIcon = getTipoInfo(visitante.tipo_visitante).icon;
              return (
                <Card key={visitante.id} className="border-0 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div 
                            className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#dfe3ee' }}
                          >
                            <TipoIcon className="w-5 h-5 text-[#3b5998]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                              {visitante.nome_visitante}
                            </h3>
                            <p className="text-xs text-gray-600">{getTipoInfo(visitante.tipo_visitante).label}</p>
                            {visitante.documento_visitante && (
                              <p className="text-xs text-gray-500 mt-1">Doc: {visitante.documento_visitante}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(visitante)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600 bg-[#f7f7f7] p-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
                                {diasSemana.find(d => d.value === dia)?.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {visitante.observacoes && (
                        <p className="text-xs text-gray-500 italic line-clamp-2 bg-gray-50 p-2 rounded">
                          {visitante.observacoes}
                        </p>
                      )}

                      {visitante.status === 'agendado' && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <Button
                            onClick={() => handleCancelar(visitante.id)}
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar Autorização
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão Cadastrar */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setShowForm(true)}
          disabled={loadingMorador || !moradorLogado}
          className="h-14 px-6 rounded-full shadow-lg flex items-center gap-2 font-semibold text-white disabled:opacity-50 bg-[#2c2c2c] hover:bg-[#1a1a1a]"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar</span>
        </button>
      </div>
    </div>
  );
}
