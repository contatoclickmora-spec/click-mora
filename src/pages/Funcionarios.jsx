import React, { useState, useEffect } from 'react';
import { Funcionario } from "@/entities/Funcionario";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserPlus, 
  Users,
  CheckCircle,
  AlertCircle,
  Search,
  Shield,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import FuncionarioForm from '../components/funcionarios/FuncionarioForm';
import FuncionarioCard from '../components/funcionarios/FuncionarioCard';

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [userCondominioId, setUserCondominioId] = useState(null);

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
        setError("Condomínio não identificado");
        setLoading(false);
        return;
      }

      const condominioId = moradorLogado.condominio_id;
      setUserCondominioId(condominioId);

      // PROTEÇÃO: Carregar APENAS funcionários do condomínio
      const funcionariosDoCondominio = await base44.entities.Funcionario.filter({ 
        condominio_id: condominioId 
      }, "-created_date");

      // VALIDAÇÃO: Garantir isolamento
      const funcionariosValidados = funcionariosDoCondominio.filter(f => f.condominio_id === condominioId);
      setFuncionarios(funcionariosValidados);

      console.log(`[SECURITY] Funcionários carregados - Condomínio: ${condominioId}, Total: ${funcionariosValidados.length}`);
      
    } catch (err) {
      console.error("[SECURITY] Erro ao carregar funcionários:", err);
      setError("Erro ao carregar funcionários.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (!userCondominioId) {
        setError("ERRO DE SEGURANÇA: Condomínio não identificado");
        return;
      }

      const currentUser = await User.me();
      
      // PROTEÇÃO: Forçar condomínio do usuário logado
      const dataToSave = {
        ...formData,
        condominio_id: userCondominioId,
        cadastrado_por: currentUser.id
      };

      // VALIDAÇÃO: Garantir que não está salvando em outro condomínio
      if (dataToSave.condominio_id !== userCondominioId) {
        throw new Error("SECURITY_BREACH: Tentativa de salvar em outro condomínio");
      }

      if (editingFuncionario) {
        await Funcionario.update(editingFuncionario.id, dataToSave);
        setSuccess("Funcionário atualizado com sucesso!");
      } else {
        await Funcionario.create(dataToSave);
        setSuccess("Funcionário cadastrado com sucesso!");
      }

      setShowForm(false);
      setEditingFuncionario(null);
      await loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("[SECURITY] Erro ao salvar funcionário:", err);
      setError("Erro ao salvar funcionário. Verifique os dados e tente novamente.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEdit = (funcionario) => {
    setEditingFuncionario(funcionario);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (funcionario) => {
    if (!window.confirm(`Tem certeza que deseja remover ${funcionario.nome}?`)) {
      return;
    }

    try {
      await Funcionario.delete(funcionario.id);
      setSuccess("Funcionário removido com sucesso!");
      await loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Erro ao remover funcionário.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFuncionario(null);
    setError("");
  };

  const filteredFuncionarios = funcionarios.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStats = () => {
    return {
      total: funcionarios.length,
      ativos: funcionarios.filter(f => f.status === 'ativo').length,
      porteiros: funcionarios.filter(f => f.cargo === 'porteiro').length,
      outros: funcionarios.filter(f => f.cargo !== 'porteiro').length
    };
  };

  const stats = getStats();

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Funcionários</h1>
            <p className="text-gray-600">
              {stats.total} funcionários cadastrados ({stats.ativos} ativos)
            </p>
          </div>
          <Button
            onClick={() => { setEditingFuncionario(null); setShowForm(true); setError(""); }}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>

        {/* Alertas */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulário */}
        <AnimatePresence>
          {showForm && (
            <FuncionarioForm
              funcionario={editingFuncionario}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">{stats.ativos}</p>
              <p className="text-sm text-gray-600">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Key className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.porteiros}</p>
              <p className="text-sm text-gray-600">Porteiros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.outros}</p>
              <p className="text-sm text-gray-600">Outros</p>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lista de Funcionários */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredFuncionarios.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">
                Nenhum funcionário encontrado
              </h3>
              <p className="text-gray-500 mt-2">
                Adicione funcionários para gerenciar a equipe do condomínio
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFuncionarios.map(funcionario => (
              <FuncionarioCard
                key={funcionario.id}
                funcionario={funcionario}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}