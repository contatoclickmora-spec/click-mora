import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  User as UserIcon,
  UserPlus,
  Upload,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "../components/utils/authUtils";

import MoradorCard from "../components/moradores/MoradorCard";
import DetalhesMoradorModal from "../components/moradores/DetalhesMoradorModal";
import MoradorForm from "../components/moradores/MoradorForm";
import ImportacaoMassa from "../components/moradores/ImportacaoMassa";
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import { logAction } from "../components/utils/logger";

export default function MoradoresPage() {
  const [residencias, setResidencias] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [viewingMorador, setViewingMorador] = useState(null);
  const [editingMorador, setEditingMorador] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportacao, setShowImportacao] = useState(false);

  const filterData = useCallback(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      const sorted = [...moradores].sort((a, b) => a.nome.localeCompare(b.nome));
      setFilteredData(sorted);
      return;
    }

    const filtered = moradores.filter(morador => {
      return (
        morador.nome.toLowerCase().includes(term) ||
        morador.apelido_endereco?.toLowerCase().includes(term) ||
        morador.abreviacao?.toLowerCase().includes(term) ||
        morador.tipo_usuario?.toLowerCase().includes(term) ||
        morador.email?.toLowerCase().includes(term)
      );
    });
    
    const sorted = filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    setFilteredData(sorted);
  }, [searchTerm, moradores]);

  const loadDataAndUser = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const role = await getUserRole();
      setCurrentUser(role.user);
      setUserType(role.userType);

      let currentCondominioId = null;

      if (role.morador && role.morador.condominio_id) {
        currentCondominioId = role.morador.condominio_id;
      }

      if (!currentCondominioId) {
        setError("ERRO: Condomínio não identificado.");
        setMoradores([]);
        setResidencias([]);
        setLoading(false);
        return;
      }

      setUserCondominioId(currentCondominioId);

      // PROTEÇÃO: Carregar APENAS dados do condomínio do usuário
      const [moradoresDoCondominio, residenciasDoCondominio] = await Promise.all([
        base44.entities.Morador.filter({ condominio_id: currentCondominioId }),
        base44.entities.Residencia.filter({ condominio_id: currentCondominioId })
      ]);

      // VALIDAÇÃO FINAL: Garantir isolamento
      const moradoresValidados = moradoresDoCondominio
        .filter(m => m.condominio_id === currentCondominioId)
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      const residenciasValidadas = residenciasDoCondominio
        .filter(r => r.condominio_id === currentCondominioId);

      setMoradores(moradoresValidados);
      setResidencias(residenciasValidadas);

      console.log(`[SECURITY] Moradores carregados - Condomínio: ${currentCondominioId}, Total: ${moradoresValidados.length}`);

    } catch (err) {
      setError("Erro ao carregar dados. Verifique a conexão e tente novamente.");
      console.error("[SECURITY] Erro ao carregar moradores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadDataAndUser();
    return () => abortController.abort();
  }, [loadDataAndUser]);

  useEffect(() => {
    filterData();
  }, [searchTerm, moradores, filterData]);

  const handleView = (morador) => {
    setViewingMorador(morador);
  };

  const handleEdit = (morador) => {
    setEditingMorador(morador);
    setShowForm(true);
    setViewingMorador(null);
  };

  const handleDelete = async (morador) => {
    try {
      // INTEGRIDADE: Verificar dependências
      const [encomendas, chamados, visitantes] = await Promise.all([
        base44.entities.Encomenda.filter({ morador_id: morador.id }),
        base44.entities.Chamado.filter({ morador_id: morador.id }),
        base44.entities.Visitante.filter({ morador_id: morador.id })
      ]);

      const totalDependencias = encomendas.length + chamados.length + visitantes.length;

      if (totalDependencias > 0) {
        const msg = `${morador.nome} possui registros vinculados:\n` +
                    `• ${encomendas.length} encomenda(s)\n` +
                    `• ${chamados.length} chamado(s)\n` +
                    `• ${visitantes.length} visitante(s)\n\n` +
                    `Deseja remover TODOS os dados relacionados? Esta ação é irreversível.`;
        
        if (!window.confirm(msg)) {
          return;
        }

        // CASCADE DELETE
        for (const enc of encomendas) {
          await base44.entities.Encomenda.delete(enc.id);
        }
        for (const cham of chamados) {
          await base44.entities.Chamado.delete(cham.id);
        }
        for (const vis of visitantes) {
          await base44.entities.Visitante.delete(vis.id);
        }

        console.log(`[DATA_INTEGRITY] Cascade delete executado: ${totalDependencias} registros`);
      } else {
        if (!window.confirm(`Tem certeza que deseja remover ${morador.nome}?`)) {
          return;
        }
      }

      await base44.entities.Morador.delete(morador.id);
      
      await logAction({
        tipo_acao: 'deletar_morador',
        usuario_email: currentUser.email,
        usuario_nome: currentUser.full_name,
        condominio_id: userCondominioId,
        descricao: `Morador ${morador.nome} removido ${totalDependencias > 0 ? `com ${totalDependencias} registros vinculados` : ''}`,
        dados_anteriores: morador,
        sucesso: true
      });

      setSuccess(`${morador.nome} foi removido com sucesso!`);
      setTimeout(() => setSuccess(""), 5000);
      loadDataAndUser();
    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao remover:", err);
      setError("Erro ao remover pessoa. Tente novamente.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleSubmitForm = async (dados) => {
    // IDEMPOTÊNCIA: Prevenir submissões duplicadas
    if (submitting) {
      console.warn('[IDEMPOTENCY] Submissão duplicada ignorada');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // VALIDAÇÃO: Campos obrigatórios
      if (!dados.nome?.trim()) {
        setError("Nome é obrigatório");
        setSubmitting(false);
        return;
      }

      if (!dados.email?.trim()) {
        setError("Email é obrigatório");
        setSubmitting(false);
        return;
      }

      if (!dados.telefone?.trim()) {
        setError("Telefone é obrigatório");
        setSubmitting(false);
        return;
      }

      // SANITIZAÇÃO: Limpar dados
      const dadosSanitizados = {
        ...dados,
        nome: String(dados.nome).trim().slice(0, 200),
        email: String(dados.email).trim().toLowerCase().slice(0, 100),
        telefone: String(dados.telefone).replace(/[^\d]/g, '').slice(0, 11),
        observacoes: dados.observacoes ? String(dados.observacoes).trim().slice(0, 500) : '',
        condominio_id: userCondominioId
      };

      // VALIDAÇÃO: Email válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dadosSanitizados.email)) {
        setError("Email inválido");
        setSubmitting(false);
        return;
      }

      // VALIDAÇÃO: Telefone válido
      if (dadosSanitizados.telefone.length < 10) {
        setError("Telefone inválido (mínimo 10 dígitos)");
        setSubmitting(false);
        return;
      }

      if (editingMorador) {
        await base44.entities.Morador.update(editingMorador.id, dadosSanitizados);
        
        await logAction({
          tipo_acao: 'editar_morador',
          usuario_email: currentUser.email,
          usuario_nome: currentUser.full_name,
          condominio_id: userCondominioId,
          descricao: `Informações de ${dadosSanitizados.nome} foram atualizadas`,
          dados_anteriores: editingMorador,
          dados_novos: dadosSanitizados,
          sucesso: true
        });

        setSuccess("Informações atualizadas com sucesso!");
      } else {
        const novoMorador = await base44.entities.Morador.create(dadosSanitizados);
        
        await logAction({
          tipo_acao: 'criar_morador',
          usuario_email: currentUser.email,
          usuario_nome: currentUser.full_name,
          condominio_id: userCondominioId,
          descricao: `Nova pessoa cadastrada: ${dadosSanitizados.nome}`,
          dados_novos: novoMorador,
          sucesso: true
        });

        setSuccess("Pessoa cadastrada com sucesso!");
      }

      setTimeout(() => setSuccess(""), 5000);
      setShowForm(false);
      setEditingMorador(null);
      loadDataAndUser();
      
    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao salvar:", err);
      setError("Erro ao salvar. Verifique os dados e tente novamente.");
      setTimeout(() => setError(""), 5000);
    } finally {
      // Delay antes de liberar para prevenir cliques rápidos
      setTimeout(() => setSubmitting(false), 500);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMorador(null);
  };

  const handleNovoClick = () => {
    setEditingMorador(null);
    setShowForm(true);
  };

  const handleImportacaoSuccess = () => {
    setShowImportacao(false);
    setSuccess("Importação concluída com sucesso!");
    setTimeout(() => setSuccess(""), 5000);
    loadDataAndUser();
  };

  const isPorteiroOrSindico = userType === 'porteiro' || userType === 'administrador';
  const isSindico = userType === 'administrador';

  if (!isPorteiroOrSindico) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] overflow-x-hidden">
        <MoradorHeader title={isSindico ? "Pessoas" : "Moradores"} />
        <div className="flex items-center justify-center pt-32 pb-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  // Se está mostrando o formulário (apenas síndicos)
  if (showForm && isSindico) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] overflow-x-hidden">
        <MoradorHeader title={editingMorador ? "Editar Pessoa" : "Nova Pessoa"} />
        <div className="pt-28 pb-24 px-3">
          <MoradorForm
            morador={editingMorador}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
            residencias={residencias}
            selectedCondominioId={userCondominioId}
          />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  // Se está mostrando importação (apenas síndicos)
  if (showImportacao && isSindico) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] overflow-x-hidden">
        <MoradorHeader title="Importação em Massa" />
        <div className="pt-28 pb-24 px-3">
          <ImportacaoMassa
            condominioId={userCondominioId}
            onSuccess={handleImportacaoSuccess}
            onCancel={() => setShowImportacao(false)}
          />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] overflow-x-hidden w-full">
      <MoradorHeader title={isSindico ? "Pessoas" : "Moradores"} />
      
      <div className="pt-28 pb-24 px-2 w-full max-w-full overflow-x-hidden">
        <div className="w-full space-y-3 mt-3">
          {/* Alertas */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <AlertDescription className="text-green-800 text-sm">
                    {success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ações (apenas para síndicos) */}
          {isSindico && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                onClick={handleNovoClick}
                className="bg-[#3b5998] hover:bg-[#2d4373] h-12 text-sm font-medium shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
              <Button
                onClick={() => setShowImportacao(true)}
                className="bg-[#10b981] hover:bg-[#059669] h-12 text-sm font-medium shadow-sm text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </div>
          )}

          {/* Busca */}
          <Card className="border-0 shadow-sm w-full">
            <CardContent className="p-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 flex-shrink-0 pointer-events-none" />
                <Input
                  placeholder="Buscar por nome, endereço ou tipo"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-0 bg-[#dfe3ee] w-full text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contador de resultados */}
          {searchTerm && (
            <div className="text-sm text-gray-600 px-1">
              {filteredData.length} {filteredData.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
            </div>
          )}
          
          {/* Lista de Moradores */}
          <div className="space-y-3 w-full">
            {filteredData.length === 0 ? (
              <Card className="border-0 shadow-sm w-full">
                <CardContent className="p-12 text-center">
                  <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Nenhuma pessoa encontrada
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? "Tente ajustar os filtros de busca" : "Nenhuma pessoa cadastrada no momento"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredData.map((morador) => (
                <div key={morador.id} className="relative">
                  <MoradorCard
                    morador={morador}
                    residencias={residencias}
                    onView={handleView}
                  />
                  
                  {/* Menu de ações (apenas síndicos) - posicionado absolutamente no canto superior direito */}
                  {isSindico && (
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(morador);
                            }}
                            className="cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(morador);
                            }}
                            className="text-red-600 cursor-pointer focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {viewingMorador && (
        <DetalhesMoradorModal
          morador={viewingMorador}
          residencias={residencias}
          onClose={() => setViewingMorador(null)}
          onEdit={isSindico ? handleEdit : undefined}
          onDelete={isSindico ? handleDelete : undefined}
        />
      )}

      <MoradorFooter />
    </div>
  );
}