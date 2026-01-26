import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, User, Mail, Phone, MapPin, Calendar as CalendarIcon, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VisualizarMoradorModal({ morador, residencias, onClose }) {
  const getResidenciaInfo = (residenciaId) => {
    const residencia = residencias.find(r => r.id === residenciaId);
    return residencia 
      ? `${residencia.identificador_principal}${residencia.complemento ? ', ' + residencia.complemento : ''}`
      : "Não cadastrado";
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

  const getTipoUsuarioLabel = (tipo) => {
    switch (tipo) {
      case 'administrador': return 'Síndico/Administrador';
      case 'porteiro': return 'Porteiro';
      case 'morador': return 'Morador';
      default: return tipo;
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#dfe3ee] bg-[#3b5998] text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            Detalhes do Morador
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-[#8b9dc3]">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#3b5998] to-[#8b9dc3] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#3b5998]">{morador.nome}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={getTipoUsuarioColor(morador.tipo_usuario)}>
                    {getTipoUsuarioLabel(morador.tipo_usuario)}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(morador.status)}>
                    {morador.status}
                  </Badge>
                </div>
              </div>
              
              {/* Botão WhatsApp */}
              {formatWhatsAppNumber(morador.telefone) && (
                <button
                  onClick={handleWhatsAppClick}
                  className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1fb355] hover:scale-110 transition-all duration-200"
                  title={`Abrir WhatsApp com ${morador.nome}`}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Endereço */}
          {morador.tipo_usuario !== 'administrador' && (
            <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
              <h3 className="font-semibold text-[#3b5998] mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </h3>
              <div className="space-y-2 text-sm text-[#8b9dc3]">
                {morador.abreviacao && (
                  <div>
                    <strong className="text-[#3b5998]">Abreviação:</strong> {morador.abreviacao}
                  </div>
                )}
                {morador.endereco && (
                  <div>
                    <strong className="text-[#3b5998]">Endereço Principal:</strong> {morador.endereco}
                  </div>
                )}
                {morador.complemento && (
                  <div>
                    <strong className="text-[#3b5998]">Complemento:</strong> {morador.complemento}
                  </div>
                )}
                {morador.residencia_id && (
                  <div>
                    <strong className="text-[#3b5998]">Residência:</strong> {getResidenciaInfo(morador.residencia_id)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contato */}
          <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
            <h3 className="font-semibold text-[#3b5998] mb-3">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-[#8b9dc3]" />
                <div className="flex-1">
                  <p className="text-xs text-[#8b9dc3]">Email</p>
                  <p className="text-[#3b5998] font-medium">{morador.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-[#8b9dc3]" />
                <div className="flex-1">
                  <p className="text-xs text-[#8b9dc3]">Telefone</p>
                  <p className="text-[#3b5998] font-medium">{morador.telefone || "Não informado"}</p>
                  {!formatWhatsAppNumber(morador.telefone) && morador.telefone && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 mt-1">
                      Número inválido para WhatsApp
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
            <h3 className="font-semibold text-[#3b5998] mb-3">Informações do Sistema</h3>
            <div className="space-y-2 text-sm text-[#8b9dc3]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span><strong className="text-[#3b5998]">Cadastrado em:</strong> {format(new Date(morador.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {morador.data_aprovacao && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong className="text-[#3b5998]">Aprovado em:</strong> {format(new Date(morador.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              )}
              {morador.created_by && (
                <div>
                  <strong className="text-[#3b5998]">Cadastrado por:</strong> {morador.created_by}
                </div>
              )}
            </div>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t border-[#dfe3ee]">
            <Button onClick={onClose} className="bg-[#3b5998] hover:bg-[#8b9dc3] text-white">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}