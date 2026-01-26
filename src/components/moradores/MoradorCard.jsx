import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin } from "lucide-react";

export default function MoradorCard({ morador, residencias, onView }) {
  const residencia = residencias?.find(r => r.id === morador.residencia_id);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inativo':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'porteiro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'morador':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'administrador':
        return 'Síndico';
      case 'porteiro':
        return 'Porteiro';
      case 'morador':
        return 'Morador';
      default:
        return tipo;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-gray-100 hover:border-[#3b5998]"
      onClick={() => onView(morador)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Foto de Perfil */}
          <div className="flex-shrink-0">
            {morador.foto_url ? (
              <img
                src={morador.foto_url}
                alt={morador.nome}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#dfe3ee] flex items-center justify-center border-2 border-gray-200">
                <span className="text-[#3b5998] font-bold text-xl">
                  {getInitials(morador.nome)}
                </span>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {morador.nome}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={getTipoColor(morador.tipo_usuario)}>
                {getTipoLabel(morador.tipo_usuario)}
              </Badge>
              <Badge variant="outline" className={getStatusColor(morador.status)}>
                {morador.status}
              </Badge>
            </div>

            {/* Contatos */}
            <div className="space-y-1.5 text-sm">
              {morador.telefone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{morador.telefone}</span>
                </div>
              )}

              {morador.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{morador.email}</span>
                </div>
              )}

              {/* Endereço */}
              {(morador.endereco || morador.abreviacao) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {morador.endereco || morador.abreviacao}
                    {morador.complemento && `, ${morador.complemento}`}
                  </span>
                </div>
              )}

              {morador.abreviacao && morador.endereco && (
                <div className="text-xs text-gray-500 ml-6">
                  Busca: {morador.abreviacao}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}