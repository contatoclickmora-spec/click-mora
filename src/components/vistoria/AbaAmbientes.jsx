import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Vistoria } from "@/entities/Vistoria";
import { Plus, Check, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import AdicionarAmbientesModal from './AdicionarAmbientesModal';

export default function AbaAmbientes({ vistoria, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [ambientes, setAmbientes] = useState(vistoria?.ambientes || []);

  const handleSalvarAmbientes = async (novosAmbientes) => {
    try {
      const ambientesAtualizados = [
        ...ambientes,
        ...novosAmbientes.map(nome => ({
          nome: nome,
          status: 'Pendente',
          checklist: [],
          fotos: [],
          observacoes: ''
        }))
      ];

      await Vistoria.update(vistoria.id, {
        ambientes: ambientesAtualizados
      });

      setAmbientes(ambientesAtualizados);
      
      if (onUpdate) {
        onUpdate({ ...vistoria, ambientes: ambientesAtualizados });
      }

      setShowModal(false);
    } catch (err) {
      console.error('[ABA AMBIENTES] Erro ao salvar:', err);
      alert('Erro ao adicionar ambientes.');
    }
  };

  const getAmbienteProgress = (ambiente) => {
    const itens = ambiente.checklist?.length || 0;
    return itens;
  };

  if (!ambientes || ambientes.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-6">
            <div className="w-48 h-48 bg-gray-100 rounded-3xl flex items-center justify-center">
              <div className="relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white border-4 border-gray-200 rounded-2xl transform -rotate-6">
                  <div className="p-3 space-y-2">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-full h-2 bg-gray-200 rounded"></div>
                    <div className="w-full h-2 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                <div className="absolute top-4 left-4 w-32 h-32 bg-white border-4 border-gray-200 rounded-2xl transform rotate-3">
                  <div className="p-3 space-y-2">
                    <div className="w-6 h-6 bg-gray-400 rounded"></div>
                    <div className="w-full h-2 bg-gray-300 rounded"></div>
                    <div className="w-full h-2 bg-gray-300 rounded"></div>
                    <div className="w-2/3 h-2 bg-gray-300 rounded"></div>
                  </div>
                </div>

                <div 
                  className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#4a4a4a' }}
                >
                  <Plus className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Adicione ambientes
          </h3>
          <p className="text-gray-500 text-sm text-center max-w-xs">
            Comece adicionando os ambientes do imóvel para realizar a vistoria
          </p>
        </div>

        {/* Botão Flutuante */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40"
          style={{ backgroundColor: '#4a4a4a' }}
        >
          <Plus className="w-8 h-8 text-white" />
        </motion.button>

        {showModal && (
          <AdicionarAmbientesModal
            onClose={() => setShowModal(false)}
            onSalvar={handleSalvarAmbientes}
            ambientesExistentes={[]}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <AnimatePresence>
          {ambientes.map((ambiente, index) => {
            const itens = getAmbienteProgress(ambiente);
            const completo = itens > 0; // Simplificado - considerar completo se tem itens

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Check Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        completo ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Check className={`w-6 h-6 ${
                          completo ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900">
                          {ambiente.nome}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Itens: {itens}
                        </p>
                      </div>

                      {/* Menu */}
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Botão Flutuante */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40"
        style={{ backgroundColor: '#4a4a4a' }}
      >
        <Plus className="w-8 h-8 text-white" />
      </motion.button>

      {showModal && (
        <AdicionarAmbientesModal
          onClose={() => setShowModal(false)}
          onSalvar={handleSalvarAmbientes}
          ambientesExistentes={ambientes.map(a => a.nome)}
        />
      )}
    </>
  );
}