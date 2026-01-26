import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Home, LayoutGrid, PenTool, Loader2, AlertCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from "@/utils";
import AmbientesVistoria from "../components/vistoria/AmbientesVistoria";
import AssinaturasVistoria from "../components/vistoria/AssinaturasVistoria";

// ========================================
// CONFIGURAÇÃO DOS TEMPLATES DE ITENS
// ========================================

// AMBIENTES COM TEMPLATE VAZIO - começam sem nenhum item
const AMBIENTES_SEM_ITENS_PADRAO = [
  'Jardim',
  'Piscina', 
  'Quintal',
  'Rede elétrica',
  'Rede hidráulica'
];

// AMBIENTES COM TEMPLATE FIXO - têm lista de itens padrão
const ITENS_PADRAO = {
  'Banheiro': [
    'Box', 'Chuveiro', 'Teto', 'Tomadas', 'Piso', 'Interruptores',
    'Assento sanitário', 'Ralo', 'Janelas', 'Porta', 'Fechadura e trinco', 'Luminária'
  ],
  'Cozinha': [
    'Pia', 'Torneira', 'Armários', 'Piso', 'Teto', 'Tomadas', 'Interruptores',
    'Janelas', 'Porta', 'Luminária', 'Exaustor'
  ],
  'Sala': [
    'Piso', 'Teto', 'Paredes', 'Tomadas', 'Interruptores', 'Janelas', 
    'Porta', 'Luminária', 'Rodapé'
  ],
  'Quarto': [
    'Piso', 'Teto', 'Paredes', 'Tomadas', 'Interruptores', 'Janelas',
    'Porta', 'Fechadura', 'Luminária', 'Armário embutido'
  ],
  'Área de serviço': [
    'Tanque', 'Torneira', 'Piso', 'Tomadas', 'Interruptores', 'Ralo',
    'Porta', 'Luminária'
  ],
  'Varanda': [
    'Piso', 'Teto', 'Paredes', 'Tomadas', 'Interruptores', 'Porta',
    'Guarda-corpo', 'Luminária', 'Ralo'
  ],
  'Fachada': [
    'Teto', 'Parede', 'Porta', 'Fechadura e trincos'
  ],
  'Garagem': [
    'Piso', 'Teto', 'Paredes', 'Tomadas', 'Interruptores', 'Luminária', 'Portão'
  ],
  'Suíte': [
    'Piso', 'Teto', 'Paredes', 'Tomadas', 'Interruptores', 'Janelas',
    'Porta', 'Fechadura', 'Luminária', 'Armário embutido', 'Chuveiro', 'Pia', 'Assento sanitário'
  ]
};

// Função para obter quantidade de itens padrão de um ambiente
function getQtdItensPadrao(nomeAmbiente) {
  // Se é ambiente sem template, retorna 0
  if (AMBIENTES_SEM_ITENS_PADRAO.includes(nomeAmbiente)) {
    return 0;
  }
  // Se tem template definido, retorna a quantidade
  if (ITENS_PADRAO[nomeAmbiente]) {
    return ITENS_PADRAO[nomeAmbiente].length;
  }
  // Ambiente desconhecido, retorna 0
  return 0;
}

export default function NovaVistoria() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('imovel');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imovel, setImovel] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [ambientesSelecionados, setAmbientesSelecionados] = useState([]);
  const [vistoriaAtual, setVistoriaAtual] = useState(null);
  const [intervenientes, setIntervenientes] = useState([]);

  // Pegar imovelId e vistoriaId da URL
  const urlParams = new URLSearchParams(window.location.search);
  const imovelId = urlParams.get('imovelId');
  const vistoriaIdParam = urlParams.get('vistoriaId');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!imovelId) {
          setError('Imóvel não especificado.');
          setLoading(false);
          return;
        }

        // Carregar usuário
        const user = await base44.auth.me();
        if (!user || !user.email) {
          setError('Usuário não autenticado.');
          setLoading(false);
          return;
        }

        // Carregar morador
        const todosMoradores = await base44.entities.Morador.list();
        const morador = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        if (!morador) {
          setError('Cadastro não encontrado.');
          setLoading(false);
          return;
        }

        setMoradorLogado(morador);

        // Carregar imóvel
        const todosImoveis = await base44.entities.ImovelVistoria.list();
        const imovelEncontrado = todosImoveis.find(i => i.id === imovelId);

        if (!imovelEncontrado) {
          setError('Imóvel não encontrado.');
          setLoading(false);
          return;
        }

        // Verificar se o imóvel pertence ao morador
        if (imovelEncontrado.morador_id !== morador.id) {
          setError('Você não tem permissão para criar vistoria neste imóvel.');
          setLoading(false);
          return;
        }

        setImovel(imovelEncontrado);

        // Verificar se já existe uma vistoria em rascunho para esse imóvel ou se foi passado vistoriaId
        const todasVistorias = await base44.entities.Vistoria.list();
        let vistoriaExistente = null;

        if (vistoriaIdParam) {
          // Se foi passado um ID de vistoria, usar essa
          vistoriaExistente = todasVistorias.find(v => v.id === vistoriaIdParam);
        } else {
          // Procurar por rascunho existente desse imóvel
          vistoriaExistente = todasVistorias.find(
            v => v.imovel_id === imovelId && v.morador_id === morador.id && v.rascunho === true
          );
        }

        if (vistoriaExistente) {
          // Carregar vistoria existente
          setVistoriaAtual(vistoriaExistente);
          // Carregar ambientes salvos (extrair apenas os nomes)
          if (vistoriaExistente.ambientes && vistoriaExistente.ambientes.length > 0) {
            const nomesAmbientes = vistoriaExistente.ambientes.map(a => a.nome);
            setAmbientesSelecionados(nomesAmbientes);
          }
          // Carregar intervenientes salvos
          if (vistoriaExistente.intervenientes && vistoriaExistente.intervenientes.length > 0) {
            setIntervenientes(vistoriaExistente.intervenientes);
          }
        } else {
          // Criar nova vistoria em rascunho
          const novaVistoria = await base44.entities.Vistoria.create({
            imovel_id: imovelId,
            morador_id: morador.id,
            data_vistoria: new Date().toISOString().split('T')[0],
            tipo_vistoria: 'Entrada',
            status_geral: 'Bom',
            rascunho: true,
            ambientes: [],
            etapa_atual: 1
          });
          setVistoriaAtual(novaVistoria);
        }

        setLoading(false);

      } catch (err) {
        console.error('[NOVA VISTORIA] Erro ao carregar:', err);
        setError('Erro ao carregar dados.');
        setLoading(false);
      }
    };

    loadData();
  }, [imovelId, vistoriaIdParam]);

  const handleClose = () => {
    navigate(createPageUrl('VistoriaImoveis'));
  };

  // Função para salvar ambientes no banco
  const handleAmbientesChange = async (novosAmbientes) => {
    setAmbientesSelecionados(novosAmbientes);
    
    if (!vistoriaAtual) return;
    
    try {
      setSaving(true);
      
      // Preservar dados existentes dos ambientes que continuam selecionados
      const ambientesAtuais = vistoriaAtual.ambientes || [];
      const ambientesFormatados = novosAmbientes.map(nome => {
        const existente = ambientesAtuais.find(a => a.nome === nome);
        if (existente) return existente;
        // IMPORTANTE: checklist: null indica que não há dados salvos ainda
        // O componente EditarAmbiente vai decidir se carrega template ou não
        return {
          nome: nome,
          status: 'Pendente',
          checklist: null,
          fotos: [],
          videos: [],
          observacoes: ''
        };
      });

      await base44.entities.Vistoria.update(vistoriaAtual.id, {
        ambientes: ambientesFormatados
      });

      // Atualizar estado local
      setVistoriaAtual(prev => ({
        ...prev,
        ambientes: ambientesFormatados
      }));
    } catch (err) {
      console.error('[NOVA VISTORIA] Erro ao salvar ambientes:', err);
    } finally {
      setSaving(false);
    }
  };

  // Função para atualizar um ambiente específico
  const handleAmbienteUpdate = async (ambienteAtualizado) => {
    if (!vistoriaAtual) return;
    
    try {
      setSaving(true);
      
      const ambientesAtuais = vistoriaAtual.ambientes || [];
      const novosAmbientes = ambientesAtuais.map(a => 
        a.nome === ambienteAtualizado.nome ? ambienteAtualizado : a
      );

      await base44.entities.Vistoria.update(vistoriaAtual.id, {
        ambientes: novosAmbientes
      });

      setVistoriaAtual(prev => ({
        ...prev,
        ambientes: novosAmbientes
      }));
    } catch (err) {
      console.error('[NOVA VISTORIA] Erro ao atualizar ambiente:', err);
    } finally {
      setSaving(false);
    }
  };

  // Converter array de ambientes para objeto indexado por nome
  const getAmbientesData = () => {
    const data = {};
    (vistoriaAtual?.ambientes || []).forEach(a => {
      data[a.nome] = a;
    });
    return data;
  };

  // Calcular itens por ambiente
  // Se o ambiente já tem checklist salva, usa ela
  // Senão, usa a quantidade do template padrão (ou 0 para ambientes vazios)
  const getItensAmbiente = () => {
    const itens = {};
    ambientesSelecionados.forEach(nomeAmbiente => {
      // Verificar se já tem dados salvos na vistoria
      const ambienteSalvo = (vistoriaAtual?.ambientes || []).find(a => a.nome === nomeAmbiente);
      
      if (ambienteSalvo && ambienteSalvo.checklist && ambienteSalvo.checklist.length > 0) {
        // Tem checklist salva, usar ela
        itens[nomeAmbiente] = ambienteSalvo.checklist.length;
      } else {
        // Não tem checklist salva, usar quantidade do template padrão
        itens[nomeAmbiente] = getQtdItensPadrao(nomeAmbiente);
      }
    });
    return itens;
  };

  // Função para atualizar intervenientes
  const handleIntervenientesChange = async (novosIntervenientes) => {
    setIntervenientes(novosIntervenientes);
    
    if (!vistoriaAtual) return;
    
    try {
      setSaving(true);
      await base44.entities.Vistoria.update(vistoriaAtual.id, {
        intervenientes: novosIntervenientes
      });
      setVistoriaAtual(prev => ({
        ...prev,
        intervenientes: novosIntervenientes
      }));
    } catch (err) {
      console.error('[NOVA VISTORIA] Erro ao salvar intervenientes:', err);
    } finally {
      setSaving(false);
    }
  };

  // Função para finalizar vistoria
  const handleFinalizarVistoria = async () => {
    if (!vistoriaAtual) return;
    
    try {
      setSaving(true);
      await base44.entities.Vistoria.update(vistoriaAtual.id, {
        rascunho: false,
        data_finalizacao: new Date().toISOString()
      });
      navigate(createPageUrl('VistoriaImoveis'));
    } catch (err) {
      console.error('[NOVA VISTORIA] Erro ao finalizar vistoria:', err);
    } finally {
      setSaving(false);
    }
  };

  const abas = [
    { id: 'imovel', label: 'Imóvel', icon: Home },
    { id: 'ambientes', label: 'Ambientes', icon: LayoutGrid },
    { id: 'assinaturas', label: 'Assinaturas', icon: PenTool },
  ];

  const getEmptyStateContent = () => {
    switch (abaAtiva) {
      case 'imovel':
        return {
          title: 'Preencha os dados do imóvel',
          showButton: false
        };
      case 'ambientes':
        return {
          title: 'Adicione os ambientes da vistoria',
          showButton: false
        };
      case 'assinaturas':
        return {
          title: 'Finalize a vistoria para coletar assinaturas',
          buttonText: 'Finalizar vistoria',
          showButton: true
        };
      default:
        return { title: '', buttonText: '', showButton: false };
    }
  };

  const renderConteudoImovel = () => {
    const emptyState = getEmptyStateContent();
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Ícone de documentos empilhados com + */}
        <div className="relative mb-10">
          {/* Documento de trás */}
          <div className="absolute -left-4 -top-3 w-36 h-44 bg-white/70 rounded-xl shadow-sm transform -rotate-6" />
          
          {/* Documento da frente */}
          <div className="relative w-36 h-44 bg-white rounded-xl shadow-lg p-4">
            <div className="w-10 h-10 bg-gray-400 rounded-md mb-3" />
            <div className="space-y-2">
              <div className="h-2.5 bg-gray-300 rounded w-full" />
              <div className="h-2.5 bg-gray-300 rounded w-3/4" />
              <div className="h-2.5 bg-gray-300 rounded w-5/6" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-gray-300 rounded" />
                <div className="h-2.5 bg-gray-300 rounded flex-1" />
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 bg-gray-300 rounded" />
                <div className="h-2.5 bg-gray-300 rounded flex-1" />
              </div>
            </div>
          </div>
          
          {/* Botão + */}
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center shadow-xl border-4 border-gray-200">
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Texto */}
        <h2 className="text-xl font-semibold text-gray-700 text-center mb-auto px-4 max-w-xs">
          {emptyState.title}
        </h2>

        {/* Botão de ação - apenas para assinaturas */}
        {emptyState.showButton && (
          <div className="w-full max-w-sm mt-auto pt-8 pb-4">
            <Button 
              className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-6 rounded-full text-lg font-medium shadow-lg"
              onClick={() => console.log('Finalizar vistoria')}
            >
              {emptyState.buttonText}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderConteudo = () => {
    switch (abaAtiva) {
      case 'ambientes':
        return (
          <AmbientesVistoria
            ambientes={ambientesSelecionados}
            onAmbientesChange={handleAmbientesChange}
            saving={saving}
            ambientesData={getAmbientesData()}
            onAmbienteUpdate={handleAmbienteUpdate}
            itensAmbiente={getItensAmbiente()}
          />
        );
      case 'assinaturas':
        return (
          <AssinaturasVistoria
            intervenientes={intervenientes}
            onIntervenientesChange={handleIntervenientesChange}
            onFinalizarVistoria={handleFinalizarVistoria}
            vistoriadorNome={moradorLogado?.nome || ''}
            vistoriadorEmail={moradorLogado?.email || ''}
          />
        );
      case 'imovel':
      default:
        return renderConteudoImovel();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
        <div 
          className="flex items-center justify-between h-16 px-4 shadow-md"
          style={{ backgroundColor: '#3b5998' }}
        >
          <button
            onClick={handleClose}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Nova Vistoria</h1>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
        <div 
          className="flex items-center justify-between h-16 px-4 shadow-md"
          style={{ backgroundColor: '#3b5998' }}
        >
          <button
            onClick={handleClose}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Nova Vistoria</h1>
          <div className="w-10" />
        </div>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleClose} className="w-full mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d8dce5] flex flex-col">
      {/* Header + Abas unificados */}
      <div style={{ backgroundColor: '#3b5998' }}>
        {/* Header */}
        <div className="flex items-center h-14 px-4">
          <button
            onClick={handleClose}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 text-center pr-8">
            <h1 className="text-lg font-semibold text-white">Nova Vistoria</h1>
          </div>
        </div>

        {/* Navegação por Abas */}
        <div className="flex">
          {abas.map((aba) => {
            const isActive = abaAtiva === aba.id;
            
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-all ${
                  isActive 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {aba.label}
              </button>
            );
          })}
        </div>
        {/* Indicador de aba ativa */}
        <div className="relative h-1">
          <motion.div
            className="absolute bottom-0 h-1 bg-white"
            initial={false}
            animate={{
              left: `${abas.findIndex(a => a.id === abaAtiva) * (100 / abas.length)}%`,
              width: `${100 / abas.length}%`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 bg-[#d8dce5] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={abaAtiva}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col"
          >
            {renderConteudo()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}