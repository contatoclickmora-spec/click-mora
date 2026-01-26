import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Crown,
  Save,
  Building2,
  AlertCircle,
  Loader2
} from "lucide-react";
import WhatsAppQAPanel from "@/components/admin-master/WhatsAppQAPanel";

export default function ConfiguracoesWhatsAppAdmin({ userType }) {
  const [condominios, setCondominios] = useState([]);
  const [config, setConfig] = useState(null);
  const [condominioSelecionado, setCondominioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdminMaster, setIsAdminMaster] = useState(false);
  const [logs, setLogs] = useState([]);
  const [consentStats, setConsentStats] = useState({ aceito: 0, recusado: 0, pendente: 0 });

  const [formData, setFormData] = useState({
    zapi_instance_id: '',
    zapi_token: '',
    zapi_client_token: '',
    zapi_base_url: 'https://api.z-api.io',
    zapi_send_text_endpoint: '/send-text',
    mensagem_primeira_entrega: 'Olá: {nome_do_morador}\n\nVocê possui {total_encomendas} encomenda(s) aguardando retirada:\n\n{lista_encomendas}\nDeseja continuar recebendo notificações de entrega pelo WhatsApp?',
    ativo: false
  });

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    if (condominioSelecionado) {
      loadLogs();
    }
    return () => abortController.abort();
  }, [condominioSelecionado]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      if (user.role === 'admin') {
        setIsAdminMaster(true);
        const todosCondominios = await base44.entities.Condominio.list();
        setCondominios(todosCondominios);
        
        if (todosCondominios.length > 0) {
          setCondominioSelecionado(todosCondominios[0].id);
          await loadConfig(todosCondominios[0].id);
        }
      } else {
        const todosMoradores = await base44.entities.Morador.list();
        const moradorLogado = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        if (moradorLogado?.condominio_id) {
          setCondominioSelecionado(moradorLogado.condominio_id);
          const condominiosSindico = await base44.entities.Condominio.filter({ id: moradorLogado.condominio_id });
          setCondominios(condominiosSindico);
          await loadConfig(moradorLogado.condominio_id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async (condominioId) => {
    try {
      const configs = await base44.entities.WhatsAppConfig.filter({ condominio_id: condominioId });
      if (configs.length > 0) {
        const cfg = configs[0];
        setConfig(cfg);
        setFormData({
          zapi_instance_id: cfg.zapi_instance_id || '',
          zapi_token: cfg.zapi_token || '',
          zapi_client_token: cfg.zapi_client_token || '',
          zapi_base_url: cfg.zapi_base_url || 'https://api.z-api.io',
          zapi_send_text_endpoint: cfg.zapi_send_text_endpoint || '/send-text',
          mensagem_primeira_entrega: cfg.mensagem_primeira_entrega || 'Olá: {nome_do_morador}\n\nVocê possui {total_encomendas} encomenda(s) aguardando retirada:\n\n{lista_encomendas}\nDeseja continuar recebendo notificações de entrega pelo WhatsApp?',
          ativo: cfg.ativo || false
        });
      } else {
        setConfig(null);
      }
    } catch (err) {
      console.error("Erro ao carregar config:", err);
    }
  };

  const loadLogs = async () => {
    try {
      const mensagens = await base44.entities.MensagemWhatsApp.filter({ condominio_id: condominioSelecionado });
      const sortedLogs = mensagens.sort((a, b) => 
        new Date(b.data_envio) - new Date(a.data_envio)
      ).slice(0, 50);
      setLogs(sortedLogs);

      const moradores = await base44.entities.Morador.filter({ condominio_id: condominioSelecionado });
      const aceitos = moradores.filter(m => m.whatsapp_notificacoes === 'aceito').length;
      const recusados = moradores.filter(m => m.whatsapp_notificacoes === 'recusado').length;
      const pendentes = moradores.filter(m => m.whatsapp_notificacoes === 'pendente' || !m.whatsapp_notificacoes).length;
      
      setConsentStats({ aceito: aceitos, recusado: recusados, pendente: pendentes });
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    }
  };

  const handleCondominioChange = async (condominioId) => {
    setCondominioSelecionado(condominioId);
    await loadConfig(condominioId);
  };

  const handleSaveConfig = async () => {
    if (!condominioSelecionado) {
      alert("Selecione um condomínio");
      return;
    }

    if (!formData.zapi_instance_id.trim()) {
      alert("Instance ID é obrigatório");
      return;
    }

    if (!formData.zapi_token.trim()) {
      alert("Token é obrigatório");
      return;
    }

    if (!formData.zapi_client_token.trim()) {
      alert("Client Token é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const user = await base44.auth.me();
      const configData = {
        condominio_id: condominioSelecionado,
        zapi_instance_id: formData.zapi_instance_id.trim(),
        zapi_token: formData.zapi_token.trim(),
        zapi_client_token: formData.zapi_client_token.trim(),
        zapi_base_url: formData.zapi_base_url.trim(),
        zapi_send_text_endpoint: formData.zapi_send_text_endpoint.trim(),
        mensagem_primeira_entrega: formData.mensagem_primeira_entrega,
        ativo: formData.ativo,
        configurado_por: user.email,
        data_configuracao: new Date().toISOString(),
        ultima_sincronizacao: new Date().toISOString()
      };

      console.log('💾 Salvando config:', configData);

      let resultado;
      if (config) {
        console.log('🔄 Atualizando config existente:', config.id);
        await base44.entities.WhatsAppConfig.update(config.id, configData);
        setConfig({...config, ...configData});
        console.log('✅ Config atualizada');
      } else {
        console.log('✨ Criando nova config');
        resultado = await base44.entities.WhatsAppConfig.create(configData);
        setConfig(resultado);
        console.log('✅ Config criada:', resultado.id);
      }

      alert("✅ Configurações salvas com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao salvar:", err);
      console.error("Details:", err.message);
      alert("❌ Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const condominioAtual = condominios.find(c => c.id === condominioSelecionado);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Admin</h1>
            {isAdminMaster && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Admin Master
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Sistema unificado de notificações WhatsApp
          </p>
        </div>

        {isAdminMaster && condominios.length > 0 && (
          <Card className="mb-6 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="condominio-select" className="text-base font-semibold">Condomínio</Label>
                  <select
                    id="condominio-select"
                    value={condominioSelecionado || ''}
                    onChange={(e) => handleCondominioChange(e.target.value)}
                    className="w-full mt-2 p-3 border rounded-md text-lg"
                  >
                    {condominios.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} - {c.cidade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {condominioAtual && (
          <Card className="mb-6 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{condominioAtual.nome}</h3>
                  <p className="text-sm text-gray-600">{condominioAtual.cidade}</p>
                </div>
                <Badge className={formData.ativo ? 
                  "bg-green-100 text-green-800 border-0" : 
                  "bg-gray-100 text-gray-800 border-0"
                }>
                  {formData.ativo ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inativo
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {condominioSelecionado ? (
          <Tabs defaultValue="zapi-config" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="zapi-config">Z-API Config</TabsTrigger>
              <TabsTrigger value="qa">QA Testing</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="zapi-config">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Configuração Z-API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className={formData.zapi_instance_id && formData.zapi_token && formData.zapi_client_token ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                    {formData.zapi_instance_id && formData.zapi_token && formData.zapi_client_token ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 text-sm">
                          <strong>Configurado</strong> - Instance: {formData.zapi_instance_id}
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 text-sm">
                          Preencha todos os campos obrigatórios
                        </AlertDescription>
                      </>
                    )}
                  </Alert>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-base font-semibold">Ativar WhatsApp</Label>
                      <p className="text-sm text-gray-600 mt-1">Habilitar notificações via Z-API</p>
                    </div>
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                    />
                  </div>

                  <div>
                    <Label>Instance ID *</Label>
                    <Input
                      value={formData.zapi_instance_id}
                      onChange={(e) => setFormData({...formData, zapi_instance_id: e.target.value})}
                      placeholder="3ED875401609A24FB201CA1E029DCA8C"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Token *</Label>
                    <Input
                      type="password"
                      value={formData.zapi_token}
                      onChange={(e) => setFormData({...formData, zapi_token: e.target.value})}
                      placeholder="Seu token Z-API"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Client Token *</Label>
                    <Input
                      type="password"
                      value={formData.zapi_client_token}
                      onChange={(e) => setFormData({...formData, zapi_client_token: e.target.value})}
                      placeholder="Seu client-token para headers"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Obrigatório para autenticação na API</p>
                  </div>

                  <div>
                    <Label>Base URL</Label>
                    <Input
                      value={formData.zapi_base_url}
                      onChange={(e) => setFormData({...formData, zapi_base_url: e.target.value})}
                      placeholder="https://api.z-api.io"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Send Text Endpoint</Label>
                    <Input
                      value={formData.zapi_send_text_endpoint}
                      onChange={(e) => setFormData({...formData, zapi_send_text_endpoint: e.target.value})}
                      placeholder="/send-text"
                      className="mt-1"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-base font-semibold mb-3 block">Mensagem de Primeira Entrega</Label>
                    <Textarea
                      value={formData.mensagem_primeira_entrega}
                      onChange={(e) => setFormData({...formData, mensagem_primeira_entrega: e.target.value})}
                      className="mt-2 h-40 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Placeholders: <code className="bg-gray-100 p-1 rounded">{'{nome_do_morador}'}</code>, <code className="bg-gray-100 p-1 rounded">{'{total_encomendas}'}</code>, <code className="bg-gray-100 p-1 rounded">{'{lista_encomendas}'}</code>
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      O morador receberá botões Sim/Não para aceitar futuras notificações
                    </p>
                  </div>

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
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configuração
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qa">
              <WhatsAppQAPanel 
                condominioId={condominioSelecionado} 
                config={formData}
              />
            </TabsContent>

            <TabsContent value="logs">
              <Card className="border-0 shadow-md mb-6">
                <CardHeader>
                  <CardTitle>Status de Consentimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{consentStats.aceito}</p>
                        <p className="text-xs text-gray-600 mt-1">Aceitaram</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{consentStats.recusado}</p>
                        <p className="text-xs text-gray-600 mt-1">Recusaram</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-600">{consentStats.pendente}</p>
                        <p className="text-xs text-gray-600 mt-1">Pendente</p>
                      </div>
                    </div>
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-xs">
                        <strong>Pendente:</strong> Morador ainda não recebeu primeira entrega ou não respondeu.<br />
                        <strong>Aceitaram:</strong> Clicaram em SIM - receberão notificações.<br />
                        <strong>Recusaram:</strong> Clicaram em NÃO - não receberão notificações.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Histórico de Mensagens</CardTitle>
                    <Badge>{logs.length} registros</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {logs.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Nenhuma mensagem enviada</p>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm truncate">
                                  {log.destinatario_nome || 'Sem nome'}
                                </span>
                                <Badge className={log.status_envio === 'enviado' ? 
                                  "bg-green-100 text-green-800 text-xs" : 
                                  "bg-red-100 text-red-800 text-xs"
                                }>
                                  {log.status_envio}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 truncate">{log.destinatario_telefone}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{log.mensagem}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500">
                                {new Date(log.data_envio).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.data_envio).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                          {log.erro_mensagem && (
                            <p className="text-xs text-red-600 mt-2">Erro: {log.erro_mensagem}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              {isAdminMaster ? "Selecione um condomínio" : "Nenhuma configuração encontrada"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}