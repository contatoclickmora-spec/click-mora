import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  ClipboardCheck,
  UserCheck,
  Calendar,
  Eye,
  MapPin,
  Trash2
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function ImovelCard({ imovel, vistorias, inquilino, onNovaVistoria, onGerenciarInquilino, onExcluir }) {
  const navigate = useNavigate();
  const ultimaVistoria = vistorias[0];
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'Vazio': return 'bg-gray-100 text-gray-700';
      case 'Alugado': return 'bg-green-100 text-green-700';
      case 'Manutenção': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCardClick = () => {
    console.log('[IMOVEL CARD] Navegando para imóvel:', imovel.id);
    try {
      navigate(`/DetalhesImovelVistoria/${imovel.id}`);
    } catch (err) {
      console.error('[IMOVEL CARD] Erro ao navegar:', err);
      // Fallback: tentar recarregar a página diretamente
      window.location.href = `/DetalhesImovelVistoria/${imovel.id}`;
    }
  };

  return (
    <Card 
      className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-[#3b5998]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-[#3b5998]" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{imovel.titulo}</h3>
              {onExcluir && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExcluir(imovel);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir imóvel"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{imovel.subtitulo}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {imovel.tipo}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {imovel.mobiliado}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(imovel.status)}`}>
                {imovel.status}
              </Badge>
            </div>

            {imovel.endereco_completo && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                <span>
                  {imovel.endereco_completo.cidade}, {imovel.endereco_completo.estado}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-[#f7f7f7] rounded-lg p-3 mb-3 space-y-2">
          {inquilino && (
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-[#3b5998]" />
              <span className="text-gray-700">
                <strong>Inquilino:</strong> {inquilino.nome_completo}
              </span>
            </div>
          )}
          
          {ultimaVistoria && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#3b5998]" />
              <span className="text-gray-700">
                <strong>Última vistoria:</strong> {format(new Date(ultimaVistoria.data_vistoria), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="w-4 h-4 text-[#3b5998]" />
            <span className="text-gray-700">
              <strong>Vistorias:</strong> {vistorias.length} registrada{vistorias.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onNovaVistoria();
            }}
            className="flex-1 bg-[#3b5998] hover:bg-[#2d4373]"
            size="sm"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Nova Vistoria
          </Button>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onGerenciarInquilino();
            }}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Inquilino
          </Button>
        </div>

        {vistorias.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-2 text-[#3b5998]"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/DetalhesImovelVistoria/${imovel.id}?tab=vistorias`);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Todas as Vistorias ({vistorias.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}