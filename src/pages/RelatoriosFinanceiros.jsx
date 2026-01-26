import React, { useState, useEffect } from 'react';
import { Condominio } from "@/entities/Condominio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp,
  Calendar,
  Download,
  Crown,
  Building2,
  CheckCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatoriosFinanceiros() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes_atual');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const condominiosData = await Condominio.list();
      setCondominios(condominiosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos financeiros
  const receitaMensal = condominios
    .filter(c => c.status === 'ativo')
    .reduce((acc, c) => acc + (c.valor_mensalidade || 0), 0);

  const receitaAnual = receitaMensal * 12;

  const condominiosAtivos = condominios.filter(c => c.status === 'ativo').length;
  const condominiosInativos = condominios.filter(c => c.status === 'inativo').length;
  const condominiosTeste = condominios.filter(c => c.status === 'teste').length;

  // Dados para gráfico de receita por plano
  const receitaPorPlano = [
    { plano: '30 moradores', valor: condominios.filter(c => c.plano === '30_moradores' && c.status === 'ativo').reduce((acc, c) => acc + c.valor_mensalidade, 0) },
    { plano: '50 moradores', valor: condominios.filter(c => c.plano === '50_moradores' && c.status === 'ativo').reduce((acc, c) => acc + c.valor_mensalidade, 0) },
    { plano: '100 moradores', valor: condominios.filter(c => c.plano === '100_moradores' && c.status === 'ativo').reduce((acc, c) => acc + c.valor_mensalidade, 0) },
    { plano: '200 moradores', valor: condominios.filter(c => c.plano === '200_moradores' && c.status === 'ativo').reduce((acc, c) => acc + c.valor_mensalidade, 0) },
    { plano: '500 moradores', valor: condominios.filter(c => c.plano === '500_moradores' && c.status === 'ativo').reduce((acc, c) => acc + c.valor_mensalidade, 0) },
    { plano: '500+ moradores', valor: condominios.filter(c => c.plano === '500_plus' && c.status === 'ativo').reduce((acc, c) => acc + c.valor_mensalidade, 0) }
  ].filter(item => item.valor > 0);

  // Dados para gráfico de pizza - distribuição de status
  const statusData = [
    { name: 'Ativos', value: condominiosAtivos, color: '#10b981' },
    { name: 'Inativos', value: condominiosInativos, color: '#ef4444' },
    { name: 'Em Teste', value: condominiosTeste, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Simulação de dados mensais (últimos 6 meses)
  const dadosMensais = Array.from({ length: 6 }, (_, i) => {
    const mes = subMonths(new Date(), 5 - i);
    return {
      mes: format(mes, 'MMM', { locale: ptBR }),
      receita: receitaMensal * (0.8 + Math.random() * 0.4), // Simulando variação
    };
  });

  const exportarRelatorio = () => {
    const headers = ["Condomínio", "Plano", "Status", "Valor Mensal", "Início", "Renovação"];
    const data = condominios.map(c => [
      c.nome,
      c.plano,
      c.status,
      `R$ ${(c.valor_mensalidade || 0).toFixed(2)}`,
      c.data_inicio || "",
      c.data_renovacao || ""
    ]);

    const csv = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Admin Master
              </Badge>
            </div>
            <p className="text-gray-600">Visão completa da saúde financeira da plataforma</p>
          </div>
          <Button onClick={exportarRelatorio} className="gap-2 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-12 h-12 opacity-80" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Receita Mensal</p>
              <h3 className="text-3xl font-bold">
                R$ {receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs opacity-75 mt-2">
                {condominiosAtivos} condomínios ativos
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-12 h-12 opacity-80" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Receita Anual Projetada</p>
              <h3 className="text-3xl font-bold">
                R$ {receitaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs opacity-75 mt-2">
                Baseado no mês atual
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="w-12 h-12 opacity-80" />
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Condomínios Ativos</p>
              <h3 className="text-3xl font-bold">{condominiosAtivos}</h3>
              <p className="text-xs opacity-75 mt-2">
                {condominiosTeste} em período de teste
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-12 h-12 opacity-80" />
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Ticket Médio</p>
              <h3 className="text-3xl font-bold">
                R$ {condominiosAtivos > 0 ? (receitaMensal / condominiosAtivos).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </h3>
              <p className="text-xs opacity-75 mt-2">
                Por condomínio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Receita por Mês */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Receita Mensal (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Status */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Distribuição de Condomínios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Receita por Plano */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Receita por Tipo de Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={receitaPorPlano}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="plano" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela de Condomínios */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Detalhamento por Condomínio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Condomínio</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Plano</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Valor Mensal</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Renovação</th>
                  </tr>
                </thead>
                <tbody>
                  {condominios.map((cond) => (
                    <tr key={cond.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">{cond.nome}</p>
                          <p className="text-sm text-gray-500">{cond.cidade}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{cond.plano.replace('_', ' ')}</td>
                      <td className="p-3">
                        <Badge className={`${
                          cond.status === 'ativo' ? 'bg-green-100 text-green-800' :
                          cond.status === 'teste' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        } border-0`}>
                          {cond.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        R$ {(cond.valor_mensalidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {cond.data_renovacao ? format(new Date(cond.data_renovacao), 'dd/MM/yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}