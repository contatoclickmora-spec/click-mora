import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Building,
  Home,
  User as UserIcon,
  Search,
  X
} from "lucide-react";

const tiposDestinatario = [
  { id: "todos", label: "Condomínio Inteiro", icon: Users, description: "Todos os moradores" },
  { id: "bloco", label: "Bloco Específico", icon: Building, description: "Moradores de um bloco" },
  { id: "apartamento", label: "Apartamento Específico", icon: Home, description: "Moradores de um endereço" },
  { id: "individuais", label: "Pessoas Específicas", icon: UserIcon, description: "Seleção individual" }
];

export default function SeletorDestinatarios({ formData, setFormData, moradores, residencias, destinatarios }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleTipoChange = (tipo) => {
    setFormData({
      ...formData,
      tipo_destinatario: tipo,
      filtro_bloco: "",
      filtro_apartamento: "",
      moradores_selecionados: []
    });
  };

  const handleMoradorToggle = (moradorId) => {
    const isSelected = formData.moradores_selecionados.includes(moradorId);
    const newSelection = isSelected
      ? formData.moradores_selecionados.filter(id => id !== moradorId)
      : [...formData.moradores_selecionados, moradorId];
    
    setFormData({
      ...formData,
      moradores_selecionados: newSelection
    });
  };

  const removeMorador = (moradorId) => {
    setFormData({
      ...formData,
      moradores_selecionados: formData.moradores_selecionados.filter(id => id !== moradorId)
    });
  };

  const getResidenciaInfo = (moradorId) => {
    const morador = moradores.find(m => m.id === moradorId);
    if (!morador) return "Não encontrado";
    
    const residencia = residencias.find(r => r.id === morador.residencia_id);
    return residencia ? `${residencia.identificador_principal} ${residencia.complemento}` : "N/A";
  };

  const filteredMoradores = moradores.filter(morador =>
    morador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    morador.apelido_endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Selecionar Destinatários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tiposDestinatario.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => handleTipoChange(tipo.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formData.tipo_destinatario === tipo.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <tipo.icon className={`w-5 h-5 ${formData.tipo_destinatario === tipo.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">{tipo.label}</p>
                  <p className="text-sm text-gray-500">{tipo.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filtros específicos */}
        {formData.tipo_destinatario === "bloco" && (
          <div>
            <Label htmlFor="filtro-bloco">Nome do Bloco</Label>
            <Input
              id="filtro-bloco"
              value={formData.filtro_bloco}
              onChange={(e) => setFormData({...formData, filtro_bloco: e.target.value})}
              placeholder="Ex: Bloco 9, Torre A..."
              className="mt-1"
            />
          </div>
        )}

        {formData.tipo_destinatario === "apartamento" && (
          <div>
            <Label htmlFor="filtro-apartamento">Endereço</Label>
            <Input
              id="filtro-apartamento"
              value={formData.filtro_apartamento}
              onChange={(e) => setFormData({...formData, filtro_apartamento: e.target.value})}
              placeholder="Ex: Bloco 9, Apto 103..."
              className="mt-1"
            />
          </div>
        )}

        {formData.tipo_destinatario === "individuais" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar moradores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Moradores Selecionados */}
            {formData.moradores_selecionados.length > 0 && (
              <div className="space-y-2">
                <Label>Selecionados ({formData.moradores_selecionados.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.moradores_selecionados.map(moradorId => {
                    const morador = moradores.find(m => m.id === moradorId);
                    return morador ? (
                      <Badge key={moradorId} variant="secondary" className="flex items-center gap-1">
                        {morador.nome}
                        <button
                          type="button"
                          onClick={() => removeMorador(moradorId)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Lista de Moradores */}
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredMoradores.map(morador => (
                <div key={morador.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                  <Checkbox
                    id={`morador-${morador.id}`}
                    checked={formData.moradores_selecionados.includes(morador.id)}
                    onCheckedChange={() => handleMoradorToggle(morador.id)}
                  />
                  <label htmlFor={`morador-${morador.id}`} className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">{morador.nome}</p>
                      <p className="text-sm text-gray-500">{getResidenciaInfo(morador.id)} ({morador.apelido_endereco})</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview dos Destinatários */}
        {destinatarios.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Prévia - {destinatarios.length} destinatário(s):
            </h4>
            <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
              {destinatarios.slice(0, 10).map(morador => (
                <div key={morador.id}>• {morador.nome} ({morador.apelido_endereco})</div>
              ))}
              {destinatarios.length > 10 && (
                <div className="text-gray-500 italic">... e mais {destinatarios.length - 10} morador(es)</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}