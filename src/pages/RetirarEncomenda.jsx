import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthGuard from "../components/utils/AuthGuard";
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Upload,
  X,
  ArrowRight,
  Check,
  Search,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { logAction } from "../components/utils/logger";
import { getCondominioContext } from "../components/utils/condominioContext";
import { saveDraft, getDraft, clearDraft } from "../components/utils/sessionStorage";

export default function RetirarEncomenda() {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [condominioContext, setCondominioContext] = useState(null);

  // Etapa 1: Identificação
  const [codigoRetirada, setCodigoRetirada] = useState('');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [mostrarUnidades, setMostrarUnidades] = useState(false);

  // Etapa 2: Correspondências
  const [correspondencias, setCorrespondencias] = useState([]);
  const [correspondenciasSelecionadas, setCorrespondenciasSelecionadas] = useState([]);

  // Etapa 3: Retirada por
  const [retiradaPor, setRetiradaPor] = useState('');
  const [fotoRetirada, setFotoRetirada] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const galeriaInputRef = useRef(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    const initPage = async () => {
      await loadData();
      
      // Restaurar rascunho se existir
      const draft = getDraft('retirar_encomenda');
      if (draft && draft.etapa && !abortController.signal.aborted) {
        setEtapa(draft.etapa);
        setUnidadeSelecionada(draft.unidadeSelecionada || '');
        setCodigoRetirada(draft.codigoRetirada || '');
        setRetiradaPor(draft.retiradaPor || '');
      }
    };
    
    initPage();
    
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const context = await getCondominioContext();
      
      if (!context || !context.condominioId) {
        setError("ERRO DE SEGURANÇA: Condomínio não identificado");
        setLoading(false);
        return;
      }
      
      setCondominioContext(context);

      // PROTEÇÃO: Carregar APENAS moradores do condomínio do usuário
      const moradoresDoCondominio = await base44.entities.Morador.filter({ 
        condominio_id: context.condominioId, 
        status: 'ativo' 
      });

      // VALIDAÇÃO FINAL: Garantir isolamento
      const moradoresValidados = moradoresDoCondominio.filter(m => 
        m.condominio_id === context.condominioId
      );

      // Extrair unidades únicas
      const unidadesUnicas = [...new Set(
        moradoresValidados
          .map(m => m.apelido_endereco || m.abreviacao)
          .filter(Boolean)
      )].sort();

      setUnidades(unidadesUnicas);

      console.log(`[SECURITY] Retirar Encomenda - Condomínio: ${context.condominioId}, Unidades: ${unidadesUnicas.length}`);
      
    } catch (err) {
      console.error("[SECURITY] Erro ao carregar dados:", err);
      setError("Erro ao carregar dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Etapa 1 → 2: Buscar correspondências
  const buscarCorrespondencias = async () => {
    if (!unidadeSelecionada && !codigoRetirada) {
      setError("Preencha o código de retirada ou selecione uma unidade");
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!condominioContext || !condominioContext.condominioId) {
        setError("ERRO DE SEGURANÇA: Contexto de condomínio não disponível");
        setLoading(false);
        return;
      }

      const condominioId = condominioContext.condominioId;

      // PROTEÇÃO: Carregar APENAS dados do condomínio do usuário
      const [moradores, encomendas] = await Promise.all([
        base44.entities.Morador.filter({ condominio_id: condominioId, status: 'ativo' }),
        base44.entities.Encomenda.filter({ condominio_id: condominioId, status: 'aguardando' })
      ]);

      // VALIDAÇÃO: Garantir isolamento
      const moradoresValidados = moradores.filter(m => m.condominio_id === condominioId);
      const encomendasValidadas = encomendas.filter(e => e.condominio_id === condominioId);

      let encomendasEncontradas = [];

      // Busca por código de retirada
      if (codigoRetirada.trim()) {
        const encomenda = encomendasValidadas.find(e => e.codigo === codigoRetirada.trim());

        if (!encomenda) {
          setError(`Código ${codigoRetirada} não encontrado ou já retirado`);
          setLoading(false);
          return;
        }

        // VALIDAÇÃO: Verificar se encomenda pertence ao condomínio correto
        if (encomenda.condominio_id !== condominioId) {
          console.error('[SECURITY] TENTATIVA DE ACESSO CRUZADO BLOQUEADA');
          setError("Acesso negado");
          setLoading(false);
          return;
        }

        const morador = moradoresValidados.find(m => m.id === encomenda.morador_id);
        if (morador) {
          setUnidadeSelecionada(morador.apelido_endereco || morador.abreviacao);
          encomendasEncontradas = encomendasValidadas.filter(e => e.morador_id === morador.id);
        }
      } 
      // Busca por unidade
      else if (unidadeSelecionada) {
        const moradoresDaUnidade = moradoresValidados.filter(m => 
          m.apelido_endereco === unidadeSelecionada || m.abreviacao === unidadeSelecionada
        );

        const moradoresIds = moradoresDaUnidade.map(m => m.id);
        encomendasEncontradas = encomendasValidadas.filter(e => moradoresIds.includes(e.morador_id));
      }

      if (encomendasEncontradas.length === 0) {
        setError(`Nenhuma correspondência aguardando retirada para ${unidadeSelecionada || 'esta unidade'}`);
        setLoading(false);
        return;
      }

      // Adicionar informações do morador a cada encomenda
      const encomendasComMorador = encomendasEncontradas.map(e => {
        const morador = moradoresValidados.find(m => m.id === e.morador_id);
        return { ...e, morador };
      });

      setCorrespondencias(encomendasComMorador);
      setCorrespondenciasSelecionadas(encomendasComMorador.map(e => e.id));
      setEtapa(2);

      console.log(`[SECURITY] Busca realizada - Encomendas encontradas: ${encomendasComMorador.length}`);
      
    } catch (err) {
      console.error("[SECURITY] Erro ao buscar correspondências:", err);
      if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        setError("Erro ao buscar correspondências. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCorrespondencia = (id) => {
    setCorrespondenciasSelecionadas(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleAddFoto = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError("Por favor, selecione uma imagem válida.");
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setUploadingFoto(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFotoRetirada({
        url: file_url,
        preview: URL.createObjectURL(file),
        nome: file.name,
        tamanho: file.size
      });
    } catch (err) {
      setError("Erro ao enviar foto. Tente novamente.");
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoverFoto = () => {
    setFotoRetirada(null);
  };

  const handleLerQRCode = () => {
    // Funcionalidade de câmera desativada temporariamente
    setError("Funcionalidade de QR Code temporariamente indisponível. Use o código manual.");
    setTimeout(() => setError(''), 3000);
  };

  // Salvar rascunho automaticamente
  useEffect(() => {
    if (etapa > 1) {
      saveDraft('retirar_encomenda', {
        etapa,
        unidadeSelecionada,
        codigoRetirada,
        retiradaPor
      });
    }
  }, [etapa, unidadeSelecionada, codigoRetirada, retiradaPor]);

  const confirmarEntrega = async () => {
    // IDEMPOTÊNCIA: Prevenir múltiplas submissões
    if (submitting) {
      console.warn('[IDEMPOTENCY] Submissão duplicada ignorada');
      return;
    }

    // VALIDAÇÃO: Campos obrigatórios
    if (!correspondenciasSelecionadas || correspondenciasSelecionadas.length === 0) {
      setError("Selecione ao menos uma correspondência");
      return;
    }

    const retiradoPorSanitizado = String(retiradaPor || '').trim();
    if (!retiradoPorSanitizado) {
      setError("Informe quem está retirando");
      return;
    }

    // SANITIZAÇÃO: Limitar tamanho
    const retiradoPorFinal = retiradoPorSanitizado.slice(0, 200);

    setSubmitting(true);
    setError('');

    try {
      const agora = new Date().toISOString();
      const currentUser = await base44.auth.me();
      const porteiro = String(currentUser?.full_name || "Porteiro").trim().slice(0, 100);

      // VALIDAÇÃO: Verificar ownership de todas as encomendas
      for (const encId of correspondenciasSelecionadas) {
        const encomenda = correspondencias.find(e => e.id === encId);
        
        if (!encomenda) {
          throw new Error(`Encomenda ${encId} não encontrada`);
        }

        // VALIDAÇÃO CRÍTICA: Garantir que encomenda pertence ao condomínio
        if (!condominioContext.isAdminMaster && encomenda.condominio_id !== condominioContext.condominioId) {
          throw new Error('SECURITY_BREACH: Tentativa de retirar encomenda de outro condomínio');
        }

        // PROTEÇÃO: Prevenir atualização de encomenda já retirada
        if (encomenda.status !== 'aguardando') {
          setError(`Encomenda ${encomenda.codigo} já foi retirada anteriormente`);
          setSubmitting(false);
          return;
        }
      }

      // Atualizar cada encomenda selecionada
      for (const encId of correspondenciasSelecionadas) {
        await base44.entities.Encomenda.update(encId, {
          status: 'retirada',
          data_retirada: agora,
          retirado_por: retiradoPorFinal,
          foto_documento: fotoRetirada?.url || null,
          porteiro_retirada: porteiro,
          metodo_retirada: codigoRetirada ? '🔒 Código - Mais Seguro' : 'Busca manual'
        });

        const encomenda = correspondencias.find(e => e.id === encId);
        await logAction('retirar_encomenda', `Encomenda ${encomenda.codigo} retirada por ${retiradoPorFinal} da unidade ${unidadeSelecionada}`, {
          condominio_id: condominioContext.condominioId,
          dados_novos: {
            encomenda_id: encId,
            retirado_por: retiradoPorFinal,
            porteiro: porteiro,
            data_hora: agora
          }
        });
      }

      setEtapa(5);
      clearDraft('retirar_encomenda');
      
    } catch (err) {
      console.error('[DATA_INTEGRITY] Erro ao processar entrega:', err);
      
      if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError("Erro de conexão. Seus dados foram salvos, tente novamente.");
      } else if (err.message?.includes('SECURITY_BREACH')) {
        setError("Erro de segurança crítico. Operação bloqueada.");
      } else {
        setError("Erro ao processar entrega. Verifique os dados e tente novamente.");
      }

      if (condominioContext?.condominioId) {
        await logAction('retirar_encomenda', `Erro ao retirar encomenda: ${err.message}`, {
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

  const resetFlow = () => {
    setEtapa(1);
    setCodigoRetirada('');
    setUnidadeSelecionada('');
    setCorrespondencias([]);
    setCorrespondenciasSelecionadas([]);
    setRetiradaPor('');
    setFotoRetirada(null);
    setError('');
    clearDraft('retirar_encomenda');
  };

  if (loading && etapa === 1) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="Entregar correspondência" />
          <div className="flex items-center justify-center pt-32 pb-20">
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
        <MoradorHeader title="Entregar correspondência" />

        <div className="pt-28 pb-24 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-6 flex items-center justify-between">
              {['Identificação', 'Correspondências', 'Retirada por', 'Revisar e entregar'].map((label, idx) => {
                const stepNumber = idx + 1;
                const isActive = etapa === stepNumber;
                const isCompleted = etapa > stepNumber;
                const canNavigate = isCompleted || isActive;

                return (
                  <React.Fragment key={stepNumber}>
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => {
                          if (canNavigate && stepNumber < etapa) {
                            setEtapa(stepNumber);
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                          isCompleted
                            ? 'bg-[#3b5998] text-white cursor-pointer hover:bg-[#2d4373]'
                            : isActive
                            ? 'bg-[#3b5998] text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                      </div>
                      <span className={`text-xs mt-1 ${isActive ? 'text-[#3b5998] font-semibold' : 'text-gray-500'}`}>
                        {label.split(' ')[0]}
                      </span>
                    </div>
                    {idx < 3 && <div className="flex-1 h-px bg-gray-300 mx-2 mt-4" />}
                  </React.Fragment>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {/* ETAPA 1: Identificação */}
              {etapa === 1 && (
                <motion.div
                  key="etapa1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Informe o código de retirada ou a unidade.
                      </p>

                      {/* Dica de segurança */}
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800" style={{ fontSize: '0.5rem' }}>
                          <strong>Dica:</strong> Utilizar o código de retirada ou o QR Code torna o processo de entrega mais seguro
                        </AlertDescription>
                      </Alert>

                      <div>
                        <label className="text-sm text-gray-700 mb-1 block">Código de retirada</label>
                        <Input
                          placeholder="Código de retirada"
                          value={codigoRetirada}
                          onChange={(e) => setCodigoRetirada(e.target.value)}
                          className="h-12 bg-[#f7f7f7] border-gray-300"
                        />
                      </div>

                      <div className="relative">
                        <label className="text-sm text-gray-700 mb-1 block">Unidade</label>
                        <div
                          onClick={() => setMostrarUnidades(!mostrarUnidades)}
                          className="w-full h-12 px-3 bg-[#f7f7f7] border border-gray-300 rounded-md text-gray-900 flex items-center justify-between cursor-pointer"
                        >
                          <span className={unidadeSelecionada ? 'text-gray-900' : 'text-gray-500'}>
                            {unidadeSelecionada || 'Unidade'}
                          </span>
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        </div>

                        {mostrarUnidades && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-hidden">
                            <div className="p-2 border-b sticky top-0 bg-white">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  placeholder="Buscar unidade..."
                                  value={buscaUnidade}
                                  onChange={(e) => setBuscaUnidade(e.target.value)}
                                  className="pl-9 h-10 bg-[#f7f7f7] border-gray-300"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {unidades
                                .filter(u => u.toLowerCase().includes(buscaUnidade.toLowerCase()))
                                .map(u => (
                                  <div
                                    key={u}
                                    onClick={() => {
                                      setUnidadeSelecionada(u);
                                      setMostrarUnidades(false);
                                      setBuscaUnidade('');
                                    }}
                                    className="px-3 py-2 hover:bg-[#f7f7f7] cursor-pointer text-sm text-gray-900"
                                  >
                                    {u}
                                  </div>
                                ))}
                              {unidades.filter(u => u.toLowerCase().includes(buscaUnidade.toLowerCase())).length === 0 && (
                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                  Nenhuma unidade encontrada
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleLerQRCode}
                        variant="outline"
                        className="w-full h-12 text-[#3b5998] border-[#3b5998] hover:bg-blue-50"
                      >
                        <span className="mr-2">▦▦</span> Ler QRCode
                      </Button>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <div className="fixed bottom-24 left-0 right-0 px-4">
                    <Button
                      onClick={buscarCorrespondencias}
                      disabled={loading || (!codigoRetirada.trim() && !unidadeSelecionada)}
                      className="w-full max-w-2xl mx-auto h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white font-medium rounded-full shadow-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Próximo <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 2: Correspondências */}
              {etapa === 2 && (
                <motion.div
                  key="etapa2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-gray-700 mb-4">
                        Selecione a correspondência da unidade <strong>{unidadeSelecionada}</strong> que serão entregues.
                      </p>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {correspondencias.map(corresp => (
                          <div
                            key={corresp.id}
                            onClick={() => handleToggleCorrespondencia(corresp.id)}
                            className="flex items-start gap-3 p-4 bg-[#f7f7f7] rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <Checkbox
                              checked={correspondenciasSelecionadas.includes(corresp.id)}
                              onCheckedChange={() => handleToggleCorrespondencia(corresp.id)}
                              className="mt-1"
                            />

                            {corresp.foto_encomenda && (
                              <img
                                src={corresp.foto_encomenda}
                                alt="Correspondência"
                                className="w-16 h-16 object-cover rounded border"
                              />
                            )}

                            <div className="flex-1">
                              <p className="text-sm text-gray-600">Portaria</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(corresp.data_entrada).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(corresp.data_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-gray-500">{corresp.observacoes || corresp.remetente || 'sua encomenda chegou'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="fixed bottom-24 left-0 right-0 px-4">
                    <Button
                      onClick={() => setEtapa(3)}
                      disabled={correspondenciasSelecionadas.length === 0}
                      className="w-full max-w-2xl mx-auto h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white font-medium rounded-full shadow-lg"
                    >
                      Próximo <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 3: Retirada por */}
              {etapa === 3 && (
                <motion.div
                  key="etapa3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-gray-700 mb-4">
                        Informe a pessoa que está retirando a correspondência, se desejar inclua fotos (documentos, assinaturas, fotos, etc) do retirante.
                      </p>

                      <div>
                        <label className="text-sm text-gray-700 mb-1 block">Retirada por</label>
                        <Input
                          placeholder="Retirada por"
                          value={retiradaPor}
                          onChange={(e) => setRetiradaPor(e.target.value)}
                          className="h-12 bg-[#f7f7f7] border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => galeriaInputRef.current?.click()}
                          disabled={uploadingFoto}
                          className="w-full h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Selecionar da Galeria
                        </Button>
                      </div>

                      {uploadingFoto && (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="w-5 h-5 animate-spin text-[#3b5998]" />
                          <span className="ml-2 text-sm text-gray-600">Enviando foto...</span>
                        </div>
                      )}

                      {fotoRetirada && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Arquivos anexados:</p>
                          <div className="flex items-center justify-between p-3 bg-[#f7f7f7] rounded-lg">
                            <div className="flex items-center gap-3">
                              <img src={fotoRetirada.preview} alt="Foto" className="w-12 h-12 object-cover rounded" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{fotoRetirada.nome}</p>
                                <p className="text-xs text-gray-500">{Math.round(fotoRetirada.tamanho / 1024)} KB • JPG</p>
                              </div>
                            </div>
                            <button onClick={handleRemoverFoto} className="p-1 hover:bg-gray-200 rounded">
                              <X className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}

                      <input
                        ref={galeriaInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAddFoto(e.target.files[0])}
                        className="hidden"
                      />

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <div className="fixed bottom-24 left-0 right-0 px-4">
                    <Button
                      onClick={() => setEtapa(4)}
                      disabled={!retiradaPor.trim()}
                      className="w-full max-w-2xl mx-auto h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white font-medium rounded-full shadow-lg"
                    >
                      Próximo <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 4: Revisar e entregar */}
              {etapa === 4 && (
                <motion.div
                  key="etapa4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Geral</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Unidade</p>
                            <p className="text-sm font-medium text-gray-900">{unidadeSelecionada}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Correspondências selecionadas</h3>
                        <div className="space-y-3">
                          {correspondencias
                            .filter(c => correspondenciasSelecionadas.includes(c.id))
                            .map(corresp => (
                              <div key={corresp.id} className="flex items-start gap-3 p-3 bg-[#f7f7f7] rounded-lg">
                                {corresp.foto_encomenda && (
                                  <img
                                    src={corresp.foto_encomenda}
                                    alt="Correspondência"
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="text-sm text-gray-600">Portaria</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(corresp.data_entrada).toLocaleDateString('pt-BR')} às{' '}
                                    {new Date(corresp.data_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <p className="text-xs text-gray-500">{corresp.observacoes || corresp.remetente}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Retirada por</h3>
                        <div>
                          <p className="text-xs text-gray-500">Nome</p>
                          <p className="text-sm font-medium text-gray-900 mb-3">{retiradaPor}</p>

                          {fotoRetirada && (
                            <img
                              src={fotoRetirada.preview}
                              alt="Foto retirada"
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="fixed bottom-24 left-0 right-0 px-4">
                    <Button
                      onClick={confirmarEntrega}
                      disabled={submitting}
                      className="w-full max-w-2xl mx-auto h-12 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white font-medium rounded-full shadow-lg"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Entregar <Check className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 5: Conclusão */}
              {etapa === 5 && (
                <motion.div
                  key="etapa5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Entrega Concluída!</h2>
                  <p className="text-gray-600 mb-2">
                    {correspondenciasSelecionadas.length} correspondência(s) entregue(s)
                  </p>
                  <p className="text-gray-500 text-sm mb-8">
                    Para: <strong>{retiradaPor}</strong> • {unidadeSelecionada}
                  </p>
                  <Button
                    onClick={resetFlow}
                    className="bg-[#3b5998] hover:bg-[#2d4373] text-white px-8"
                  >
                    Nova Entrega
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <MoradorFooter />
      </div>
    </AuthGuard>
  );
}