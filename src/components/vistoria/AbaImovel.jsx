import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Image as ImageIcon, 
  Video, 
  Building2, 
  Armchair, 
  Ruler, 
  MapPin,
  Edit,
  Copy,
  Trash2
} from "lucide-react";

export default function AbaImovel({ imovel, vistoria, moradorLogado }) {
  const inicial = imovel.titulo.charAt(0).toUpperCase();
  const tipoVistoria = vistoria?.tipo_vistoria || 'Entrada';
  
  const totalFotos = (imovel.fotos_imovel?.length || 0) + 
                    (vistoria?.ambientes?.reduce((acc, amb) => acc + (amb.fotos?.length || 0), 0) || 0);
  
  const totalVideos = 0;

  const endereco = imovel.endereco_completo 
    ? `${imovel.endereco_completo.logradouro}, ${imovel.endereco_completo.numero}${imovel.endereco_completo.complemento ? ', ' + imovel.endereco_completo.complemento : ''}`
    : 'Endereço não informado';

  const enderecoCompleto = imovel.endereco_completo 
    ? `${imovel.endereco_completo.logradouro}, ${imovel.endereco_completo.numero}${imovel.endereco_completo.complemento ? ', ' + imovel.endereco_completo.complemento : ''}, ${imovel.endereco_completo.bairro}, ${imovel.endereco_completo.cidade} - ${imovel.endereco_completo.estado}`
    : 'Endereço não informado';

  const dataVistoria = vistoria?.created_date ? new Date(vistoria.created_date) : new Date();
  const mes = dataVistoria.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
  const dia = dataVistoria.getDate();
  const horario = dataVistoria.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-0">
      {/* Card Principal - Visual Novo */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden mb-6">
        <CardContent className="p-0">
          {/* Cabeçalho do Card */}
          <div className="bg-white p-6 relative">
            <div className="flex items-start gap-4">
              {/* Ícone Grande */}
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#6b6b6b' }}
              >
                <span className="text-white text-5xl font-bold">{inicial}</span>
              </div>

              {/* Informações Principais */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {imovel.titulo}
                </h2>
                
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{endereco}</span>
                </div>

                <div className="text-sm">
                  <span className="text-gray-600">Tipo: </span>
                  <span className="font-bold text-gray-900">{tipoVistoria}</span>
                </div>
              </div>

              {/* Badge de Data */}
              <div 
                className="absolute top-4 right-4 bg-[#FFA500] rounded-xl px-4 py-3 text-center shadow-lg min-w-[80px]"
              >
                <div className="text-white text-xs font-bold uppercase">{mes}</div>
                <div className="text-white text-3xl font-bold leading-none">{dia}</div>
                <div className="text-white text-xs mt-1">{horario}</div>
              </div>
            </div>

            {/* Linha Divisória */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-around">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Edit className="w-5 h-5" />
                <span className="font-medium">Editar</span>
              </button>

              <div className="w-px h-8 bg-gray-200"></div>

              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Copy className="w-5 h-5" />
                <span className="font-medium">Duplicar</span>
              </button>

              <div className="w-px h-8 bg-gray-200"></div>

              <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Remover</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Detalhadas */}
      <div className="space-y-4">
        {/* Informações do Vistoriador */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#3b5998]" />
              <div>
                <span className="text-gray-600 text-sm">Vistoriador: </span>
                <span className="text-gray-900 font-medium">{moradorLogado?.nome || 'Não informado'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-[#3b5998]" />
              <div>
                <span className="text-gray-600 text-sm">Total de Fotos: </span>
                <span className="text-gray-900 font-medium">{totalFotos}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-[#3b5998]" />
              <div>
                <span className="text-gray-600 text-sm">Total de Vídeos: </span>
                <span className="text-gray-900 font-medium">{totalVideos}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#3b5998]" />
              <div>
                <span className="text-gray-600 text-sm">Imobiliária: </span>
                <span className="text-gray-900 font-medium">Sem empresa</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Características do Imóvel */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Armchair className="w-5 h-5 text-[#3b5998]" />
              <div>
                <span className="text-gray-600 text-sm">Mobília: </span>
                <span className="text-gray-900 font-medium">{imovel.mobiliado}</span>
              </div>
            </div>

            {imovel.metragem && (
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5 text-[#3b5998]" />
                <div>
                  <span className="text-gray-600 text-sm">Metragem: </span>
                  <span className="text-gray-900 font-medium">{imovel.metragem} M²</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endereço Completo */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#3b5998] mt-0.5 flex-shrink-0" />
              <p className="text-gray-900 font-medium flex-1">{enderecoCompleto}</p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {imovel.observacoes_gerais && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Observações</h3>
              <p className="text-gray-600 text-sm">{imovel.observacoes_gerais}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}