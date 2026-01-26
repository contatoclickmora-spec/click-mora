import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import PhotoUpload from "../shared/PhotoUpload";

export default function FuncionarioForm({ funcionario, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    foto_url: null,
    cargo: 'porteiro',
    email: '',
    telefone: '',
    observacoes: '',
    status: 'ativo',
    permissoes: {
      registrar_encomenda: true,
      retirar_encomenda: true,
      controlar_visitantes: false,
      cadastrar_veiculos: false,
      visualizar_moradores: false,
      enviar_avisos: false,
      ver_relatorios: false
    },
    data_admissao: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome || '',
        foto_url: funcionario.foto_url || null,
        cargo: funcionario.cargo || 'porteiro',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        observacoes: funcionario.observacoes || '',
        status: funcionario.status || 'ativo',
        permissoes: funcionario.permissoes || {
          registrar_encomenda: true,
          retirar_encomenda: true,
          controlar_visitantes: false,
          cadastrar_veiculos: false,
          visualizar_moradores: false,
          enviar_avisos: false,
          ver_relatorios: false
        },
        data_admissao: funcionario.data_admissao || ''
      });
    }
  }, [funcionario]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePermissaoChange = (permissao, checked) => {
    setFormData(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [permissao]: checked
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    // NOVA REGRA: Foto obrigatória para funcionários
    if (!formData.foto_url) {
      newErrors.foto_url = 'Foto obrigatória para cadastro de funcionário.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const getCargoLabel = (cargo) => {
    const cargos = {
      porteiro: "Porteiro",
      zelador: "Zelador",
      seguranca: "Segurança",
      faxineiro: "Faxineiro",
      assistente: "Assistente"
    };
    return cargos[cargo] || cargo;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {funcionario ? 'Editar Funcionário' : 'Novo Funcionário'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto de Perfil - OBRIGATÓRIA */}
            <div>
              <PhotoUpload
                currentPhotoUrl={formData.foto_url}
                onPhotoChange={(url) => handleChange('foto_url', url)}
                label="Foto de Perfil"
                required={true}
              />
              {errors.foto_url && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-semibold">{errors.foto_url}</p>
                </div>
              )}
            </div>

            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Digite o nome completo"
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
            </div>

            {/* Cargo e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cargo">Cargo *</Label>
                <Select
                  value={formData.cargo}
                  onValueChange={(value) => handleChange('cargo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porteiro">Porteiro</SelectItem>
                    <SelectItem value="zelador">Zelador</SelectItem>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="faxineiro">Faxineiro</SelectItem>
                    <SelectItem value="assistente">Assistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contatos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={errors.telefone ? 'border-red-500' : ''}
                />
                {errors.telefone && <p className="text-sm text-red-500 mt-1">{errors.telefone}</p>}
              </div>
            </div>

            {/* Data de Admissão */}
            <div>
              <Label htmlFor="data_admissao">Data de Admissão</Label>
              <Input
                id="data_admissao"
                type="date"
                value={formData.data_admissao}
                onChange={(e) => handleChange('data_admissao', e.target.value)}
              />
            </div>

            {/* Permissões */}
            <div className="space-y-3">
              <Label>Permissões de Acesso</Label>
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                {[
                  { key: 'registrar_encomenda', label: 'Registrar Encomendas' },
                  { key: 'retirar_encomenda', label: 'Processar Retirada de Encomendas' },
                  { key: 'controlar_visitantes', label: 'Gerenciar Visitantes' },
                  { key: 'cadastrar_veiculos', label: 'Cadastrar Veículos' },
                  { key: 'visualizar_moradores', label: 'Consultar Cadastro de Moradores' },
                  { key: 'enviar_avisos', label: 'Enviar Avisos aos Moradores' },
                  { key: 'ver_relatorios', label: 'Acessar Relatórios' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData.permissoes[key]}
                      onCheckedChange={(checked) => handlePermissaoChange(key, checked)}
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o funcionário..."
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 text-sm mb-2">⚠️ Atenção:</h4>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• <strong>Foto obrigatória:</strong> Todos os funcionários devem ter foto de perfil</li>
                <li>• A foto será usada para identificação e controle de acesso</li>
                <li>• Permissões podem ser ajustadas a qualquer momento</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {funcionario ? 'Atualizar Funcionário' : 'Cadastrar Funcionário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}