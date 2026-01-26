import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Phone,
  Package,
  Calendar,
  User,
  Building2,
  FileText
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DetalhesEntrega({ registro, onVoltar }) {
  const handleWhatsApp = () => {
    if (!registro.entregador_telefone) return;
    
    // Remover formatação do telefone
    const telefone = registro.entregador_telefone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    const telefoneCompleto = telefone.startsWith('55') ? telefone : `55${telefone}`;
    
    // Abrir WhatsApp
    window.open(`https://wa.me/${telefoneCompleto}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-[#3b5998] text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button onClick={onVoltar} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Detalhes da Entrega</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Fotos dos Pacotes */}
        {registro.fotos_pacotes && registro.fotos_pacotes.length > 0 && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-2 p-2">
                {registro.fotos_pacotes.map((foto, index) => (
                  <img
                    key={index}
                    src={foto}
                    alt={`Pacote ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Entregador */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Entregador</h2>
            
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#3b5998]" />
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="text-base font-semibold text-gray-900">{registro.entregador_nome}</p>
              </div>
            </div>

            {registro.entregador_telefone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#3b5998]" />
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-base font-semibold text-gray-900">{registro.entregador_telefone}</p>
                </div>
              </div>
            )}

            {registro.entregador_empresa && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#3b5998]" />
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="text-base font-semibold text-gray-900">{registro.entregador_empresa}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Entrega */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações da Entrega</h2>
            
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#3b5998]" />
              <div>
                <p className="text-xs text-gray-500">Quantidade de Pacotes</p>
                <p className="text-base font-semibold text-gray-900">
                  {registro.quantidade_pacotes} {registro.quantidade_pacotes === 1 ? 'pacote' : 'pacotes'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#3b5998]" />
              <div>
                <p className="text-xs text-gray-500">Data e Hora do Registro</p>
                <p className="text-base font-semibold text-gray-900">
                  {format(parseISO(registro.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#3b5998]" />
              <div>
                <p className="text-xs text-gray-500">Registrado por</p>
                <p className="text-base font-semibold text-gray-900">{registro.porteiro_responsavel}</p>
              </div>
            </div>

            {registro.observacoes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#3b5998] mt-1" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Observações</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{registro.observacoes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão WhatsApp */}
        {registro.entregador_telefone && (
          <Button
            onClick={handleWhatsApp}
            className="w-full h-14 bg-[#25D366] hover:bg-[#1ea952] text-white rounded-full text-lg font-semibold shadow-md"
          >
            <Phone className="w-5 h-5 mr-2" />
            Falar com entregador
          </Button>
        )}
      </div>
    </div>
  );
}