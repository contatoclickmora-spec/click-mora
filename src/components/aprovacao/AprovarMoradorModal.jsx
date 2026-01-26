
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AprovarMoradorModal({ morador, residencias, onClose, onConfirm }) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    tipo_usuario: "morador",
    residencia_id: "",
    apelido_endereco: "",
    endereco_principal: "",
    complemento: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (morador) {
      const residencia = morador.residencia_id 
        ? residencias.find(r => r.id === morador.residencia_id) 
        : null;
      
      setFormData({
        nome: morador.nome || "",
        email: morador.email || "",
        telefone: morador.telefone || "",
        tipo_usuario: morador.tipo_usuario || "morador",
        residencia_id: morador.residencia_id || "",
        apelido_endereco: morador.apelido_endereco || "",
        endereco_principal: residencia?.identificador_principal || "",
        complemento: residencia?.complemento || ""
      });
    }
  }, [morador, residencias]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
    
    // Validate address fields only if the user is not a 'porteiro'
    if (formData.tipo_usuario !== 'porteiro') {
      if (!formData.endereco_principal.trim()) {
        newErrors.endereco_principal = "Endereço é obrigatório";
      }
      if (!formData.apelido_endereco.trim()) {
        newErrors.apelido_endereco = "Abreviação é obrigatória";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Preparar dados para salvar (incluindo endereco)
    const dadosParaSalvar = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      tipo_usuario: formData.tipo_usuario,
      // Only include address fields if not a 'porteiro'
      apelido_endereco: formData.tipo_usuario !== 'porteiro' ? formData.apelido_endereco : null,
      identificador_principal: formData.tipo_usuario !== 'porteiro' ? formData.endereco_principal : null,
      complemento: formData.tipo_usuario !== 'porteiro' ? formData.complemento : null,
      residencia_id: formData.tipo_usuario !== 'porteiro' ? formData.residencia_id : null
    };

    onConfirm(dadosParaSalvar);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Aprovar Cadastro de {morador.nome}
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Revise as informações antes de aprovar. Você pode editar os dados se necessário.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className={errors.nome ? "border-red-500" : ""}
            />
            {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                className={errors.telefone ? "border-red-500" : ""}
              />
              {errors.telefone && <p className="text-sm text-red-500 mt-1">{errors.telefone}</p>}
            </div>
          </div>

          {/* Tipo de Usuário */}
          <div>
            <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
            <Select
              value={formData.tipo_usuario}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  tipo_usuario: value,
                  // Clear address-related fields if switching to 'porteiro'
                  ...(value === 'porteiro' && {
                    residencia_id: "",
                    apelido_endereco: "",
                    endereco_principal: "",
                    complemento: ""
                  })
                }));
                // Clear address related errors if switching to 'porteiro'
                if (value === 'porteiro') {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.endereco_principal;
                    delete newErrors.apelido_endereco;
                    return newErrors;
                  });
                }
              }}
            >
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

          {/* Endereço - Apenas para Morador e Administrador */}
          {formData.tipo_usuario !== 'porteiro' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endereco_principal">Endereço Principal *</Label>
                  <Input
                    id="endereco_principal"
                    value={formData.endereco_principal}
                    onChange={(e) => setFormData({...formData, endereco_principal: e.target.value})}
                    placeholder="Ex: Bloco 9, Torre B"
                    className={errors.endereco_principal ? "border-red-500" : ""}
                  />
                  {errors.endereco_principal && <p className="text-sm text-red-500 mt-1">{errors.endereco_principal}</p>}
                </div>

                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                    placeholder="Ex: Apto 103"
                  />
                </div>
              </div>

              {/* Abreviação */}
              <div>
                <Label htmlFor="apelido_endereco">Abreviação (para busca) *</Label>
                <Input
                  id="apelido_endereco"
                  value={formData.apelido_endereco}
                  onChange={(e) => setFormData({...formData, apelido_endereco: e.target.value})}
                  placeholder="Ex: 9-103"
                  className={errors.apelido_endereco ? "border-red-500" : ""}
                />
                {errors.apelido_endereco && <p className="text-sm text-red-500 mt-1">{errors.apelido_endereco}</p>}
              </div>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar e Ativar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
