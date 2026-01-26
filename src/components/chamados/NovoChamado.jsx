import React, { useState, useRef, useEffect } from 'react';
import { Chamado } from "@/entities/Chamado";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  HelpCircle,
  Lightbulb,
  Wrench,
  Frown,
  FileText,
  Calendar,
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChamados } from "../utils/chamadosContext";

const tiposChamado = [
  { value: 'palavra_chave_encomendas', label: 'Palavra Chave - Encomendas', icon: FileText, destinatario: 'portaria' },
  { value: 'duvida', label: 'Dúvida', icon: HelpCircle, destinatario: 'portaria' },
  { value: 'sugestao', label: 'Sugestão', icon: Lightbulb, destinatario: 'sindico' },
  { value: 'manutencao', label: 'Manutenção', icon: Wrench, destinatario: 'portaria' },
  { value: 'reclamacao', label: 'Reclamação', icon: Frown, destinatario: 'sindico' },
  { value: 'solicitacao', label: 'Solicitação', icon: FileText, destinatario: 'sindico' },
  { value: 'agendamento_mudanca', label: 'Agendamento de mudança', icon: Calendar, destinatario: 'portaria' }
];

export default function NovoChamado({ moradorLogado: moradorLogadoProp, userType = 'morador', onVoltar, onSuccess }) {
  // ESTADO CRÍTICO - NÃO MEXER SEM ENTENDER
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initError, setInitError] = useState('');
  
  const [showTipoSelector, setShowTipoSelector] = useState(false);
  const [showDestinatarioSelector, setShowDestinatarioSelector] = useState(false);
  const [chamado, setChamado] = useState({
    tipo: '',
    titulo: '',
    descricao: '',
    destinatario: '',
    destinatario_morador_id: null,
    arquivos_anexos: []
  });
  const [moradorSearch, setMoradorSearch] = useState('');
  const [moradoresFiltrados, setMoradoresFiltrados] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const galleryInputRef = useRef(null);
  const { notificarNovoChamado } = useChamados();

  // CARREGAMENTO CRÍTICO - Este useEffect é ESSENCIAL
  useEffect(() => {
    let isMounted = true;

    const initializeUser = async () => {
      try {
        console.log('=== [NOVO CHAMADO] INICIANDO CARREGAMENTO ===');
        console.log('[NOVO CHAMADO] Props recebidas:', { moradorLogadoProp, userType });

        // Se recebeu via props, usar diretamente
        if (moradorLogadoProp) {
          console.log('[NOVO CHAMADO] ✅ Morador recebido via props:', moradorLogadoProp);
          
          if (!moradorLogadoProp.id) {
            console.error('[NOVO CHAMADO] ❌ ERRO: moradorLogadoProp.id está undefined!');
            if (isMounted) {
              setInitError('Erro nos dados do usuário. Por favor, faça login novamente.');
              setLoadingUser(false);
            }
            return;
          }

          if (isMounted) {
            setMoradorLogado(moradorLogadoProp);
            setIsReady(true);
            setLoadingUser(false);
          }
          return;
        }

        // Caso contrário, carregar do zero
        console.log('[NOVO CHAMADO] 📥 Carregando dados do usuário...');
        
        const user = await User.me();
        console.log('[NOVO CHAMADO] User carregado:', { email: user?.email, id: user?.id });

        if (!user || !user.email) {
          console.error('[NOVO CHAMADO] ❌ Usuário não autenticado');
          if (isMounted) {
            setInitError('Você precisa estar autenticado para criar um chamado.');
            setLoadingUser(false);
          }
          return;
        }

        console.log('[NOVO CHAMADO] 📥 Buscando morador no banco...');
        const todosMoradores = await Morador.list();
        console.log('[NOVO CHAMADO] Total de moradores:', todosMoradores.length);

        const morador = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        console.log('[NOVO CHAMADO] Morador encontrado:', morador);

        if (!morador) {
          console.error('[NOVO CHAMADO] ❌ Cadastro não encontrado');
          if (isMounted) {
            setInitError('Seu cadastro não foi encontrado no sistema.');
            setLoadingUser(false);
          }
          return;
        }

        if (!morador.id) {
          console.error('[NOVO CHAMADO] ❌ ERRO CRÍTICO: morador.id está undefined!', morador);
          if (isMounted) {
            setInitError('Erro crítico nos dados do usuário. Contate o administrador.');
            setLoadingUser(false);
          }
          return;
        }

        if (!morador.condominio_id) {
          console.error('[NOVO CHAMADO] ❌ Usuário sem condomínio');
          if (isMounted) {
            setInitError('Você não está vinculado a nenhum condomínio.');
            setLoadingUser(false);
          }
          return;
        }

        console.log('[NOVO CHAMADO] ✅ SUCESSO - Morador carregado:', {
          id: morador.id,
          nome: morador.nome,
          condominio_id: morador.condominio_id
        });

        if (isMounted) {
          setMoradorLogado(morador);
          setIsReady(true);
          setLoadingUser(false);
        }

      } catch (err) {
        console.error('[NOVO CHAMADO] ❌ ERRO FATAL:', err);
        console.error('[NOVO CHAMADO] Stack:', err.stack);
        if (isMounted) {
          setInitError(`Erro ao carregar dados: ${err.message}`);
          setLoadingUser(false);
        }
      }
    };

    initializeUser();

    return () => {
      isMounted = false;
    };
  }, [moradorLogadoProp, userType]);

  const getTipoInfo = (value) => {
    return tiposChamado.find(t => t.value === value);
  };

  const buscarMoradores = async (termo) => {
    if (!termo || termo.length < 2) {
      setMoradoresFiltrados([]);
      return;
    }

    // VALIDAÇÃO CRÍTICA
    if (!moradorLogado || !moradorLogado.condominio_id) {
      console.error('[NOVO CHAMADO] ❌ Tentativa de buscar moradores sem moradorLogado carregado');
      return;
    }

    try {
      const todosMoradores = await Morador.list();
      const filtrados = todosMoradores.filter(m => 
        m.condominio_id === moradorLogado.condominio_id &&
        m.status === 'ativo' &&
        m.tipo_usuario === 'morador' && // Only search for other moradors
        (m.nome.toLowerCase().includes(termo.toLowerCase()) ||
         m.apelido_endereco?.toLowerCase().includes(termo.toLowerCase()))
      );
      setMoradoresFiltrados(filtrados);
    } catch (err) {
      console.error('[NOVO CHAMADO] Erro ao buscar moradores:', err);
    }
  };

  const handleDestinatarioChange = (value, moradorId = null) => {
    setChamado(prev => ({
      ...prev,
      destinatario: value,
      destinatario_morador_id: moradorId
    }));
    setShowDestinatarioSelector(false);
    setMoradorSearch('');
    setMoradoresFiltrados([]);
  };

  const handleFileUpload = async (e) => {
    try {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) {
        console.log('📷 [NOVO CHAMADO] Nenhum arquivo selecionado');
        return;
      }

      console.log('📷 [NOVO CHAMADO] Arquivos selecionados:', files.length);

      if (chamado.arquivos_anexos.length + files.length > 5) {
        setError('Máximo de 5 imagens por chamado');
        setTimeout(() => setError(''), 3000);
        return;
      }

      setUploading(true);
      setError('');
      
      const uploadedFiles = [];
      
      for (const file of files) {
        try {
          console.log('📷 [NOVO CHAMADO] Processando:', file.name, file.type, file.size);

          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const isValidType = validTypes.includes(file.type) || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(fileExtension || '');

          if (!isValidType) {
            console.warn('⚠️ [NOVO CHAMADO] Formato inválido:', file.type);
            setError('Formato inválido. Use: JPG, PNG, HEIC ou WEBP');
            continue;
          }

          if (file.size > 10 * 1024 * 1024) {
            console.warn('⚠️ [NOVO CHAMADO] Arquivo muito grande:', file.size);
            setError('Imagem muito grande. Máximo 10MB');
            continue;
          }

          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          console.log('✅ [NOVO CHAMADO] Upload concluído:', file_url);
          
          uploadedFiles.push({
            url: file_url,
            type: file.type,
            name: file.name
          });
        } catch (uploadError) {
          console.error('❌ [NOVO CHAMADO] Erro ao fazer upload do arquivo:', file.name, uploadError);
          setError(`Erro ao enviar ${file.name}`);
        }
      }

      if (uploadedFiles.length > 0) {
        setChamado(prev => ({
          ...prev,
          arquivos_anexos: [...prev.arquivos_anexos, ...uploadedFiles]
        }));
        console.log('✅ [NOVO CHAMADO] Total de arquivos anexados:', uploadedFiles.length);
      }
    } catch (err) {
      console.error('❌ [NOVO CHAMADO] Erro crítico ao fazer upload:', err);
      setError('Erro ao enviar imagens');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeAnexo = (index) => {
    setChamado(prev => ({
      ...prev,
      arquivos_anexos: prev.arquivos_anexos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    console.log('=== [NOVO CHAMADO] TENTANDO ENVIAR ===');
    
    // VALIDAÇÃO ULTRA-CRÍTICA #1
    if (!isReady) {
      console.error('[NOVO CHAMADO] ❌ Sistema não está pronto ainda!');
      setError('Sistema ainda está carregando. Aguarde alguns segundos.');
      return;
    }

    // VALIDAÇÃO ULTRA-CRÍTICA #2
    if (!moradorLogado) {
      console.error('[NOVO CHAMADO] ❌ ERRO CRÍTICO: moradorLogado é null/undefined!');
      console.error('[NOVO CHAMADO] Estado atual:', { moradorLogado, isReady, loadingUser });
      setError('Erro: Dados do usuário não carregados. Recarregue a página.');
      return;
    }

    // VALIDAÇÃO ULTRA-CRÍTICA #3
    if (!moradorLogado.id) {
      console.error('[NOVO CHAMADO] ❌ ERRO CRÍTICO: moradorLogado.id é undefined!');
      console.error('[NOVO CHAMADO] moradorLogado completo:', JSON.stringify(moradorLogado, null, 2));
      setError('Erro crítico: ID do usuário não disponível. Contate o administrador.');
      return;
    }

    console.log('[NOVO CHAMADO] ✅ Validações passaram. Morador:', {
      id: moradorLogado.id,
      nome: moradorLogado.nome,
      email: moradorLogado.email
    });

    // Validações de formulário
    if (!chamado.tipo) {
      setError('Selecione o tipo do chamado');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!chamado.titulo.trim()) {
      setError('Informe o assunto');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!chamado.descricao.trim()) {
      setError('Descreva o chamado');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!chamado.destinatario) {
      setError('Selecione para quem vai o chamado');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (chamado.destinatario === 'morador' && !chamado.destinatario_morador_id) {
      setError('Selecione o morador destinatário');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('[NOVO CHAMADO] 📤 Criando chamado...');

      // The morador_id in the Chamado entity generally represents the morador to whom the call is primarily linked
      // If it's a specific morador recipient, use that ID. Otherwise, it's the sender's morador ID.
      const moradorDestinatarioId = chamado.destinatario === 'morador' 
        ? chamado.destinatario_morador_id 
        : moradorLogado.id; // If not directed to a specific morador, the 'morador_id' in Chamado refers to the sender

      const dadosChamado = {
        morador_id: moradorDestinatarioId, // This is the morador associated with the call (either recipient or sender if general)
        criado_por_id: moradorLogado.id,
        criado_por_nome: moradorLogado.nome,
        criado_por_tipo: userType, // 'morador', 'sindico', 'porteiro' etc.
        tipo: chamado.tipo,
        titulo: chamado.titulo.trim(),
        descricao: chamado.descricao.trim(),
        destinatario: chamado.destinatario, // 'sindico', 'portaria', or 'morador'
        destinatario_morador_id: chamado.destinatario === 'morador' ? chamado.destinatario_morador_id : null,
        status: 'aberto',
        arquivos_anexos: chamado.arquivos_anexos || [],
        lido_pelo_morador: false // Assume unread initially
      };

      console.log('[NOVO CHAMADO] 📋 Dados do chamado:', JSON.stringify(dadosChamado, null, 2));

      const chamadoCriado = await Chamado.create(dadosChamado);
      
      console.log('[NOVO CHAMADO] ✅ SUCESSO! Chamado criado:', chamadoCriado.id);
      
      notificarNovoChamado();

      if (onSuccess) onSuccess();
      if (onVoltar) onVoltar();
      
    } catch (err) {
      console.error('[NOVO CHAMADO] ❌ ERRO ao criar chamado:', err);
      console.error('[NOVO CHAMADO] Stack:', err.stack);
      setError(`Erro ao enviar chamado: ${err.message || 'Tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  const tipoSelecionado = getTipoInfo(chamado.tipo);

  // CONDIÇÃO FINAL PARA HABILITAR BOTÃO
  const podeEnviar = isReady && 
                     moradorLogado && 
                     moradorLogado.id && 
                     !loading && 
                     !uploading && 
                     !loadingUser;

  console.log('[NOVO CHAMADO] Estado do botão:', {
    podeEnviar,
    isReady,
    temMorador: !!moradorLogado,
    temId: !!moradorLogado?.id,
    loading,
    uploading,
    loadingUser
  });

  // TELA DE CARREGAMENTO
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="bg-[#3b5998] text-white p-4 shadow-md">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <button onClick={onVoltar} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Novo Chamado</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center pt-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  // TELA DE ERRO
  if (initError) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="bg-[#3b5998] text-white p-4 shadow-md">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <button onClick={onVoltar} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Novo Chamado</h1>
          </div>
        </div>
        <div className="p-4 pt-20 max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{initError}</AlertDescription>
          </Alert>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => window.location.reload()} className="flex-1">
              Recarregar Página
            </Button>
            <Button onClick={onVoltar} variant="outline" className="flex-1">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL
  return (
    <div className="min-h-screen bg-[#f7f7f7] pt-24 pb-6">
      <div className="p-4 max-w-2xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isReady && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Aguarde, carregando dados do usuário...
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <button
            onClick={() => setShowTipoSelector(true)}
            disabled={!isReady}
            className="w-full p-4 bg-[#dfe3ee] rounded-lg text-left flex items-center justify-between hover:bg-[#dfe3ee]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={tipoSelecionado ? "text-gray-900" : "text-gray-500"}>
              {tipoSelecionado ? tipoSelecionado.label : "Tipo"}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>

          <Input
            placeholder="Assunto"
            value={chamado.titulo}
            onChange={(e) => setChamado(prev => ({ ...prev, titulo: e.target.value }))}
            disabled={!isReady}
            className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
          />

          <Textarea
            placeholder="Descrição"
            value={chamado.descricao}
            onChange={(e) => setChamado(prev => ({ ...prev, descricao: e.target.value }))}
            disabled={!isReady}
            rows={6}
            className="bg-[#dfe3ee] border-0 rounded-lg text-base p-4 resize-none"
          />

          {chamado.arquivos_anexos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {chamado.arquivos_anexos.map((arquivo, index) => (
                <div key={index} className="relative">
                  <img
                    src={arquivo.url}
                    alt={`Anexo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => removeAnexo(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading || chamado.arquivos_anexos.length >= 5 || !isReady}
              className="flex flex-col items-center gap-2 p-4 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-[#dfe3ee] rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <span className="text-sm text-gray-700 font-medium">Galeria</span>
            </button>
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Selecionar imagens da galeria"
          />

          <button
            onClick={() => setShowDestinatarioSelector(true)}
            disabled={!isReady}
            className="w-full p-4 bg-[#dfe3ee] rounded-lg text-left flex items-center justify-between hover:bg-[#dfe3ee]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={chamado.destinatario ? "text-gray-900" : "text-gray-500"}>
              {chamado.destinatario === 'sindico' && 'Síndico/Administração'}
              {chamado.destinatario === 'portaria' && 'Portaria'}
              {chamado.destinatario === 'morador' && chamado.destinatario_morador_id && moradoresFiltrados.find(m => m.id === chamado.destinatario_morador_id)?.nome}
              {!chamado.destinatario && "Para quem vai o chamado"}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>

          <Button
            onClick={handleSubmit}
            disabled={!podeEnviar}
            className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-lg font-semibold mt-6 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : !isReady ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              'ENVIAR'
            )}
          </Button>
        </div>
      </div>

      {/* Modais */}
      <AnimatePresence>
        {showTipoSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowTipoSelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#3b5998]">Tipo</h2>
                <button
                  onClick={() => setShowTipoSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2">
                {tiposChamado.map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => {
                      setChamado(prev => ({ ...prev, tipo: tipo.value }));
                      setShowTipoSelector(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
                  >
                    <tipo.icon className="w-6 h-6 text-[#3b5998]" />
                    <span className="text-lg text-gray-900">{tipo.label}</span>
                    {chamado.tipo === tipo.value && (
                      <Check className="w-5 h-5 text-[#3b5998] ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDestinatarioSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowDestinatarioSelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#3b5998]">Para quem vai o chamado</h2>
                <button
                  onClick={() => setShowDestinatarioSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Options available for all user types */}
              <div className="space-y-2">
                <button
                  onClick={() => handleDestinatarioChange('sindico')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100"
                >
                  <span className="text-lg text-gray-900">Síndico/Administração</span>
                  {chamado.destinatario === 'sindico' && (
                    <Check className="w-5 h-5 text-[#3b5998]" />
                  )}
                </button>
                <button
                  onClick={() => handleDestinatarioChange('portaria')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <span className="text-lg text-gray-900">Portaria</span>
                  {chamado.destinatario === 'portaria' && (
                    <Check className="w-5 h-5 text-[#3b5998]" />
                  )}
                </button>
              </div>

              {/* Morador search for non-morador users (e.g., Porteiro, Síndico) */}
              {userType !== 'morador' && (
                <div className="space-y-4 mt-6 border-t border-gray-100 pt-6">
                  <p className="text-lg font-semibold text-gray-700">Ou envie para um morador específico:</p>
                  <Input
                    placeholder="Digite nome ou abreviação (ex: 9-103)"
                    value={moradorSearch}
                    onChange={(e) => {
                      setMoradorSearch(e.target.value);
                      buscarMoradores(e.target.value);
                    }}
                    className="h-12 bg-[#dfe3ee] border-0"
                  />
                  
                  {moradoresFiltrados.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {moradoresFiltrados.map((morador) => (
                        <button
                          key={morador.id}
                          onClick={() => handleDestinatarioChange('morador', morador.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="text-left">
                            <p className="text-lg text-gray-900">{morador.nome}</p>
                            <p className="text-sm text-gray-500">{morador.apelido_endereco}</p>
                          </div>
                          {chamado.destinatario_morador_id === morador.id && (
                            <Check className="w-5 h-5 text-[#3b5998]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}