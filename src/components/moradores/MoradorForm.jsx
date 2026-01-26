import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, User } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhotoUpload from "../shared/PhotoUpload";

export default function MoradorForm({ morador, onSubmit, onCancel, residencias, initialUserType, selectedCondominioId }) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    tipo_usuario: "morador",
    endereco: "",
    complemento: "",
    abreviacao: "",
    status: "ativo",
    foto_url: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (morador) {
      setFormData({
        nome: morador.nome || "",
        telefone: morador.telefone || "",
        email: morador.email || "",
        tipo_usuario: morador.tipo_usuario || "morador",
        endereco: morador.endereco || "",
        complemento: morador.complemento || "",
        abreviacao: morador.abreviacao || "",
        status: morador.status || "ativo",
        foto_url: morador.foto_url || null
      });
    } else {
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        tipo_usuario: initialUserType || "morador",
        endereco: "",
        complemento: "",
        abreviacao: "",
        status: "ativo",
        foto_url: null
      });
    }
    setErrors({});
  }, [morador, initialUserType]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // IDEMPOTÊNCIA: Prevenir submissões duplicadas
    if (loading) {
      console.warn('[IDEMPOTENCY] Submissão duplicada ignorada');
      return;
    }

    setLoading(true);
    setErrors({});

    let currentErrors = {};

    // SANITIZAÇÃO E VALIDAÇÃO: Nome
    const nomeSanitizado = String(formData.nome || '').trim().slice(0, 200);
    if (!nomeSanitizado) {
      currentErrors.nome = "Nome é obrigatório";
    } else if (nomeSanitizado.length < 3) {
      currentErrors.nome = "Nome muito curto (mínimo 3 caracteres)";
    }
    
    // SANITIZAÇÃO E VALIDAÇÃO: Telefone
    const cleanedPhone = String(formData.telefone || '').replace(/\D/g, '').slice(0, 11);
    if (!cleanedPhone) {
      currentErrors.telefone = "Telefone é obrigatório";
    } else if (cleanedPhone.length < 10) {
      currentErrors.telefone = "Telefone inválido (mínimo 10 dígitos com DDD)";
    }

    // SANITIZAÇÃO E VALIDAÇÃO: Email
    const emailSanitizado = String(formData.email || '').trim().toLowerCase().slice(0, 100);
    if (!emailSanitizado) {
      currentErrors.email = "E-mail é obrigatório";
    } else if (!validateEmail(emailSanitizado)) {
      currentErrors.email = "E-mail inválido";
    }

    // VALIDAÇÃO: Endereço apenas para moradores e porteiros
    if (formData.tipo_usuario !== 'administrador') {
      const enderecoSanitizado = String(formData.endereco || '').trim().slice(0, 300);
      const abreviacaoSanitizada = String(formData.abreviacao || '').trim().slice(0, 50);
      
      if (!enderecoSanitizado) {
        currentErrors.endereco = "Endereço é obrigatório";
      }
      if (!abreviacaoSanitizada) {
        currentErrors.abreviacao = "Abreviação é obrigatória";
      }
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setLoading(false);
      return;
    }

    try {
      // SANITIZAÇÃO: Preparar dados finais
      const submitData = {
        nome: nomeSanitizado,
        telefone: cleanedPhone,
        email: emailSanitizado,
        tipo_usuario: formData.tipo_usuario,
        endereco: String(formData.endereco || '').trim().slice(0, 300),
        complemento: String(formData.complemento || '').trim().slice(0, 200),
        abreviacao: String(formData.abreviacao || '').trim().slice(0, 50),
        status: formData.status,
        foto_url: formData.foto_url
      };
      
      await onSubmit(submitData);
      
    } catch (err) {
      console.error('[DATA_INTEGRITY] Erro ao submeter formulário:', err);
      setErrors({ submit: 'Erro ao salvar. Tente novamente.' });
    } finally {
      // IDEMPOTÊNCIA: Delay antes de liberar
      setTimeout(() => setLoading(false), 500);
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'pendente': return 'Pendente de Aprovação';
      default: return status;
    }
  };

  const getTipoUsuarioLabel = (tipo) => {
    switch(tipo) {
      case 'morador': return 'Morador';
      case 'porteiro': return 'Porteiro';
      case 'administrador': return 'Síndico/Administrador';
      default: return tipo;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {morador ? "Editar Usuário" : `Adicionar Novo ${getTipoUsuarioLabel(formData.tipo_usuario)}`}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto de Perfil */}
            <PhotoUpload
              currentPhotoUrl={formData.foto_url}
              onPhotoChange={(url) => handleInputChange('foto_url', url)}
              label="Foto de Perfil"
              required={false}
            />

            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite o nome completo"
                className={`mt-1 ${errors.nome ? "border-red-500" : ""}`}
              />
              {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
            </div>
            
            {/* Endereços - Oculto para Administradores */}
            {formData.tipo_usuario !== 'administrador' && (
              <>
                <div>
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Ex: Bloco 9, Torre A, beco rosa 100A"
                    className={`mt-1 ${errors.endereco ? "border-red-500" : ""}`}
                  />
                  {errors.endereco && <p className="text-sm text-red-500 mt-1">{errors.endereco}</p>}
                  <p className="text-xs text-gray-500 mt-1">Endereço em texto livre</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => handleInputChange('complemento', e.target.value)}
                      placeholder="Ex: Apto 103, Portão Azul"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Opcional</p>
                  </div>

                  <div>
                    <Label htmlFor="abreviacao">Abreviação (para busca) *</Label>
                    <Input
                      id="abreviacao"
                      value={formData.abreviacao}
                      onChange={(e) => handleInputChange('abreviacao', e.target.value)}
                      placeholder="Ex: 9-103, BR100A"
                      className={`mt-1 ${errors.abreviacao ? "border-red-500" : ""}`}
                    />
                    {errors.abreviacao && <p className="text-sm text-red-500 mt-1">{errors.abreviacao}</p>}
                    <p className="text-xs text-gray-500 mt-1">Formato curto para busca rápida</p>
                  </div>
                </div>
              </>
            )}

            {/* Contatos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="+55 11 91234-5678"
                  className={`mt-1 ${errors.telefone ? "border-red-500" : ""}`}
                />
                {errors.telefone && <p className="text-sm text-red-500 mt-1">{errors.telefone}</p>}
              </div>

              <div>
                <Label htmlFor="email">E-mail (Obrigatório para login) *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="exemplo@email.com"
                  className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Tipo de Usuário e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
                <Select
                  value={formData.tipo_usuario}
                  onValueChange={(value) => handleInputChange('tipo_usuario', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morador">{getTipoUsuarioLabel('morador')}</SelectItem>
                    <SelectItem value="porteiro">{getTipoUsuarioLabel('porteiro')}</SelectItem>
                    <SelectItem value="administrador">{getTipoUsuarioLabel('administrador')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Define as permissões de acesso</p>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {getStatusLabel('ativo')}
                      </div>
                    </SelectItem>
                    <SelectItem value="inativo">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        {getStatusLabel('inativo')}
                      </div>
                    </SelectItem>
                    <SelectItem value="pendente">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        {getStatusLabel('pendente')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.status === 'ativo' && 'Usuário com acesso completo'}
                  {formData.status === 'inativo' && 'Usuário sem acesso ao sistema'}
                  {formData.status === 'pendente' && 'Aguardando aprovação'}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">Informações Importantes:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Foto:</strong> Opcional para moradores (recomendado para identificação)</li>
                <li>• <strong>Ativo:</strong> Usuário com acesso total ao sistema</li>
                <li>• <strong>Inativo:</strong> Usuário bloqueado (não conta no limite do plano)</li>
                <li>• <strong>Pendente:</strong> Aguardando aprovação do administrador</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? "Salvando..." : (morador ? "Atualizar Usuário" : "Salvar Usuário")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}