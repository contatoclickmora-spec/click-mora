import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, User, Mail, Phone, MapPin, Building2, Calendar, Edit, Trash2, MessageCircle } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DetalhesMoradorModal({ morador, residencias, onClose, onEdit, onDelete }) {
  if (!morador) return null;

  const residencia = residencias.find(r => r.id === morador.residencia_id);

  const getTipoLabel = (tipo) => {
    switch(tipo) {
      case 'morador': return 'Morador';
      case 'porteiro': return 'Porteiro';
      case 'administrador': return 'Síndico/Administrador';
      default: return tipo;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-300';
      case 'inativo': return 'bg-red-100 text-red-800 border-red-300';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'pendente': return 'Pendente de Aprovação';
      default: return status;
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

  const handleWhatsAppClick = () => {
    const numeroFormatado = formatWhatsAppNumber(morador.telefone);
    
    if (!numeroFormatado) {
      alert(`${morador.nome} não possui número de WhatsApp cadastrado ou o número é inválido.`);
      return;
    }
    
    window.open(`https://wa.me/${numeroFormatado}`, '_blank', 'noopener,noreferrer');
  };

  const temWhatsApp = formatWhatsAppNumber(morador.telefone);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b bg-gradient-to-r from-[#3b5998]/10 to-[#8b9dc3]/10 sticky top-0 z-10 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#3b5998]">
              <User className="w-5 h-5" />
              Informações Completas
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Avatar e Nome */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3b5998] to-[#8b9dc3] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {morador.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{morador.nome}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm">
                  {getTipoLabel(morador.tipo_usuario)}
                </Badge>
                <Badge className={getStatusColor(morador.status)}>
                  {getStatusLabel(morador.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Contato
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-lg">
              <Mail className="w-5 h-5 text-[#3b5998] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">E-mail</p>
                <p className="text-sm font-medium text-gray-900 break-all">{morador.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-lg">
              <Phone className="w-5 h-5 text-[#3b5998] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="text-sm font-medium text-gray-900">{morador.telefone}</p>
              </div>
              {temWhatsApp && (
                <Button
                  onClick={handleWhatsAppClick}
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#1fb355] text-white flex-shrink-0"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>

          {/* Endereço */}
          {morador.tipo_usuario !== 'porteiro' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                Endereço
              </h3>
              
              {morador.endereco && (
                <div className="flex items-start gap-3 p-3 bg-[#f7f7f7] rounded-lg">
                  <MapPin className="w-5 h-5 text-[#3b5998] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Endereço Completo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {morador.endereco}
                      {morador.complemento && `, ${morador.complemento}`}
                    </p>
                  </div>
                </div>
              )}

              {morador.abreviacao && (
                <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-lg">
                  <Building2 className="w-5 h-5 text-[#3b5998] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Abreviação (para busca)</p>
                    <p className="text-sm font-medium text-gray-900">{morador.abreviacao}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Informações do Sistema */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Sistema
            </h3>
            
            {morador.created_date && (
              <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-lg">
                <Calendar className="w-5 h-5 text-[#3b5998] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Cadastrado em</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(morador.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {morador.data_aprovacao && (
              <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-lg">
                <Calendar className="w-5 h-5 text-[#3b5998] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Aprovado em</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(morador.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ações (se onEdit e onDelete forem fornecidos - apenas síndicos) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {(onEdit || onDelete) ? (
              <>
                {onEdit && (
                  <Button
                    onClick={() => {
                      onEdit(morador);
                      onClose();
                    }}
                    className="flex-1 bg-[#3b5998] hover:bg-[#2d4373]"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={() => {
                      onDelete(morador);
                      onClose();
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={onClose} variant="outline" className="w-full">
                Fechar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}