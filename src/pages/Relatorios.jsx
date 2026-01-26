import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  Package,
  PackageCheck,
  Clock,
  TrendingUp,
  Calendar,
  Filter,
  Shield
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSecurityContext, secureLoadEntity } from "../components/utils/securityMiddleware";

export default function RelatoriosPage() {
  const [encomendas, setEncomendas] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    dataInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dataFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: "todos"
  });

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // PROTEÇÃO: Obter contexto de segurança do usuário
      const context = await getSecurityContext();
      setUserCondominioId(context.condominioId);

      // PROTEÇÃO: Carregar APENAS dados do condomínio do usuário
      const [encData, morData, resData] = await Promise.all([
        secureLoadEntity('Encomenda', context.condominioId, { sort: '-created_date' }),
        secureLoadEntity('Morador', context.condominioId),
        secureLoadEntity('Residencia', context.condominioId)
      ]);

      // VALIDAÇÃO FINAL: Garantir que todos os dados pertencem ao condomínio correto
      const encomendasValidadas = context.condominioId 
        ? encData.filter(e => e.condominio_id === context.condominioId)
        : encData;
      
      const moradoresValidados = context.condominioId
        ? morData.filter(m => m.condominio_id === context.condominioId)
        : morData;
      
      const residenciasValidadas = context.condominioId
        ? resData.filter(r => r.condominio_id === context.condominioId)
        : resData;

      setEncomendas(encomendasValidadas);
      setMoradores(moradoresValidados);
      setResidencias(residenciasValidadas);

      console.log(`[SECURITY] Relatórios carregados - Condomínio: ${context.condominioId}, Encomendas: ${encomendasValidadas.length}`);
      
    } catch (error) {
      console.error("[SECURITY] Erro ao carregar relatórios:", error);
      setError("Erro ao carregar relatórios. Verifique suas permissões.");
      setEncomendas([]);
      setMoradores([]);
      setResidencias([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEncomendas = () => {
    return encomendas.filter(encomenda => {
      // Filtro por data
      const dataEntrada = parseISO(encomenda.data_entrada);
      const intervalo = {
        start: parseISO(filtros.dataInicio),
        end: parseISO(filtros.dataFim + 'T23:59:59')
      };

      const dentroDoIntervalo = isWithinInterval(dataEntrada, intervalo);

      // Filtro por status
      const statusMatch = filtros.status === "todos" || encomenda.status === filtros.status;

      return dentroDoIntervalo && statusMatch;
    });
  };

  const filteredEncomendas = getFilteredEncomendas();

  const getStats = () => {
    // PROTEÇÃO: Tratar arrays vazios e valores nulos
    const total = filteredEncomendas?.length || 0;
    const aguardando = filteredEncomendas?.filter(e => e.status === "aguardando").length || 0;
    const retiradas = filteredEncomendas?.filter(e => e.status === "retirada").length || 0;
    const devolvidas = filteredEncomendas?.filter(e => e.status === "devolvida").length || 0;

    // PROTEÇÃO: Tempo médio de retirada (em dias) - prevenir NaN
    const encomendasRetiradas = filteredEncomendas?.filter(e => 
      e.status === "retirada" && e.data_retirada && e.data_entrada
    ) || [];
    
    let tempoMedio = 0;
    
    if (encomendasRetiradas.length > 0) {
      try {
        const tempoTotal = encomendasRetiradas.reduce((acc, enc) => {
          const entrada = new Date(enc.data_entrada);
          const retirada = new Date(enc.data_retirada);
          
          // VALIDAÇÃO: Datas válidas
          if (isNaN(entrada.getTime()) || isNaN(retirada.getTime())) {
            return acc;
          }
          
          const diffTime = Math.abs(retirada.getTime() - entrada.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // VALIDAÇÃO: Evitar valores absurdos
          return acc + (diffDays > 0 && diffDays < 365 ? diffDays : 0);
        }, 0);
        
        tempoMedio = tempoTotal > 0 
          ? (tempoTotal / encomendasRetiradas.length).toFixed(1) 
          : 0;
      } catch (err) {
        console.error('[DATA_INTEGRITY] Erro ao calcular tempo médio:', err);
        tempoMedio = 0;
      }
    }

    return { total, aguardando, retiradas, devolvidas, tempoMedio };
  };

  const stats = getStats();

  const getMoradorNome = (moradorId) => {
    const morador = moradores.find(m => m.id === moradorId);
    return morador ? morador.nome : "Não encontrado";
  };

  const getResidenciaInfo = (moradorId) => {
    const morador = moradores.find(m => m.id === moradorId);
    if (!morador) return "Não encontrado";

    return morador.apelido_endereco || morador.abreviacao || "N/A";
  };

  const exportarCSV = () => {
    const headers = [
      "Data de Entrada",
      "Morador",
      "Endereço",
      "Remetente",
      "Status",
      "Data de Retirada",
      "Porteiro Entrada"
    ];

    const dados = filteredEncomendas.map(enc => [
      format(new Date(enc.data_entrada), 'dd/MM/yyyy HH:mm'),
      getMoradorNome(enc.morador_id),
      getResidenciaInfo(enc.morador_id),
      enc.remetente || "Não informado",
      enc.status,
      enc.data_retirada ? format(new Date(enc.data_retirada), 'dd/MM/yyyy HH:mm') : "",
      enc.porteiro_entrada || ""
    ]);

    const csvContent = [
      headers.join(','),
      ...dados.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_encomendas_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    let config = { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Desconhecido' };
    if (status === "aguardando") {
      config = { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Aguardando' };
    } else if (status === "retirada") {
      config = { color: 'bg-green-50 text-green-700 border-green-200', label: 'Retirada' };
    } else if (status === "devolvida") {
      config = { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Devolvida' };
    }
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios e Métricas</h1>
          <p className="text-gray-600">Análise detalhada do fluxo de encomendas</p>
        </div>

        <Button onClick={exportarCSV} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Alerta de Segurança */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          Por segurança, os códigos de retirada não são exibidos nos relatórios. 
          Apenas os moradores têm acesso aos seus códigos individuais.
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="todos">Todos</option>
                <option value="aguardando">Aguardando</option>
                <option value="retirada">Retiradas</option>
                <option value="devolvida">Devolvidas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600">Total de Encomendas</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">No período</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-900">{stats.aguardando}</h3>
            <p className="text-gray-600">Aguardando Retirada</p>
            <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-200">
              {((stats.aguardando / stats.total) * 100 || 0).toFixed(0)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <PackageCheck className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-900">{stats.retiradas}</h3>
            <p className="text-gray-600">Já Retiradas</p>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
              {((stats.retiradas / stats.total) * 100 || 0).toFixed(0)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-900">{stats.tempoMedio}</h3>
            <p className="text-gray-600">Dias Médio Retirada</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-sm text-gray-500">Tempo médio</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de encomendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detalhamento das Encomendas ({filteredEncomendas.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabela para telas maiores */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data/Hora</th>
                  <th className="text-left p-2">Morador</th>
                  <th className="text-left p-2">Local</th>
                  <th className="text-left p-2">Remetente</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Retirada</th>
                </tr>
              </thead>
              <tbody>
                {filteredEncomendas.slice(0, 20).map((encomenda) => (
                  <tr key={encomenda.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 whitespace-nowrap">
                      {format(new Date(encomenda.data_entrada), 'dd/MM/yy HH:mm')}
                    </td>
                    <td className="p-2">{getMoradorNome(encomenda.morador_id)}</td>
                    <td className="p-2 whitespace-nowrap">{getResidenciaInfo(encomenda.morador_id)}</td>
                    <td className="p-2">{encomenda.remetente || "-"}</td>
                    <td className="p-2"><StatusBadge status={encomenda.status} /></td>
                    <td className="p-2 whitespace-nowrap">
                      {encomenda.data_retirada
                        ? format(new Date(encomenda.data_retirada), 'dd/MM HH:mm')
                        : "-"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista de Cards para telas menores */}
          <div className="space-y-4 md:hidden">
            {filteredEncomendas.slice(0, 20).map((encomenda) => (
              <Card key={encomenda.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{getMoradorNome(encomenda.morador_id)}</p>
                    <p className="text-sm text-gray-500">{getResidenciaInfo(encomenda.morador_id)}</p>
                  </div>
                  <StatusBadge status={encomenda.status} />
                </div>
                <div className="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
                  <p><strong>Entrada:</strong> {format(new Date(encomenda.data_entrada), 'dd/MM/yy HH:mm')}</p>
                  <p><strong>Remetente:</strong> {encomenda.remetente || "-"}</p>
                  <p><strong>Retirada:</strong> {encomenda.data_retirada ? format(new Date(encomenda.data_retirada), 'dd/MM/yy HH:mm') : "Pendente"}</p>
                </div>
              </Card>
            ))}
          </div>

          {filteredEncomendas.length > 20 && (
            <div className="p-4 text-center text-gray-500">
              Mostrando 20 de {filteredEncomendas.length} registros.
              Use o filtro ou exporte o CSV para ver todos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}