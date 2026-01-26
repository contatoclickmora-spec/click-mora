import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Upload, Video, X, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";

const ESTADOS_ITEM = ['Novo', 'Bom', 'Regular', 'Ruim', 'Péssimo'];

export default function EditarItem({ 
  item, 
  ambienteNome,
  onClose, 
  onSave,
  itens = [], // Lista de todos os itens do ambiente para navegação
  onNavigate // Função para navegar entre itens
}) {
  const [abaAtiva, setAbaAtiva] = useState('estado');
  const [estado, setEstado] = useState(item?.estado || 'Bom');
  const [temInconformidade, setTemInconformidade] = useState(item?.inconformidade || false);
  const [fotos, setFotos] = useState(item?.fotos || []);
  const [videos, setVideos] = useState(item?.videos || []);
  const [comentario, setComentario] = useState(item?.observacao || '');
  const [uploading, setUploading] = useState(false);

  const fotoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const abas = [
    { id: 'estado', label: 'ESTADO' },
    { id: 'fotos', label: 'FOTOS' },
    { id: 'videos', label: 'VÍDEOS' },
    { id: 'comentarios', label: 'COMENTÁRIOS' }
  ];

  useEffect(() => {
    if (item) {
      setEstado(item.estado || 'Bom');
      setTemInconformidade(item.inconformidade || false);
      setFotos(item.fotos || []);
      setVideos(item.videos || []);
      setComentario(item.observacao || '');
    }
  }, [item]);

  const handleSave = () => {
    const itemAtualizado = {
      ...item,
      estado,
      inconformidade: temInconformidade,
      fotos,
      videos,
      observacao: comentario
    };
    onSave(itemAtualizado);
  };

  const handleUploadFoto = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const novasFotos = [...fotos];
      
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        novasFotos.push({
          url: file_url,
          data: new Date().toISOString()
        });
      }
      
      setFotos(novasFotos);
    } catch (err) {
      console.error('Erro ao fazer upload da foto:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVideo = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const novosVideos = [...videos];
      
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        novosVideos.push({
          url: file_url,
          data: new Date().toISOString()
        });
      }
      
      setVideos(novosVideos);
    } catch (err) {
      console.error('Erro ao fazer upload do vídeo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoverFoto = (index) => {
    const novasFotos = fotos.filter((_, i) => i !== index);
    setFotos(novasFotos);
  };

  const handleRemoverVideo = (index) => {
    const novosVideos = videos.filter((_, i) => i !== index);
    setVideos(novosVideos);
  };

  // Navegação entre itens
  const itemIndex = itens.findIndex(i => i.nome === item?.nome);
  const podeVoltar = itemIndex > 0;
  const podeAvancar = itemIndex < itens.length - 1;

  const handleNavegar = (direcao) => {
    handleSave();
    if (direcao === 'anterior' && podeVoltar) {
      onNavigate(itens[itemIndex - 1]);
    } else if (direcao === 'proximo' && podeAvancar) {
      onNavigate(itens[itemIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f7f7f7] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#3b5998] text-white">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => { handleSave(); onClose(); }} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{item?.nome || 'Item'}</h1>
          <div className="w-8" />
        </div>

        {/* Abas */}
        <div className="flex border-b border-[#2d4373]">
          {abas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                abaAtiva === aba.id 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {abaAtiva === 'estado' && (
            <motion.div
              key="estado"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              {/* Checkbox de inconformidade */}
              <button
                onClick={() => setTemInconformidade(!temInconformidade)}
                className="flex items-center justify-between w-full py-4 border-b border-gray-200"
              >
                <span className="text-gray-500">Contem inconformidade</span>
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                  temInconformidade ? 'bg-[#3b5998] border-[#3b5998]' : 'border-gray-300'
                }`}>
                  {temInconformidade && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>

              {/* Opções de estado */}
              <div className="flex flex-wrap gap-3 mt-6">
                {ESTADOS_ITEM.map(opcao => (
                  <button
                    key={opcao}
                    onClick={() => setEstado(opcao)}
                    className={`px-6 py-3 rounded-full border-2 text-sm font-medium transition-all ${
                      estado === opcao
                        ? 'bg-[#3b5998] border-[#3b5998] text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-[#3b5998]'
                    }`}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {abaAtiva === 'fotos' && (
            <motion.div
              key="fotos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadFoto}
                className="hidden"
              />

              {/* Grid de fotos */}
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {fotos.map((foto, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                      <img 
                        src={foto.url} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoverFoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de adicionar */}
              <button
                onClick={() => fotoInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 text-gray-500 hover:border-[#3b5998] hover:text-[#3b5998] transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Selecionar da galeria</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {abaAtiva === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleUploadVideo}
                className="hidden"
              />

              {/* Grid de vídeos */}
              {videos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {videos.map((video, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                      <video 
                        src={video.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                      <button
                        onClick={() => handleRemoverVideo(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de adicionar */}
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 text-gray-500 hover:border-[#3b5998] hover:text-[#3b5998] transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Video className="w-8 h-8" />
                    <span className="text-sm font-medium">Selecionar da galeria</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {abaAtiva === 'comentarios' && (
            <motion.div
              key="comentarios"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Adicione comentários sobre este item..."
                className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#3b5998] text-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer de navegação */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => handleNavegar('anterior')}
          disabled={!podeVoltar}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            podeVoltar ? 'bg-[#3b5998] text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <span className="text-base font-semibold text-gray-900">
          {item?.nome || 'Item'}
        </span>

        <button
          onClick={() => handleNavegar('proximo')}
          disabled={!podeAvancar}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            podeAvancar ? 'bg-[#3b5998] text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}