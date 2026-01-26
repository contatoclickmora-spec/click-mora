import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Server,
  Database,
  Zap,
  Clock,
  RefreshCw,
  Download
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function MonitoramentoSistema() {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Dados simulados de monitoramento
  const systemStats = {
    status: 'online',
    uptime: '99.98%',
    responseTime: 245, // ms
    activeUsers: 1847,
    requestsPerMinute: 3542,
    errorRate: 0.02, // %
    databaseLoad: 42, // %
    cpuUsage: 38, // %
    memoryUsage: 65, // %
  };

  // Dados de performance dos últimos 60 minutos
  const performanceData = Array.from({ length: 12 }, (_, i) => ({
    time: `${11 - i}h`,
    responseTime: 200 + Math.random() * 100,
    requests: 3000 + Math.random() * 1000,
    errors: Math.random() * 10
  }));

  // Erros recentes (simulados)
  const recentErrors = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 3600000),
      type: 'Database Connection',
      severity: 'warning',
      message: 'Conexão com banco de dados lenta (2.3s)',
      resolved: true
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 7200000),
      type: 'API Integration',
      severity: 'error',
      message: 'Falha ao enviar WhatsApp - Timeout',
      resolved: true
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 10800000),
      type: 'File Upload',
      severity: 'info',
      message: 'Upload de arquivo grande (>10MB) - Performance degradada',
      resolved: true
    }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setLoading(false);
    }, 1000);
  };

  const exportLogs = () => {
    alert('Exportando logs do sistema...');
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Monitoramento do Sistema</h1>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Admin Master
              </Badge>
            </div>
            <p className="text-gray-600">Status em tempo real, erros e performance da plataforma</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} disabled={loading} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={exportLogs} className="gap-2 bg-blue-600">
              <Download className="w-4 h-4" />
              Exportar Logs
            </Button>
          </div>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Server className="w-12 h-12 opacity-80" />
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Status do Sistema</p>
              <h3 className="text-3xl font-bold">Online</h3>
              <p className="text-xs opacity-75 mt-2">
                Uptime: {systemStats.uptime}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-12 h-12 opacity-80" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Tempo de Resposta</p>
              <h3 className="text-3xl font-bold">{systemStats.responseTime}ms</h3>
              <p className="text-xs opacity-75 mt-2">
                Média últimos 60 minutos
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-12 h-12 opacity-80" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Requisições/Min</p>
              <h3 className="text-3xl font-bold">{systemStats.requestsPerMinute.toLocaleString()}</h3>
              <p className="text-xs opacity-75 mt-2">
                {systemStats.activeUsers} usuários ativos
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-12 h-12 opacity-80" />
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm opacity-90 mb-1">Taxa de Erros</p>
              <h3 className="text-3xl font-bold">{systemStats.errorRate}%</h3>
              <p className="text-xs opacity-75 mt-2">
                Muito baixa - sistema saudável
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Tempo de Resposta (Últimos 60min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#3b82f6" 
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Requisições e Erros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recursos do Sistema */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              Uso de Recursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* CPU */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU</span>
                  <span className="text-sm font-semibold text-gray-900">{systemStats.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${systemStats.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Memória */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Memória RAM</span>
                  <span className="text-sm font-semibold text-gray-900">{systemStats.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${systemStats.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Banco de Dados */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Banco de Dados</span>
                  <span className="text-sm font-semibold text-gray-900">{systemStats.databaseLoad}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${systemStats.databaseLoad}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Erros e Problemas Recentes */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Erros e Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentErrors.map((error) => (
                <div 
                  key={error.id}
                  className="flex items-start gap-4 p-4 rounded-lg border-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0">
                    {error.resolved ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${getSeverityColor(error.severity)} border`}>
                        {error.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-900">{error.type}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{error.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{error.timestamp.toLocaleString('pt-BR')}</span>
                      </div>
                      {error.resolved && (
                        <span className="text-green-600 font-medium">✓ Resolvido</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {recentErrors.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">Nenhum erro registrado</h3>
                  <p className="text-gray-500 mt-2">O sistema está funcionando perfeitamente!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Informação */}
        <Card className="mt-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Activity className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">🔍 Monitoramento em Tempo Real</h3>
                <p className="text-sm text-blue-800">
                  Esta página mostra o status da plataforma em tempo real. Você pode identificar problemas de performance, 
                  erros, lentidão e tomar ações para melhorar a experiência dos usuários. 
                  Os dados são atualizados automaticamente a cada minuto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Última atualização */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  );
}