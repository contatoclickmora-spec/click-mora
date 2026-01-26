import React, { useState } from 'react';
import { Condominio } from "@/entities/Condominio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

export default function NovoCondominioModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nome: "",
    cidade: "",
    endereco: "",
    email_administrador: "",
    telefone: "",
    plano: "30_moradores",
    status: "teste",
    limite_moradores: 30,
    moradores_ativos: 0, // Changed from moradores_cadastrados
    total_usuarios: 0, // Added
    valor_mensalidade: 109, // Changed from 120
    data_inicio: new Date().toISOString().split('T')[0],
    observacoes: "",
    sindicos_ids: [], // Added
    administrador_supremo_id: null // Added
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const planosValores = {
    '30_moradores': { limite: 30, valor: 109 }, // Value changed
    '50_moradores': { limite: 50, valor: 189 }, // Value changed
    '100_moradores': { limite: 100, valor: 324 }, // Value changed
    '200_moradores': { limite: 200, valor: 524 }, // Value changed
    '500_moradores': { limite: 500, valor: 849 } // Value changed, '500_plus' removed
  };

  const handlePlanoChange = (plano) => {
    const config = planosValores[plano];
    setFormData({
      ...formData,
      plano,
      limite_moradores: config.limite,
      valor_mensalidade: config.valor
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.cidade.trim()) newErrors.cidade = "Cidade é obrigatória";
    if (!formData.email_administrador.trim()) newErrors.email_administrador = "Email é obrigatório";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dataInicio = new Date(formData.data_inicio);
      const dataRenovacao = new Date(dataInicio);
      dataRenovacao.setDate(dataRenovacao.getDate() + 30);

      // CRIAR CONDOMÍNIO COM CONFIGURAÇÕES PADRÃO
      const novoCondominio = await Condominio.create({
        nome: formData.nome,
        cidade: formData.cidade,
        endereco: formData.endereco,
        email_administrador: formData.email_administrador,
        telefone: formData.telefone,
        plano: formData.plano,
        status: formData.status,
        limite_moradores: formData.limite_moradores,
        moradores_ativos: 0,
        total_usuarios: 0,
        valor_mensalidade: formData.valor_mensalidade,
        data_inicio: formData.data_inicio,
        data_renovacao: dataRenovacao.toISOString().split('T')[0],
        observacoes: formData.observacoes,
        sindicos_ids: [],
        administrador_supremo_id: null,
        permissoes_perfis: {
          morador: {
            dashboard: true,
            encomendas: true,
            chamados: true,
            visitantes: true,
            avisos: true,
            enquetes: true,
            marketplace: true,
            vistoria: true,
            manutencoes: true
          },
          porteiro: {
            dashboard: true,
            registrar_encomenda: true,
            retirar_encomenda: true,
            visitantes_portaria: true,
            chamados_portaria: true,
            entregadores: true,
            gerenciamento_encomendas: true,
            moradores: true,
            notificacoes_whatsapp: true
          },
          sindico: {
            dashboard: true,
            registrar_encomenda: true,
            retirar_encomenda: true,
            visitantes_portaria: true,
            chamados_portaria: true,
            entregadores: true,
            gerenciamento_encomendas: true,
            notificacoes_whatsapp: true,
            aprovacao_moradores: true,
            enviar_avisos: true,
            relatorios: true,
            moradores: true,
            funcionarios: true,
            templates: true,
            permissoes: true,
            manutencoes: true,
            documentos: true,
            marketplace: true,
            enquetes: true
          }
        }
      });
      
      console.log("✅ Condomínio criado:", novoCondominio.id);
      alert("✅ Condomínio criado com sucesso! Todas as configurações foram aplicadas automaticamente.");
      onSave();
    } catch (error) {
      console.error("Erro ao criar condomínio:", error);
      alert("Erro ao criar condomínio. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Criar Novo Condomínio</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Condomínio *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Residencial Jardim das Flores"
                className={errors.nome ? "border-red-500" : ""}
              />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
            </div>

            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                placeholder="Ex: São Paulo"
                className={errors.cidade ? "border-red-500" : ""}
              />
              {errors.cidade && <p className="text-xs text-red-500 mt-1">{errors.cidade}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email do Administrador (Síndico) *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email_administrador}
                onChange={(e) => setFormData({...formData, email_administrador: e.target.value})}
                placeholder="sindico@condominio.com"
                className={errors.email_administrador ? "border-red-500" : ""}
              />
              <p className="text-xs text-gray-500 mt-1">Este será o email de login e contato principal</p>
              {errors.email_administrador && <p className="text-xs text-red-500 mt-1">{errors.email_administrador}</p>}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="+55 11 91234-5678"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plano">Selecione o Plano</Label>
            <select
              id="plano"
              value={formData.plano}
              onChange={(e) => handlePlanoChange(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="30_moradores">30 moradores - R$ 109/mês</option>
              <option value="50_moradores">50 moradores - R$ 189/mês</option>
              <option value="100_moradores">100 moradores - R$ 324/mês</option>
              <option value="200_moradores">200 moradores - R$ 524/mês</option>
              <option value="500_moradores">500 moradores - R$ 849/mês</option>
            </select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Informações adicionais..."
              className="w-full mt-1 p-2 border rounded-md h-20"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Criando...' : 'Criar Condomínio'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}