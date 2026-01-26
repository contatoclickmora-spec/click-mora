import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Building2, 
  Crown, 
  User,
  Shield,
  Trash2,
  Edit,
  PlusCircle,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MoradorForm from '../components/moradores/MoradorForm';
import NovoCondominioModal from '../components/admin-master/NovoCondominioModal';

const UserCard = ({ user, type, onEdit, onDelete, onDefineSupremo, isSupremo, userType, onToggleStatus }) => {
  const typeConfig = {
    sindico: { icon: Crown, color: 'purple' },
    porteiro: { icon: Shield, color: 'blue' },
    morador: { icon: User, color: 'gray' },
  };

  const Icon = typeConfig[type].icon;
  const userIsSupremo = typeof isSupremo === 'function' ? isSupremo(user) : false;

  const getStatusColor = (status) => {
    switch(status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-4 border rounded-lg flex items-center justify-between transition-all ${userIsSupremo ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' : 'bg-white'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-${typeConfig[type].color}-100 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${typeConfig[type].color}-600`} />
        </div>
        <div>
          <p className="font-semibold">{user.nome}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex gap-2 mt-1">
            {userIsSupremo && <Badge className="bg-yellow-400 text-white">Admin Supremo</Badge>}
            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {userType === 'admin_master' && (
          <>
            {user.status === 'ativo' ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onToggleStatus(user, 'inativo')}
                className="text-orange-600 hover:bg-orange-50"
              >
                Desativar
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onToggleStatus(user, 'ativo')}
                className="text-green-600 hover:bg-green-50"
              >
                Ativar
              </Button>
            )}
          </>
        )}
        {userType === 'admin_master' && type === 'sindico' && !userIsSupremo && onDefineSupremo && (
          <Button variant="outline" size="sm" onClick={() => onDefineSupremo(user)} className="text-yellow-600 hover:bg-yellow-50">
            <Crown className="w-4 h-4 mr-1" /> Tornar Supremo
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onEdit(user)}><Edit className="w-4 h-4" /></Button>
        {userType === 'admin_master' && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(user)}><Trash2 className="w-4 h-4" /></Button>
        )}
      </div>
    </div>
  );
};

const TabContent = ({ title, users, type, onAdd, onToggleStatus, onDelete, ...props }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title} ({users.length})</h3>
      <Button onClick={onAdd}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
    </div>
    <div className="space-y-3">
      {users.length > 0 ? (
        users.map(u => <UserCard key={u.id} user={u} type={type} onToggleStatus={onToggleStatus} onDelete={onDelete} {...props} />)
      ) : (
        <p className="text-gray-500 text-center py-4">Nenhum usuário deste tipo encontrado.</p>
      )}
    </div>
  </div>
);

export default function GestaoCondominios({ userType }) {
  const [condominios, setCondominios] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCondominio, setSelectedCondominio] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingUserType, setAddingUserType] = useState(null);
  const [isCreateCondominioOpen, setIsCreateCondominioOpen] = useState(false);

  // Função de carregamento de dados - SEM dependências para evitar loops
  const loadData = async () => {
    try {
      const isInitialLoad = loading;
      if (!isInitialLoad) setRefreshing(true);
      
      console.log("🔄 Carregando dados...");
      
      const [condos, mors, res] = await Promise.all([
        base44.entities.Condominio.list(), 
        base44.entities.Morador.list(),
        base44.entities.Residencia.list()
      ]);
      
      console.log(`✅ Dados carregados: ${condos.length} condomínios, ${mors.length} moradores`);
      
      setCondominios(condos);
      setMoradores(mors);
      setResidencias(res);
      
      // Se ainda não tem condomínio selecionado, selecionar o primeiro
      if (!selectedCondominio && condos.length > 0) {
        console.log("📍 Selecionando primeiro condomínio:", condos[0].nome);
        setSelectedCondominio(condos[0]);
      } else if (selectedCondominio) {
        // Atualizar o condomínio selecionado com os dados mais recentes
        const updatedCondo = condos.find(c => c.id === selectedCondominio.id);
        if (updatedCondo) {
          setSelectedCondominio(updatedCondo);
        }
      }
    } catch (err) {
      console.error("❌ Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados APENAS uma vez quando o componente montar
  useEffect(() => {
    const abortController = new AbortController();
    console.log("🚀 Componente GestaoCondominios montado");
    loadData();
    return () => abortController.abort();
     
  }, []); // Array vazio = executa apenas uma vez, sem loadData para evitar loops

  const filteredCondominios = condominios.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const moradoresDoCondominio = selectedCondominio
    ? moradores.filter(m => m.condominio_id === selectedCondominio.id)
    : [];

  const sindicos = moradoresDoCondominio.filter(m => m.tipo_usuario === 'administrador');
  const porteiros = moradoresDoCondominio.filter(m => m.tipo_usuario === 'porteiro');
  const moradoresNormais = moradoresDoCondominio.filter(m => m.tipo_usuario === 'morador');

  const handleToggleStatus = async (user, newStatus) => {
    if (!window.confirm(`Tem certeza que deseja ${newStatus === 'ativo' ? 'ativar' : 'desativar'} ${user.nome}?`)) {
      return;
    }

    try {
      await base44.entities.Morador.update(user.id, { status: newStatus });
      alert(`Status de ${user.nome} atualizado para ${newStatus}!`);
      await loadData();
    } catch(err) {
      alert("Erro ao atualizar status.");
    }
  };

  const handleDefineSupremo = async (sindico) => {
    if (!selectedCondominio || !window.confirm(`Deseja tornar ${sindico.nome} o Administrador Supremo de ${selectedCondominio.nome}?`)) return;
    try {
      await base44.entities.Condominio.update(selectedCondominio.id, { administrador_supremo_id: sindico.id });
      alert("Administrador Supremo definido com sucesso!");
      await loadData();
    } catch(err) {
      alert("Erro ao definir Administrador Supremo.");
    }
  };

  const handleDeleteSindico = async (sindico) => {
    if (!selectedCondominio) return;

    const isAdminSupremo = selectedCondominio.administrador_supremo_id === sindico.id;
    
    const confirmMessage = isAdminSupremo
      ? `⚠️ ATENÇÃO: ${sindico.nome} é o ADMINISTRADOR SUPREMO deste condomínio!\n\n` +
        `Ao removê-lo como síndico, ele perderá:\n` +
        `• Status de Administrador Supremo\n` +
        `• Acesso total ao condomínio\n` +
        `• Vínculo com o condomínio\n\n` +
        `Deseja continuar?`
      : `Tem certeza que deseja remover ${sindico.nome} como síndico de ${selectedCondominio.nome}?\n\n` +
        `Ele perderá o acesso administrativo ao condomínio.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (isAdminSupremo) {
        await base44.entities.Condominio.update(selectedCondominio.id, {
          administrador_supremo_id: null
        });
      }

      const novosSindicosIds = (selectedCondominio.sindicos_ids || []).filter(id => id !== sindico.id);
      await base44.entities.Condominio.update(selectedCondominio.id, {
        sindicos_ids: novosSindicosIds
      });

      await base44.entities.Morador.update(sindico.id, {
        tipo_usuario: 'morador',
        condominio_id: null
      });

      alert(`✅ ${sindico.nome} foi removido como síndico com sucesso!`);
      await loadData();
    } catch (err) {
      console.error("Erro ao remover síndico:", err);
      alert("❌ Erro ao remover síndico. Tente novamente.");
    }
  };

  const handleDeletePorteiro = async (porteiro) => {
    if (!window.confirm(`Tem certeza que deseja remover ${porteiro.nome} como porteiro?\n\nEle perderá o acesso ao sistema.`)) {
      return;
    }

    try {
      await base44.entities.Morador.update(porteiro.id, {tipo_usuario: 'morador'});
      alert(`✅ ${porteiro.nome} foi removido com sucesso!`);
      await loadData();
    } catch (err) {
      console.error("Erro ao remover porteiro:", err);
      alert("❌ Erro ao remover porteiro. Tente novamente.");
    }
  };

  const handleDeleteMorador = async (morador) => {
    if (!window.confirm(`Tem certeza que deseja remover ${morador.nome}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await base44.entities.Morador.delete(morador.id);
      alert(`✅ ${morador.nome} foi removido com sucesso!`);
      await loadData();
    } catch (err) {
      console.error("Erro ao remover morador:", err);
      alert("❌ Erro ao remover morador. Tente novamente.");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveEdit = async (formData) => {
    if (!editingUser) return;
    try {
      const { identificador_principal, complemento, ...moradorData } = formData;
      let residenciaId = formData.residencia_id;
      
      const condominioId = editingUser.condominio_id;

      const existingResidencias = residencias.filter(res =>
        res.identificador_principal === identificador_principal &&
        (res.complemento || "") === (complemento || "") &&
        res.condominio_id === condominioId
      );

      if (existingResidencias.length > 0) {
        residenciaId = existingResidencias[0].id;
      } else if (identificador_principal) {
        const newResidencia = await base44.entities.Residencia.create({
          identificador_principal: identificador_principal,
          complemento: complemento || "",
          condominio_id: condominioId
        });
        residenciaId = newResidencia.id;
      } else {
        residenciaId = null;
      }
      
      const finalMoradorData = {
        ...moradorData,
        residencia_id: residenciaId,
        condominio_id: condominioId,
      };

      await base44.entities.Morador.update(editingUser.id, finalMoradorData);

      alert('Usuário atualizado com sucesso!');
      handleCancelEdit();
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar morador:", err);
      alert("Não foi possível atualizar o morador. Tente novamente.");
    }
  };

  const handleAdd = (type) => {
    setAddingUserType(type);
    setIsAddModalOpen(true);
  };

  const handleCancelAdd = () => {
    setIsAddModalOpen(false);
    setAddingUserType(null);
  };

  const handleSaveNewUser = async (formData) => {
    if (!selectedCondominio) {
      alert("Nenhum condomínio selecionado.");
      return;
    }
    try {
      const { identificador_principal, complemento, ...moradorData } = formData;
      let residenciaId;
      
      const condominioId = selectedCondominio.id;

      const existingResidencias = residencias.filter(res =>
        res.identificador_principal === identificador_principal &&
        (res.complemento || "") === (complemento || "") &&
        res.condominio_id === condominioId
      );

      if (existingResidencias.length > 0) {
        residenciaId = existingResidencias[0].id;
      } else if (identificador_principal) {
        const newResidencia = await base44.entities.Residencia.create({
          identificador_principal: identificador_principal,
          complemento: complemento || "",
          condominio_id: condominioId
        });
        residenciaId = newResidencia.id;
      } else {
        residenciaId = null;
      }
      
      const finalMoradorData = {
        ...moradorData,
        residencia_id: residenciaId,
        condominio_id: condominioId,
      };

      await base44.entities.Morador.create(finalMoradorData);

      alert('Usuário adicionado com sucesso!');
      handleCancelAdd();
      await loadData();
    } catch (err) {
      console.error("Erro ao adicionar usuário:", err);
      alert("Não foi possível adicionar o usuário. Tente novamente.");
    }
  };

  const handleCondominioCreated = async () => {
    setIsCreateCondominioOpen(false);
    await loadData();
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8 flex gap-6 h-full">
      {/* Coluna da Esquerda: Lista de Condomínios */}
      <div className="w-1/3 flex flex-col gap-4">
        <Card className="flex-shrink-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Buscar Condomínio</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadData}
              disabled={refreshing}
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Digite o nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => setIsCreateCondominioOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar Novo Condomínio
            </Button>
          </CardContent>
        </Card>
        <Card className="flex-grow overflow-y-auto">
           <CardHeader><CardTitle>Condomínios ({filteredCondominios.length})</CardTitle></CardHeader>
           <CardContent className="space-y-2">
            {filteredCondominios.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCondominio(c)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${selectedCondominio?.id === c.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <p className="font-semibold">{c.nome}</p>
                <p className={`text-sm ${selectedCondominio?.id === c.id ? 'text-blue-200' : 'text-gray-500'}`}>{c.cidade}</p>
              </div>
            ))}
           </CardContent>
        </Card>
      </div>

      {/* Coluna da Direita: Detalhes do Condomínio */}
      <div className="w-2/3">
        {selectedCondominio ? (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                Gerenciando: {selectedCondominio.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sindicos">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sindicos"><Crown className="w-4 h-4 mr-2" />Síndicos</TabsTrigger>
                  <TabsTrigger value="porteiros"><Shield className="w-4 h-4 mr-2" />Porteiros</TabsTrigger>
                  <TabsTrigger value="moradores"><User className="w-4 h-4 mr-2" />Moradores</TabsTrigger>
                </TabsList>
                <TabsContent value="sindicos" className="pt-4">
                  <TabContent 
                    title="Síndicos" 
                    users={sindicos} 
                    type="sindico" 
                    onAdd={() => handleAdd('administrador')}
                    onEdit={handleEdit}
                    onDelete={handleDeleteSindico}
                    onDefineSupremo={handleDefineSupremo}
                    onToggleStatus={handleToggleStatus}
                    isSupremo={(user) => user.id === selectedCondominio.administrador_supremo_id}
                    userType={userType}
                  />
                </TabsContent>
                <TabsContent value="porteiros" className="pt-4">
                  <TabContent 
                    title="Porteiros" 
                    users={porteiros} 
                    type="porteiro" 
                    onAdd={() => handleAdd('porteiro')}
                    onEdit={handleEdit}
                    onDelete={handleDeletePorteiro}
                    onToggleStatus={handleToggleStatus}
                    userType={userType}
                  />
                </TabsContent>
                <TabsContent value="moradores" className="pt-4">
                  <div className="mb-4 bg-gray-100 p-3 rounded-lg">
                    <p>
                      <span className="font-bold">{moradoresNormais.filter(m => m.status === 'ativo').length}</span> moradores ativos de 
                      <span className="font-bold"> {selectedCondominio.limite_moradores}</span> permitidos no plano.
                    </p>
                  </div>
                   <TabContent 
                    title="Moradores" 
                    users={moradoresNormais} 
                    type="morador" 
                    onAdd={() => handleAdd('morador')}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMorador}
                    onToggleStatus={handleToggleStatus}
                    userType={userType}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecione um condomínio para gerenciar</p>
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="w-full max-w-2xl">
            <MoradorForm
              morador={editingUser}
              onSubmit={handleSaveEdit}
              onCancel={handleCancelEdit}
              residencias={residencias.filter(res => res.condominio_id === selectedCondominio.id)}
            />
          </div>
        </div>
      )}

      {isAddModalOpen && selectedCondominio && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="w-full max-w-2xl">
            <MoradorForm
              onSubmit={handleSaveNewUser}
              onCancel={handleCancelAdd}
              residencias={residencias.filter(res => res.condominio_id === selectedCondominio.id)}
              initialUserType={addingUserType}
              selectedCondominioId={selectedCondominio.id}
            />
          </div>
        </div>
      )}

      {isCreateCondominioOpen && (
        <NovoCondominioModal
          onClose={() => setIsCreateCondominioOpen(false)}
          onSave={handleCondominioCreated}
        />
      )}
    </div>
  );
}