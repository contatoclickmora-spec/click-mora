import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from 'framer-motion';

const AMBIENTES_PADRAO = [
  'Banheiro',
  'Closet',
  'Cozinha',
  'Dormitório',
  'Escritório',
  'Fachada',
  'Garagem',
  'Jardim',
  'Lavabo',
  'Lavanderia',
  'Piscina',
  'Quintal',
  'Rede elétrica',
  'Rede hidráulica',
  'Sacada',
  'Sala',
  'Sala de jantar',
  'Suíte'
];

export default function SelecionarAmbientesModal({ 
  isOpen, 
  onClose, 
  onSave, 
  ambientesSelecionados = [] 
}) {
  const [selecionados, setSelecionados] = useState([]);
  const [busca, setBusca] = useState('');
  const [novoAmbiente, setNovoAmbiente] = useState('');
  const [ambientesCustomizados, setAmbientesCustomizados] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Separar ambientes selecionados em padrão e customizados
      const customizados = ambientesSelecionados.filter(
        amb => !AMBIENTES_PADRAO.includes(amb)
      );
      setAmbientesCustomizados(customizados);
      setSelecionados([...ambientesSelecionados]);
    }
  }, [isOpen, ambientesSelecionados]);

  const todosAmbientes = [...AMBIENTES_PADRAO, ...ambientesCustomizados];

  const ambientesFiltrados = todosAmbientes.filter(amb =>
    amb.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleAmbiente = (ambiente) => {
    setSelecionados(prev => 
      prev.includes(ambiente)
        ? prev.filter(a => a !== ambiente)
        : [...prev, ambiente]
    );
  };

  const handleAdicionarNovo = () => {
    const nome = novoAmbiente.trim();
    if (nome && nome.length <= 150 && !todosAmbientes.includes(nome)) {
      setAmbientesCustomizados(prev => [...prev, nome]);
      setSelecionados(prev => [...prev, nome]);
      setNovoAmbiente('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdicionarNovo();
    }
  };

  const handleSalvar = () => {
    onSave(selecionados);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#f7f7f7] flex flex-col"
    >
      {/* Header */}
      <div 
        className="flex items-center h-14 px-4 shadow-md"
        style={{ backgroundColor: '#3b5998' }}
      >
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1 text-center pr-8">
          <h1 className="text-lg font-semibold text-white">Ambientes disponíveis</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {/* Campo de busca */}
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Buscar ambiente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-gray-300 bg-white focus:border-[#3b5998] focus:ring-0"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Lista de chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ambientesFiltrados.map((ambiente) => {
            const isSelecionado = selecionados.includes(ambiente);
            return (
              <button
                key={ambiente}
                onClick={() => toggleAmbiente(ambiente)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isSelecionado
                    ? 'bg-[#3b5998] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#3b5998]'
                }`}
              >
                {ambiente}
              </button>
            );
          })}
        </div>

        {/* Campo para adicionar novo ambiente */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Adicionar novo ambiente..."
            value={novoAmbiente}
            onChange={(e) => setNovoAmbiente(e.target.value.slice(0, 150))}
            onKeyPress={handleKeyPress}
            className="w-full pl-4 pr-16 py-3 rounded-full border-2 border-gray-300 bg-white focus:border-[#3b5998] focus:ring-0"
          />
          {novoAmbiente.trim() && (
            <button
              onClick={handleAdicionarNovo}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#3b5998] text-white rounded-full hover:bg-[#2d4373] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">
          {novoAmbiente.length}/150
        </p>
      </div>

      {/* Botão Salvar */}
      <div className="p-4 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <Button
          onClick={handleSalvar}
          className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-6 rounded-full text-lg font-medium"
        >
          Salvar ({selecionados.length} {selecionados.length === 1 ? 'ambiente' : 'ambientes'})
        </Button>
      </div>
    </motion.div>
  );
}