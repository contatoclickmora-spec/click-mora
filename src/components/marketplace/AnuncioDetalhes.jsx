import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AnuncioDetalhes({ anuncio, moradores, onVoltar, isSindico = false }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [vendedor, setVendedor] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const seller = moradores.find(m => m.id === anuncio.morador_id);
    setVendedor(seller);

    // Incrementar visualizações
    const incrementViews = async () => {
      try {
        await base44.entities.Anuncio.update(anuncio.id, {
          visualizacoes: (anuncio.visualizacoes || 0) + 1
        });
      } catch (err) {
        console.error("Erro ao incrementar visualizações:", err);
      }
    };
    incrementViews();
  }, [anuncio, moradores]);

  const formatPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleWhatsApp = () => {
    if (!vendedor || !vendedor.telefone) {
      alert("WhatsApp do vendedor não disponível");
      return;
    }

    const phoneNumber = vendedor.telefone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Vi seu anúncio "${anuncio.titulo}" no Marketplace e tenho interesse.`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === anuncio.imagens.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? anuncio.imagens.length - 1 : prev - 1
    );
  };

  const descricaoLonga = anuncio.descricao.length > 200;
  const descricaoExibida = showFullDescription || !descricaoLonga
    ? anuncio.descricao
    : anuncio.descricao.substring(0, 200) + '...';

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Excluir anúncio
      await base44.entities.Anuncio.update(anuncio.id, {
        status: 'removido'
      });

      // Criar chamado notificando o morador
      if (vendedor) {
        await base44.entities.Chamado.create({
          morador_id: vendedor.id,
          criado_por_id: vendedor.id,
          criado_por_nome: 'Sistema',
          criado_por_tipo: 'administrador',
          tipo: 'sugestao',
          titulo: 'Anúncio removido pelo síndico',
          descricao: `Olá ${vendedor.nome},\n\nSeu anúncio "${anuncio.titulo}" foi removido pelo síndico do condomínio.\n\nSe tiver dúvidas, entre em contato com a administração.`,
          destinatario: 'morador',
          status: 'aberto'
        });
      }

      onVoltar();
    } catch (err) {
      console.error("Erro ao excluir anúncio:", err);
      alert("Erro ao excluir anúncio. Tente novamente.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-start justify-between py-6 px-4 max-w-2xl mx-auto">
          <button
            onClick={onVoltar}
            className="p-2 active:bg-gray-100 rounded-full transition-colors -ml-2 mt-2"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          
          {isSindico && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 active:bg-red-50 rounded-full transition-colors mt-2"
            >
              <Trash2 className="w-6 h-6 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-black">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={anuncio.imagens[currentImageIndex]}
            alt={anuncio.titulo}
            className="w-full h-72 object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {anuncio.imagens.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 active:bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 active:bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-900" />
            </button>

            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
              {anuncio.imagens.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 w-1.5'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-3 max-w-2xl mx-auto pb-20">
        {/* Preço e Título */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {formatPreco(anuncio.valor)}
          </h1>
          <h2 className="text-base text-gray-800 leading-snug">
            {anuncio.titulo}
          </h2>
        </div>

        {/* WhatsApp Button */}
        <Button
          onClick={handleWhatsApp}
          className="w-full h-11 bg-[#25D366] active:bg-[#20BA5A] text-white mb-3 text-sm font-semibold"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Enviar mensagem
        </Button>

        {/* Descrição */}
        <Card className="mb-3">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Descrição</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {descricaoExibida}
            </p>
            {descricaoLonga && !showFullDescription && (
              <button
                onClick={() => setShowFullDescription(true)}
                className="text-[#3b5998] font-medium mt-2 text-sm active:underline"
              >
                Ver mais
              </button>
            )}
          </CardContent>
        </Card>

        {/* Informações do Vendedor */}
        {vendedor && (
          <Card className="mb-3">
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Vendedor</h3>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#3b5998] rounded-full flex items-center justify-center text-white font-bold text-base">
                  {vendedor.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{vendedor.nome}</p>
                  {vendedor.apelido_endereco && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vendedor.apelido_endereco}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{anuncio.visualizacoes || 0} visualizações</span>
              </div>
              <Badge variant="outline" className="bg-gray-50 text-xs">
                {anuncio.categoria.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio será removido e o morador será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}