import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import AuthGuard from "../components/utils/AuthGuard";
import { getUserRole } from "../components/utils/authUtils";

export default function ConfiguracoesWhatsAppAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [condominios, setCondominios] = useState([]);
  const [configs, setConfigs] = useState([]);

  const [form, setForm] = useState({
    id: null,
    condominio_id: "GLOBAL",
    zapi_base_url: "",
    zapi_token: "",
    zapi_client_token: "",
    zapi_send_text_endpoint: "/send-text",
    ativo: false,
  });

  // Carregar dados e garantir acesso admin master
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const role = await getUserRole();
        if (!role?.isAuthenticated) { window.location.href = "/login"; return; }
        if (role.userType !== "admin_master") { window.location.href = "/Dashboard"; return; }
        const [condos, cfgs] = await Promise.all([
          base44.entities.Condominio.list(),
          base44.entities.WhatsAppConfig.list()
        ]);
        setCondominios(condos || []);
        setConfigs(cfgs || []);
      } catch (e) {
        setError("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetForm = () => setForm({ id: null, condominio_id: "GLOBAL", zapi_base_url: "", zapi_token: "", zapi_client_token: "", zapi_send_text_endpoint: "/send-text", ativo: false });

  const validate = () => {
    if (!form.zapi_base_url?.trim()) return "Informe a Base URL da Z-API";
    try {
      const u = new URL(form.zapi_base_url.trim());
      if (!/^https?:$/.test(u.protocol)) return "A URL deve iniciar com http(s)";
    } catch {
      return "URL da API inválida";
    }
    if (!form.zapi_token?.trim()) return "Informe o Token (Authorization)";
    if (!form.zapi_send_text_endpoint?.trim()) return "Informe o endpoint de envio";
    return null;
  };

  const loadConfigs = async () => {
    const list = await base44.entities.WhatsAppConfig.list();
    setConfigs(list || []);
  };

  const setActive = async (config) => {
    // Ativar este e desativar os demais do mesmo escopo
    const scopeId = config.condominio_id;
    const sameScope = (configs || []).filter(c => c.condominio_id === scopeId);
    await Promise.all(sameScope.map(c => c.id !== config.id ? base44.entities.WhatsAppConfig.update(c.id, { ativo: false }) : Promise.resolve()));
    await base44.entities.WhatsAppConfig.update(config.id, { ativo: true });
    await loadConfigs();
    setSuccess("Configuração ativada");
    setTimeout(() => setSuccess(""), 2500);
  };

  const onEdit = (config) => {
    setForm({
      id: config.id,
      condominio_id: config.condominio_id || "GLOBAL",
      zapi_base_url: config.zapi_base_url || "",
      zapi_token: config.zapi_token || "",
      zapi_client_token: config.zapi_client_token || "",
      zapi_send_text_endpoint: config.zapi_send_text_endpoint || "/send-text",
      ativo: !!config.ativo,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); setTimeout(()=>setError(""), 3000); return; }

    try {
      setSaving(true); setError(""); setSuccess("");
      const role = await getUserRole();
      const endpoint = form.zapi_send_text_endpoint.startsWith("/") ? form.zapi_send_text_endpoint : `/${form.zapi_send_text_endpoint}`;
      const payload = {
        condominio_id: form.condominio_id || "GLOBAL",
        zapi_base_url: form.zapi_base_url.trim().replace(/\/$/, ""),
        zapi_token: form.zapi_token.trim(),
        zapi_client_token: form.zapi_client_token?.trim() || "",
        zapi_send_text_endpoint: endpoint,
        ativo: !!form.ativo,
        configurado_por: role?.user?.email || role?.email || "",
        data_configuracao: new Date().toISOString(),
      };

      if (form.id) {
        await base44.entities.WhatsAppConfig.update(form.id, payload);
      } else {
        await base44.entities.WhatsAppConfig.create(payload);
      }

      // Garantir unicidade de ativo por escopo
      if (payload.ativo) {
        const list = await base44.entities.WhatsAppConfig.filter({ condominio_id: payload.condominio_id });
        const justSaved = (await base44.entities.WhatsAppConfig.list()).find(c => c.condominio_id === payload.condominio_id && c.zapi_base_url === payload.zapi_base_url);
        const idSaved = justSaved?.id || form.id;
        await Promise.all((list || []).map(c => c.id !== idSaved ? base44.entities.WhatsAppConfig.update(c.id, { ativo: false }) : Promise.resolve()));
      }

      await loadConfigs();
      setSuccess("Configuração salva");
      setTimeout(() => setSuccess(""), 2500);
      resetForm();
    } catch (err) {
      setError("Falha ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const groupedConfigs = useMemo(() => {
    const groups = {};
    (configs || []).forEach(c => {
      const key = c.condominio_id || "GLOBAL";
      groups[key] = groups[key] || [];
      groups[key].push(c);
    });
    return groups;
  }, [configs]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações WhatsApp</h1>
            <p className="text-sm text-gray-600">Gerencie a integração central da Z-API por condomínio ou global.</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Nova/Editar Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Escopo</Label>
                    <Select value={form.condominio_id} onValueChange={(v) => setForm(f => ({ ...f, condominio_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o escopo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GLOBAL">Global</SelectItem>
                        {(condominios || []).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome || c.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Base URL da Z-API</Label>
                    <Input placeholder="https://api.z-api.io" value={form.zapi_base_url} onChange={(e) => setForm(f => ({ ...f, zapi_base_url: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <Label>Token (Authorization)</Label>
                    <Input type="password" placeholder="Bearer token" value={form.zapi_token} onChange={(e) => setForm(f => ({ ...f, zapi_token: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <Label>Client-Token (opcional)</Label>
                    <Input placeholder="Client-Token" value={form.zapi_client_token} onChange={(e) => setForm(f => ({ ...f, zapi_client_token: e.target.value }))} />
                  </div>

                  <div className="space-y-1">
                    <Label>Endpoint de envio</Label>
                    <Input placeholder="/send-text" value={form.zapi_send_text_endpoint} onChange={(e) => setForm(f => ({ ...f, zapi_send_text_endpoint: e.target.value }))} />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Ativar esta configuração</Label>
                      <p className="text-xs text-gray-500">Ao ativar, as outras do mesmo escopo serão desativadas.</p>
                    </div>
                    <Switch checked={form.ativo} onCheckedChange={(v) => setForm(f => ({ ...f, ativo: v }))} />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>) : (form.id ? "Atualizar" : "Salvar")}
                    </Button>
                    {form.id && (
                      <Button type="button" variant="outline" onClick={resetForm}>Cancelar edição</Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Configurações Cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
                  {Object.keys(groupedConfigs).length === 0 && (
                    <p className="text-sm text-gray-500">Nenhuma configuração cadastrada.</p>
                  )}
                  {Object.entries(groupedConfigs).map(([scope, list]) => (
                    <div key={scope} className="border rounded-lg p-3 bg-white/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{scope === "GLOBAL" ? "Global" : (condominios.find(c => c.id === scope)?.nome || scope)}</p>
                          <p className="text-xs text-gray-500">{list.length} configuração(ões)</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {list.map(cfg => (
                          <div key={cfg.id} className="flex items-center justify-between gap-3 border rounded-md p-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{cfg.zapi_base_url}{cfg.zapi_send_text_endpoint}</p>
                              <p className="text-xs text-gray-500">Ativo: {cfg.ativo ? "Sim" : "Não"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!cfg.ativo && (
                                <Button size="sm" variant="outline" onClick={() => setActive(cfg)}>Ativar</Button>
                              )}
                              <Button size="sm" onClick={() => onEdit(cfg)}>Editar</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}