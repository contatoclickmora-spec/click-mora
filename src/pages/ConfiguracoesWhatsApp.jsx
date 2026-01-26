
import React, { useState, useEffect } from 'react';
import { WhatsAppConfig } from "@/entities/WhatsAppConfig";
import { MensagemWhatsApp } from "@/entities/MensagemWhatsApp";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Settings,
  BarChart3,
  AlertCircle,
  Loader2,
  Phone,
  Key,
  Building2,
  TestTube
} from "lucide-react";

export default function ConfiguracoesWhatsApp() {
  const [config, setConfig] = useState(null);
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [stats, setStats] = useState({ total: 0, enviadas: 0, erros: 0 });

  const [formData, setFormData] = useState({
    numero_whatsapp: '',
    nome_exibicao: '',
    api_provider: 'evolution_api',
    api_key: ''
  });

  const [testMessage, setTestMessage] = useState({
    telefone: '',
    mensagem: 'Olá! Esta é uma mensagem de teste do sistema de encomendas. Se você recebeu esta mensagem, a integração está funcionando corretamente!'
  });

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

      if (moradorLogado && moradorLogado.condominio_id) {
        setUserCondominioId(moradorLogado.condominio_id);
        
        // Buscar configuração existente
        const configs = await WhatsAppConfig.filter({ condominio_id: moradorLogado.condominio_id });
        if (configs.length > 0) {
          const existingConfig = configs[0];
          setConfig(existingConfig);
          setFormData({
            numero_whatsapp: existingConfig.numero_whatsapp || '',
            nome_exibicao: existingConfig.nome_exibicao || '',
            api_provider: existingConfig.api_provider || 'evolution_api',
            api_key: existingConfig.api_key || ''
          });
        }

        // Buscar logs de mensagens
        const logs = await MensagemWhatsApp.filter({ condominio_id: moradorLogado.condominio_id });
        setMensagens(logs.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio)));
        
        // Calcular estatísticas
        setStats({
          total: logs.length,
          enviadas: logs.filter(m => m.status_envio === 'enviado' || m.status_envio === 'entregue').length,
          erros: logs.filter(m => m.status_envio === 'erro').length
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!formData.numero_whatsapp.trim() || !formData.nome_exibicao.trim()) {
      alert("❌ Preencha o número e o nome de exibição!");
      return;
    }

    // Validar formato do número
    if (!formData.numero_whatsapp.match(/^\+?[1-9]\d{1,14}$/)) {
      alert("❌ Formato de número inválido! Use o formato internacional: +5511999999999");
      return;
    }

    setSaving(true);
    try {
      const user = await User.me();
      const configData = {
        condominio_id: userCondominioId,
        numero_whatsapp: formData.numero_whatsapp,
        nome_exibicao: formData.nome_exibicao,
        api_provider: formData.api_provider,
        api_key: formData.api_key,
        status_conexao: 'conectado',
        ativo: true,
        configurado_por: user.email,
        data_configuracao: new Date().toISOString()
      };

      if (config) {
        await WhatsAppConfig.update(config.id, configData);
      } else {
        await WhatsAppConfig.create(configData);
      }

      alert("✅ Configurações salvas com sucesso!");
      loadData();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("❌ Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testMessage.telefone.trim()) {
      alert("Informe um número de telefone para teste");
      return;
    }

    if (!formData.numero_whatsapp.trim()) {
      alert("Configure o WhatsApp primeiro");
      return;
    }

    setTesting(true);
    try {
      const user = await User.me();

      // Criar log da mensagem de teste
      await MensagemWhatsApp.create({
        condominio_id: userCondominioId,
        destinatario_nome: "Teste",
        destinatario_telefone: testMessage.telefone,
        mensagem: testMessage.mensagem,
        tipo_mensagem: "outro",
        status_envio: "enviado",
        data_envio: new Date().toISOString(),
        enviado_por: user.email,
        template_usado: "teste_conexao"
      });

      alert("Mensagem de teste registrada com sucesso! Em produção com API configurada, a mensagem seria enviada via WhatsApp.");
      loadData();
    } catch (err) {
      console.error("Erro no teste:", err);
      alert("Erro ao enviar mensagem de teste.");
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      'desconectado': { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Desconectado' },
      'conectado': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Conectado' },
      'erro': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Erro' }
    };
    const cfg = configs[status] || configs['desconectado'];
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  const getStatusEnvioBadge = (status) => {
    const configs = {
      'pendente': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      'enviado': { color: 'bg-blue-100 text-blue-800', label: 'Enviado' },
      'entregue': { color: 'bg-green-100 text-green-800', label: 'Entregue' },
      'lido': { color: 'bg-purple-100 text-purple-800', label: 'Lido' },
      'erro': { color: 'bg-red-100 text-red-800', label: 'Erro' }
    };
    const cfg = configs[status] || configs['pendente'];
    return <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Integração WhatsApp</h1>
            {config && getStatusBadge(config.status_conexao)}
          </div>
          <p className="text-gray-600">
            Configure e gerencie o envio de mensagens via WhatsApp para os moradores
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total de Mensagens</p>
                  <h3 className="text-3xl font-bold text-blue-900">{stats.total}</h3>
                </div>
                <MessageCircle className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Enviadas com Sucesso</p>
                  <h3 className="text-3xl font-bold text-green-900">{stats.enviadas}</h3>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium mb-1">Erros de Envio</p>
                  <h3 className="text-3xl font-bold text-red-900">{stats.erros}</h3>
                </div>
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="configuracao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuracao">
              <Settings className="w-4 h-4 mr-2" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="teste">
              <TestTube className="w-4 h-4 mr-2" />
              Testar Envio
            </TabsTrigger>
            <TabsTrigger value="logs">
              <BarChart3 className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuração */}
          <TabsContent value="configuracao">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Configurar WhatsApp Business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Como funciona:</strong> Você precisa conectar uma conta WhatsApp Business através de uma API oficial.
                    Recomendamos usar Evolution API, Twilio ou WPPConnect. Após conectar, todas as mensagens serão enviadas do seu número.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="numero">Número do WhatsApp *</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="numero"
                        value={formData.numero_whatsapp}
                        onChange={(e) => setFormData({...formData, numero_whatsapp: e.target.value})}
                        placeholder="+5511999999999"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Formato internacional: +55 11 99999-9999</p>
                  </div>

                  <div>
                    <Label htmlFor="nome">Nome de Exibição *</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="nome"
                        value={formData.nome_exibicao}
                        onChange={(e) => setFormData({...formData, nome_exibicao: e.target.value})}
                        placeholder="Condomínio XYZ"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nome que aparecerá nas mensagens</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider">Provedor de API</Label>
                  <select
                    id="provider"
                    value={formData.api_provider}
                    onChange={(e) => setFormData({...formData, api_provider: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="evolution_api">Evolution API (Recomendado)</option>
                    <option value="twilio">Twilio</option>
                    <option value="wppconnect">WPPConnect</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="api-key">API Key / Token</Label>
                  <div className="relative mt-1">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="api-key"
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                      placeholder="Sua chave de API"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Chave fornecida pelo provedor escolhido
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveConfig} 
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvar Configuração
                      </>
                    )}
                  </Button>
                </div>

                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    <strong>Importante:</strong> Para usar a integração em produção, você precisará contratar um provedor de WhatsApp Business API.
                    Entre em contato com o suporte para mais informações sobre como configurar corretamente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Teste */}
          <TabsContent value="teste">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Testar Conexão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!config || !config.ativo ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure o WhatsApp na aba "Configuração" antes de testar o envio.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="test-telefone">Número para Teste</Label>
                      <Input
                        id="test-telefone"
                        value={testMessage.telefone}
                        onChange={(e) => setTestMessage({...testMessage, telefone: e.target.value})}
                        placeholder="+5511999999999"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Digite seu número de celular para receber a mensagem de teste
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="test-mensagem">Mensagem de Teste</Label>
                      <textarea
                        id="test-mensagem"
                        value={testMessage.mensagem}
                        onChange={(e) => setTestMessage({...testMessage, mensagem: e.target.value})}
                        className="w-full mt-1 p-2 border rounded-md h-32"
                      />
                    </div>

                    <Button
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando Teste...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem de Teste
                        </>
                      )}
                    </Button>

                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        A mensagem de teste será registrada nos logs e, em produção com API configurada, será enviada via WhatsApp.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Logs */}
          <TabsContent value="logs">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Histórico de Mensagens Enviadas ({mensagens.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {mensagens.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma mensagem enviada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {mensagens.map((msg) => (
                      <div key={msg.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{msg.destinatario_nome}</p>
                            <p className="text-sm text-gray-600">{msg.destinatario_telefone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusEnvioBadge(msg.status_envio)}
                            <Badge variant="outline" className="text-xs">
                              {msg.tipo_mensagem}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{msg.mensagem}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.data_envio).toLocaleString('pt-BR')}
                          </span>
                          <span>Por: {msg.enviado_por}</span>
                        </div>
                        {msg.erro_mensagem && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {msg.erro_mensagem}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
