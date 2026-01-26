import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Clock, Package, Building, User, Image as ImageIcon, X } from "lucide-react";
import { format, parseISO } from 'date-fns';

export default function RegistroCard({ registro, entregador }) {
  const [showPhotos, setShowPhotos] = useState(false);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col gap-4">
          {/* Info Principal */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{entregador.nome}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                  {entregador.origem && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{entregador.origem}</span>
                    </div>
                  )}
                  {entregador.telefone && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      📱 {entregador.telefone}
                    </span>
                  )}
                  {entregador.placa_veiculo && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                      🚗 {entregador.placa_veiculo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-end gap-2 md:gap-6 text-sm w-full md:w-auto">
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{registro.quantidade_pacotes} {registro.quantidade_pacotes === 1 ? 'pacote' : 'pacotes'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-medium">
                  {format(parseISO(registro.data_registro), 'HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="flex flex-wrap gap-3 pt-3 border-t">
            {/* Porteiro Responsável */}
            {registro.porteiro_responsavel && (
              <div className="flex items-center gap-2 text-sm bg-purple-50 px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4 text-purple-600" />
                <span className="text-purple-900">
                  <strong>Registrado por:</strong> {registro.porteiro_responsavel}
                </span>
              </div>
            )}

            {/* Botão para ver fotos */}
            {registro.fotos_encomendas && registro.fotos_encomendas.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPhotos(true)}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Ver Fotos ({registro.fotos_encomendas.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Fotos */}
      {showPhotos && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotos(false)}>
          <div className="relative max-w-4xl w-full bg-white rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2"
              onClick={() => setShowPhotos(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            
            <h3 className="text-xl font-bold mb-4">Fotos da Entrega</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {registro.fotos_encomendas.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`Foto ${index + 1}`} 
                    className="w-full h-auto rounded-lg border shadow-sm"
                  />
                  <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                    Foto {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}