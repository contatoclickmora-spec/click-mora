
import React, { useState, useEffect } from 'react'; // Added useEffect
import { Chamado } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, PlusCircle, Send, CornerDownRight } from "lucide-react";

import { useChamados } from "../utils/chamadosContext"; // NEW import for context

export default function GerenciarChamados() { // Removed props chamados, moradorId, onUpdate
  const [showForm, setShowForm] = useState(false);
  // Replaced newChamado state with formData, for handling both new and potentially edited data
  const [formData, setFormData] = useState({ titulo: '', descricao: '' });
  const [editingChamado, setEditingChamado] = useState(null); // State to hold the Chamado being edited
  const [saving, setSaving] = useState(false); // State to indicate if a save operation is in progress
  const [error, setError] = useState(''); // State to hold form validation or submission errors

  // Consume the Chamados context to get necessary data and functions
  const { moradorLogado, loadData, notificarNovoChamado, chamados } = useChamados();

  // Effect to load chamados when the component mounts or moradorLogado changes
  useEffect(() => {
    if (moradorLogado?.id) {
      loadData(); // Load chamados for the current logged-in resident
    }
  }, [moradorLogado, loadData]); // Dependencies: moradorLogado (for initial load) and loadData (if it were to change)

  // Helper function to reset the form states
  const resetForm = () => {
    setFormData({ titulo: '', descricao: '' });
    setEditingChamado(null);
    setShowForm(false);
    setError('');
  };

  // Handles form submission for both creating and updating chamados
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    
    // Basic validation
    if (!formData.titulo.trim() || !formData.descricao.trim()) {
      setError("Título e descrição são obrigatórios");
      return;
    }

    setSaving(true); // Set saving state to true
    setError(""); // Clear any previous errors

    try {
      if (editingChamado) {
        // If editing an existing chamado (UI for editing not fully implemented in this snippet)
        await Chamado.update(editingChamado.id, formData);
      } else {
        // If creating a new chamado
        if (!moradorLogado?.id) {
          setError("ID do morador não disponível para criar chamado.");
          setSaving(false);
          return;
        }
        await Chamado.create({
          ...formData,
          morador_id: moradorLogado.id // Use moradorLogado.id from context
        });
        
        // Notify the system that a new chamado has been created
        notificarNovoChamado();
      }
      
      await loadData(); // Reload the list of chamados from the backend via context
      resetForm(); // Reset form fields and hide the form
    } catch (err) {
      console.error("Erro ao salvar chamado:", err);
      setError("Erro ao salvar chamado. Tente novamente.");
    } finally {
      setSaving(false); // Reset saving state
    }
  };

  const statusConfig = {
    aberto: "bg-blue-100 text-blue-800",
    em_atendimento: "bg-yellow-100 text-yellow-800",
    resolvido: "bg-green-100 text-green-800",
    fechado: "bg-gray-100 text-gray-800"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Meus Chamados para a Portaria
        </CardTitle>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {showForm ? 'Cancelar' : 'Abrir Chamado'}
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          // Use a form element for proper submission handling
          <form onSubmit={handleSubmit} className="p-4 border rounded-lg mb-6 space-y-4 bg-gray-50">
            <h3 className="font-semibold">{editingChamado ? 'Editar Chamado' : 'Novo Chamado'}</h3>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>} {/* Display error message */}
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                placeholder="Ex: Luz do corredor queimada"
                value={formData.titulo} // Bind to formData
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                disabled={saving} // Disable input while saving
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Detalhe sua solicitação aqui..."
                value={formData.descricao} // Bind to formData
                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                disabled={saving} // Disable textarea while saving
              />
            </div>
            <Button type="submit" disabled={saving}> {/* Submit button with loading state */}
              <Send className="w-4 h-4 mr-2" />
              {saving ? 'Enviando...' : (editingChamado ? 'Salvar Alterações' : 'Enviar Chamado')}
            </Button>
            {editingChamado && ( // Optionally show a cancel edit button if in editing mode
              <Button type="button" variant="ghost" onClick={resetForm} disabled={saving} className="ml-2">
                Cancelar Edição
              </Button>
            )}
          </form>
        )}
        
        <div className="space-y-4">
          {/* Safely check if chamados is an array and if it's empty */}
          {!chamados || chamados.length === 0 && !showForm ? (
            <p className="text-center text-gray-500 py-4">Nenhum chamado aberto.</p>
          ) : (
            (chamados || []).map(chamado => ( // Map over chamados from context
              <div key={chamado.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{chamado.titulo}</h4>
                    <p className="text-sm text-gray-600">{chamado.descricao}</p>
                  </div>
                  <Badge className={statusConfig[chamado.status]}>{chamado.status}</Badge>
                </div>
                {chamado.resposta_portaria && (
                  <div className="mt-3 pt-3 border-t flex items-start gap-2">
                    <CornerDownRight className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Resposta da Portaria:</p>
                      <p className="text-sm text-gray-600">{chamado.resposta_portaria}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
