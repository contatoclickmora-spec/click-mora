import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Crown,
  Save,
  Shield,
  Bell,
  Zap,
  Server,
  AlertCircle
} from "lucide-react";

export default function ConfiguracoesSistema() {
  const [config, setConfig] = useState({
    // Notificações
    notificacoes_whatsapp: true,
    notificacoes_email: true,
    notificacoes_push: false,
    
    // Segurança
    autenticacao_dois_fatores: false,
    tempo_sessao: 60,
    senha_forte_obrigatoria: true,
    
    // Sistema
    manutencao_programada: false,
    backup_automatico: true,
    logs_detalhados: true,
    
    // Integrações
    api_whatsapp_key: "sk-demo-***",
    api_email_key: "sg-demo-***",
    google_maps_key: "AIza***",
  });

  const handleSave = () => {
    alert("Configurações salvas com sucesso!");
  };

  const ConfigSection = ({ title, icon: Icon, children }) => (
    <Card className="border-0 shadow-md mb-6">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {children}
      </CardContent>
    </Card>
  );

  const ConfigItem = ({ label, description, children }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <Label className="text-base font-semibold text-gray-900">{label}</Label>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Admin Master
              </Badge>
            </div>
            <p className="text-gray-600">Controle completo das configurações globais da plataforma</p>
          </div>
          <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </div>

        {/* Notificações */}
        <ConfigSection title="Notificações" icon={Bell}>
          <ConfigItem 
            label="WhatsApp" 
            description="Enviar notificações via WhatsApp para moradores"
          >
            <Switch 
              checked={config.notificacoes_whatsapp}
              onCheckedChange={(checked) => setConfig({...config, notificacoes_whatsapp: checked})}
            />
          </ConfigItem>

          <ConfigItem 
            label="E-mail" 
            description="Enviar notificações por e-mail"
          >
            <Switch 
              checked={config.notificacoes_email}
              onCheckedChange={(checked) => setConfig({...config, notificacoes_email: checked})}
            />
          </ConfigItem>

          <ConfigItem 
            label="Push Notifications" 
            description="Notificações push no navegador/app"
          >
            <Switch 
              checked={config.notificacoes_push}
              onCheckedChange={(checked) => setConfig({...config, notificacoes_push: checked})}
            />
          </ConfigItem>
        </ConfigSection>

        {/* Segurança */}
        <ConfigSection title="Segurança e Privacidade" icon={Shield}>
          <ConfigItem 
            label="Autenticação de Dois Fatores" 
            description="Exigir 2FA para todos os administradores"
          >
            <Switch 
              checked={config.autenticacao_dois_fatores}
              onCheckedChange={(checked) => setConfig({...config, autenticacao_dois_fatores: checked})}
            />
          </ConfigItem>

          <ConfigItem 
            label="Senha Forte Obrigatória" 
            description="Exigir senhas complexas (mínimo 8 caracteres, maiúsculas, números)"
          >
            <Switch 
              checked={config.senha_forte_obrigatoria}
              onCheckedChange={(checked) => setConfig({...config, senha_forte_obrigatoria: checked})}
            />
          </ConfigItem>

          <ConfigItem 
            label="Tempo de Sessão" 
            description="Tempo em minutos antes do logout automático"
          >
            <Input 
              type="number" 
              value={config.tempo_sessao}
              onChange={(e) => setConfig({...config, tempo_sessao: parseInt(e.target.value)})}
              className="w-24"
            />
          </ConfigItem>
        </ConfigSection>

        {/* Sistema */}
        <ConfigSection title="Sistema e Manutenção" icon={Server}>
          <ConfigItem 
            label="Modo Manutenção" 
            description="Bloquear acesso ao sistema para manutenção"
          >
            <Switch 
              checked={config.manutencao_programada}
              onCheckedChange={(checked) => setConfig({...config, manutencao_programada: checked})}
            />
          </ConfigItem>

          <ConfigItem 
            label="Backup Automático Diário" 
            description="Realizar backup automático do banco de dados"
          >
            <Switch 
              checked={config.backup_automatico}
              onCheckedChange={(checked) => setConfig({...config, backup_automatico: checked})}
            />
          </ConfigItem>

          <ConfigItem 
            label="Logs Detalhados" 
            description="Registrar todas as ações dos usuários (recomendado)"
          >
            <Switch 
              checked={config.logs_detalhados}
              onCheckedChange={(checked) => setConfig({...config, logs_detalhados: checked})}
            />
          </ConfigItem>
        </ConfigSection>

        {/* Integrações */}
        <ConfigSection title="Integrações e APIs" icon={Zap}>
          <ConfigItem 
            label="WhatsApp API Key" 
            description="Chave de API para integração com WhatsApp"
          >
            <Input 
              type="password"
              value={config.api_whatsapp_key}
              onChange={(e) => setConfig({...config, api_whatsapp_key: e.target.value})}
              className="w-48"
            />
          </ConfigItem>

          <ConfigItem 
            label="SendGrid API Key" 
            description="Chave para envio de e-mails via SendGrid"
          >
            <Input 
              type="password"
              value={config.api_email_key}
              onChange={(e) => setConfig({...config, api_email_key: e.target.value})}
              className="w-48"
            />
          </ConfigItem>

          <ConfigItem 
            label="Google Maps API Key" 
            description="Chave para funcionalidades de mapas"
          >
            <Input 
              type="password"
              value={config.google_maps_key}
              onChange={(e) => setConfig({...config, google_maps_key: e.target.value})}
              className="w-48"
            />
          </ConfigItem>
        </ConfigSection>

        {/* Card de Aviso */}
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">⚠️ Atenção: Configurações Críticas</h3>
                <p className="text-sm text-red-800">
                  Como Admin Master, você tem acesso total às configurações do sistema. 
                  Alterações nestas configurações afetam TODOS os condomínios e usuários. 
                  Sempre faça backup antes de modificar configurações críticas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}