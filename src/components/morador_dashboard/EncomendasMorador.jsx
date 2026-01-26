import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, QrCode, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function EncomendasMorador({ encomendas, moradorId }) {
  const [encomendaSelecionada, setEncomendaSelecionada] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const encomendasPendentes = encomendas.filter(e => e.status === 'aguardando');
  const historicoEncomendas = encomendas.filter(e => e.status !== 'aguardando').slice(0, 5);

  const generateQRCode = (encomenda) => {
    // Em produção, isso geraria um QR Code real
    const qrData = {
      codigo: encomenda.codigo,
      morador_id: encomenda.morador_id,
      id: encomenda.id
    };
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12">${encomenda.codigo}</text></svg>`;
  };

  const handleShowQR = (encomenda) => {
    setEncomendaSelecionada(encomenda);
    setShowQR(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Suas Encomendas</h3>
        <p className="text-gray-600">
          {encomendasPendentes.length} encomenda{encomendasPendentes.length !== 1 ? 's' : ''} aguardando retirada
        </p>
      </div>

      {/* Encomendas Pendentes */}
      {encomendasPendentes.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Para Retirar
          </h4>
          <div className="grid gap-4">
            {encomendasPendentes.map((encomenda) => (
              <Card key={encomenda.id} className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          Aguardando Retirada
                        </Badge>
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Código: {encomenda.codigo}
                      </p>
                      <p className="text-sm text-gray-600">
                        Remetente: {encomenda.remetente || 'Não informado'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Chegou em: {format(new Date(encomenda.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleShowQR(encomenda)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Ver QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {historicoEncomendas.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Últimas Retiradas
          </h4>
          <div className="space-y-3">
            {historicoEncomendas.map((encomenda) => (
              <Card key={encomenda.id} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {encomenda.codigo}
                      </p>
                      <p className="text-sm text-gray-600">
                        Retirada em: {encomenda.data_retirada 
                          ? format(new Date(encomenda.data_retirada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Data não disponível'
                        }
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Retirada
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sem encomendas */}
      {encomendas.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhuma encomenda
          </h3>
          <p className="text-gray-500">
            Você não possui encomendas no momento.
          </p>
        </div>
      )}

      {/* Modal QR Code */}
      <AnimatePresence>
        {showQR && encomendaSelecionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                QR Code para Retirada
              </h3>
              <p className="text-gray-600 mb-6">
                Mostre este código na portaria
              </p>
              
              <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-mono text-gray-600">
                      {encomendaSelecionada.codigo}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-left bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Código:</strong> {encomendaSelecionada.codigo}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Remetente:</strong> {encomendaSelecionada.remetente || 'Não informado'}
                </p>
              </div>

              <Button 
                onClick={() => setShowQR(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}