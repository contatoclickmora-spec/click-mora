import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Shield, AlertTriangle } from "lucide-react";

export default function WhatsApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#25D366]" /> WhatsApp
          </h1>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Esta aba está reativada em modo seguro. Nenhuma integração externa é chamada e nenhum envio é realizado.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">Integração: <span className="font-medium text-gray-900">Desativada</span></p>
              <p className="text-sm text-gray-600">Conexão: <span className="font-medium text-gray-900">Nenhuma</span></p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">Nenhum provedor configurado.</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled>Conectar provedor</Button>
                <Button variant="outline" disabled>Testar mensagem</Button>
              </div>
              <p className="text-xs text-gray-500">Habilitaremos os botões após definirmos o provedor desejado.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="w-4 h-4" /> Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-700">
              Para evitar qualquer erro anterior, todos os envios automáticos e chamadas externas estão desativados nesta versão.
            </p>
            <p className="text-sm text-gray-600">
              Quando você confirmar o provedor e escopo desejados, ativaremos as ações gradualmente com logs e validações.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}