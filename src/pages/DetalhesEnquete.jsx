import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trash2, Loader2, AlertCircle, CheckCircle, List, X, Eye, ChevronDown, ChevronUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "../components/utils/authUtils";
import { getCondominioContext } from "../components/utils/condominioContext";
import { safeEntityCall } from "../components/utils/apiCache";

export default function DetalhesEnquetePage() {
  const [enquete, setEnquete] = useState(null);
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [moradorId, setMoradorId] = useState(null);
  const [jaVotou, setJaVotou] = useState(false);
  const [isSindico, setIsSindico] = useState(false);
  const [respostas, setRespostas] = useState({});
  const [showAlternativaModal, setShowAlternativaModal] = useState(false);
  const [perguntaAtualModal, setPerguntaAtualModal] = useState(null);
  
  const [modoVisualizacao, setModoVisualizacao] = useState('votar');
  const [votosDetalhados, setVotosDetalhados] = useState({});
  const [expandedAlternativas, setExpandedAlternativas] = useState({});
  const [moradoresMap, setMoradoresMap] = useState({});
  const [moradoresCarregados, setMoradoresCarregados] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const urlParams = new URLSearchParams(window.location.search);
      const enqueteId = urlParams.get('id');
      
      if (!enqueteId) {
        setError("Enquete nao encontrada");
        setLoading(false);
        return;
      }

      console.log("[DetalhesEnquete] Carregando dados...");

      // Delay inicial
      await new Promise(resolve => setTimeout(resolve, 300));

      const role = await getUserRole();
      const context = await getCondominioContext();
      
      setMoradorId(context.userId);
      setIsSindico(role.userType === 'administrador');

      // Delay entre chamadas
      await new Promise(resolve => setTimeout(resolve, 300));

      const enqueteData = await base44.entities.Enquete.get(enqueteId);
      setEnquete(enqueteData);

      console.log("[DetalhesEnquete] Enquete carregada:", enqueteData.nome);

      // Delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const todasPerguntas = await base44.entities.PerguntaEnquete.filter({ 
        enquete_id: enqueteId 
      });
      const perguntasOrdenadas = todasPerguntas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setPerguntas(perguntasOrdenadas);

      console.log("[DetalhesEnquete] Perguntas carregadas:", perguntasOrdenadas.length);

      // Delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const todosVotos = await base44.entities.VotoEnquete.filter({
        enquete_id: enqueteId,
        morador_id: context.userId
      });
      
      if (todosVotos.length > 0) {
        setJaVotou(true);
        const respostasAnteriores = {};
        todosVotos.forEach(voto => {
          if (voto.tipo_voto === 'alternativa') {
            respostasAnteriores[voto.pergunta_id] = voto.alternativa_escolhida;
          } else {
            respostasAnteriores[voto.pergunta_id] = voto.resposta_descritiva || '';
          }
        });
        setRespostas(respostasAnteriores);
        console.log("[DetalhesEnquete] Usuario ja votou");
      }

      // Carregar moradores e resultados apenas se necessário
      if (role.userType === 'administrador' || enqueteData.resultado_publico) {
        console.log("[DetalhesEnquete] Carregando resultados...");
        
        // Delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await carregarMoradoresEResultados(enqueteId, perguntasOrdenadas, context.condominioId);
      }

    } catch (err) {
      console.error("[DetalhesEnquete] Erro ao carregar enquete:", err);
      setError("Erro ao carregar enquete");
    } finally {
      setLoading(false);
    }
  };

  const carregarMoradoresEResultados = async (enqueteId, perguntas, condominioId) => {
    try {
      // Usar safeEntityCall para retry automático
      const todosMoradores = await safeEntityCall('Morador', 'filter', { 
        condominio_id: condominioId 
      });

      console.log("[DetalhesEnquete] Moradores carregados:", todosMoradores.length);

      const moradoresById = {};
      todosMoradores.forEach(m => {
        moradoresById[m.id] = m;
      });
      setMoradoresMap(moradoresById);
      setMoradoresCarregados(true);

      // Delay
      await new Promise(resolve => setTimeout(resolve, 300));

      await carregarResultados(enqueteId, perguntas);
    } catch (err) {
      console.error("[DetalhesEnquete] Erro ao carregar moradores:", err);
      // Não bloqueia, só registra o erro
      setMoradoresCarregados(true); // Marca como tentado
    }
  };

  const carregarResultados = async (enqueteId, perguntas) => {
    try {
      const todosVotos = await base44.entities.VotoEnquete.filter({
        enquete_id: enqueteId
      });

      console.log("[DetalhesEnquete] Votos carregados:", todosVotos.length);

      const votosPorPergunta = {};
      
      perguntas.forEach(pergunta => {
        const votosDaPergunta = todosVotos.filter(v => v.pergunta_id === pergunta.id);
        
        if (pergunta.tipo_resposta === 'multipla_escolha') {
          const votosPorAlternativa = {};
          pergunta.alternativas?.forEach(alt => {
            votosPorAlternativa[alt.letra] = votosDaPergunta.filter(v => v.alternativa_escolhida === alt.letra);
          });
          votosPorPergunta[pergunta.id] = votosPorAlternativa;
        } else {
          votosPorPergunta[pergunta.id] = votosDaPergunta;
        }
      });

      setVotosDetalhados(votosPorPergunta);
      console.log("[DetalhesEnquete] Resultados processados");
    } catch (err) {
      console.error("[DetalhesEnquete] Erro ao carregar resultados:", err);
    }
  };

  const handleSelecionarAlternativa = (pergunta) => {
    setPerguntaAtualModal(pergunta);
    setShowAlternativaModal(true);
  };

  const handleEscolherAlternativa = (letra) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaAtualModal.id]: letra
    }));
    setShowAlternativaModal(false);
    setPerguntaAtualModal(null);
  };

  const handleRespostaDescritivaChange = (perguntaId, texto) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: texto
    }));
  };

  const handleResponder = async () => {
    try {
      setSubmitting(true);
      setError("");

      const perguntasNaoRespondidas = perguntas.filter(p => {
        const resposta = respostas[p.id];
        return !resposta || (typeof resposta === 'string' && !resposta.trim());
      });

      if (perguntasNaoRespondidas.length > 0) {
        setError("Por favor, responda todas as perguntas");
        setTimeout(() => setError(""), 3000);
        setSubmitting(false);
        return;
      }

      const role = await getUserRole();
      const context = await getCondominioContext();

      for (const pergunta of perguntas) {
        const resposta = respostas[pergunta.id];
        
        let votoData = {
          enquete_id: enquete.id,
          pergunta_id: pergunta.id,
          condominio_id: context.condominioId,
          morador_id: context.userId,
          morador_nome: role.morador?.nome || role.user.full_name,
          data_voto: new Date().toISOString()
        };

        if (pergunta.tipo_resposta === 'multipla_escolha') {
          votoData.tipo_voto = 'alternativa';
          votoData.alternativa_escolhida = resposta;
          
          const alternativasAtualizadas = pergunta.alternativas.map(alt => {
            if (alt.letra === resposta) {
              return { ...alt, votos: (alt.votos || 0) + 1 };
            }
            return alt;
          });
          
          await base44.entities.PerguntaEnquete.update(pergunta.id, {
            alternativas: alternativasAtualizadas
          });
        } else {
          votoData.tipo_voto = 'aprovado';
          votoData.resposta_descritiva = resposta;
        }

        await base44.entities.VotoEnquete.create(votoData);

        // Delay entre criações
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await base44.entities.Enquete.update(enquete.id, {
        total_votos: (enquete.total_votos || 0) + 1
      });

      setSuccess("Resposta enviada com sucesso!");
      setJaVotou(true);
      
      setTimeout(() => {
        window.history.back();
      }, 2000);

    } catch (err) {
      console.error("Erro ao enviar resposta:", err);
      setError("Erro ao enviar resposta. Tente novamente.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerResultados = async () => {
    setModoVisualizacao('resultados');
    
    // Se ainda não carregou moradores, carregar agora
    if (!moradoresCarregados) {
      try {
        const context = await getCondominioContext();
        await carregarMoradoresEResultados(enquete.id, perguntas, context.condominioId);
      } catch (err) {
        console.error("Erro ao carregar resultados:", err);
        setError("Erro ao carregar resultados");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleTornarPublico = async () => {
    if (!window.confirm("Tem certeza que deseja tornar os resultados publicos? Todos os moradores poderao ver os votos.")) {
      return;
    }

    try {
      setSubmitting(true);
      
      await base44.entities.Enquete.update(enquete.id, {
        resultado_publico: true
      });

      setEnquete(prev => ({ ...prev, resultado_publico: true }));
      setSuccess("Resultados tornados publicos com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Erro ao tornar publico:", err);
      setError("Erro ao tornar publico");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcluirEnquete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta enquete?")) {
      return;
    }

    try {
      setSubmitting(true);
      
      const votos = await base44.entities.VotoEnquete.filter({ enquete_id: enquete.id });
      for (const voto of votos) {
        await base44.entities.VotoEnquete.delete(voto.id);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      for (const pergunta of perguntas) {
        await base44.entities.PerguntaEnquete.delete(pergunta.id);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await base44.entities.Enquete.delete(enquete.id);
      
      window.history.back();
    } catch (err) {
      console.error("Erro ao excluir enquete:", err);
      setError("Erro ao excluir enquete");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const getAlternativaTexto = (pergunta, letra) => {
    const alt = pergunta.alternativas?.find(a => a.letra === letra);
    return alt ? alt.texto : letra;
  };

  const getPrimeiroNome = (nomeCompleto) => {
    if (!nomeCompleto) return '';
    return nomeCompleto.split(' ')[0];
  };

  const toggleExpandAlternativa = (perguntaId, letra) => {
    const key = `${perguntaId}-${letra}`;
    setExpandedAlternativas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const podeVerResultados = isSindico || enquete?.resultado_publico;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="bg-[#3b5998] text-white p-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="w-7 h-7" />
            </button>
            <h1 className="text-2xl font-semibold">Enquete</h1>
            <div className="w-12" />
          </div>
        </div>
        <div className="flex items-center justify-center pt-24">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
        </div>
      </div>
    );
  }

  if (!enquete) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="bg-[#3b5998] text-white p-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="w-7 h-7" />
            </button>
            <h1 className="text-2xl font-semibold">Enquete</h1>
            <div className="w-12" />
          </div>
        </div>
        <div className="p-4 max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Enquete nao encontrada</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-24">
      <div className="bg-[#3b5998] text-white p-5 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-2xl font-semibold">Enquete</h1>
          {isSindico && (
            <button 
              onClick={handleExcluirEnquete}
              disabled={submitting}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-7 h-7" />
            </button>
          )}
          {!isSindico && <div className="w-12" />}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{enquete.nome}</h2>
          <div className="w-full h-1 bg-gray-300 rounded-full mt-4" />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {isSindico && podeVerResultados && !jaVotou && (
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setModoVisualizacao('votar')}
              variant={modoVisualizacao === 'votar' ? 'default' : 'outline'}
              className={`flex-1 ${modoVisualizacao === 'votar' ? 'bg-[#3b5998] text-white' : ''}`}
            >
              Votar
            </Button>
            <Button
              onClick={handleVerResultados}
              variant={modoVisualizacao === 'resultados' ? 'default' : 'outline'}
              className={`flex-1 ${modoVisualizacao === 'resultados' ? 'bg-[#3b5998] text-white' : ''}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Resultados
            </Button>
          </div>
        )}

        {modoVisualizacao === 'votar' && !podeVerResultados && (
          <div className="space-y-6">
            {perguntas.map((pergunta) => (
              <div key={pergunta.id} className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{pergunta.pergunta}</h3>

                {pergunta.tipo_resposta === 'multipla_escolha' && (
                  <div className="relative">
                    <button
                      onClick={() => !jaVotou && handleSelecionarAlternativa(pergunta)}
                      disabled={jaVotou}
                      className={`w-full h-14 bg-white border-2 ${jaVotou ? 'border-blue-300' : 'border-gray-300'} rounded-lg px-4 flex items-center justify-between text-left ${!jaVotou && 'hover:border-[#3b5998] cursor-pointer'}`}
                    >
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Selecionar alternativa</p>
                        <p className="text-base text-gray-900">
                          {respostas[pergunta.id] 
                            ? getAlternativaTexto(pergunta, respostas[pergunta.id])
                            : 'Selecione uma opcao'}
                        </p>
                      </div>
                      {!jaVotou && <List className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                )}

                {pergunta.tipo_resposta === 'descritiva' && (
                  <Textarea
                    placeholder="Responder"
                    value={respostas[pergunta.id] || ''}
                    onChange={(e) => !jaVotou && handleRespostaDescritivaChange(pergunta.id, e.target.value)}
                    disabled={jaVotou}
                    rows={5}
                    className="bg-white border-2 border-gray-300 rounded-lg resize-none disabled:bg-gray-50 disabled:border-blue-300"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {(modoVisualizacao === 'resultados' || podeVerResultados) && (jaVotou || isSindico) && (
          <div className="space-y-6">
            {perguntas.map((pergunta) => (
              <div key={pergunta.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{pergunta.pergunta}</h3>

                {pergunta.tipo_resposta === 'multipla_escolha' && (
                  <div className="space-y-3">
                    {pergunta.alternativas?.filter(alt => alt.texto.trim()).map((alt) => {
                      const votosNaAlternativa = votosDetalhados[pergunta.id]?.[alt.letra] || [];
                      const totalVotos = Object.values(votosDetalhados[pergunta.id] || {}).reduce((acc, votos) => acc + votos.length, 0);
                      const porcentagem = totalVotos > 0 ? (votosNaAlternativa.length / totalVotos) * 100 : 0;
                      const isExpanded = expandedAlternativas[`${pergunta.id}-${alt.letra}`];

                      return (
                        <div key={alt.letra} className="space-y-2">
                          <div 
                            onClick={() => votosNaAlternativa.length > 0 && toggleExpandAlternativa(pergunta.id, alt.letra)}
                            className={`${votosNaAlternativa.length > 0 ? 'cursor-pointer' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{alt.texto}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {votosNaAlternativa.length} {votosNaAlternativa.length === 1 ? 'voto' : 'votos'}
                                </span>
                                {votosNaAlternativa.length > 0 && (
                                  isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#3b5998] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${porcentagem}%` }}
                              />
                            </div>
                          </div>

                          {isExpanded && votosNaAlternativa.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 space-y-2 pt-2 border-l-2 border-gray-200"
                            >
                              {votosNaAlternativa.map((voto) => {
                                const morador = moradoresMap[voto.morador_id];
                                return (
                                  <div key={voto.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>
                                      {getPrimeiroNome(voto.morador_nome)}
                                      {morador?.apelido_endereco && ` (${morador.apelido_endereco})`}
                                    </span>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {pergunta.tipo_resposta === 'descritiva' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        {votosDetalhados[pergunta.id]?.length || 0} {(votosDetalhados[pergunta.id]?.length || 0) === 1 ? 'resposta' : 'respostas'}
                      </span>
                    </div>
                    {votosDetalhados[pergunta.id]?.map((voto) => {
                      const morador = moradoresMap[voto.morador_id];
                      return (
                        <div key={voto.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {getPrimeiroNome(voto.morador_nome)}
                              {morador?.apelido_endereco && ` (${morador.apelido_endereco})`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{voto.resposta_descritiva}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {modoVisualizacao === 'votar' && !jaVotou && !podeVerResultados && (
          <div className="mt-8">
            <Button
              onClick={handleResponder}
              disabled={submitting || enquete.status === 'encerrada'}
              className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-base font-semibold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Responder'
              )}
            </Button>
          </div>
        )}

        {isSindico && !enquete.resultado_publico && jaVotou && (
          <div className="mt-8">
            <Button
              onClick={handleTornarPublico}
              disabled={submitting}
              className="w-full h-14 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-full text-base font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  Tornar publica a votacao
                </>
              )}
            </Button>
          </div>
        )}

        {jaVotou && !isSindico && !podeVerResultados && (
          <div className="mt-8">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Voce ja respondeu esta enquete. Os resultados serao publicados pelo sindico.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {enquete.resultado_publico && (
          <div className="mt-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Resultados publicos - Todos podem ver os votos
              </AlertDescription>
            </Alert>
          </div>
        )}

        {enquete.status === 'encerrada' && (
          <div className="mt-8">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Esta enquete foi encerrada
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAlternativaModal && perguntaAtualModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowAlternativaModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl w-full p-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#3b5998]">Selecionar alternativa</h3>
                <button
                  onClick={() => setShowAlternativaModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {perguntaAtualModal.alternativas
                  ?.filter(alt => alt.texto.trim())
                  .map((alt) => (
                    <button
                      key={alt.letra}
                      onClick={() => handleEscolherAlternativa(alt.letra)}
                      className="w-full p-4 text-left hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0"
                    >
                      <p className="text-base text-gray-900">{alt.texto}</p>
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