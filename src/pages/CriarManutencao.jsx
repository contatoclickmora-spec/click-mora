import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MoradorFooter from '../components/shared/MoradorFooter';
import AuthGuard from '../components/utils/AuthGuard';
import { getUserRole } from "../components/utils/authUtils";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';



export default function CriarManutencao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState('morador');
  const [condominioId, setCondominioId] = useState(null);
  
  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('preventiva');
  const [status, setStatus] = useState('pendente');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [valor, setValor] = useState('');
  const [fornecedor, setFornecedor] = useState('');
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
      setUserType(role.userType);
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
        <div 
          className="fixed top-0 left-0 right-0 z-40 shadow-md"
          style={{ backgroundColor: '#3b5998' }}
        >
          <div style={{ height: 'env(safe-area-inset-top)', backgroundColor: '#3b5998' }} />
          <div className="flex items-end justify-between h-24 px-4 pb-3">
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate(createPageUrl('Manutencoes'), { replace: true });
                }
              }}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="flex-1 text-xl font-semibold text-center text-white">
              Nova Manutenção
            </h1>
            <div className="w-10" />
          </div>
        </div>
        
        <div className="pt-28 pb-24 px-4 max-w-7xl mx-auto">
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
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-gray-100 rounded-lg px-4 py-3"
                  >
                    <option value="preventiva">Preventiva</option>
                    <option value="eventual">Eventual</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-700 mb-2 block">Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-100 rounded-lg px-4 py-3"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em andamento</option>
                  </select>
                </div>
              </div>

              {/* Início e Fim */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 mb-2 block">Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-left hover:border-gray-400 transition-colors"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 mb-2 block">Fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    min={dataInicio || undefined}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={!dataInicio}
                    className={`bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-left transition-colors ${
                      dataInicio ? 'hover:border-gray-400' : 'opacity-50 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <Label className="text-gray-700 mb-2 block">Fornecedor</Label>
                <Input
                  placeholder="Nome do fornecedor"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  className="bg-gray-100 border-0"
                />
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
                <select
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value)}
                  className="w-full bg-gray-100 rounded-lg px-4 py-3"
                >
                  <option value="nenhuma">Nenhuma</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </select>
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

        {/* Tipo - seletor simples sem modal (para estabilidade) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700 mb-2 block">Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-gray-100 rounded-lg px-4 py-3"
            >
              <option value="preventiva">Preventiva</option>
              <option value="eventual">Eventual</option>
            </select>
          </div>
          <div>
            <Label className="text-gray-700 mb-2 block">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-100 rounded-lg px-4 py-3"
            >
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
            </select>
          </div>
        </div>



        {/* Recorrência - seletor simples */}
        <div>
          <Label className="text-gray-700 mb-2 block">Recorrência</Label>
          <select
            value={recorrencia}
            onChange={(e) => setRecorrencia(e.target.value)}
            className="w-full bg-gray-100 rounded-lg px-4 py-3"
          >
            <option value="nenhuma">Nenhuma</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </div>

}



        {userType !== 'morador' && <MoradorFooter />}
      </div>
    </AuthGuard>
  );
}