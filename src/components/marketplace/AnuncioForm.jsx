import React, { useState, useRef } from 'react';
import { Anuncio } from "@/entities/Anuncio";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categorias = [
  { value: "moveis", label: "Móveis" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "eletrodomesticos", label: "Eletrodomésticos" },
  { value: "decoracao", label: "Decoração" },
  { value: "livros", label: "Livros" },
  { value: "brinquedos", label: "Brinquedos" },
  { value: "roupas", label: "Roupas" },
  { value: "servicos", label: "Serviços" },
  { value: "vagas_garagem", label: "Vagas de Garagem" },
  { value: "outros", label: "Outros" }
];

export default function AnuncioForm({ moradorLogado, onVoltar, onSuccess }) {
  const [showCategoriaSelector, setShowCategoriaSelector] = useState(false);
  const [anuncio, setAnuncio] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    valor: '',
    imagens: []
  });
  const [valorFormatado, setValorFormatado] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (anuncio.imagens.length + files.length > 5) {
      setError('Máximo de 5 imagens por anúncio');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedImages = [];

      for (const file of files) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          setError('Formato inválido. Use: JPG, PNG ou WEBP');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setError('Imagem muito grande. Máximo 5MB');
          continue;
        }

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedImages.push(file_url);
      }

      if (uploadedImages.length > 0) {
        setAnuncio(prev => ({
          ...prev,
          imagens: [...prev.imagens, ...uploadedImages]
        }));
      }
    } catch (err) {
      console.error("Erro ao upload:", err);
      setError('Erro ao enviar imagem');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const removeImagem = (index) => {
    setAnuncio(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const formatarPreco = (valor) => {
    const numero = valor.replace(/\D/g, '');
    if (!numero) return '';
    const valorNumerico = parseInt(numero) / 100;
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleValorChange = (e) => {
    const input = e.target.value;
    const numero = input.replace(/\D/g, '');
    if (!numero) {
      setValorFormatado('');
      setAnuncio(prev => ({ ...prev, valor: '' }));
      return;
    }
    const valorNumerico = parseInt(numero) / 100;
    setValorFormatado(formatarPreco(input));
    setAnuncio(prev => ({ ...prev, valor: valorNumerico.toString() }));
  };

  const handleSubmit = async () => {
    if (!anuncio.categoria) {
      setError('Selecione uma categoria');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!anuncio.titulo.trim()) {
      setError('Informe o título');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!anuncio.valor || parseFloat(anuncio.valor) <= 0) {
      setError('Informe um valor válido');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (anuncio.imagens.length === 0) {
      setError('Adicione pelo menos uma imagem');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const phoneClean = moradorLogado.telefone.replace(/\D/g, '');
      const whatsappLink = `https://wa.me/${phoneClean}`;

      await Anuncio.create({
        morador_id: moradorLogado.id,
        condominio_id: moradorLogado.condominio_id,
        titulo: anuncio.titulo.trim(),
        descricao: anuncio.descricao.trim(),
        categoria: anuncio.categoria,
        valor: parseFloat(anuncio.valor),
        imagens: anuncio.imagens,
        whatsapp: moradorLogado.telefone,
        whatsapp_link: whatsappLink,
        status: 'ativo',
        visualizacoes: 0
      });

      if (onSuccess) onSuccess();
      if (onVoltar) onVoltar();

    } catch (err) {
      console.error("Erro ao criar anúncio:", err);
      setError('Erro ao publicar anúncio');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const categoriaSelecionada = categorias.find(c => c.value === anuncio.categoria);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto">
          <button
            onClick={onVoltar}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Novo Anúncio</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Categoria */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Categoria
            </label>
            <button
              onClick={() => setShowCategoriaSelector(true)}
              className="w-full p-4 bg-white border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-[#3b5998] transition-colors"
            >
              <span className={categoriaSelecionada ? "text-gray-900" : "text-gray-500"}>
                {categoriaSelecionada ? categoriaSelecionada.label : "Selecione uma categoria"}
              </span>
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                {categoriaSelecionada && <Check className="w-4 h-4 text-[#3b5998]" />}
              </div>
            </button>
          </div>

          {/* Título */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Título
            </label>
            <Input
              placeholder="Ex: Sofá 3 lugares em ótimo estado"
              value={anuncio.titulo}
              onChange={(e) => setAnuncio(prev => ({ ...prev, titulo: e.target.value }))}
              className="h-12"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Preço
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                R$
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={valorFormatado}
                onChange={handleValorChange}
                className="h-12 pl-12 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Descrição
            </label>
            <Textarea
              placeholder="Descreva o item..."
              value={anuncio.descricao}
              onChange={(e) => setAnuncio(prev => ({ ...prev, descricao: e.target.value }))}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Imagens */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Fotos (mínimo 1, máximo 5)
            </label>

            {anuncio.imagens.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {anuncio.imagens.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImagem(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || anuncio.imagens.length >= 5}
                variant="outline"
                className="flex-1 h-12"
              >
                <Camera className="w-5 h-5 mr-2" />
                Câmera
              </Button>

              <Button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading || anuncio.imagens.length >= 5}
                variant="outline"
                className="flex-1 h-12"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5 mr-2" />
                )}
                Galeria
              </Button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Anúncio'
            )}
          </Button>
        </div>
      </div>

      {/* Modal Seletor de Categoria */}
      <AnimatePresence>
        {showCategoriaSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowCategoriaSelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Categoria</h2>
                <button
                  onClick={() => setShowCategoriaSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {categorias.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setAnuncio(prev => ({ ...prev, categoria: cat.value }));
                      setShowCategoriaSelector(false);
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
                  >
                    <span className="text-lg text-gray-900">{cat.label}</span>
                    {anuncio.categoria === cat.value && (
                      <Check className="w-5 h-5 text-[#3b5998]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}