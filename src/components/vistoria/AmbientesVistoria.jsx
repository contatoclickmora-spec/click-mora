import React, { useState } from 'react';
import { Plus, Check, Pencil, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SelecionarAmbientesModal from './SelecionarAmbientesModal';
import EditarAmbiente from './EditarAmbiente';

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
  if (AMBIENTES_SEM_ITENS_PADRAO.includes(nomeAmbiente)) {
    return 0;
  }
  if (ITENS_PADRAO[nomeAmbiente]) {
    return ITENS_PADRAO[nomeAmbiente].length;
  }
  return 0;
}

export default function AmbientesVistoria({ 
  ambientes = [], 
  onAmbientesChange,
  itensAmbiente = {}, // { "Banheiro": 5, "Cozinha": 3 } - contador de itens por ambiente
  saving = false,
  ambientesData = {}, // Dados completos dos ambientes (checklist, fotos, etc)
  onAmbienteUpdate // Callback para atualizar um ambiente específico
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [ambienteEditando, setAmbienteEditando] = useState(null);

  const handleSalvarAmbientes = (novosSelecionados) => {
    onAmbientesChange(novosSelecionados);
  };

  const handleAbrirEdicao = (nomeAmbiente) => {
    // IMPORTANTE: Não passar checklist vazia para ambientes com template
    // O EditarAmbiente vai decidir se carrega template ou não
    const dadosAmbiente = ambientesData[nomeAmbiente] || {
      nome: nomeAmbiente,
      status: 'Pendente',
      checklist: null, // null = não tem dados salvos, deixar EditarAmbiente decidir
      fotos: [],
      videos: [],
      observacoes: ''
    };
    setAmbienteEditando(dadosAmbiente);
  };

  const handleSalvarAmbiente = (ambienteAtualizado) => {
    if (onAmbienteUpdate) {
      onAmbienteUpdate(ambienteAtualizado);
    }
    setAmbienteEditando(null);
  };

  const handleNavegarAmbiente = (nomeAmbiente) => {
    const dadosAmbiente = ambientesData[nomeAmbiente] || {
      nome: nomeAmbiente,
      status: 'Pendente',
      checklist: null, // null = não tem dados salvos, deixar EditarAmbiente decidir
      fotos: [],
      videos: [],
      observacoes: ''
    };
    setAmbienteEditando(dadosAmbiente);
  };

  const temAmbientes = ambientes.length > 0;

  return (
    <div className="flex-1 flex flex-col relative">
      <AnimatePresence>
        {!temAmbientes ? (
          // Estado Vazio
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-12"
          >
            {/* Ilustração de documentos */}
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
              
              {/* Ícone + decorativo */}
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center shadow-xl border-4 border-gray-200">
                <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Texto */}
            <h2 className="text-xl font-semibold text-gray-700 text-center mb-auto px-4 max-w-xs">
              Adicione ambientes
            </h2>
          </motion.div>
        ) : (
          // Lista de Ambientes
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-auto px-4 py-4"
          >
            {/* Header com botão editar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Ambientes selecionados
                </h3>
                {saving && <Loader2 className="w-4 h-4 animate-spin text-[#3b5998]" />}
              </div>
              <button
                onClick={() => setModalAberto(true)}
                className="flex items-center gap-1 text-[#3b5998] text-sm font-medium hover:underline"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            </div>

            {/* Lista de ambientes */}
            <div className="space-y-2">
              {ambientes.map((ambiente, index) => (
                <motion.div
                  key={ambiente}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAbrirEdicao(ambiente)}
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#3b5998]/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#3b5998]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{ambiente}</p>
                      <p className="text-sm text-gray-500">
                        Itens: {itensAmbiente[ambiente] !== undefined ? itensAmbiente[ambiente] : getQtdItensPadrao(ambiente)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante + */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setModalAberto(true)}
          className="w-14 h-14 bg-[#3b5998] rounded-full flex items-center justify-center shadow-xl hover:bg-[#2d4373] transition-colors"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </motion.button>
      </div>



      {/* Modal de seleção */}
      <SelecionarAmbientesModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={handleSalvarAmbientes}
        ambientesSelecionados={ambientes}
      />

      {/* Tela de edição do ambiente */}
      {ambienteEditando && (
        <EditarAmbiente
          ambiente={ambienteEditando}
          onClose={() => setAmbienteEditando(null)}
          onSave={handleSalvarAmbiente}
          ambientes={ambientes}
          onNavigate={handleNavegarAmbiente}
        />
      )}
    </div>
  );
}