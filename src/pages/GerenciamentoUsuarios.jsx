import React, { useState, useEffect } from 'react';
import { Morador } from "@/entities/Morador";
import { PermissoesUsuario } from "@/entities/PermissoesUsuario";
import { Condominio } from "@/entities/Condominio";
import { Residencia } from "@/entities/Residencia";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  Shield, 
  Crown, 
  Users,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import UsuarioCard from '../components/gestao-usuarios/UsuarioCard';
import NovoUsuarioModal from '../components/gestao-usuarios/NovoUsuarioModal';
import EditarUsuarioModal from '../components/gestao-usuarios/EditarUsuarioModal';
import PermissoesModal from '../components/gestao-usuarios/PermissoesModal';
import TurnosModal from '../components/gestao-usuarios/TurnosModal';

export default function GerenciamentoUsuarios({ userType }) {
  const [usuarios, setUsuarios] = useState([]);
  const [permissoes, setPermissoes] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCondominio, setFiltroCondominio] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroNivel, setFiltroNivel] = useState("todos");
  
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showPermissoesModal, setShowPermissoesModal] = useState(false);
  const [showTurnosModal, setShowTurnosModal] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError("");
      }
      
      console.log("🔄 Carregando dados do sistema...");

      // Verificar autenticação primeiro
      let currentUser;
      try {
        currentUser = await User.me();
        if (!currentUser) {
          throw new Error("Usuário não autenticado");
        }
      } catch (authError) {
        console.error("❌ Erro de autenticação:", authError);
        setError("Erro de autenticação. Por favor, faça login novamente.");
        setLoading(false);
        return;
      }

      // Carregar dados com timeout e retry
      const loadWithRetry = async (loadFn, entityName, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const result = await Promise.race([
              loadFn(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
              )
            ]);
            return result;
          } catch (err) {
            console.error(`❌ Tentativa ${i + 1}/${maxRetries} falhou para ${entityName}:`, err);
            if (i === maxRetries - 1) throw err;
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      };

      // Carregar entidades sequencialmente para evitar sobrecarga
      let usuariosData = [];
      let permissoesData = [];
      let condominiosData = [];
      let residenciasData = [];

      try {
        console.log("📥 Carregando usuários...");
        usuariosData = await loadWithRetry(() => Morador.list(), "Morador");
        console.log(`✅ ${usuariosData.length} usuários carregados`);
      } catch (err) {
        console.error("❌ Erro ao carregar usuários:", err);
        throw new Error("Falha ao carregar usuários");
      }

      try {
        console.log("📥 Carregando permissões...");
        permissoesData = await loadWithRetry(() => PermissoesUsuario.list(), "PermissoesUsuario");
        console.log(`✅ ${permissoesData.length} permissões carregadas`);
      } catch (err) {
        console.error("⚠️ Erro ao carregar permissões:", err);
        // Permissões não são críticas, continuar
        permissoesData = [];
      }

      try {
        console.log("📥 Carregando condomínios...");
        condominiosData = await loadWithRetry(() => Condominio.list(), "Condominio");
        console.log(`✅ ${condominiosData.length} condomínios carregados`);
      } catch (err) {
        console.error("❌ Erro ao carregar condomínios:", err);
        throw new Error("Falha ao carregar condomínios");
      }

      try {
        console.log("📥 Carregando residências...");
        residenciasData = await loadWithRetry(() => Residencia.list(), "Residencia");
        console.log(`✅ ${residenciasData.length} residências carregadas`);
      } catch (err) {
        console.error("⚠️ Erro ao carregar residências:", err);
        // Residências não são críticas, continuar
        residenciasData = [];
      }

      setUsuarios(usuariosData);
      setPermissoes(permissoesData);
      setCondominios(condominiosData);
      setResidencias(residenciasData);
      setRetryCount(0);

      console.log("✅ Todos os dados carregados com sucesso");
    } catch (err) {
      console.error("❌ Erro ao carregar dados:", err);
      
      const errorMessage = err.message || "Erro ao carregar dados do sistema";
      
      if (retryCount < 2) {
        setError(`${errorMessage}. Tentando novamente...`);
        setRetryCount(prev => prev + 1);
        // Tentar novamente após 2 segundos
        setTimeout(() => loadData(true), 2000);
      } else {
        setError(`${errorMessage}. Por favor, recarregue a página.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Enriquecer dados do usuário com permissões
  const getUsuarioCompleto = (usuario) => {
    const permissao = permissoes.find(p => p.morador_id === usuario.id);
    const condominio = condominios.find(c => c.id === usuario.condominio_id);
    const residencia = residencias.find(r => r.id === usuario.residencia_id);
    
    return {
      ...usuario,
      permissoes_detalhadas: permissao,
      condominio_nome: condominio?.nome || "Não definido",
      residencia_info: residencia ? `${residencia.identificador_principal}${residencia.complemento ? ', ' + residencia.complemento : ''}` : null
    };
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios
    .map(getUsuarioCompleto)
    .filter(u => {
      const matchSearch = searchTerm === "" || 
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.apelido_endereco?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCondominio = filtroCondominio === "todos" || u.condominio_id === filtroCondominio;
      const matchStatus = filtroStatus === "todos" || u.status === filtroStatus;
      const matchNivel = filtroNivel === "todos" || u.tipo_usuario === filtroNivel;
      
      return matchSearch && matchCondominio && matchStatus && matchNivel;
    });

  // Estatísticas
  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.status === 'ativo').length,
    inativos: usuarios.filter(u => u.status === 'inativo').length,
    pendentes: usuarios.filter(u => u.status === 'pendente').length,
    sindicos: usuarios.filter(u => u.tipo_usuario === 'administrador').length,
    porteiros: usuarios.filter(u => u.tipo_usuario === 'porteiro').length,
    moradores: usuarios.filter(u => u.tipo_usuario === 'morador').length
  };

  // Handlers
  const handleNovoUsuario = () => {
    setUsuarioSelecionado(null);
    setShowNovoModal(true);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioSelecionado(usuario);
    setShowEditarModal(true);
  };

  const handleGerenciarPermissoes = (usuario) => {
    setUsuarioSelecionado(usuario);
    setShowPermissoesModal(true);
  };

  const handleGerenciarTurnos = (usuario) => {
    setUsuarioSelecionado(usuario);
    setShowTurnosModal(true);
  };

  const handleToggleStatus = async (usuario, novoStatus) => {
    if (!window.confirm(`Tem certeza que deseja ${novoStatus === 'ativo' ? 'ativar' : 'desativar'} ${usuario.nome}?`)) {
      return;
    }

    try {
      await Morador.update(usuario.id, { status: novoStatus });
      setSuccess(`Status de ${usuario.nome} atualizado com sucesso!`);
      loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Erro ao atualizar status do usuário");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeletarUsuario = async (usuario) => {
    if (!window.confirm(
      `ATENÇÃO: Tem certeza que deseja DELETAR ${usuario.nome}?\n\n` +
      `Esta ação é IRREVERSÍVEL e irá:\n` +
      `• Remover todos os dados do usuário\n` +
      `• Remover suas permissões\n` +
      `• Remover histórico de ações\n\n` +
      `Digite "CONFIRMAR" para prosseguir`
    )) {
      return;
    }

    const confirmacao = prompt("Digite CONFIRMAR para deletar o usuário:");
    if (confirmacao !== "CONFIRMAR") {
      alert("Operação cancelada");
      return;
    }

    try {
      const permissao = permissoes.find(p => p.morador_id === usuario.id);
      if (permissao) {
        await PermissoesUsuario.delete(permissao.id);
      }
      
      await Morador.delete(usuario.id);
      
      setSuccess(`${usuario.nome} foi removido do sistema com sucesso`);
      loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Erro ao deletar usuário:", err);
      setError("Erro ao deletar usuário");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleSaveUsuario = async (dados) => {
    try {
      const currentUser = await User.me();
      
      console.log("💾 Salvando usuário:", dados);
      
      let usuarioId;
      if (usuarioSelecionado) {
        console.log("✏️ Atualizando usuário existente:", usuarioSelecionado.id);
        await Morador.update(usuarioSelecionado.id, dados.usuario);
        usuarioId = usuarioSelecionado.id;
        setSuccess("✅ Usuário atualizado com sucesso!");
      } else {
        console.log("➕ Criando novo usuário");
        const novoUsuario = await Morador.create({
          ...dados.usuario,
          email: dados.usuario.email.trim().toLowerCase()
        });
        usuarioId = novoUsuario.id;
        setSuccess("✅ Usuário criado com sucesso!");
      }
      
      const permissaoExistente = permissoes.find(p => p.morador_id === usuarioId);
      
      const dadosPermissao = {
        morador_id: usuarioId,
        condominio_id: dados.usuario.condominio_id,
        nivel_acesso: dados.permissoes.nivel_acesso,
        permissoes: dados.permissoes.permissoes_especificas,
        turno: dados.turno || {},
        restricoes: dados.restricoes || {},
        [permissaoExistente ? 'atualizado_por' : 'criado_por']: currentUser.email,
        [permissaoExistente ? 'ultima_atualizacao' : 'data_criacao']: new Date().toISOString()
      };
      
      if (permissaoExistente) {
        console.log("✏️ Atualizando permissões existentes");
        await PermissoesUsuario.update(permissaoExistente.id, dadosPermissao);
      } else {
        console.log("➕ Criando novas permissões");
        await PermissoesUsuario.create(dadosPermissao);
      }
      
      console.log("✅ Salvamento concluído com sucesso!");
      
      setShowNovoModal(false);
      setShowEditarModal(false);
      setUsuarioSelecionado(null);
      await loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("❌ Erro ao salvar usuário:", err);
      setError("❌ Erro ao salvar usuário. Verifique os dados e tente novamente.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleSavePermissoes = async (novasPermissoes) => {
    try {
      const currentUser = await User.me();
      const permissaoExistente = permissoes.find(p => p.morador_id === usuarioSelecionado.id);
      
      const dadosPermissao = {
        ...novasPermissoes,
        atualizado_por: currentUser.email,
        ultima_atualizacao: new Date().toISOString(),
        historico: [
          ...(permissaoExistente?.historico || []),
          {
            data: new Date().toISOString(),
            acao: "Permissões atualizadas",
            realizado_por: currentUser.email,
            detalhes: `Nível: ${novasPermissoes.nivel_acesso}`
          }
        ]
      };
      
      if (permissaoExistente) {
        await PermissoesUsuario.update(permissaoExistente.id, dadosPermissao);
      } else {
        await PermissoesUsuario.create({
          ...dadosPermissao,
          morador_id: usuarioSelecionado.id,
          condominio_id: usuarioSelecionado.condominio_id,
          criado_por: currentUser.email,
          data_criacao: new Date().toISOString()
        });
      }
      
      setSuccess("Permissões atualizadas com sucesso!");
      setShowPermissoesModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Erro ao atualizar permissões");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleSaveTurnos = async (dadosTurno) => {
    try {
      const permissaoExistente = permissoes.find(p => p.morador_id === usuarioSelecionado.id);
      
      if (permissaoExistente) {
        await PermissoesUsuario.update(permissaoExistente.id, {
          turno: dadosTurno
        });
        setSuccess("Turnos atualizados com sucesso!");
      } else {
        setError("Permissões não encontradas. Crie as permissões primeiro.");
      }
      
      setShowTurnosModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 5000);
      setTimeout(() => setError(""), 5000);
    } catch (err) {
      setError("Erro ao atualizar turnos");
      setTimeout(() => setError(""), 5000);
    }
  };

  const exportarUsuarios = () => {
    const csv = [
      ['Nome', 'Email', 'Tipo', 'Status', 'Condomínio', 'Endereço'].join(','),
      ...usuariosFiltrados.map(u => [
        u.nome,
        u.email,
        u.tipo_usuario,
        u.status,
        u.condominio_nome,
        u.residencia_info || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de gerenciamento...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Tentativa {retryCount}/3</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
              {userType === 'admin_master' && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin Master
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              Controle total sobre todos os usuários do sistema
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => loadData()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={exportarUsuarios} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleNovoUsuario} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.ativos}</p>
              <p className="text-xs text-gray-600">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.inativos}</p>
              <p className="text-xs text-gray-600">Inativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.pendentes}</p>
              <p className="text-xs text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.sindicos}</p>
              <p className="text-xs text-gray-600">Síndicos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.porteiros}</p>
              <p className="text-xs text-gray-600">Porteiros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.moradores}</p>
              <p className="text-xs text-gray-600">Moradores</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Nome, email ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Condomínio
                </label>
                <select
                  value={filtroCondominio}
                  onChange={(e) => setFiltroCondominio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os condomínios</option>
                  {condominios.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tipo de Usuário
                </label>
                <select
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="administrador">Síndicos</option>
                  <option value="porteiro">Porteiros</option>
                  <option value="morador">Moradores</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {usuariosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-500">
                  Tente ajustar os filtros ou adicione novos usuários ao sistema
                </p>
              </CardContent>
            </Card>
          ) : (
            usuariosFiltrados.map(usuario => (
              <UsuarioCard
                key={usuario.id}
                usuario={usuario}
                onEditar={handleEditarUsuario}
                onGerenciarPermissoes={handleGerenciarPermissoes}
                onGerenciarTurnos={handleGerenciarTurnos}
                onToggleStatus={handleToggleStatus}
                onDeletar={handleDeletarUsuario}
              />
            ))
          )}
        </div>

        {/* Modais */}
        {showNovoModal && (
          <NovoUsuarioModal
            condominios={condominios}
            residencias={residencias}
            onClose={() => setShowNovoModal(false)}
            onSave={handleSaveUsuario}
          />
        )}

        {showEditarModal && usuarioSelecionado && (
          <EditarUsuarioModal
            usuario={usuarioSelecionado}
            condominios={condominios}
            residencias={residencias}
            onClose={() => setShowEditarModal(false)}
            onSave={handleSaveUsuario}
          />
        )}

        {showPermissoesModal && usuarioSelecionado && (
          <PermissoesModal
            usuario={usuarioSelecionado}
            permissoesAtuais={usuarioSelecionado.permissoes_detalhadas}
            onClose={() => setShowPermissoesModal(false)}
            onSave={handleSavePermissoes}
          />
        )}

        {showTurnosModal && usuarioSelecionado && (
          <TurnosModal
            usuario={usuarioSelecionado}
            turnoAtual={usuarioSelecionado.permissoes_detalhadas?.turno}
            onClose={() => setShowTurnosModal(false)}
            onSave={handleSaveTurnos}
          />
        )}
      </div>
    </div>
  );
}