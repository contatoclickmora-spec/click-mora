import React, { useState } from 'react';
import { Condominio } from "@/entities/Condominio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";

export default function GerenciarCondominioModal({ condominio, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    status: condominio.status || 'teste',
    plano: condominio.plano || '30_moradores',
    valor_mensalidade: condominio.valor_mensalidade || 120,
    limite_moradores: condominio.limite_moradores || 30
  });

  const [saving, setSaving] = useState(false);

  const planosValores = {
    '30_moradores': { limite: 30, valor: 120 },
    '50_moradores': { limite: 50, valor: 180 },
    '100_moradores': { limite: 100, valor: 300 },
    '200_moradores': { limite: 200, valor: 500 },
    '500_moradores': { limite: 500, valor: 1000 },
    '500_plus': { limite: 999999, valor: 1500 }
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await Condominio.update(condominio.id, formData);
      onUpdate(formData);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar: {condominio.nome}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status */}
          <div>
            <Label htmlFor="status">Status do Plano</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="teste">Em Teste</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          {/* Plano */}
          <div>
            <Label htmlFor="plano">Plano Contratado</Label>
            <select
              id="plano"
              value={formData.plano}
              onChange={(e) => handlePlanoChange(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="30_moradores">30 moradores - R$ 120/mês</option>
              <option value="50_moradores">50 moradores - R$ 180/mês</option>
              <option value="100_moradores">100 moradores - R$ 300/mês</option>
              <option value="200_moradores">200 moradores - R$ 500/mês</option>
              <option value="500_moradores">500 moradores - R$ 1.000/mês</option>
              <option value="500_plus">500+ moradores - R$ 1.500/mês</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <Label htmlFor="valor">Valor Mensal (R$)</Label>
            <Input
              id="valor"
              type="number"
              value={formData.valor_mensalidade}
              onChange={(e) => setFormData({...formData, valor_mensalidade: parseFloat(e.target.value)})}
              className="mt-1"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}