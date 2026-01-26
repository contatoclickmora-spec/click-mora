import React, { useState, useEffect } from 'react';
import { LogSistema } from "@/entities/LogSistema";
import { User } from "@/entities/User";
import { Morador } from "@/entities/Morador";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Search,
  Calendar,
  User as UserIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  FileText,
  Download
} from "lucide-react";
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditoriaAlteracoes() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const user = await User.me();
      const todosMoradores = await Morador.list();
      const moradorLogado = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      // Bloquear porteiros
      if (moradorLogado && moradorLogado.tipo_usuario === 'porteiro') {
        setUserType('porteiro');
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setUserType(moradorLogado?.tipo_usuario || 'administrador');

      // Buscar logs dos últimos 7 dias relacionados a moradores
      const dataLimite = subDays(new Date(), 7).toISOString();
      const todosLogs = await LogSistema.list('-timestamp');
      
      const logsRelevantes = todosLogs.filter(log => 
        log.timestamp >= dataLimite &&
        (log.tipo_acao === 'criar_morador' ||
         log.tipo_acao === 'editar_morador' ||
         log.tipo_acao === 'deletar_morador' ||
         log.tipo_acao === 'importar_moradores' ||
         log.tipo_acao === 'aprovar_morador' ||
         log.tipo_acao === 'recusar_morador' ||
         log.tipo_acao === 'tentativa_operacao_negada' ||
         log.tipo_acao === 'tentativa_acesso_negado')
      );

      setLogs(logsRelevantes);

    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = () => {
    const csv = [
      ['Data/Hora', 'Ação', 'Usuário', 'Email', 'Descrição', 'Sucesso'].join(','),
      ...logs.map(log => [
        format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        log.tipo_acao,
        log.usuario_nome || 'N/A',
        log.usuario_email,
        log.descricao,
        log.sucesso ? 'Sim' : 'Não'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_moradores_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getIconeAcao = (tipoAcao) => {
    const icones = {
      criar_morador: Plus,
      editar_morador: Edit,
      deletar_morador: Trash2,
      importar_moradores: FileText,
      aprovar_morador: CheckCircle,
      recusar_morador: XCircle,
      tentativa_operacao_negada: AlertTriangle,
      tentativa_acesso_negado: Shield
    };
    return icones[tipoAcao] || UserIcon;
  };

  const getCorAcao = (tipoAcao) => {
    const cores = {
      criar_morador: 'bg-green-100 text-green-800 border-green-300',
      editar_morador: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      deletar_morador: 'bg-red-100 text-red-800 border-red-300',
      importar_moradores: 'bg-blue-100 text-blue-800 border-blue-300',
      aprovar_morador: 'bg-green-100 text-green-800 border-green-300',
      recusar_morador: 'bg-red-100 text-red-800 border-red-300',
      tentativa_operacao_negada: 'bg-orange-100 text-orange-800 border-orange-300',
      tentativa_acesso_negado: 'bg-red-100 text-red-800 border-red-300'
    };
    return cores[tipoAcao] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const logsFiltrados = logs.filter(log =>
    log.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.usuario_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tentativasNegadas = logs.filter(log =>
    log.tipo_acao === 'tentativa_operacao_negada' || log.tipo_acao === 'tentativa_acesso_negado'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-500">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Apenas síndicos e administradores podem acessar os logs de auditoria.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Auditoria de Alterações - Últimos 7 Dias
          </h1>
          <p className="text-gray-600">
            Histórico completo de todas as operações realizadas com moradores
          </p>
        </div>

        {tentativasNegadas > 0 && (
          <Alert className="mb-6 border-2 border-orange-500 bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>⚠️ {tentativasNegadas} tentativa(s) de acesso não autorizado detectada(s)!</strong>
              <br />
              Revise os logs abaixo para identificar possíveis violações de segurança.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-sm text-gray-600">Total de Operações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{logs.filter(l => l.sucesso).length}</p>
              <p className="text-sm text-gray-600">Operações Bem-sucedidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{tentativasNegadas}</p>
              <p className="text-sm text-gray-600">Acessos Negados</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por usuário, ação ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={exportarRelatorio} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {logsFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum log encontrado nos últimos 7 dias</p>
              </CardContent>
            </Card>
          ) : (
            logsFiltrados.map(log => {
              const Icone = getIconeAcao(log.tipo_acao);
              const corAcao = getCorAcao(log.tipo_acao);

              return (
                <Card key={log.id} className="border-l-4 hover:shadow-lg transition-shadow" style={{
                  borderLeftColor: log.tipo_acao.includes('negad') ? '#f59e0b' : '#3b82f6'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${corAcao}`}>
                        <Icone className="w-6 h-6" />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${corAcao} border`}>
                            {log.tipo_acao.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          {!log.sucesso && (
                            <Badge variant="destructive">FALHOU</Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-1">{log.descricao}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span><strong>Usuário:</strong> {log.usuario_nome || log.usuario_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span><strong>Data:</strong> {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                          </div>
                        </div>

                        {log.erro_mensagem && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            <strong>Erro:</strong> {log.erro_mensagem}
                          </div>
                        )}

                        {(log.tipo_acao === 'tentativa_operacao_negada' || log.tipo_acao === 'tentativa_acesso_negado') && (
                          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-900">
                            <strong>⚠️ ALERTA DE SEGURANÇA:</strong> Tentativa de operação não autorizada
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}