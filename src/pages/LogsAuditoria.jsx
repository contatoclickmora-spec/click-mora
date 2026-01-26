import React, { useState, useEffect } from 'react';
import { LogSistema } from "@/entities/LogSistema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AtividadesRecentes from '../components/admin-master/AtividadesRecentes';
import { 
  FileText, 
  Crown,
  Search,
  Download,
  AlertTriangle,
  Edit,
  Plus,
  RefreshCw
} from "lucide-react";
import { format } from 'date-fns';

export default function LogsAuditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const allLogs = await LogSistema.list('-timestamp', 100);
      setLogs(allLogs);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: logs.length,
    criacao: logs.filter(l => l.tipo_acao.includes('criar')).length,
    edicao: logs.filter(l => l.tipo_acao.includes('editar')).length,
    delecao: logs.filter(l => l.tipo_acao.includes('deletar') || l.tipo_acao.includes('recusar')).length,
    erros: logs.filter(l => !l.sucesso).length
  };

  const exportarLogs = () => {
    const headers = ["Timestamp", "Usuário", "Ação", "Descrição", "Condomínio", "Sucesso"];
    const data = filteredLogs.map(log => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      log.usuario_nome || log.usuario_email,
      log.tipo_acao,
      log.descricao,
      log.condominio_nome || 'N/A',
      log.sucesso ? 'Sim' : 'Não'
    ]);

    const csv = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_auditoria_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      (log.usuario_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.usuario_nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'todos' || log.tipo_acao === filterTipo;
    return matchSearch && matchTipo;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoria</h1>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Admin Master
              </Badge>
            </div>
            <p className="text-gray-600">Histórico completo de todas as ações no sistema</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadLogs} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button onClick={exportarLogs} className="gap-2 bg-blue-600">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total de Logs</p>
                  <h3 className="text-3xl font-bold text-blue-900">{stats.total}</h3>
                </div>
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Criações</p>
                  <h3 className="text-3xl font-bold text-green-900">{stats.criacao}</h3>
                </div>
                <Plus className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium mb-1">Edições</p>
                  <h3 className="text-3xl font-bold text-yellow-900">{stats.edicao}</h3>
                </div>
                <Edit className="w-12 h-12 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium mb-1">Erros</p>
                  <h3 className="text-3xl font-bold text-red-900">{stats.erros}</h3>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por usuário ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="todos">Todos os tipos</option>
                <option value="criar_morador">Criar Morador</option>
                <option value="aprovar_morador">Aprovar Morador</option>
                <option value="recusar_morador">Recusar Morador</option>
                <option value="editar_morador">Editar Morador</option>
                <option value="deletar_morador">Deletar Morador</option>
                <option value="registrar_encomenda">Registrar Encomenda</option>
                <option value="retirar_encomenda">Retirar Encomenda</option>
                <option value="criar_condominio">Criar Condomínio</option>
                <option value="editar_condominio">Editar Condomínio</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Logs */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Histórico de Atividades ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AtividadesRecentes showAll={true} limit={100} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}