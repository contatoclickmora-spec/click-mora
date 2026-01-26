import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import AuthGuard from "../components/utils/AuthGuard";
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader2, Package, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { filterByCondominio, getCondominioContext } from "../components/utils/condominioContext";
import { logAction } from "../components/utils/logger";
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificacoesWhatsApp() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [moradoresComEncomendas, setMoradoresComEncomendas] = useState([]);
  const [whatsappConfig, setWhatsappConfig] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [condominioContext, setCondominioContext] = useState(null);
  const [selectedMoradores, setSelectedMoradores] = useState(new Set());
  const [contextLoaded, setContextLoaded] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Validação de contexto com tratamento de erro robusto
      let context = null;
      try {
        context = await getCondominioContext();
        console.log('[NOTIFICAÇÕES WHATSAPP] Context obtido:', context);
      } catch (err) {
        console.error('[NOTIFICAÇÕES WHATSAPP] ❌ Erro ao buscar contexto:', err);
        setError("Erro ao carregar contexto do condomínio. Verifique suas permissões.");
        setMoradoresComEncomendas([]);
        setSelectedMoradores(new Set());
        setContextLoaded(true);
        setLoading(false);
        return;
      }
      
      // Validar se contexto é válido
      if (!context || !context.condominioId) {
        console.error('[NOTIFICAÇÕES WHATSAPP] ❌ Contexto inválido:', context);
        setError("Esta página é acessível apenas para síndicos e funcionários de condomínio.");
        setMoradoresComEncomendas([]);
        setSelectedMoradores(new Set());
        setContextLoaded(true);
        setLoading(false);
        return;
      }
      
      setCondominioContext(context);
      setContextLoaded(true);
      console.log('[NOTIFICAÇÕES WHATSAPP] ✅ Context validado:', context);

      // Buscar dados com validação individual
      let encomendasRaw = [];
      let moradoresRaw = [];
      let configsRaw = [];
      
      try {
        encomendasRaw = await base44.entities.Encomenda.list();
  
      } catch (err) {
        console.warn('[NOTIFICAÇÕES WHATSAPP] Erro ao carregar encomendas:', err);
      }
      
      try {
        moradoresRaw = await base44.entities.Morador.list();
  
      } catch (err) {
        console.warn('[NOTIFICAÇÕES WHATSAPP] Erro ao carregar moradores:', err);
      }
      
      try {
        configsRaw = await base44.entities.WhatsAppConfig.list();
  
      } catch (err) {
        console.warn('[NOTIFICAÇÕES WHATSAPP] Erro ao carregar configs:', err);
      }

      // Garantir que são arrays
      const encomendas = Array.isArray(encomendasRaw) ? encomendasRaw : [];
      const moradores = Array.isArray(moradoresRaw) ? moradoresRaw : [];
      const configs = Array.isArray(configsRaw) ? configsRaw : [];



      // Filtrar com segurança
      const encomendasFiltradas = await filterByCondominio(encomendas).catch(() => []);
      const moradoresFiltrados = await filterByCondominio(moradores).catch(() => []);



      // Buscar config do WhatsApp do condomínio
      const config = Array.isArray(configs) ? configs.find(c => 
        c?.condominio_id === context.condominioId && c?.ativo
      ) : null;
      
      setWhatsappConfig(config || null);

      // Filtrar encomendas pendentes com validação
      const encomendasArray = Array.isArray(encomendasFiltradas) ? encomendasFiltradas : [];
      const encomendasPendentes = encomendasArray.filter(e => e?.status === 'aguardando');



      // Agrupar por morador
      const agrupamento = {};
      const moradoresArray = Array.isArray(moradoresFiltrados) ? moradoresFiltrados : [];
      
      encomendasPendentes.forEach(encomenda => {
        if (!encomenda?.morador_id) return;
        
        if (!agrupamento[encomenda.morador_id]) {
          const morador = moradoresArray.find(m => m?.id === encomenda.morador_id);
          if (morador?.telefone) {
            agrupamento[encomenda.morador_id] = {
              morador: morador,
              encomendas: [],
              status: 'pendente',
              ultima_notificacao: null
            };
          }
        }
        
        if (agrupamento[encomenda.morador_id]) {
          agrupamento[encomenda.morador_id].encomendas.push(encomenda);
          
          // Capturar a última notificação enviada com validação
          if (encomenda.ultima_notificacao_enviada) {
            try {
              const dataNotif = new Date(encomenda.ultima_notificacao_enviada);
              if (!isNaN(dataNotif.getTime())) {
                if (!agrupamento[encomenda.morador_id].ultima_notificacao || 
                    dataNotif > new Date(agrupamento[encomenda.morador_id].ultima_notificacao)) {
                  agrupamento[encomenda.morador_id].ultima_notificacao = encomenda.ultima_notificacao_enviada;
                }
              }
            } catch (e) {
              console.warn('[NOTIFICAÇÕES WHATSAPP] Erro ao processar data:', e);
            }
          }
        }
      });

      const lista = Object.values(agrupamento);
      setMoradoresComEncomendas(Array.isArray(lista) ? lista : []);
      

      
      // Selecionar todos por padrão
      const allIds = new Set(lista.map(item => item?.morador?.id).filter(Boolean));
      setSelectedMoradores(allIds);

    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.code === 'ECONNABORTED' || err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        return;
      }
      console.error("[NOTIFICAÇÕES WHATSApp] ❌ Erro crítico ao carregar:", err, err.stack);
      setMoradoresComEncomendas([]);
      setSelectedMoradores(new Set());
      setContextLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!Array.isArray(moradoresComEncomendas)) return;
    
    if (selectedMoradores.size === moradoresComEncomendas.length) {
      setSelectedMoradores(new Set());
    } else {
      const allIds = new Set(moradoresComEncomendas.map(item => item?.morador?.id).filter(Boolean));
      setSelectedMoradores(allIds);
    }
  };

  const toggleMorador = (moradorId) => {
    const newSelected = new Set(selectedMoradores);
    if (newSelected.has(moradorId)) {
      newSelected.delete(moradorId);
    } else {
      newSelected.add(moradorId);
    }
    setSelectedMoradores(newSelected);
  };

  const removerMorador = (moradorId) => {
    if (!moradorId) return;
    // Remover da lista de exibição
    setMoradoresComEncomendas(prev => 
      Array.isArray(prev) ? prev.filter(item => item?.morador?.id !== moradorId) : []
    );
    // Remover da seleção
    setSelectedMoradores(prev => {
      const newSet = new Set(prev);
      newSet.delete(moradorId);
      return newSet;
    });
  };

  const notificarMoradores = async () => {
    if (!selectedMoradores || selectedMoradores.size === 0) {
      setError("Selecione pelo menos um morador para notificar.");
      return;
    }
    
    if (!whatsappConfig || !whatsappConfig.ativo) {
      setError("WhatsApp não configurado. Entre em contato com o administrador do sistema.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const { enviarNotificacaoEncomenda } = await import("@/functions/enviarNotificacaoEncomenda");
      
      let enviados = 0;
      let erros = 0;
      const moradoresEnviados = [];

      for (const item of moradoresComEncomendas) {
        if (!item?.morador?.id || !selectedMoradores.has(item.morador.id)) continue;

        const consentimento = item.morador.whatsapp_notificacoes || 'pendente';
        const primeiraEncomenda = !item.morador.whatsapp_primeira_encomenda_enviada;

        if (primeiraEncomenda || consentimento === 'aceito') {
          try {
            const resultado = await enviarNotificacaoEncomenda({
              condominioId: condominioContext.condominioId,
              moradorId: item.morador.id,
              encomendas: item.encomendas
            });

            if (resultado.success) {
              enviados++;
              moradoresEnviados.push(item.morador.id);
              
              // Atualizar timestamp de última notificação em todas as encomendas do morador
              const timestamp = new Date().toISOString();
              for (const encomenda of item.encomendas) {
                await base44.entities.Encomenda.update(encomenda.id, {
                  ultima_notificacao_enviada: timestamp
                });
              }
            } else {
              erros++;
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
          } catch (err) {
            console.error(`Erro ao enviar para ${item.morador.nome}:`, err);
            erros++;
          }
        }
      }

      if (moradoresEnviados.length > 0) {
        setMoradoresComEncomendas(prev => 
          prev.filter(item => !moradoresEnviados.includes(item.morador.id))
        );
        setSelectedMoradores(prev => {
          const newSet = new Set(prev);
          moradoresEnviados.forEach(id => newSet.delete(id));
          return newSet;
        });
      }

      setSuccess(`✅ ${enviados} notificação(ões) enviada(s) com sucesso!`);
      setTimeout(() => setSuccess(""), 5000);
      
      await logAction('enviar_notificacoes_whatsapp', 
        `Notificações WhatsApp enviadas: ${enviados} sucesso, ${erros} erro(s)`, 
        {
          condominio_id: condominioContext.condominioId,
          dados_novos: { 
            total: enviados + erros,
            enviados: enviados,
            erros: erros
          }
        }
      );

    } catch (err) {
      console.error("[NOTIFICAÇÕES] Erro ao notificar:", err);
      setError("Erro ao enviar notificações. Verifique a configuração do WhatsApp.");
      
      await logAction('enviar_notificacoes_whatsapp', 
        `Erro ao enviar notificações WhatsApp: ${err.message}`, 
        {
          condominio_id: condominioContext.condominioId,
          sucesso: false,
          erro_mensagem: err.message
        }
      );
    } finally {
      setSending(false);
    }
  };

  // Normalização de dados para renderização segura
  const listaSegura = React.useMemo(() => {
    if (!Array.isArray(moradoresComEncomendas)) return [];
    return moradoresComEncomendas.filter(item => item?.morador?.id);
  }, [moradoresComEncomendas]);

  // Proteção contra renderização prematura
  if (!contextLoaded || loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="WhatsApp" />
          <div className="flex items-center justify-center pt-24 pb-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          </div>
          <MoradorFooter />
        </div>
      </AuthGuard>
    );
  }



  // Try-catch de renderização
  try {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="WhatsApp" />
          
          <div className="pt-28 pb-24 px-4">
            <div className="max-w-2xl mx-auto">

            {/* Alerta de WhatsApp não configurado */}
            {(!whatsappConfig || !whatsappConfig.ativo) && (
              <Alert className="mb-3 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>WhatsApp não configurado.</strong> As notificações não poderão ser enviadas. Entre em contato com o administrador do sistema para configurar.
                </AlertDescription>
              </Alert>
            )}

            {/* Alertas */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3"
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
                  className="mb-3"
                >
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Card */}
            <Card className="mb-4 border-0 shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1">Total</p>
                    <p className="text-xl font-bold text-gray-700">
                      {listaSegura.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1">Selecionados</p>
                    <p className="text-xl font-bold text-[#3b5998]">
                      {selectedMoradores?.size || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1">Encomendas</p>
                    <p className="text-xl font-bold text-gray-700">
                      {listaSegura
                        .filter(m => m?.morador?.id && selectedMoradores?.has(m.morador.id))
                        .reduce((sum, m) => sum + (m?.encomendas?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selecionar Todos */}
            {listaSegura.length > 0 && (
              <Card className="mb-3 border-0 shadow-sm bg-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="select-all"
                      checked={selectedMoradores?.size === listaSegura.length && listaSegura.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-semibold text-gray-900 cursor-pointer flex-1"
                    >
                      Selecionar todos ({listaSegura.length})
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão Principal */}
            {listaSegura.length > 0 && (
              <div className="mb-4">
                <Button
                  onClick={notificarMoradores}
                  disabled={sending || (selectedMoradores?.size || 0) === 0}
                  className="w-full h-12 font-semibold bg-[#3b5998] hover:bg-[#2d4373] disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      <span className="text-sm">Notificar ({selectedMoradores?.size || 0})</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Lista de Moradores */}
            <div className="space-y-3">
              {listaSegura.length === 0 ? (
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      Não há encomendas pendentes para notificar
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Registre encomendas para enviar notificações aos moradores
                    </p>
                  </CardContent>
                </Card>
              ) : (
                listaSegura.map((item, index) => (
                  <motion.div
                    key={item.morador.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm bg-white">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3 mb-3">
                          <Checkbox
                            checked={selectedMoradores.has(item?.morador?.id)}
                            onCheckedChange={() => item?.morador?.id && toggleMorador(item.morador.id)}
                            className="mt-1 flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-[#dfe3ee] rounded-full flex items-center justify-center flex-shrink-0">
                                  <MessageCircle className="w-5 h-5 text-[#3b5998]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate text-sm">
                                    {item?.morador?.nome || 'Sem nome'}
                                  </h3>
                                  <p className="text-xs text-gray-600 truncate">
                                    {item?.morador?.apelido_endereco || item?.morador?.endereco || 'Sem endereço'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => item?.morador?.id && removerMorador(item.morador.id)}
                                className="flex-shrink-0 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover da lista"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                                <Package className="w-3 h-3 mr-1" />
                                {item?.encomendas?.length || 0} encomenda{item?.encomendas?.length !== 1 ? 's' : ''}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {item?.morador?.telefone || 'Sem telefone'}
                              </span>
                            </div>

                            {/* Última Notificação Enviada */}
                            {item?.ultima_notificacao && (() => {
                              try {
                                const parsed = parseISO(item.ultima_notificacao);
                                if (isNaN(parsed.getTime())) return null;
                                
                                return (
                                  <div className="mb-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        Última notificação: {formatDistanceToNow(parsed, { 
                                          addSuffix: true, 
                                          locale: ptBR 
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}

                            {/* Tabela de Encomendas */}
                            <div className="pt-2 border-t border-gray-100">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-100">
                                    <th className="text-left py-1 text-gray-600 font-medium">Código</th>
                                    <th className="text-left py-1 text-gray-600 font-medium">Chegada</th>
                                    <th className="text-left py-1 text-gray-600 font-medium">Remetente</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(item?.encomendas) && item.encomendas.map((enc, idx) => enc ? (
                                    <tr key={idx} className="border-b border-gray-50">
                                      <td className="py-1.5">
                                        <span className="px-2 py-0.5 bg-[#dfe3ee] text-[#3b5998] rounded font-mono">
                                          {enc?.codigo || '-'}
                                        </span>
                                      </td>
                                      <td className="py-1.5 text-gray-700">
                                        {(() => {
                                          try {
                                            if (!enc?.data_entrada) return '-';
                                            const parsed = parseISO(enc.data_entrada);
                                            if (isNaN(parsed.getTime())) return '-';
                                            return format(parsed, "dd/MM/yy HH:mm", { locale: ptBR });
                                          } catch (e) {
                                            return '-';
                                          }
                                        })()}
                                      </td>
                                      <td className="py-1.5 text-gray-700 truncate max-w-[100px]">
                                        {enc?.remetente || 'Não informado'}
                                      </td>
                                    </tr>
                                  ) : null)}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <MoradorFooter />
      </div>
    </AuthGuard>
    );
  } catch (renderError) {
    console.error('[NOTIFICAÇÕES WHATSAPP] ❌ Erro de renderização:', renderError);
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="WhatsApp" />
          <div className="pt-28 pb-24 px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    Erro ao carregar notificações
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Tente recarregar a página
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 bg-[#3b5998] hover:bg-[#2d4373]"
                  >
                    Recarregar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          <MoradorFooter />
        </div>
      </AuthGuard>
    );
  }
}