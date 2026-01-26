import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function EditarUsuarioModal({ usuario, condominios, residencias, onClose, onSave }) {
  const [tabAtiva, setTabAtiva] = useState("basico");
  const [saving, setSaving] = useState(false);
  const [dados, setDados] = useState({
    usuario: {
      nome: usuario.nome || "",
      email: usuario.email || "",
      telefone: usuario.telefone || "",
      tipo_usuario: usuario.tipo_usuario || "morador",
      status: usuario.status || "ativo",
      condominio_id: usuario.condominio_id || "",
      residencia_id: usuario.residencia_id || "",
      apelido_endereco: usuario.apelido_endereco || ""
    },
    permissoes: {
      nivel_acesso: usuario.permissoes_detalhadas?.nivel_acesso || usuario.tipo_usuario || "morador",
      permissoes_especificas: usuario.permissoes_detalhadas?.permissoes || {
        gerenciar_moradores: false,
        gerenciar_porteiros: false,
        gerenciar_sindicos: false,
        registrar_encomendas: false,
        retirar_encomendas: false,
        visualizar_relatorios: false,
        exportar_dados: false,
        enviar_avisos: false,
        aprovar_cadastros: false,
        gerenciar_visitantes: false,
        configurar_whatsapp: false,
        visualizar_financeiro: false,
        alterar_configuracoes: false
      }
    },
    turno: usuario.permissoes_detalhadas?.turno || {
      tem_turno: false,
      tipo_turno: "manha",
      horario_entrada: "08:00",
      horario_saida: "17:00",
      dias_semana: ["seg", "ter", "qua", "qui", "sex"]
    }
  });

  const [errors, setErrors] = useState({});

  const handleUsuarioChange = (field, value) => {
    setDados(prev => ({
      ...prev,
      usuario: { ...prev.usuario, [field]: value }
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Auto-ajustar permissões baseado no tipo de usuário
    if (field === "tipo_usuario") {
      const permissoesPreset = getPermissoesPorTipo(value);
      setDados(prev => ({
        ...prev,
        permissoes: {
          ...prev.permissoes,
          nivel_acesso: permissoesPreset.nivel_acesso,
          permissoes_especificas: permissoesPreset.permissoes
        }
      }));
    }
  };

  const getPermissoesPorTipo = (tipo) => {
    switch(tipo) {
      case 'administrador':
        return {
          nivel_acesso: 'sindico',
          permissoes: {
            gerenciar_moradores: true,
            gerenciar_porteiros: true,
            gerenciar_sindicos: false,
            registrar_encomendas: true,
            retirar_encomendas: true,
            visualizar_relatorios: true,
            exportar_dados: true,
            enviar_avisos: true,
            aprovar_cadastros: true,
            gerenciar_visitantes: true,
            configurar_whatsapp: true,
            visualizar_financeiro: true,
            alterar_configuracoes: true
          }
        };
      case 'porteiro':
        return {
          nivel_acesso: 'porteiro',
          permissoes: {
            gerenciar_moradores: false,
            gerenciar_porteiros: false,
            gerenciar_sindicos: false,
            registrar_encomendas: true,
            retirar_encomendas: true,
            visualizar_relatorios: false,
            exportar_dados: false,
            enviar_avisos: false,
            aprovar_cadastros: false,
            gerenciar_visitantes: true,
            configurar_whatsapp: false,
            visualizar_financeiro: false,
            alterar_configuracoes: false
          }
        };
      default:
        return {
          nivel_acesso: 'morador',
          permissoes: {
            gerenciar_moradores: false,
            gerenciar_porteiros: false,
            gerenciar_sindicos: false,
            registrar_encomendas: false,
            retirar_encomendas: false,
            visualizar_relatorios: false,
            exportar_dados: false,
            enviar_avisos: false,
            aprovar_cadastros: false,
            gerenciar_visitantes: false,
            configurar_whatsapp: false,
            visualizar_financeiro: false,
            alterar_configuracoes: false
          }
        };
    }
  };

  const handlePermissaoChange = (permissao, valor) => {
    setDados(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        permissoes_especificas: {
          ...prev.permissoes.permissoes_especificas,
          [permissao]: valor
        }
      }
    }));
  };

  const handleTurnoChange = (field, value) => {
    setDados(prev => ({
      ...prev,
      turno: { ...prev.turno, [field]: value }
    }));
  };

  const toggleDiaSemana = (dia) => {
    setDados(prev => ({
      ...prev,
      turno: {
        ...prev.turno,
        dias_semana: prev.turno.dias_semana.includes(dia)
          ? prev.turno.dias_semana.filter(d => d !== dia)
          : [...prev.turno.dias_semana, dia]
      }
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!dados.usuario.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!dados.usuario.email.trim()) newErrors.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.usuario.email)) newErrors.email = "Email inválido";
    if (!dados.usuario.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    if (!dados.usuario.condominio_id) newErrors.condominio_id = "Selecione um condomínio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      await onSave(dados);
      console.log("✅ Usuário atualizado com sucesso");
    } catch (err) {
      console.error("❌ Erro ao salvar:", err);
      alert("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const residenciasFiltradas = residencias.filter(r => r.condominio_id === dados.usuario.condominio_id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            Editar Usuário: {usuario.nome}
            <Badge className={
              dados.usuario.status === 'ativo' ? 'bg-green-100 text-green-800' :
              dados.usuario.status === 'inativo' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {dados.usuario.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            <TabsTrigger value="turnos" disabled={dados.usuario.tipo_usuario !== 'porteiro'}>
              Turnos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações Básicas */}
          <TabsContent value="basico" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={dados.usuario.nome}
                  onChange={(e) => handleUsuarioChange('nome', e.target.value)}
                  className={errors.nome ? "border-red-500" : ""}
                />
                {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={dados.usuario.email}
                  onChange={(e) => handleUsuarioChange('email', e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={dados.usuario.telefone}
                  onChange={(e) => handleUsuarioChange('telefone', e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className={errors.telefone ? "border-red-500" : ""}
                />
                {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
              </div>

              <div>
                <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
                <Select value={dados.usuario.tipo_usuario} onValueChange={(value) => handleUsuarioChange('tipo_usuario', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morador">Morador</SelectItem>
                    <SelectItem value="porteiro">Porteiro</SelectItem>
                    <SelectItem value="administrador">Síndico/Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condominio">Condomínio *</Label>
                <Select 
                  value={dados.usuario.condominio_id} 
                  onValueChange={(value) => handleUsuarioChange('condominio_id', value)}
                >
                  <SelectTrigger className={errors.condominio_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {condominios.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condominio_id && <p className="text-red-500 text-sm mt-1">{errors.condominio_id}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={dados.usuario.status} onValueChange={(value) => handleUsuarioChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Ativo
                      </div>
                    </SelectItem>
                    <SelectItem value="inativo">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Inativo
                      </div>
                    </SelectItem>
                    <SelectItem value="pendente">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Pendente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dados.usuario.tipo_usuario !== 'porteiro' && (
                <>
                  <div>
                    <Label htmlFor="residencia">Residência</Label>
                    <Select 
                      value={dados.usuario.residencia_id} 
                      onValueChange={(value) => handleUsuarioChange('residencia_id', value)}
                      disabled={!dados.usuario.condominio_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {residenciasFiltradas.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.identificador_principal}{r.complemento ? `, ${r.complemento}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="apelido">Abreviação (ex: 9-103)</Label>
                    <Input
                      id="apelido"
                      value={dados.usuario.apelido_endereco}
                      onChange={(e) => handleUsuarioChange('apelido_endereco', e.target.value)}
                      placeholder="9-103"
                    />
                  </div>
                </>
              )}
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                💡 Todas as alterações serão salvas ao clicar em "Salvar Alterações"
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Tab: Permissões */}
          <TabsContent value="permissoes" className="space-y-4 pt-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Nível de Acesso</h3>
                  <p className="text-sm text-gray-600">Baseado no tipo de usuário: {dados.usuario.tipo_usuario}</p>
                </div>
                <Badge className="text-sm px-3 py-1">
                  {dados.permissoes.nivel_acesso.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Permissões Específicas</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dados.permissoes.permissoes_especificas).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Label htmlFor={key} className="text-sm cursor-pointer">
                      {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => handlePermissaoChange(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Turnos */}
          <TabsContent value="turnos" className="space-y-4 pt-4">
            {dados.usuario.tipo_usuario === 'porteiro' ? (
              <>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="tem_turno" className="text-base font-semibold">
                      Trabalha em Turnos
                    </Label>
                    <p className="text-sm text-gray-600">Ative para configurar horários específicos</p>
                  </div>
                  <Switch
                    id="tem_turno"
                    checked={dados.turno.tem_turno}
                    onCheckedChange={(checked) => handleTurnoChange('tem_turno', checked)}
                  />
                </div>

                {dados.turno.tem_turno && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Tipo de Turno</Label>
                        <Select value={dados.turno.tipo_turno} onValueChange={(value) => handleTurnoChange('tipo_turno', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manha">Manhã</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noite">Noite</SelectItem>
                            <SelectItem value="madrugada">Madrugada</SelectItem>
                            <SelectItem value="integral">Integral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="horario_entrada">Entrada</Label>
                        <Input
                          id="horario_entrada"
                          type="time"
                          value={dados.turno.horario_entrada}
                          onChange={(e) => handleTurnoChange('horario_entrada', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="horario_saida">Saída</Label>
                        <Input
                          id="horario_saida"
                          type="time"
                          value={dados.turno.horario_saida}
                          onChange={(e) => handleTurnoChange('horario_saida', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Dias da Semana</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(dia => (
                          <Button
                            key={dia}
                            type="button"
                            variant={dados.turno.dias_semana.includes(dia) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDiaSemana(dia)}
                          >
                            {dia.charAt(0).toUpperCase() + dia.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configuração de turnos disponível apenas para porteiros
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}