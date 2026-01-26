import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, User, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AnuncioCard({ anuncio, moradores, onClick }) {
  const morador = moradores.find(m => m.id === anuncio.morador_id);
  
  const getCategoriaLabel = (categoria) => {
    const labels = {
      moveis: 'Móveis',
      eletronicos: 'Eletrônicos',
      eletrodomesticos: 'Eletrodomésticos',
      decoracao: 'Decoração',
      livros: 'Livros',
      brinquedos: 'Brinquedos',
      roupas: 'Roupas',
      servicos: 'Serviços',
      vagas_garagem: 'Vagas de Garagem',
      outros: 'Outros'
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaColor = (categoria) => {
    const colors = {
      moveis: 'bg-brown-100 text-brown-800',
      eletronicos: 'bg-blue-100 text-blue-800',
      eletrodomesticos: 'bg-purple-100 text-purple-800',
      decoracao: 'bg-pink-100 text-pink-800',
      livros: 'bg-yellow-100 text-yellow-800',
      brinquedos: 'bg-green-100 text-green-800',
      roupas: 'bg-indigo-100 text-indigo-800',
      servicos: 'bg-orange-100 text-orange-800',
      vagas_garagem: 'bg-gray-100 text-gray-800',
      outros: 'bg-slate-100 text-slate-800'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden"
        onClick={onClick}
      >
        {/* Imagem */}
        <div className="relative h-48 bg-gray-200">
          {anuncio.imagens && anuncio.imagens.length > 0 ? (
            <img 
              src={anuncio.imagens[0]} 
              alt={anuncio.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <MapPin className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* Badge de categoria */}
          <div className="absolute top-3 left-3">
            <Badge className={`${getCategoriaColor(anuncio.categoria)} border-0 shadow-md`}>
              {getCategoriaLabel(anuncio.categoria)}
            </Badge>
          </div>

          {/* Visualizações */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Eye className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">{anuncio.visualizacoes || 0}</span>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Título */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
            {anuncio.titulo}
          </h3>

          {/* Valor */}
          <div className="text-2xl font-bold text-blue-600 mb-3">
            R$ {anuncio.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>

          {/* Descrição */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {anuncio.descricao}
          </p>

          {/* Info do anunciante */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="line-clamp-1">{morador?.nome || 'Anunciante'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(anuncio.created_date), 'dd/MM', { locale: ptBR })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}