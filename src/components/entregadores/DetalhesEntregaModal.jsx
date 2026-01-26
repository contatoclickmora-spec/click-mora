import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Truck, Building, User, Package, Clock, Calendar, Phone, FileText, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DetalhesEntregaModal({ registro, entregador, onClose }) {
  if (!entregador) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Detalhes da Entrega
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Info do Entregador */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{entregador.nome}</h3>
                {entregador.origem && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {entregador.origem}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {entregador.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span><strong>Telefone:</strong> {entregador.telefone}</span>
                </div>
              )}
              {entregador.documento && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span><strong>Documento:</strong> {entregador.documento}</span>
                </div>
              )}
              {entregador.placa_veiculo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                    🚗 {entregador.placa_veiculo}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info da Entrega */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Informações da Entrega
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-400" />
                <span><strong>Quantidade:</strong> {registro.quantidade_pacotes} {registro.quantidade_pacotes === 1 ? 'pacote' : 'pacotes'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span><strong>Data:</strong> {format(parseISO(registro.data_registro), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span><strong>Horário:</strong> {format(parseISO(registro.data_registro), 'HH:mm', { locale: ptBR })}</span>
              </div>
              
              {registro.porteiro_responsavel && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span><strong>Registrado por:</strong> {registro.porteiro_responsavel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fotos */}
          {registro.fotos_encomendas && registro.fotos_encomendas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Fotos da Entrega ({registro.fotos_encomendas.length})
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {registro.fotos_encomendas.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Foto ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => window.open(url, '_blank')}
                    />
                    <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-xs">
                      Foto {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}