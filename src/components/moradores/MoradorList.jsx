import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, User, MapPin, Mail, Phone, Eye, Loader2 } from "lucide-react";

export default function MoradorList({ moradores, residencias, onEdit, onView, onDelete, loading, userType, isPorteiro }) {
  const getResidenciaInfo = (residenciaId) => {
    const residencia = residencias.find(r => r.id === residenciaId);
    return residencia 
      ? `${residencia.identificador_principal}${residencia.complemento ? ', ' + residencia.complemento : ''}`
      : "Não encontrado";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
      case 'inativo': return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoUsuarioColor = (tipo) => {
    switch (tipo) {
      case 'administrador': return 'bg-[#3b5998] text-white border-[#3b5998]';
      case 'porteiro': return 'bg-[#8b9dc3] text-white border-[#8b9dc3]';
      case 'morador': return 'bg-[#dfe3ee] text-[#3b5998] border-[#dfe3ee]';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatWhatsAppNumber = (telefone) => {
    if (!telefone) return null;
    const numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length < 10) return null;
    if (!numeroLimpo.startsWith('55')) {
      return `55${numeroLimpo}`;
    }
    return numeroLimpo;
  };

  const handleWhatsAppClick = (telefone, nomeMorador) => {
    const numeroFormatado = formatWhatsAppNumber(telefone);
    
    if (!numeroFormatado) {
      alert(`${nomeMorador} não possui número de WhatsApp cadastrado ou o número é inválido.`);
      return;
    }
    
    window.open(`https://wa.me/${numeroFormatado}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  if (moradores.length === 0) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 text-[#dfe3ee] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#3b5998]">
            Nenhum morador encontrado
          </h3>
          <p className="text-[#8b9dc3] mt-2">
            {isPorteiro ? 'Nenhum morador cadastrado no momento' : 'Adicione moradores para começar a gerenciar o condomínio'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {moradores.map((morador) => (
        <Card key={morador.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-[#3b5998] to-[#8b9dc3] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {morador.nome.charAt(0).toUpperCase()}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#3b5998] mb-1">
                      {morador.nome}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={getTipoUsuarioColor(morador.tipo_usuario)}>
                        {morador.tipo_usuario}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(morador.status)}>
                        {morador.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Botão WhatsApp */}
                  {formatWhatsAppNumber(morador.telefone) && (
                    <button
                      onClick={() => handleWhatsAppClick(morador.telefone, morador.nome)}
                      className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-md hover:bg-[#1fb355] hover:scale-110 transition-all duration-200 flex-shrink-0"
                      title={`Abrir WhatsApp com ${morador.nome}`}
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Informações */}
                <div className="space-y-1 text-sm text-[#8b9dc3]">
                  {morador.abreviacao && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-[#3b5998]">{morador.abreviacao}</span>
                    </div>
                  )}
                  {morador.endereco && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{morador.endereco}{morador.complemento && `, ${morador.complemento}`}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{morador.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{morador.telefone || "Não informado"}</span>
                    {!formatWhatsAppNumber(morador.telefone) && morador.telefone && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                        Número inválido
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#dfe3ee]">
                  {isPorteiro ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(morador)}
                      className="flex-1 text-[#3b5998] border-[#3b5998] hover:bg-[#3b5998] hover:text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(morador)}
                        className="flex-1 text-[#3b5998] border-[#3b5998] hover:bg-[#3b5998] hover:text-white"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(morador)}
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}