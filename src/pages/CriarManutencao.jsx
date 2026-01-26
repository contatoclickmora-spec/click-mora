import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MoradorHeader from '../components/shared/MoradorHeader';
import AuthGuard from '../components/utils/AuthGuard';
import { getUserRole } from "../components/utils/authUtils";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { X, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DatePickerModal from '../components/shared/DatePickerModal';

export default function CriarManutencao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [condominioId, setCondominioId] = useState(null);
  
  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('preventiva');
  const [status, setStatus] = useState('pendente');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [valor, setValor] = useState('');
  const [visivelMoradores, setVisivelMoradores] = useState(true);
  const [recorrencia, setRecorrencia] = useState('nenhuma');
  
  // Modal states
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRecorrenciaModal, setShowRecorrenciaModal] = useState(false);
  const [showInicioModal, setShowInicioModal] = useState(false);
  const [showFimModal, setShowFimModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const role = await getUserRole();
      setCurrentUser(role.user);
      if (role.morador?.condominio_id) {
        setCondominioId(role.morador.condominio_id);
      }
    } catch (error) {
      console.error('[CRIAR MANUTENCAO] Erro ao carregar dados:', error);
    }
  };

  const formatCurrency = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseFloat(numbers) / 100;
    
    // Formata com separadores
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleValorChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    setValor(formatted);
  };

  const parseValorToNumber = (valorString) => {
    if (!valorString) return 0;
    // Remove R$, pontos e substitui vírgula por ponto
    return parseFloat(valorString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
  };

  const handleSalvar = async () => {
    // Validações
    if (!titulo.trim()) {
      alert('Por favor, preencha o título');
      return;
    }
    if (!descricao.trim()) {
      alert('Por favor, preencha a descrição');
      return;
    }
    if (!dataInicio) {
      alert('Por favor, selecione a data de início');
      return;
    }
    if (!dataFim) {
      alert('Por favor, selecione a data de fim');
      return;
    }
    if (new Date(dataFim) < new Date(dataInicio)) {
      alert('A data de fim não pode ser anterior à data de início');
      return;
    }

    try {
      setLoading(true);

      const manutencaoData = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tipo,
        status,
        data_inicio: dataInicio,
        data_fim: dataFim,
        valor: parseValorToNumber(valor),
        visivel_moradores: visivelMoradores,
        recorrencia,
        condominio_id: condominioId,
        criado_por: currentUser?.full_name || currentUser?.email,
        criado_por_id: currentUser?.id
      };

      await base44.entities.Manutencao.create(manutencaoData);

      // Voltar para a página de manutenções
      navigate(createPageUrl('Manutencoes'));
    } catch (error) {
      console.error('[CRIAR MANUTENCAO] Erro ao salvar:', error);
      alert('Erro ao salvar manutenção. Tente novamente.');
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo) => {
    return tipo === 'preventiva' ? 'Preventiva' : 'Eventual';
  };

  const getStatusLabel = (status) => {
    return status === 'pendente' ? 'Pendente' : 'Em andamento';
  };

  const getRecorrenciaLabel = (recorrencia) => {
    const labels = {
      nenhuma: 'Nenhuma',
      semanal: 'Semanal',
      mensal: 'Mensal',
      anual: 'Anual'
    };
    return labels[recorrencia] || 'Nenhuma';
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Criar manutenção" />
        
        <div className="pt-16 pb-24 px-4 max-w-7xl mx-auto">
          <Card className="bg-white">
            <CardContent className="p-6 space-y-4">
              {/* Título */}
              <div>
                <Label className="text-gray-700 mb-2 block">Título</Label>
                <Input
                  placeholder="Título"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="bg-gray-100 border-0"
                />
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-gray-700 mb-2 block">Descrição</Label>
                <Textarea
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="bg-gray-100 border-0 min-h-[120px]"
                />
              </div>

              {/* Tipo e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 mb-2 block">Tipo</Label>
                  <button
                    onClick={() => setShowTipoModal(true)}
                    className="w-full bg-gray-100 rounded-lg px-4 py-3 text-left flex items-center justify-between"
                  >
                    <span className="text-gray-700">{getTipoLabel(tipo)}</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                    </div>
                  </button>
                </div>

                <div>
                  <Label className="text-gray-700 mb-2 block">Status</Label>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="w-full bg-gray-100 rounded-lg px-4 py-3 text-left flex items-center justify-between"
                  >
                    <span className="text-gray-700">{getStatusLabel(status)}</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Início e Fim */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 mb-2 block">Início</Label>
                  <button
                    onClick={() => setShowInicioModal(true)}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 transition-colors"
                  >
                    <span className="text-gray-900 text-lg">
                      {dataInicio ? formatDateDisplay(dataInicio) : 'Selecionar'}
                    </span>
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div>
                  <Label className="text-gray-700 mb-2 block">Fim</Label>
                  <button
                    onClick={() => dataInicio && setShowFimModal(true)}
                    disabled={!dataInicio}
                    className={`w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors ${
                      dataInicio ? 'hover:border-gray-400 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-gray-900 text-lg">
                      {dataFim ? formatDateDisplay(dataFim) : 'Selecionar'}
                    </span>
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div>
                <Label className="text-gray-700 mb-2 block">Valor</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={valor}
                  onChange={handleValorChange}
                  className="bg-gray-100 border-0"
                />
              </div>

              {/* Visível aos moradores */}
              <div className="flex items-center space-x-3 py-2">
                <Checkbox
                  id="visivel"
                  checked={visivelMoradores}
                  onCheckedChange={setVisivelMoradores}
                  className="data-[state=checked]:bg-[#3b5998] data-[state=checked]:border-[#3b5998]"
                />
                <Label htmlFor="visivel" className="text-gray-700 font-normal cursor-pointer">
                  Visível aos moradores
                </Label>
              </div>

              {/* Recorrência */}
              <div>
                <Label className="text-gray-700 mb-2 block">Recorrência</Label>
                <button
                  onClick={() => setShowRecorrenciaModal(true)}
                  className="w-full bg-gray-100 rounded-lg px-4 py-3 text-left flex items-center justify-between"
                >
                  <span className="text-gray-700">{getRecorrenciaLabel(recorrencia)}</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                  </div>
                </button>
              </div>

              {/* Botão Salvar */}
              <div className="pt-4">
                <Button
                  onClick={handleSalvar}
                  disabled={loading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-6 rounded-full"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal Tipo */}
        <Dialog open={showTipoModal} onOpenChange={setShowTipoModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#3b5998] text-2xl">Tipo</DialogTitle>
                <button
                  onClick={() => setShowTipoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogHeader>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setTipo('preventiva');
                  setShowTipoModal(false);
                }}
                className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 border-b"
              >
                <Calendar className="w-6 h-6 text-[#3b5998]" />
                <span className="text-lg">Preventiva</span>
              </button>
              <button
                onClick={() => {
                  setTipo('eventual');
                  setShowTipoModal(false);
                }}
                className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <Calendar className="w-6 h-6 text-[#3b5998]" />
                <span className="text-lg">Eventual</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Status */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#3b5998] text-2xl">Status</DialogTitle>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogHeader>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setStatus('pendente');
                  setShowStatusModal(false);
                }}
                className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 border-b"
              >
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <span className="text-lg">Pendente</span>
              </button>
              <button
                onClick={() => {
                  setStatus('em_andamento');
                  setShowStatusModal(false);
                }}
                className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <span className="text-lg">Em andamento</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Recorrência */}
        <Dialog open={showRecorrenciaModal} onOpenChange={setShowRecorrenciaModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#3b5998] text-2xl">Recorrência</DialogTitle>
                <button
                  onClick={() => setShowRecorrenciaModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogHeader>
            <div className="space-y-2">
              {['nenhuma', 'semanal', 'mensal', 'anual'].map((rec, idx) => (
                <button
                  key={rec}
                  onClick={() => {
                    setRecorrencia(rec);
                    setShowRecorrenciaModal(false);
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 ${
                    idx < 3 ? 'border-b' : ''
                  }`}
                >
                  <Calendar className="w-6 h-6 text-[#3b5998]" />
                  <span className="text-lg">{getRecorrenciaLabel(rec)}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Data Início */}
        <DatePickerModal
          open={showInicioModal}
          onClose={() => setShowInicioModal(false)}
          title="Início"
          onConfirm={setDataInicio}
          initialDate={dataInicio}
        />

        {/* Modal Data Fim */}
        <DatePickerModal
          open={showFimModal}
          onClose={() => setShowFimModal(false)}
          title="Fim"
          onConfirm={setDataFim}
          initialDate={dataFim}
          minDate={dataInicio}
        />
      </div>
    </AuthGuard>
  );
}