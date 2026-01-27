import React, { useState, useEffect, useRef } from 'react';
import { User } from "@/entities/User";
import { Morador } from "@/entities/Morador";
import { Residencia } from "@/entities/Residencia";
import { Aviso } from "@/entities/Aviso";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Building2,
  Home,
  User as UserIcon,
  Camera,
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  ChevronDown,
  QrCode,
  MessageSquare,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import OperationalFooter from "../components/shared/OperationalFooter";

const tiposDestinatario = [
  { value: 'todos', label: 'Condomínio', icon: Building2, description: 'Todos os moradores' },
  { value: 'bloco', label: 'Bloco', icon: Building2, description: 'Moradores de um bloco' },
  { value: 'apartamento', label: 'Apartamento', icon: Home, description: 'Moradores de um endereço' },
  { value: 'individuais', label: 'Pessoa', icon: UserIcon, description: 'Seleção individual' }
];

export default function EnviarAvisos() {
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    tipo_destinatario: '',
    filtro_bloco: '',
    filtro_apartamento: '',
    moradores_selecionados: [],
    blocos_selecionados: []
  });

  const [moradores, setMoradores] = useState([]);
  const [residencias, setResidencias] = useState([]);
  const [imagemUrl, setImagemUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [showDestinatarioModal, setShowDestinatarioModal] = useState(false);
  const [searchMorador, setSearchMorador] = useState('');

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = await User.me();
      
      if (!user || !user.email) {
        setError("Usuário não autenticado");
        setLoading(false);
        return;
      }
      
      const todosMoradores = await Morador.list();
      const moradorLogado = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (!moradorLogado || !moradorLogado.condominio_id) {
        setError("Condomínio não identificado");
        setLoading(false);
        return;
      }

      const condominioId = moradorLogado.condominio_id;
      setUserCondominioId(condominioId);

      // PROTEÇÃO: Carregar APENAS dados do condomínio do usuário
      const [moradoresData, residenciasData] = await Promise.all([
        Morador.filter({ condominio_id: condominioId, status: "ativo" }),
        Residencia.filter({ condominio_id: condominioId })
      ]);

      // VALIDAÇÃO: Garantir isolamento absoluto
      const moradoresValidados = moradoresData.filter(m => m.condominio_id === condominioId);
      const residenciasValidadas = residenciasData.filter(r => r.condominio_id === condominioId);

      setMoradores(moradoresValidados);
      setResidencias(residenciasValidadas);

      console.log(`[SECURITY] Enviar Avisos - Condomínio: ${condominioId}, Moradores: ${moradoresValidados.length}`);
      
    } catch (err) {
      console.error("[SECURITY] Erro ao carregar dados:", err);
      setError("Erro ao carregar dados");
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Formato inválido. Use: JPG, PNG ou WEBP');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImagemUrl(file_url);
    } catch (err) {
      setError("Erro ao fazer upload da imagem");
      console.error("Erro:", err);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleDestinatarioSelect = (tipo) => {
    setFormData(prev => ({
      ...prev,
      tipo_destinatario: tipo,
      filtro_bloco: '',
      filtro_apartamento: '',
      moradores_selecionados: [],
      blocos_selecionados: []
    }));
    setShowDestinatarioModal(false);
  };

  const toggleMorador = (moradorId) => {
    setFormData(prev => ({
      ...prev,
      moradores_selecionados: prev.moradores_selecionados.includes(moradorId)
        ? prev.moradores_selecionados.filter(id => id !== moradorId)
        : [...prev.moradores_selecionados, moradorId]
    }));
  };

  const toggleBloco = (blocoId) => {
    setFormData(prev => ({
      ...prev,
      blocos_selecionados: prev.blocos_selecionados.includes(blocoId)
        ? prev.blocos_selecionados.filter(id => id !== blocoId)
        : [...prev.blocos_selecionados, blocoId]
    }));
  };

  const calcularDestinatarios = () => {
    let destinatarios = [];

    switch (formData.tipo_destinatario) {
      case 'todos':
        destinatarios = moradores;
        break;
      
      case 'bloco':
        if (formData.blocos_selecionados.length > 0) {
          destinatarios = moradores.filter(morador => {
            const residencia = residencias.find(r => r.id === morador.residencia_id);
            return residencia && formData.blocos_selecionados.includes(residencia.identificador_principal);
          });
        }
        break;
      
      case 'apartamento':
        destinatarios = moradores.filter(m => formData.moradores_selecionados.includes(m.id));
        break;
      
      case 'individuais':
        destinatarios = moradores.filter(m => formData.moradores_selecionados.includes(m.id));
        break;
    }

    return destinatarios;
  };

  // Obter lista única de blocos
  const getBlocosUnicos = () => {
    const blocosSet = new Set();
    residencias.forEach(res => {
      if (res.identificador_principal) {
        blocosSet.add(res.identificador_principal);
      }
    });
    return Array.from(blocosSet).sort();
  };

  // Obter moradores por apartamento
  const getMoradoresPorApartamento = () => {
    if (!formData.filtro_apartamento) return [];
    
    return moradores.filter(morador => {
      const residencia = residencias.find(r => r.id === morador.residencia_id);
      if (!residencia) return false;
      
      const enderecoCompleto = `${residencia.identificador_principal} ${residencia.complemento}`.toLowerCase();
      return enderecoCompleto.includes(formData.filtro_apartamento.toLowerCase());
    });
  };

  const destinatarios = calcularDestinatarios();
  const blocosUnicos = getBlocosUnicos();
  const moradoresDoApartamento = getMoradoresPorApartamento();

  const moradoresFiltrados = moradores.filter(m =>
    m.nome.toLowerCase().includes(searchMorador.toLowerCase()) ||
    m.apelido_endereco?.toLowerCase().includes(searchMorador.toLowerCase())
  );

  const getTipoLabel = () => {
    const tipo = tiposDestinatario.find(t => t.value === formData.tipo_destinatario);
    return tipo ? tipo.label : 'Enviar para';
  };

  const handleSubmit = async () => {
    // IDEMPOTÊNCIA: Prevenir submissões duplicadas
    if (loading) {
      console.warn('[IDEMPOTENCY] Submissão duplicada ignorada');
      return;
    }

    // SANITIZAÇÃO: Limpar dados
    const tituloSanitizado = String(formData.titulo || '').trim().slice(0, 200);
    const mensagemSanitizada = String(formData.mensagem || '').trim().slice(0, 2000);

    // VALIDAÇÃO: Campos obrigatórios
    if (!tituloSanitizado) {
      setError("Título é obrigatório");
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!mensagemSanitizada) {
      setError("Mensagem é obrigatória");
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!destinatarios || destinatarios.length === 0) {
      setError("Selecione pelo menos um destinatário");
      setTimeout(() => setError(''), 3000);
      return;
    }


    // VALIDAÇÃO: Condomínio identificado
    if (!userCondominioId) {
      setError("Erro de segurança: Condomínio não identificado");
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const currentUser = await User.me();
      const agora = new Date();

      const avisoData = {
        titulo: tituloSanitizado,
        mensagem: mensagemSanitizada,
        imagem_url: imagemUrl || '',
        tipo_destinatario: formData.tipo_destinatario,
        filtro_bloco: formData.tipo_destinatario === 'bloco' ? formData.blocos_selecionados.join(', ').slice(0, 500) : '',
        filtro_apartamento: String(formData.filtro_apartamento || '').slice(0, 200),
        moradores_destinatarios: ['individuais', 'apartamento'].includes(formData.tipo_destinatario) ? formData.moradores_selecionados : [],
        total_destinatarios: destinatarios.length,
        condominio_id: userCondominioId,
        enviado_por: String(currentUser?.full_name || 'Administrador').trim().slice(0, 100),
        data_envio: agora.toISOString(),
        status: 'enviado'
      };

      await Aviso.create(avisoData);


      setSuccess(`Aviso enviado para ${destinatarios.length} morador(es)!`);
      
      // Resetar formulário
      setFormData({
        titulo: '',
        mensagem: '',
        tipo_destinatario: '',
        filtro_bloco: '',
        filtro_apartamento: '',
        moradores_selecionados: [],
        blocos_selecionados: []
      });
      setImagemUrl('');

      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao enviar aviso:", err);
      setError("Erro ao enviar aviso");
      setTimeout(() => setError(''), 3000);
    } finally {
      // IDEMPOTÊNCIA: Delay antes de liberar
      setTimeout(() => setLoading(false), 500);
    }
  };

  if (loading && !moradores.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f7f7f7]">
        <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  const footerItems = [
    {
      icon: QrCode,
      label: 'Registrar',
      path: createPageUrl('RegistrarEncomenda'),
      key: 'registrar'
    },
    {
      icon: MessageSquare,
      label: 'Chamados',
      path: createPageUrl('ChamadosPortaria'),
      key: 'chamados'
    },
    {
      icon: Package,
      label: 'Encomendas',
      path: createPageUrl('GerenciamentoEncomendas'),
      key: 'encomendas'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-24">
      {/* Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ backgroundColor: '#3b5998' }}
      >
        {/* Safe Area Spacer for iOS */}
        <div style={{ height: 'env(safe-area-inset-top)', backgroundColor: '#3b5998' }} />
        
        <div className="flex items-end justify-between h-24 px-4 pb-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="flex-1 text-xl font-semibold text-center text-white">
            Enviar aviso
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pt-28 p-4 max-w-2xl mx-auto space-y-4">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campo Enviar Para */}
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Enviar para</label>
          <button
            onClick={() => setShowDestinatarioModal(true)}
            className="w-full h-14 bg-[#dfe3ee] rounded-lg px-4 flex items-center justify-between text-left border-2 border-[#8b9dc3]"
          >
            <span className={formData.tipo_destinatario ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {getTipoLabel()}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Seleção de Blocos */}
        {formData.tipo_destinatario === 'bloco' && (
          <div className="space-y-3">
            <label className="text-sm text-gray-600">Selecione os blocos</label>
            <div className="bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              {blocosUnicos.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhum bloco encontrado
                </div>
              ) : (
                blocosUnicos.map(bloco => (
                  <div
                    key={bloco}
                    onClick={() => toggleBloco(bloco)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      formData.blocos_selecionados.includes(bloco)
                        ? 'bg-[#3b5998] border-[#3b5998]' 
                        : 'border-gray-300'
                    }`}>
                      {formData.blocos_selecionados.includes(bloco) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{bloco}</p>
                      <p className="text-sm text-gray-500">
                        {moradores.filter(m => {
                          const res = residencias.find(r => r.id === m.residencia_id);
                          return res?.identificador_principal === bloco;
                        }).length} moradores
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Seleção de Apartamento e Moradores */}
        {formData.tipo_destinatario === 'apartamento' && (
          <div className="space-y-3">
            <Input
              placeholder="Digite o apartamento (ex: Bloco 9 Apto 103)"
              value={formData.filtro_apartamento}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  filtro_apartamento: e.target.value,
                  moradores_selecionados: []
                }));
              }}
              className="h-14 bg-[#dfe3ee] border-0 rounded-lg"
            />
            
            {formData.filtro_apartamento && moradoresDoApartamento.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Selecione os moradores deste apartamento
                </label>
                <div className="bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {moradoresDoApartamento.map(morador => {
                    const residencia = residencias.find(r => r.id === morador.residencia_id);
                    return (
                      <div
                        key={morador.id}
                        onClick={() => toggleMorador(morador.id)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.moradores_selecionados.includes(morador.id)
                            ? 'bg-[#3b5998] border-[#3b5998]' 
                            : 'border-gray-300'
                        }`}>
                          {formData.moradores_selecionados.includes(morador.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{morador.nome}</p>
                          {residencia && (
                            <p className="text-sm text-gray-500">
                              {residencia.identificador_principal} {residencia.complemento}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.filtro_apartamento && moradoresDoApartamento.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                Nenhum morador encontrado para este apartamento
              </div>
            )}
          </div>
        )}

        {formData.tipo_destinatario === 'individuais' && (
          <div className="space-y-3">
            <Input
              placeholder="Buscar morador..."
              value={searchMorador}
              onChange={(e) => setSearchMorador(e.target.value)}
              className="h-12 bg-[#dfe3ee] border-0"
            />
            <div className="bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              {moradoresFiltrados.map(morador => (
                <div
                  key={morador.id}
                  onClick={() => toggleMorador(morador.id)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    formData.moradores_selecionados.includes(morador.id) 
                      ? 'bg-[#3b5998] border-[#3b5998]' 
                      : 'border-gray-300'
                  }`}>
                    {formData.moradores_selecionados.includes(morador.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{morador.nome}</p>
                    <p className="text-sm text-gray-500">{morador.apelido_endereco}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campo Título */}
        <Input
          placeholder="Título do aviso"
          value={formData.titulo}
          onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
          className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
        />

        {/* Campo Mensagem */}
        <Textarea
          placeholder="Texto"
          value={formData.mensagem}
          onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
          rows={6}
          className="bg-[#dfe3ee] border-0 rounded-lg text-base p-4 resize-none"
        />

        {/* Imagem Anexada */}
        {imagemUrl && (
          <div className="relative">
            <img src={imagemUrl} alt="Anexo" className="w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
            <button
              onClick={() => setImagemUrl('')}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Botões Anexar Imagem */}
        <div>
          <p className="text-sm text-gray-600 text-center mb-3">Anexar imagem</p>
          <div className="flex justify-center gap-8">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading || imagemUrl}
              className="flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-[#dfe3ee] rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <span className="text-sm text-gray-700">Câmera</span>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading || imagemUrl}
              className="flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-[#dfe3ee] rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Galeria</span>
            </button>
          </div>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture
          onChange={handleImageUpload}
          className="hidden"
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Checkbox WhatsApp */}

        {/* Contador de Destinatários */}
        {destinatarios.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-blue-900">
              {destinatarios.length} {destinatarios.length === 1 ? 'destinatário' : 'destinatários'}
            </p>
          </div>
        )}

        {/* Botão Enviar */}
        <Button
          onClick={handleSubmit}
          disabled={loading || uploading || destinatarios.length === 0}
          className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-lg font-semibold shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar'
          )}
        </Button>
      </div>

      {/* Modal Selecionar Destinatário */}
      <AnimatePresence>
        {showDestinatarioModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowDestinatarioModal(false)}
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
                <h2 className="text-2xl font-bold text-[#3b5998]">Enviar para</h2>
                <button
                  onClick={() => setShowDestinatarioModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2">
                {tiposDestinatario.map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => handleDestinatarioSelect(tipo.value)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <tipo.icon className="w-6 h-6 text-[#3b5998]" />
                      <div className="text-left">
                        <p className="text-lg text-gray-900 font-semibold">{tipo.label}</p>
                        <p className="text-sm text-gray-500">{tipo.description}</p>
                      </div>
                    </div>
                    {formData.tipo_destinatario === tipo.value && (
                      <Check className="w-5 h-5 text-[#3b5998]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OperationalFooter />
    </div>
  );
}