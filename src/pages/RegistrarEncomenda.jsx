import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import { logAction } from "../components/utils/logger";
import AuthGuard from "../components/utils/AuthGuard";
import { getCondominioContext, addCondominioId, validateCondominioAccess } from "../components/utils/condominioContext";
import { saveDraft, getDraft, clearDraft } from "../components/utils/sessionStorage";


export default function RegistrarEncomenda() {
  const [moradores, setMoradores] = useState([]);
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [condominioContext, setCondominioContext] = useState(null);
  
  // Form state
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [moradorSelecionado, setMoradorSelecionado] = useState(null);
  const [observacoes, setObservacoes] = useState("");
  const [fotosEncomenda, setFotosEncomenda] = useState([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [nomeOCR, setNomeOCR] = useState("");

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const ocrInputRef = useRef(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    const initPage = async () => {
      try {
        await loadData(abortController.signal);
        
        if (abortController.signal.aborted) return;
        
        // Restaurar rascunho se existir
        const draft = getDraft('registrar_encomenda');
        if (draft && !abortController.signal.aborted) {
          setSearchTerm(draft.searchTerm || '');
          setMoradorSelecionado(draft.moradorSelecionado || null);
          setObservacoes(draft.observacoes || '');
          setFotosEncomenda(draft.fotosEncomenda || []);
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      }
    };
    
    initPage();
    
    // Função global para receber imagens do app nativo
    window.handleNativePhoto = async (base64Data, source) => {
      console.log("[BRIDGE] Foto recebida do app nativo:", source);
      
      try {
        // Converter Base64 para Blob
        const byteString = atob(base64Data.split(',')[1] || base64Data);
        const mimeString = base64Data.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], `${source}_${Date.now()}.jpg`, { type: mimeString });
        
        // Verificar modo salvo
        const mode = sessionStorage.getItem('camera_mode');
        
        if (source === 'camera' && mode === 'ocr') {
          await handleOcrUpload(file);
          sessionStorage.removeItem('camera_mode');
        } else {
          await handleAddFoto(file);
        }
        
      } catch (err) {
        setError("Erro ao processar foto do aplicativo");
        setTimeout(() => setError(""), 3000);
      }
    };

    return () => {
      abortController.abort();
      delete window.handleNativePhoto;
    };
  }, []);

  useEffect(() => {
    const registrarAcesso = () => {
      const acessos = JSON.parse(localStorage.getItem('acessos_recentes') || '[]');
      const agora = new Date().getTime();
      const novosAcessos = [
        { key: 'registrar', timestamp: agora },
        ...acessos.filter(a => a.key !== 'registrar')
      ].slice(0, 10);
      localStorage.setItem('acessos_recentes', JSON.stringify(novosAcessos));
    };
    registrarAcesso();
  }, []);

  const loadData = async (signal) => {
    try {
      setLoading(true);
      setError('');
      console.log("[RegistrarEncomenda] Carregando dados com isolamento...");

      if (signal?.aborted) return;

      const context = await getCondominioContext();
      
      if (!context || !context.condominioId) {
        setError("ERRO DE SEGURANÇA: Condomínio não identificado");
        setLoading(false);
        return;
      }
      
      setCondominioContext(context);

      if (signal?.aborted) return;

      // PROTEÇÃO: Carregar APENAS dados do condomínio do usuário
      const [moradoresData, residenciasData] = await Promise.all([
        base44.entities.Morador.filter({ condominio_id: context.condominioId, status: 'ativo' }),
        base44.entities.Residencia.filter({ condominio_id: context.condominioId })
      ]);

      if (signal?.aborted) return;

      // VALIDAÇÃO FINAL: Garantir isolamento absoluto
      const moradoresValidados = moradoresData.filter(m => m.condominio_id === context.condominioId);
      const residenciasValidadas = residenciasData.filter(r => r.condominio_id === context.condominioId);

      setMoradores(moradoresValidados);
      setResidencias(residenciasValidadas);

      console.log(`[SECURITY] Registrar Encomenda - Condomínio: ${context.condominioId}, Moradores: ${moradoresValidados.length}`);
      
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      if (!signal?.aborted) {
        console.error("[SECURITY] Erro ao carregar dados:", err);
        setError("Erro ao carregar dados iniciais.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const gerarCodigoSimples = () => {
    const codigo = Math.floor(10000 + Math.random() * 90000);
    return codigo.toString();
  };

  const filteredMoradores = searchTerm.length >= 2
    ? moradores.filter(m => {
        const term = searchTerm.toLowerCase();
        return (
          m.nome.toLowerCase().includes(term) ||
          m.apelido_endereco?.toLowerCase().includes(term) ||
          m.abreviacao?.toLowerCase().includes(term)
        );
      }).slice(0, 5)
    : [];

  const handleSelectMorador = async (morador) => {
    try {
      if (!condominioContext) {
        throw new Error("Contexto do condomínio não disponível");
      }

      if (!condominioContext.isAdminMaster) {
        await validateCondominioAccess(morador.condominio_id);
      }

      if (morador.residencia_id) {
        try {
          const residencia = await base44.entities.Residencia.get(morador.residencia_id);
          if (!condominioContext.isAdminMaster) {
            await validateCondominioAccess(residencia.condominio_id);
          }
          morador.residencia = residencia;
        } catch (err) {
          // Silently fail
        }
      }

      setMoradorSelecionado(morador);
      setSearchTerm(morador.apelido_endereco || morador.nome);
      setShowSuggestions(false);
      setError("");
    } catch (err) {
      setError("Erro de segurança: Não é possível selecionar este morador.");
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddFoto = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecione uma imagem válida.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setUploadingFoto(true);
      const compressedFile = await compressImage(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
      
      setFotosEncomenda(prev => [...prev, {
        url: file_url,
        preview: URL.createObjectURL(compressedFile)
      }]);
    } catch (err) {
      setError("Erro ao enviar foto. Tente novamente.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoveFoto = (index) => {
    setFotosEncomenda(prev => prev.filter((_, i) => i !== index));
  };

  const openNativeCamera = async (mode = 'package') => {
    // Salvar modo no sessionStorage para usar quando receber resposta
    sessionStorage.setItem('camera_mode', mode);
    
    // Tentar comunicação com app nativo
    if (window.ReactNativeWebView?.postMessage) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'OPEN_CAMERA',
          mode: mode
        }));
        return;
      } catch (err) {
        // Fallback silencioso
      }
    }

    // Fallback: usar input com capture
    if (mode === 'ocr') {
      ocrInputRef.current?.click();
    } else {
      cameraInputRef.current?.click();
    }
  };

  const openGallery = () => {
    // Tentar comunicação com app nativo
    if (window.ReactNativeWebView?.postMessage) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'OPEN_GALLERY'
        }));
        return;
      } catch (err) {
        // Fallback silencioso
      }
    }

    // Fallback: usar input sem capture
    galleryInputRef.current?.click();
  };



  const convertImageToJpeg = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const jpegFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { 
                type: 'image/jpeg' 
              });
              resolve(jpegFile);
            } else {
              reject(new Error("Falha ao converter imagem"));
            }
          }, 'image/jpeg', 0.95);
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleOcrUpload = async (file) => {
    if (!file) return;

    setOcrLoading(true);
    
    try {
      // Converter para JPEG se não for um formato compatível
      let processedFile = file;
      if (file.type === 'image/webp' || file.type === 'image/heic' || file.type === 'image/heif') {
        processedFile = await convertImageToJpeg(file);
      } else if (!file.type.startsWith('image/')) {
        throw new Error("Formato de arquivo não suportado");
      }

      const { file_url } = await base44.integrations.Core.UploadFile({ file: processedFile });
      
      const ocrResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            nome_destinatario: { type: "string", description: "O nome da pessoa que vai receber a encomenda" }
          }
        }
      });

      if (ocrResponse.status === "success" && ocrResponse.output?.nome_destinatario) {
        const nome = ocrResponse.output.nome_destinatario;
        setNomeOCR(nome);
        setSearchTerm(nome);
        setShowSuggestions(true);
      } else {
        setError("Não foi possível ler o nome da etiqueta. Tente novamente ou use a busca manual.");
        setTimeout(() => setError(""), 4000);
      }
    } catch (err) {
      if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        setError("Erro ao processar imagem. Tente tirar uma foto mais clara ou use a busca manual.");
      }
      setTimeout(() => setError(""), 4000);
    } finally {
      setOcrLoading(false);
    }
  };

  // Salvar rascunho automaticamente
  useEffect(() => {
    if (moradorSelecionado || observacoes || fotosEncomenda.length > 0) {
      saveDraft('registrar_encomenda', {
        searchTerm,
        moradorSelecionado,
        observacoes,
        fotosEncomenda
      });
    }
  }, [searchTerm, moradorSelecionado, observacoes, fotosEncomenda]);

  const handleSubmit = async () => {
    // IDEMPOTÊNCIA: Prevenir submissões duplicadas
    if (submitting) {
      console.warn('[IDEMPOTENCY] Submissão duplicada ignorada');
      return;
    }

    // VALIDAÇÃO: Campos obrigatórios
    if (!moradorSelecionado) {
      setError("Selecione um morador");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (fotosEncomenda.length === 0) {
      setError("Adicione pelo menos uma foto da encomenda");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!condominioContext || !condominioContext.condominioId) {
      setError("Erro de segurança: Contexto do condomínio não disponível.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // VALIDAÇÃO: Ownership do morador
      if (!condominioContext.isAdminMaster) {
        await validateCondominioAccess(moradorSelecionado.condominio_id);
      }

      const condominioId = moradorSelecionado.condominio_id;

      if (!condominioId) {
        setError("Erro: Não foi possível identificar o condomínio do morador.");
        setSubmitting(false);
        return;
      }

      const codigoInterno = gerarCodigoSimples();

      // SANITIZAÇÃO: Limpar observações
      const observacoesSanitizadas = observacoes ? String(observacoes).trim().slice(0, 500) : '';

      const encomendaDataToCreate = await addCondominioId({
        codigo: codigoInterno,
        morador_id: moradorSelecionado.id,
        remetente: "Não informado",
        foto_encomenda: fotosEncomenda[0].url,
        observacoes: observacoesSanitizadas,
        data_entrada: new Date().toISOString(),
        status: "aguardando",
        porteiro_entrada: String(condominioContext.userName || 'Sistema').trim().slice(0, 100),
        notificacao_enviada: false
      });

      // VALIDAÇÃO CRÍTICA: Garantir condomínio correto
      if (encomendaDataToCreate.condominio_id !== condominioId) {
        throw new Error("SECURITY_BREACH: Condomínio incorreto");
      }

      const createdEncomenda = await base44.entities.Encomenda.create(encomendaDataToCreate);

      await logAction('registrar_encomenda', `Encomenda ${codigoInterno} registrada para ${moradorSelecionado.nome}`, {
        condominio_id: condominioId,
        dados_novos: { ...encomendaDataToCreate, id: createdEncomenda.id }
      });

      setSuccess('✅ Encomenda registrada com sucesso');
      setShowSuccessModal(true);
      clearDraft('registrar_encomenda');

    } catch (err) {
      console.error('[DATA_INTEGRITY] Erro ao registrar:', err);
      
      if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError("Erro de conexão. Seus dados foram salvos e você pode tentar novamente.");
      } else if (err.message?.includes('SECURITY_BREACH')) {
        setError("Erro de segurança crítico. Operação bloqueada.");
      } else {
        setError("Erro ao registrar. Verifique os dados e tente novamente.");
      }

      if (condominioContext?.condominioId) {
        await logAction('registrar_encomenda', `Erro ao registrar encomenda: ${err.message}`, {
          condominio_id: condominioContext.condominioId,
          sucesso: false,
          erro_mensagem: err.message
        });
      }
    } finally {
      // IDEMPOTÊNCIA: Delay antes de liberar
      setTimeout(() => setSubmitting(false), 500);
    }
  };

  const resetForm = () => {
    setSearchTerm("");
    setMoradorSelecionado(null);
    setObservacoes("");
    setFotosEncomenda([]);
    setShowSuccessModal(false);
    setSuccess("");
    setError("");
    setNomeOCR("");
    clearDraft('registrar_encomenda');
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="Registrar Nova Encomenda" />
          <div className="flex items-center justify-center pt-24 pb-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          </div>
          <MoradorFooter />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Registrar Nova Encomenda" />
      
      <div className="pt-28 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 space-y-4">
              {/* 1. Busca por Abreviação */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar Morador
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Digite nome ou abreviação (ex: A-101)"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 h-12 bg-[#dfe3ee] border-0"
                    disabled={ocrLoading}
                  />
                  
                  {/* Sugestões */}
                  {showSuggestions && filteredMoradores.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto shadow-lg">
                      <CardContent className="p-0">
                        {filteredMoradores.map((morador) => (
                          <div
                            key={morador.id}
                            onClick={() => handleSelectMorador(morador)}
                            className="p-3 hover:bg-[#f7f7f7] cursor-pointer border-b last:border-0 transition-colors"
                          >
                            <p className="font-semibold text-gray-900 text-sm">{morador.nome}</p>
                            <p className="text-xs text-gray-600">{morador.apelido_endereco || morador.abreviacao}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Morador Selecionado */}
                {moradorSelecionado && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800 text-sm">{moradorSelecionado.nome}</p>
                      <p className="text-xs text-green-700">{moradorSelecionado.apelido_endereco || moradorSelecionado.abreviacao}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMoradorSelecionado(null);
                        setSearchTerm("");
                      }}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <X className="w-4 h-4 text-green-700" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Busca por Foto (OCR) - Câmera */}
              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ou buscar por foto da etiqueta
                </label>

                <Button
                  onClick={() => openNativeCamera('ocr')}
                  disabled={ocrLoading || moradorSelecionado !== null}
                  variant="outline"
                  className="w-full h-12 border-2 border-dashed border-[#8b9dc3] hover:bg-[#f7f7f7]"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Lendo foto da etiqueta...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Fotografar etiqueta
                    </>
                  )}
                </Button>
                {ocrLoading && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 text-center">
                      Processando imagem e extraindo dados...
                    </p>
                  </div>
                )}
                {nomeOCR && (
                  <p className="text-xs text-green-700 mt-1">✓ Nome encontrado: {nomeOCR}</p>
                )}
              </div>

              {/* 3. Observação */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Observação
                  </label>
                  <span className="text-xs text-gray-500">{observacoes.length}/200</span>
                </div>
                <Textarea
                  placeholder="Informações adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={3}
                  className="bg-[#dfe3ee] border-0 resize-none"
                />
              </div>

              {/* 4. Imagens */}
              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Fotos da Encomenda *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    onClick={() => openNativeCamera('package')}
                    disabled={uploadingFoto}
                    className="w-full h-14 bg-[#3b5998] hover:bg-[#2d4373] text-white"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Câmera
                  </Button>
                  <Button
                    onClick={openGallery}
                    disabled={uploadingFoto}
                    variant="outline"
                    className="w-full h-14 border-2 border-[#3b5998] text-[#3b5998] hover:bg-[#f7f7f7]"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Galeria
                  </Button>
                </div>

                {/* Miniaturas */}
                {fotosEncomenda.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {fotosEncomenda.map((foto, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={foto.preview}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-[#dfe3ee]"
                        />
                        <button
                          onClick={() => handleRemoveFoto(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadingFoto && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3b5998]" />
                    <span className="ml-2 text-sm text-gray-600">Enviando foto...</span>
                  </div>
                )}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleAddFoto(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAddFoto(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={ocrInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleOcrUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* 5. Botão Registrar */}
              <div className="pt-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !moradorSelecionado || fotosEncomenda.length === 0}
                  className="w-full h-14 text-lg font-semibold bg-[#3b5998] hover:bg-[#2d4373] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>




      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full p-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pronto!</h3>
              <p className="text-gray-600 mb-6">Encomenda registrada com sucesso ✅</p>
              {success && (
                <p className="text-sm text-green-600 font-medium mb-6">{success}</p>
              )}
              
              <div className="space-y-2">
                <Button
                  onClick={resetForm}
                  className="w-full h-12 bg-[#3b5998] hover:bg-[#2d4373]"
                >
                  Registrar Nova Encomenda
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="w-full h-12"
                >
                  Voltar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <MoradorFooter />
    </div>
    </AuthGuard>
  );
}