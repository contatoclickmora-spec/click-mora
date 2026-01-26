import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Package, ArrowLeft } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DetalhesEncomenda({ encomenda, onClose }) {
  const [moradorDados, setMoradorDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMorador = async () => {
      if (!encomenda || !encomenda.morador_id) {
        setLoading(false);
        return;
      }

      try {
        console.log("[DETALHES ENCOMENDA] Carregando morador:", encomenda.morador_id);
        const todosMoradores = await base44.entities.Morador.list();
        const morador = todosMoradores.find(m => m.id === encomenda.morador_id);
        
        if (morador) {
          console.log("[DETALHES ENCOMENDA] ✅ Morador carregado:", morador.nome);
          setMoradorDados(morador);
        } else {
          console.warn("[DETALHES ENCOMENDA] ⚠️ Morador não encontrado");
        }
      } catch (err) {
        console.error('[DETALHES ENCOMENDA] ❌ Erro ao carregar morador:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMorador();
  }, [encomenda]);

  if (!encomenda) {
    console.error("[DETALHES ENCOMENDA] Encomenda não fornecida");
    return null;
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'aguardando': return 'Pendente';
      case 'retirada': return 'Retirada';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'aguardando': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'retirada': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTipoUsuarioLabel = (tipo) => {
    switch(tipo) {
      case 'morador': return 'Morador';
      case 'porteiro': return 'Porteiro';
      case 'administrador': return 'Síndico';
      default: return 'Usuário';
    }
  };

  const qrData = JSON.stringify({
    type: 'encomenda_retirada',
    codigo: encomenda.codigo,
    encomenda_id: encomenda.id,
    timestamp: new Date().toISOString()
  });
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start md:items-center justify-center z-50 overflow-y-auto">
      <div className="w-full md:max-w-2xl md:my-8">
        <Card className="w-full md:rounded-xl rounded-none min-h-screen md:min-h-0">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-blue-50 to-indigo-50 py-8 px-4 sticky top-0 z-10">
            <div className="flex-1 flex items-center justify-center mt-6">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
                <Package className="w-7 h-7" />
                Detalhes da Encomenda
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 absolute right-4 mt-6">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6 bg-[#f7f7f7]">
            {/* QR Code Grande */}
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-8">
                <div className="flex justify-center mb-4">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code da Encomenda" 
                    className="w-[300px] h-[300px]"
                    style={{ width: '300px', height: '300px', display: 'block' }}
                  />
                </div>
                <p className="text-center text-base font-bold text-gray-900 mb-1">Código</p>
                <p className="text-center text-2xl font-bold text-gray-400 tracking-wider">
                  {encomenda.codigo}
                </p>
              </CardContent>
            </Card>

            {/* Informações em Cards Separados */}
            <div className="space-y-3">
              {/* Código */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Código</p>
                <p className="text-lg font-bold text-gray-900">{encomenda.codigo}</p>
              </div>

              {/* Cadastrada em */}
              {encomenda.data_entrada && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Cadastrada em</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(parseISO(encomenda.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Cadastrada por */}
              {encomenda.porteiro_entrada && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Cadastrada por</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
                      {getInitials(encomenda.porteiro_entrada)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{encomenda.porteiro_entrada}</p>
                      <p className="text-sm text-gray-500">Proprietário, Morador, Síndico Comunicação</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Última atualização */}
              {encomenda.data_retirada && encomenda.status === 'retirada' ? (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Última atualização</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(parseISO(encomenda.data_retirada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ) : encomenda.data_entrada && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Última atualização</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(parseISO(encomenda.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Observações */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Observações</p>
                <p className="text-lg font-bold text-gray-900">
                  {encomenda.observacoes || '-'}
                </p>
              </div>
            </div>

            {/* Foto da Encomenda - Largura Total */}
            {encomenda.foto_encomenda && (
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src={encomenda.foto_encomenda} 
                    alt="Foto da encomenda"
                    className="w-full h-auto object-cover cursor-pointer"
                    onClick={() => window.open(encomenda.foto_encomenda, '_blank')}
                  />
                </CardContent>
              </Card>
            )}

            {/* Botão Voltar */}
            <div className="pt-4">
              <Button onClick={onClose} className="w-full h-12 text-base font-medium bg-[#3b5998] hover:bg-[#2d4373]">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}