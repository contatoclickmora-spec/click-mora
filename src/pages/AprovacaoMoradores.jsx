import React, { useState, useEffect } from "react";
import { Morador } from "@/entities/Morador";
import { Condominio } from "@/entities/Condominio";
import { Residencia } from "@/entities/Residencia";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, CheckCircle, XCircle, Clock, AlertTriangle, User as UserIcon, Home, Hash, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AprovarMoradorModal from "../components/aprovacao/AprovarMoradorModal";
import { logAction } from "../components/utils/logger";

export default function AprovacaoMoradoresPage() {
  const [moradoresPendentes, setMoradoresPendentes] = useState([]);
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [moradorSelecionado, setMoradorSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [condominioAtual, setCondominioAtual] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
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
        setError("Erro: Síndico não está vinculado a um condomínio.");
        setLoading(false);
        return;
      }

      const condominioId = moradorLogado.condominio_id;
      setUserCondominioId(condominioId);

      // PROTEÇÃO: Carregar dados específicos do condomínio
      const [todosCondominios, residenciasData] = await Promise.all([
        Condominio.list(),
        Residencia.filter({ condominio_id: condominioId })
      ]);
      
      const condominio = todosCondominios.find(c => c.id === condominioId);
      setCondominioAtual(condominio);
      
      // PROTEÇÃO: Buscar APENAS moradores pendentes do condomínio ou sem condomínio atribuído
      const pendentes = todosMoradores.filter(m => 
        m.status === 'pendente' && 
        (!m.condominio_id || m.condominio_id === 'pendente_definicao' || m.condominio_id === condominioId)
      );

      // VALIDAÇÃO: Garantir isolamento em residências
      const residenciasValidadas = residenciasData.filter(r => r.condominio_id === condominioId);
      
      console.log(`[SECURITY] Aprovação Moradores - Condomínio: ${condominioId}, Pendentes: ${pendentes.length}`);
      
      setMoradoresPendentes(pendentes);
      setResidencias(residenciasValidadas);
      
    } catch (err) {
      console.error("[SECURITY] Erro ao carregar dados de aprovação:", err);
      setError("Erro ao carregar moradores pendentes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = (morador) => {
    setMoradorSelecionado(morador);
    setShowModal(true);
  };

  const handleConfirmarAprovacao = async (dadosAtualizados) => {
    try {
      // VALIDAÇÃO: Condomínio identificado
      if (!userCondominioId) {
        setError("ERRO DE SEGURANÇA: Condomínio não identificado");
        return;
      }

      // VALIDAÇÃO: Condomínio carregado
      if (!condominioAtual) {
        setError("ERRO: Dados do condomínio não carregados");
        return;
      }

      const user = await User.me();
      
      // PROTEÇÃO: Verificar limite de moradores do plano
      const moradoresDoCondominio = await Morador.filter({ 
        condominio_id: userCondominioId 
      });
      
      // VALIDAÇÃO: Garantir isolamento
      const moradoresValidados = moradoresDoCondominio.filter(m => m.condominio_id === userCondominioId);
      
      const moradoresAtivosNoCondominio = moradoresValidados.filter(
        m => m.tipo_usuario === 'morador' && m.status === 'ativo'
      ).length;

      const limite = condominioAtual.limite_moradores || 30;

      if (moradoresAtivosNoCondominio >= limite) {
        setError(`❌ Limite de moradores atingido! O plano permite ${limite} moradores ativos. Atualmente: ${moradoresAtivosNoCondominio}`);
        setTimeout(() => setError(""), 7000);
        return;
      }

      // SANITIZAÇÃO: Limpar dados recebidos
      const dadosSanitizados = {
        ...dadosAtualizados,
        nome: String(dadosAtualizados.nome || '').trim().slice(0, 200),
        email: String(dadosAtualizados.email || '').trim().toLowerCase().slice(0, 100),
        telefone: String(dadosAtualizados.telefone || '').replace(/\D/g, '').slice(0, 11),
        endereco: String(dadosAtualizados.endereco || '').trim().slice(0, 300),
        complemento: String(dadosAtualizados.complemento || '').trim().slice(0, 200),
        abreviacao: String(dadosAtualizados.abreviacao || '').trim().slice(0, 50)
      };
      
      // PROTEÇÃO: Forçar condomínio do síndico
      const dadosCompletos = {
        ...dadosSanitizados,
        condominio_id: userCondominioId,
        status: "ativo",
        data_aprovacao: new Date().toISOString(),
        aprovado_por: user.email
      };

      // VALIDAÇÃO CRÍTICA: Garantir condomínio correto
      if (dadosCompletos.condominio_id !== userCondominioId) {
        throw new Error("SECURITY_BREACH: Tentativa de aprovar para outro condomínio");
      }

      // VALIDAÇÃO: Campos obrigatórios
      if (!dadosCompletos.nome || dadosCompletos.nome.length < 3) {
        setError("Nome inválido (mínimo 3 caracteres)");
        return;
      }

      if (!dadosCompletos.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosCompletos.email)) {
        setError("Email inválido");
        return;
      }

      if (!dadosCompletos.telefone || dadosCompletos.telefone.length < 10) {
        setError("Telefone inválido (mínimo 10 dígitos)");
        return;
      }
      
      console.log(`[SECURITY] Aprovando morador ${dadosCompletos.nome} para condomínio ${userCondominioId}`);
      
      await Morador.update(moradorSelecionado.id, dadosCompletos);
      
      // PROTEÇÃO: Atualizar contador com valores seguros
      const novoMoradoresAtivos = Math.max(0, moradoresAtivosNoCondominio + 1);
      const novoTotalUsuarios = Math.max(0, moradoresValidados.length + 1);
      
      await Condominio.update(userCondominioId, {
        moradores_ativos: novoMoradoresAtivos,
        total_usuarios: novoTotalUsuarios
      });

      await logAction('aprovar_morador', `Morador ${dadosCompletos.nome} aprovado`, {
        condominio_id: userCondominioId,
        condominio_nome: condominioAtual?.nome,
        dados_novos: { morador_id: moradorSelecionado.id, nome: dadosCompletos.nome }
      });
      
      setSuccess(`✅ ${dadosCompletos.nome} foi aprovado com sucesso! O morador já pode fazer login no sistema.`);
      setShowModal(false);
      setMoradorSelecionado(null);
      
      await loadData();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao aprovar morador:", err);
      
      if (err.message?.includes('SECURITY_BREACH')) {
        setError("Erro de segurança crítico. Operação bloqueada.");
      } else {
        setError("Erro ao aprovar morador. Tente novamente.");
      }
      
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRecusar = async (morador) => {
    if (!window.confirm(
      `Tem certeza que deseja RECUSAR o cadastro de ${morador.nome}?\n\n` +
      `O cadastro será permanentemente deletado e o usuário não terá acesso ao sistema.`
    )) {
      return;
    }
    
    try {
      console.log("🗑️ Deletando morador pendente:", morador.nome);
      await Morador.delete(morador.id);

      // Registrar log
      await logAction('recusar_morador', `Cadastro de ${morador.nome} recusado`, {
        condominio_id: userCondominioId,
        condominio_nome: condominioAtual?.nome,
        dados_anteriores: { morador_id: morador.id, nome: morador.nome, email: morador.email }
      });
      
      setSuccess(`Cadastro de ${morador.nome} foi recusado e removido.`);
      await loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("❌ Erro ao recusar morador:", err);
      setError("Erro ao recusar cadastro.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const getResidenciaInfo = (residencia_id) => {
    if (!residencia_id) return "Não definido";
    const residencia = residencias.find(r => r.id === residencia_id);
    if (!residencia) return "Não encontrada";
    return `${residencia.identificador_principal}${residencia.complemento ? ', ' + residencia.complemento : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aprovação de Moradores</h1>
          <p className="text-gray-600">
            Revise e aprove os cadastros pendentes de moradores do condomínio
          </p>
          {condominioAtual && (
            <p className="text-sm text-gray-500 mt-2">
              📍 {condominioAtual.nome} - {condominioAtual.moradores_ativos || 0}/{condominioAtual.limite_moradores} moradores ativos
            </p>
          )}
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {moradoresPendentes.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum cadastro pendente
              </h3>
              <p className="text-gray-500">
                Todos os cadastros foram revisados! Novos cadastros aparecerão aqui automaticamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {moradoresPendentes.map((morador) => (
              <motion.div
                key={morador.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{morador.nome}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Aguardando Aprovação
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAprovar(morador)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => handleRecusar(morador)}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          Email
                        </p>
                        <p className="font-medium">{morador.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Telefone</p>
                        <p className="font-medium">{morador.telefone || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          Residência
                        </p>
                        <p className="font-medium">{getResidenciaInfo(morador.residencia_id)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          Abreviação
                        </p>
                        <p className="font-medium">{morador.apelido_endereco || "Não definido"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {showModal && moradorSelecionado && (
          <AprovarMoradorModal
            morador={moradorSelecionado}
            residencias={residencias}
            onClose={() => {
              setShowModal(false);
              setMoradorSelecionado(null);
            }}
            onConfirm={handleConfirmarAprovacao}
          />
        )}
      </div>
    </div>
  );
}