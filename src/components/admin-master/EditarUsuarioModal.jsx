
import React, { useState } from 'react';
import { Morador } from "@/entities/Morador";
// User is imported but not used directly in this new logic, keeping for potential future use or if it was used elsewhere.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Badge is imported but not used, keeping as it was in original.
import { Checkbox } from "@/components/ui/checkbox"; // Checkbox is used for permissions.
import { X, Save, Shield, Key } from "lucide-react"; // Eye, EyeOff, AlertTriangle are no longer needed for password section.
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditarUsuarioModal({ usuario, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    nome: usuario.nome || '',
    email: usuario.email || '',
    telefone: usuario.telefone || '',
    tipo_usuario: usuario.tipo_usuario || 'morador',
    status: usuario.status || 'ativo',
    apelido_endereco: usuario.apelido_endereco || '',
    permissoes_personalizadas: {
      registrar_encomenda: usuario.tipo_usuario === 'porteiro' || usuario.tipo_usuario === 'administrador',
      retirar_encomenda: usuario.tipo_usuario === 'porteiro' || usuario.tipo_usuario === 'administrador',
      controlar_visitantes: usuario.tipo_usuario === 'porteiro' || usuario.tipo_usuario === 'administrador',
      enviar_avisos: usuario.tipo_usuario === 'administrador',
      ver_relatorios: usuario.tipo_usuario === 'administrador',
      gerenciar_moradores: usuario.tipo_usuario === 'administrador',
      gerenciar_financeiro: usuario.tipo_usuario === 'administrador'
    }
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar dados do morador
      await Morador.update(usuario.id, formData);

      // Call onUpdate with the potentially updated form data
      onUpdate(formData);
      alert('✅ Usuário atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("❌ Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissaoChange = (permissao, checked) => {
    setFormData(prev => ({
      ...prev,
      permissoes_personalizadas: {
        ...prev.permissoes_personalizadas,
        [permissao]: checked
      }
    }));
  };

  // gerarSenhaAleatoria function is no longer needed as password reset is handled externally.

  const permissoesList = [
    { key: 'registrar_encomenda', label: 'Registrar Encomendas', description: 'Cadastrar novas encomendas no sistema' },
    { key: 'retirar_encomenda', label: 'Retirar Encomendas', description: 'Processar retirada de encomendas' },
    { key: 'controlar_visitantes', label: 'Controlar Visitantes', description: 'Gerenciar entrada e saída de visitantes' },
    { key: 'enviar_avisos', label: 'Enviar Avisos', description: 'Disparar comunicados aos moradores' },
    { key: 'ver_relatorios', label: 'Ver Relatórios', description: 'Acessar relatórios e métricas' },
    { key: 'gerenciar_moradores', label: 'Gerenciar Moradores', description: 'Adicionar, editar e remover moradores' },
    { key: 'gerenciar_financeiro', label: 'Gerenciar Financeiro', description: 'Acessar e controlar finanças' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Editar Usuário: {usuario.nome}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Dados Básicos</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço (Abreviação)</Label>
                <Input
                  id="endereco"
                  value={formData.apelido_endereco}
                  onChange={(e) => setFormData({...formData, apelido_endereco: e.target.value})}
                  placeholder="Ex: 9-103"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Cargo e Status */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Cargo e Status</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_usuario">Tipo de Usuário (Cargo)</Label>
                <select
                  id="tipo_usuario"
                  value={formData.tipo_usuario}
                  onChange={(e) => setFormData({...formData, tipo_usuario: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="morador">Morador</option>
                  <option value="porteiro">Porteiro</option>
                  <option value="administrador">Administrador (Síndico)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Mude o cargo do usuário aqui
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>
          </div>

          {/* AVISO SOBRE SENHA */}
          <Alert className="bg-blue-50 border-blue-200">
            <Key className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>🔐 Redefinição de Senha:</strong> Para alterar a senha deste usuário, 
              use a página "Gerenciar Senhas" no menu lateral. O sistema enviará um email seguro 
              para o usuário redefinir a senha.
            </AlertDescription>
          </Alert>

          {/* Permissões Personalizadas */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Permissões Personalizadas</h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                ⚙️ Personalize as permissões deste usuário independente do cargo. 
                Útil para dar acessos específicos sem mudar o cargo principal.
              </p>
            </div>

            <div className="space-y-3">
              {permissoesList.map((perm) => (
                <div 
                  key={perm.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                    formData.permissoes_personalizadas[perm.key] 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Checkbox
                    id={perm.key}
                    checked={formData.permissoes_personalizadas[perm.key]}
                    onCheckedChange={(checked) => handlePermissaoChange(perm.key, checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={perm.key} 
                      className="font-medium text-gray-900 cursor-pointer block"
                    >
                      {perm.label}
                    </label>
                    <p className="text-sm text-gray-600 mt-0.5">{perm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
