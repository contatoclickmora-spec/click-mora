import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Play
} from "lucide-react";

export default function WhatsAppQAPanel({ condominioId, config }) {
  const [loading, setLoading] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [qaResults, setQaResults] = useState(null);
  const [error, setError] = useState(null);

  const runQA = async () => {
    if (!telefone.trim()) {
      setError('Digite um telefone para teste');
      return;
    }

    setLoading(true);
    setError(null);
    setQaResults(null);

    try {
      const response = await fetch('/api/functions/qaWhatsAppIntegration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condominio_id: condominioId,
          telefone_teste: telefone
        })
      });

      const data = await response.json();
      setQaResults(data);

      if (!response.ok) {
        setError(data.error || 'Erro ao executar QA');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-50 border-green-200';
      case 'FAILED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            Status da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Instance ID</span>
                <Badge className={config.zapi_instance_id ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {config.zapi_instance_id ? "✓ Configurado" : "✗ Faltando"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Token</span>
                <Badge className={config.zapi_token ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {config.zapi_token ? "✓ Configurado" : "✗ Faltando"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Client Token</span>
                <Badge className={config.zapi_client_token ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {config.zapi_client_token ? "✓ Configurado" : "✗ Faltando"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <Badge className={config.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {config.ativo ? "🟢 Ativo" : "🔴 Inativo"}
                </Badge>
              </div>
            </div>
          ) : (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                Nenhuma configuração encontrada
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Teste de QA */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Play className="w-5 h-5 text-purple-600" />
            </div>
            Executar QA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Telefone para Teste (com código país)</Label>
            <Input
              placeholder="5521987654321"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1"
              disabled={loading || !config?.ativo}
            />
            <p className="text-xs text-gray-500 mt-1">
              Será enviada uma mensagem de teste para este número
            </p>
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={runQA}
            disabled={loading || !config?.ativo}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando QA...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Executar Testes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {qaResults && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultados dos Testes</CardTitle>
              <Badge className={qaResults.summary.status === 'ALL_TESTS_PASSED' 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
              }>
                {qaResults.summary.passed}/{qaResults.summary.total_tests} Passou
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {qaResults.summary.status === 'ALL_TESTS_PASSED' ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  ✅ Todos os testes passaram! Z-API está funcionando corretamente.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  ❌ Alguns testes falharam. Verifique as configurações.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {qaResults.tests.map((test, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(test.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{test.name}</h4>
                      {test.message && (
                        <p className="text-xs text-gray-700 mb-1">{test.message}</p>
                      )}
                      {test.error && (
                        <p className="text-xs text-red-700">{test.error}</p>
                      )}
                      {test.status_code && (
                        <p className="text-xs text-gray-600 mt-1">Status Code: {test.status_code}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t">
              Executado em: {new Date(qaResults.timestamp).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}