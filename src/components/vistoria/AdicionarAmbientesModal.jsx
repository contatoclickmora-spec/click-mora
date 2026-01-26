import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { motion } from 'framer-motion';

const ambientesDisponiveis = [
  'Banheiro', 'Closet', 'Cozinha', 'Dormitório', 'Escritório', 'Fachada',
  'Garagem', 'Jardim', 'Lavabo', 'Lavanderia', 'Piscina', 'Quintal',
  'Rede elétrica', 'Rede hidráulica', 'Sacada', 'Sala', 'Sala de jantar', 'Suíte'
];

export default function AdicionarAmbientesModal({ onClose, onSalvar, ambientesExistentes = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [novoAmbiente, setNovoAmbiente] = useState('');

  const ambientesFiltrados = ambientesDisponiveis.filter(
    amb => amb.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !ambientesExistentes.includes(amb)
  );

  const toggleAmbiente = (ambiente) => {
    if (selecionados.includes(ambiente)) {
      setSelecionados(selecionados.filter(a => a !== ambiente));
    } else {
      setSelecionados([...selecionados, ambiente]);
    }
  };

  const handleSalvar = () => {
    const todosAmbientes = [...selecionados];
    
    if (novoAmbiente.trim() && !todosAmbientes.includes(novoAmbiente.trim())) {
      todosAmbientes.push(novoAmbiente.trim());
    }

    if (todosAmbientes.length === 0) {
      alert('Selecione pelo menos um ambiente');
      return;
    }

    onSalvar(todosAmbientes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Ambientes disponíveis</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Campo de Busca */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar ambiente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-full border-2"
              />
            </div>

            {/* Lista de Ambientes em Chips */}
            <div className="flex flex-wrap gap-3 mb-6">
              {ambientesFiltrados.map((ambiente) => (
                <Badge
                  key={ambiente}
                  onClick={() => toggleAmbiente(ambiente)}
                  className={`px-4 py-2 text-sm font-medium cursor-pointer transition-all ${
                    selecionados.includes(ambiente)
                      ? 'bg-[#3b5998] text-white hover:bg-[#2d4373]'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: selecionados.includes(ambiente) ? '#3b5998' : '#e5e7eb'
                  }}
                >
                  {ambiente}
                </Badge>
              ))}
            </div>

            {/* Adicionar Ambiente Personalizado */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionar novo ambiente
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o nome do ambiente..."
                  value={novoAmbiente}
                  onChange={(e) => setNovoAmbiente(e.target.value)}
                  maxLength={150}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 self-center">{novoAmbiente.length}/150</span>
              </div>
            </div>

            {/* Contador de Selecionados */}
            {selecionados.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  {selecionados.length} ambiente(s) selecionado(s)
                </p>
              </div>
            )}

            {/* Botão de Salvar Fixo */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50">
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#4a4a4a' }}
                >
                  <span className="text-white text-xl font-bold">{selecionados.length}</span>
                </div>
                <Button
                  onClick={handleSalvar}
                  className="flex-1 h-14 text-lg font-semibold"
                  style={{ backgroundColor: '#4a4a4a' }}
                  disabled={selecionados.length === 0 && !novoAmbiente.trim()}
                >
                  Salvar ambientes
                </Button>
              </div>
            </div>

            {/* Espaço para o botão fixo */}
            <div className="h-20"></div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}