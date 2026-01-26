import React, { useState } from 'react';
import { Visitante } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, PlusCircle, Send, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciarVisitantes({ visitantes, moradorId, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [newVisitante, setNewVisitante] = useState({
    nome_visitante: '',
    documento_visitante: '',
    data_inicio: '',
    data_fim: ''
  });

  const handleCreate = async () => {
    if (!newVisitante.nome_visitante || !newVisitante.data_inicio || !newVisitante.data_fim) {
      alert("Preencha nome, data de início e data de fim.");
      return;
    }
    await Visitante.create({ ...newVisitante, morador_id: moradorId });
    setNewVisitante({ nome_visitante: '', documento_visitante: '', data_inicio: '', data_fim: '' });
    setShowForm(false);
    onUpdate();
  };

  const statusConfig = {
    agendado: "bg-blue-100 text-blue-800",
    entrou: "bg-green-100 text-green-800",
    saiu: "bg-gray-100 text-gray-800",
    cancelado: "bg-red-100 text-red-800"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Autorização de Visitantes
        </CardTitle>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {showForm ? 'Cancelar' : 'Agendar Visitante'}
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="p-4 border rounded-lg mb-6 space-y-4 bg-gray-50">
            <h3 className="font-semibold">Agendar Novo Visitante</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_visitante">Nome do Visitante</Label>
                <Input id="nome_visitante" value={newVisitante.nome_visitante} onChange={e => setNewVisitante({ ...newVisitante, nome_visitante: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="documento_visitante">Documento (Opcional)</Label>
                <Input id="documento_visitante" value={newVisitante.documento_visitante} onChange={e => setNewVisitante({ ...newVisitante, documento_visitante: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="data_inicio">Início da Visita</Label>
                <Input id="data_inicio" type="datetime-local" value={newVisitante.data_inicio} onChange={e => setNewVisitante({ ...newVisitante, data_inicio: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="data_fim">Fim da Visita</Label>
                <Input id="data_fim" type="datetime-local" value={newVisitante.data_fim} onChange={e => setNewVisitante({ ...newVisitante, data_fim: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Send className="w-4 h-4 mr-2" />
              Salvar Agendamento
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          {visitantes.length === 0 && !showForm ? (
            <p className="text-center text-gray-500 py-4">Nenhum visitante agendado.</p>
          ) : (
            visitantes.map(visitante => (
              <div key={visitante.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{visitante.nome_visitante}</h4>
                    <p className="text-sm text-gray-600">{visitante.documento_visitante || "Documento não informado"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3"/>
                      {format(new Date(visitante.data_inicio), 'dd/MM HH:mm', { locale: ptBR })} até {format(new Date(visitante.data_fim), 'dd/MM HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <Badge className={statusConfig[visitante.status]}>{visitante.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}