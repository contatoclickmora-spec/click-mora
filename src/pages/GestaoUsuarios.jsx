import React, { useState, useEffect } from 'react';
import { Morador } from "@/entities/Morador";
import { Condominio } from "@/entities/Condominio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Key,
  User as UserIcon,
  Shield,
  Download,
  Mail,
  Phone
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import EditarUsuarioModal from '../components/admin-master/EditarUsuarioModal';

export default function GestaoUsuarios() {
  const [moradores, setMoradores] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterCondominio, setFilterCondominio] = useState("todos");
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moradoresData, condominiosData] = await Promise.all([
        Morador.list("-created_date"),
        Condominio.list()
      ]);
      setMoradores(moradoresData);
      setCondominios(condominiosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCondominioNome = (condominioId) => {
    const cond = condominios.find(c => c.id === condominioId);
    return cond ? cond.nome : "Não vinculado";
  };

  const filteredMoradores = moradores.filter(m => {
    const matchSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       m.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "todos" || m.tipo_usuario === filterTipo;
    const matchCondominio = filterCondominio === "todos"; // Simplificado, pode adicionar lógica de condomínio
    
    return matchSearch && matchTipo && matchCondominio;
  });

  const stats = {
    total: moradores.length,
    administradores: moradores.filter(m => m.tipo_usuario === 'administrador').length,
    porteiros: moradores.filter(m => m.tipo_usuario === 'porteiro').length,
    moradores: moradores.filter(m => m.tipo_usuario === 'morador').length
  };

  const handleEdit = (morador) => {
    setEditingUsuario(morador);
    setShowEditModal(true);
  };

  const handleUpdateUsuario = async () => {
    await loadData();
    setShowEditModal(false);
    setEditingUsuario(null);
  };

  const handleDelete = async (morador) => {
    if (window.confirm(`Tem certeza que deseja remover ${morador.nome}?`)) {
      try {
        await Morador.delete(morador.id);
        loadData();
      } catch (error) {
        alert("Erro ao remover usuário");
      }
    }
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Tipo", "Status", "Condomínio"];
    const data = filteredMoradores.map(m => [
      m.nome,
      m.email || "",
      m.telefone || "",
      m.tipo_usuario,
      m.status,
      "N/A" // getCondominioNome seria aqui
    ]);

    const csv = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTipoBadge = (tipo) => {
    const configs = {
      'administrador': { color: 'bg-purple-100 text-purple-800', icon: Crown, label: 'Síndico' },
      'porteiro': { color: 'bg-blue-100 text-blue-800', icon: Key, label: 'Porteiro' },
      'morador': { color: 'bg-gray-100 text-gray-800', icon: UserIcon, label: 'Morador' }
    };
    const config = configs[tipo] || configs['morador'];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
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
      <div className="max-w-7xl mx-auto">
        {/* Header com Badge Admin Master */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Gestão Global de Usuários</h1>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Admin Master
              </Badge>
            </div>
            <p className="text-gray-600">Controle total sobre todos os usuários da plataforma</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button className="gap-2 bg-blue-600">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total de Usuários</p>
                  <h3 className="text-3xl font-bold text-blue-900">{stats.total}</h3>
                </div>
                <Users className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Síndicos</p>
                  <h3 className="text-3xl font-bold text-purple-900">{stats.administradores}</h3>
                </div>
                <Crown className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-cyan-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-700 font-medium mb-1">Porteiros</p>
                  <h3 className="text-3xl font-bold text-cyan-900">{stats.porteiros}</h3>
                </div>
                <Key className="w-12 h-12 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-1">Moradores</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.moradores}</h3>
                </div>
                <UserIcon className="w-12 h-12 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="administrador">Síndicos</SelectItem>
                  <SelectItem value="porteiro">Porteiros</SelectItem>
                  <SelectItem value="morador">Moradores</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCondominio} onValueChange={setFilterCondominio}>
                <SelectTrigger>
                  <SelectValue placeholder="Condomínio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os condomínios</SelectItem>
                  {condominios.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>
              Usuários Cadastrados ({filteredMoradores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Contato</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Endereço</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMoradores.map((morador) => (
                    <tr key={morador.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {morador.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{morador.nome}</p>
                            <p className="text-sm text-gray-500">{morador.apelido_endereco}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {morador.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{morador.email}</span>
                            </div>
                          )}
                          {morador.telefone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{morador.telefone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {getTipoBadge(morador.tipo_usuario)}
                      </td>
                      <td className="p-3">
                        <Badge className={`${
                          morador.status === 'ativo' ? 'bg-green-100 text-green-800' :
                          morador.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        } border-0`}>
                          {morador.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {morador.apelido_endereco || "Não informado"}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(morador)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(morador)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredMoradores.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum usuário encontrado com os filtros selecionados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Permissões */}
        <Card className="mt-6 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2">🔓 Acesso Total de Admin Master</h3>
                <p className="text-sm text-yellow-800">
                  Como Admin Master, você pode visualizar, editar e remover QUALQUER usuário do sistema, 
                  alterar permissões, tipos de acesso e gerenciar todos os dados sem restrições. 
                  Use esse poder com responsabilidade!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Edição */}
        {showEditModal && editingUsuario && (
          <EditarUsuarioModal
            usuario={editingUsuario}
            onClose={() => {
              setShowEditModal(false);
              setEditingUsuario(null);
            }}
            onUpdate={handleUpdateUsuario}
          />
        )}
      </div>
    </div>
  );
}