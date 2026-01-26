import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, MoreHorizontal, Plus, ChevronLeft, ChevronRight, Copy, Pencil, ListX, Trash2, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditarItem from './EditarItem';

// ========================================
// CONFIGURAÇÃO DOS ITENS POR AMBIENTE
// ========================================

// AMBIENTES COM TEMPLATE VAZIO - começam sem nenhum item
// O proprietário adiciona manualmente usando o botão "+"
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

// Opções de estado para cada item
const ESTADOS_ITEM = ['Bom', 'Regular', 'Ruim', 'Não possui'];

export default function EditarAmbiente({ 
  ambiente, 
  onClose, 
  onSave,
  ambientes = [], // Lista de todos os ambientes para navegação
  onNavigate // Função para navegar entre ambientes
}) {
  const [abaAtiva, setAbaAtiva] = useState('itens');
  const [itens, setItens] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [comentarios, setComentarios] = useState('');
  const [itemEditando, setItemEditando] = useState(null);
  const [novoItemNome, setNovoItemNome] = useState('');
  const [mostrarInputNovoItem, setMostrarInputNovoItem] = useState(false);
  const [menuAberto, setMenuAberto] = useState(null); // índice do item com menu aberto
  const [modoMultiSelecao, setModoMultiSelecao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [editandoNomeItem, setEditandoNomeItem] = useState(null); // índice do item editando nome
  const [nomeEditado, setNomeEditado] = useState('');

  const abas = [
    { id: 'itens', label: 'ITENS' },
    { id: 'fotos', label: 'FOTOS' },
    { id: 'videos', label: 'VÍDEOS' },
    { id: 'comentarios', label: 'COMENTÁRIOS' }
  ];

  useEffect(() => {
    if (!ambiente) return;

    // PASSO 1: Verificar se é ambiente com template vazio
    const isAmbienteSemTemplate = AMBIENTES_SEM_ITENS_PADRAO.includes(ambiente.nome);

    // PASSO 2: Se o ambiente já tem itens salvos na vistoria (checklist é array com itens), usar eles
    // IMPORTANTE: checklist === null significa que não há dados salvos ainda
    // checklist === [] (array vazio) significa que foi salvo vazio intencionalmente
    if (ambiente.checklist !== null && ambiente.checklist !== undefined && Array.isArray(ambiente.checklist) && ambiente.checklist.length > 0) {
      setItens(ambiente.checklist);
    } 
    // PASSO 3: Se é ambiente SEM template (Piscina, Jardim, etc), SEMPRE começar vazio
    else if (isAmbienteSemTemplate) {
      setItens([]);
    }
    // PASSO 4: Se é ambiente COM template e não tem dados salvos, carregar itens padrão
    else {
      const itensPadrao = ITENS_PADRAO[ambiente.nome] || [];
      const itensIniciais = itensPadrao.map(nome => ({
        nome,
        estado: 'Bom',
        observacao: '',
        fotos: [],
        videos: []
      }));
      setItens(itensIniciais);
    }

    // Carregar fotos, vídeos e comentários existentes
    setFotos(ambiente.fotos || []);
    setVideos(ambiente.videos || []);
    setComentarios(ambiente.observacoes || '');
  }, [ambiente]);

  const handleEstadoChange = (index, novoEstado) => {
    const novosItens = [...itens];
    novosItens[index].estado = novoEstado;
    setItens(novosItens);
  };

  const handleAbrirItem = (item) => {
    setItemEditando(item);
  };

  const handleSalvarItem = (itemAtualizado) => {
    const novosItens = itens.map(i => 
      i.nome === itemAtualizado.nome ? itemAtualizado : i
    );
    setItens(novosItens);
    setItemEditando(null);
  };

  const handleNavegarItem = (item) => {
    setItemEditando(item);
  };

  const handleAdicionarItem = () => {
    if (!novoItemNome.trim()) return;
    
    // Verificar se já existe
    const jaExiste = itens.some(i => i.nome.toLowerCase() === novoItemNome.trim().toLowerCase());
    if (jaExiste) {
      setNovoItemNome('');
      setMostrarInputNovoItem(false);
      return;
    }

    const novoItem = {
      nome: novoItemNome.trim(),
      estado: 'Bom',
      observacao: '',
      fotos: [],
      videos: [],
      customizado: true // Marca que foi adicionado pelo proprietário
    };

    setItens([...itens, novoItem]);
    setNovoItemNome('');
    setMostrarInputNovoItem(false);
  };

  const handleRemoverItem = (index) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
    setMenuAberto(null);
  };

  // Duplicar item
  const handleDuplicarItem = (index) => {
    const itemOriginal = itens[index];
    const novoItem = {
      ...itemOriginal,
      nome: `${itemOriginal.nome} (cópia)`,
      customizado: true
    };
    const novosItens = [...itens];
    novosItens.splice(index + 1, 0, novoItem);
    setItens(novosItens);
    setMenuAberto(null);
  };

  // Editar nome do item
  const handleEditarItem = (index) => {
    setEditandoNomeItem(index);
    setNomeEditado(itens[index].nome);
    setMenuAberto(null);
  };

  const handleSalvarNomeItem = () => {
    if (!nomeEditado.trim() || editandoNomeItem === null) {
      setEditandoNomeItem(null);
      setNomeEditado('');
      return;
    }
    const novosItens = [...itens];
    novosItens[editandoNomeItem] = {
      ...novosItens[editandoNomeItem],
      nome: nomeEditado.trim(),
      customizado: true
    };
    setItens(novosItens);
    setEditandoNomeItem(null);
    setNomeEditado('');
  };

  // Remover itens não realizados (sem estado definido ou estado padrão 'Bom' sem alteração)
  const handleRemoverNaoRealizados = () => {
    // Considera "não realizado" itens que ainda estão no estado padrão 'Bom' e sem observação/fotos
    const novosItens = itens.filter(item => 
      item.estado !== 'Bom' || 
      (item.observacao && item.observacao.trim()) || 
      (item.fotos && item.fotos.length > 0) ||
      (item.videos && item.videos.length > 0)
    );
    setItens(novosItens);
    setMenuAberto(null);
  };

  // Multi-seleção
  const handleAtivarMultiSelecao = () => {
    setModoMultiSelecao(true);
    setItensSelecionados([]);
    setMenuAberto(null);
  };

  const handleToggleSelecao = (index) => {
    if (itensSelecionados.includes(index)) {
      setItensSelecionados(itensSelecionados.filter(i => i !== index));
    } else {
      setItensSelecionados([...itensSelecionados, index]);
    }
  };

  const handleRemoverSelecionados = () => {
    const novosItens = itens.filter((_, index) => !itensSelecionados.includes(index));
    setItens(novosItens);
    setModoMultiSelecao(false);
    setItensSelecionados([]);
  };

  const handleCancelarMultiSelecao = () => {
    setModoMultiSelecao(false);
    setItensSelecionados([]);
  };

  const handleSave = () => {
    const ambienteAtualizado = {
      ...ambiente,
      checklist: itens,
      fotos,
      videos,
      observacoes: comentarios,
      status: calcularStatusGeral()
    };
    onSave(ambienteAtualizado);
  };

  const calcularStatusGeral = () => {
    if (itens.length === 0) return 'Pendente';
    const temRuim = itens.some(i => i.estado === 'Ruim');
    const temRegular = itens.some(i => i.estado === 'Regular');
    if (temRuim) return 'Ruim';
    if (temRegular) return 'Regular';
    return 'Bom';
  };

  // Navegação entre ambientes
  const ambienteIndex = ambientes.findIndex(a => a === ambiente?.nome);
  const podeVoltar = ambienteIndex > 0;
  const podeAvancar = ambienteIndex < ambientes.length - 1;

  const handleNavegar = (direcao) => {
    handleSave(); // Salvar antes de navegar
    if (direcao === 'anterior' && podeVoltar) {
      onNavigate(ambientes[ambienteIndex - 1]);
    } else if (direcao === 'proximo' && podeAvancar) {
      onNavigate(ambientes[ambienteIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f7f7f7] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#3b5998] text-white">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => { handleSave(); onClose(); }} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{ambiente?.nome || 'Ambiente'}</h1>
          <div className="w-8" /> {/* Espaço para balancear */}
        </div>

        {/* Abas */}
        <div className="flex border-b border-[#2d4373]">
          {abas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                abaAtiva === aba.id 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {abaAtiva === 'itens' && (
            <motion.div
              key="itens"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 pb-32"
            >
              {/* Barra de multi-seleção */}
              {modoMultiSelecao && (
                <div className="bg-[#3b5998] text-white p-3 rounded-xl mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    <span className="font-medium">{itensSelecionados.length} selecionado(s)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRemoverSelecionados}
                      disabled={itensSelecionados.length === 0}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        itensSelecionados.length > 0 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white/50'
                      }`}
                    >
                      Remover
                    </button>
                    <button
                      onClick={handleCancelarMultiSelecao}
                      className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {itens.length === 0 && !mostrarInputNovoItem ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    Nenhum item cadastrado
                  </p>
                  <p className="text-gray-400 text-xs mb-6">
                    Adicione os itens que existem neste ambiente
                  </p>
                  <button
                    onClick={() => setMostrarInputNovoItem(true)}
                    className="px-6 py-3 bg-[#3b5998] text-white rounded-full text-sm font-medium"
                  >
                    Adicionar item
                  </button>
                </div>
              ) : (
                <div className="space-y-1 relative">
                  {itens.map((item, index) => (
                    <div key={index} className="relative">
                      {/* Modo edição de nome */}
                      {editandoNomeItem === index ? (
                        <div className="flex items-center gap-2 py-3 px-2 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={nomeEditado}
                            onChange={(e) => setNomeEditado(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5998]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSalvarNomeItem();
                              if (e.key === 'Escape') {
                                setEditandoNomeItem(null);
                                setNomeEditado('');
                              }
                            }}
                          />
                          <button
                            onClick={handleSalvarNomeItem}
                            className="p-2 bg-[#3b5998] text-white rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditandoNomeItem(null);
                              setNomeEditado('');
                            }}
                            className="p-2 bg-gray-200 text-gray-600 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <ItemVistoria
                          item={item}
                          index={index}
                          onEstadoChange={(estado) => handleEstadoChange(index, estado)}
                          onClick={() => !modoMultiSelecao && handleAbrirItem(item)}
                          onMenuClick={(e) => {
                            e.stopPropagation();
                            setMenuAberto(menuAberto === index ? null : index);
                          }}
                          menuAberto={menuAberto === index}
                          modoMultiSelecao={modoMultiSelecao}
                          selecionado={itensSelecionados.includes(index)}
                          onToggleSelecao={() => handleToggleSelecao(index)}
                        />
                      )}

                      {/* Menu flutuante */}
                      <AnimatePresence>
                        {menuAberto === index && (
                          <>
                            {/* Overlay para fechar menu */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setMenuAberto(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[220px]"
                              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
                            >
                              <button
                                onClick={() => handleDuplicarItem(index)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <Copy className="w-5 h-5 text-[#3b5998]" />
                                <span className="text-gray-800 font-medium">Duplicar</span>
                              </button>
                              <button
                                onClick={() => handleEditarItem(index)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <Pencil className="w-5 h-5 text-[#3b5998]" />
                                <span className="text-gray-800 font-medium">Editar</span>
                              </button>
                              <button
                                onClick={handleRemoverNaoRealizados}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <ListX className="w-5 h-5 text-[#3b5998]" />
                                <span className="text-gray-800 font-medium">Remover itens não realizados</span>
                              </button>
                              <button
                                onClick={() => handleRemoverItem(index)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <Trash2 className="w-5 h-5 text-[#3b5998]" />
                                <span className="text-gray-800 font-medium">Remover</span>
                              </button>
                              <button
                                onClick={handleAtivarMultiSelecao}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <CheckSquare className="w-5 h-5 text-[#3b5998]" />
                                <span className="text-gray-800 font-medium">Remover multi-seleção</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {/* Input para adicionar novo item */}
              {mostrarInputNovoItem && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={novoItemNome}
                    onChange={(e) => setNovoItemNome(e.target.value)}
                    placeholder="Nome do item..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b5998] text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdicionarItem();
                      if (e.key === 'Escape') {
                        setMostrarInputNovoItem(false);
                        setNovoItemNome('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAdicionarItem}
                    className="px-4 py-3 bg-[#3b5998] text-white rounded-xl text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {abaAtiva === 'fotos' && (
            <motion.div
              key="fotos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Nenhuma foto adicionada</p>
                <button className="mt-4 px-6 py-2 bg-[#3b5998] text-white rounded-lg text-sm font-medium">
                  Adicionar foto
                </button>
              </div>
            </motion.div>
          )}

          {abaAtiva === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Nenhum vídeo adicionado</p>
                <button className="mt-4 px-6 py-2 bg-[#3b5998] text-white rounded-lg text-sm font-medium">
                  Adicionar vídeo
                </button>
              </div>
            </motion.div>
          )}

          {abaAtiva === 'comentarios' && (
            <motion.div
              key="comentarios"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Adicione comentários sobre este ambiente..."
                className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#3b5998] text-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botão flutuante de adicionar item */}
      {abaAtiva === 'itens' && !mostrarInputNovoItem && (
        <button 
          onClick={() => setMostrarInputNovoItem(true)}
          className="absolute bottom-24 right-1/2 translate-x-1/2 w-14 h-14 bg-[#3b5998] rounded-full shadow-lg flex items-center justify-center"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Footer de navegação */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => handleNavegar('anterior')}
          disabled={!podeVoltar}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            podeVoltar ? 'bg-[#3b5998] text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <span className="text-base font-semibold text-gray-900">
          {ambiente?.nome || 'Ambiente'}
        </span>

        <button
          onClick={() => handleNavegar('proximo')}
          disabled={!podeAvancar}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            podeAvancar ? 'bg-[#3b5998] text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Tela de edição do item */}
      {itemEditando && (
        <EditarItem
          item={itemEditando}
          ambienteNome={ambiente?.nome}
          onClose={() => setItemEditando(null)}
          onSave={handleSalvarItem}
          itens={itens}
          onNavigate={handleNavegarItem}
        />
      )}
    </div>
  );
}

// Componente para cada item da vistoria
function ItemVistoria({ 
  item, 
  index,
  onEstadoChange, 
  onClick, 
  onMenuClick,
  menuAberto,
  modoMultiSelecao,
  selecionado,
  onToggleSelecao
}) {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Novo': return 'text-blue-600';
      case 'Bom': return 'text-green-600';
      case 'Regular': return 'text-yellow-600';
      case 'Ruim': return 'text-orange-600';
      case 'Péssimo': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div 
      onClick={modoMultiSelecao ? onToggleSelecao : onClick}
      className={`flex items-center justify-between py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        selecionado ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {modoMultiSelecao ? (
          <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
            selecionado 
              ? 'bg-[#3b5998] border-[#3b5998]' 
              : 'bg-white border-gray-300'
          }`}>
            {selecionado && <Check className="w-4 h-4 text-white" />}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#dfe3ee] flex items-center justify-center">
            <Check className="w-4 h-4 text-[#3b5998]" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{item.nome}</p>
            {item.customizado && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Personalizado</span>
            )}
          </div>
          <p className={`text-sm ${getEstadoColor(item.estado)}`}>{item.estado}</p>
        </div>
      </div>

      {!modoMultiSelecao && (
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  );
}