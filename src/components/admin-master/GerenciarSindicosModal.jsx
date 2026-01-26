import React, { useState, useEffect, useCallback } from 'react';
import { Morador } from "@/entities/Morador";
import { Condominio } from "@/entities/Condominio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  X, 
  Search, 
  Crown, 
  UserPlus, 
  Trash2,
  Shield,
  AlertTriangle
} from "lucide-react";

export default function GerenciarSindicosModal({ condominio, onClose, onUpdate }) {
  const [todosMoradores, setTodosMoradores] = useState([]);
  const [sindicos, setSindicos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const moradores = await Morador.list();
      setTodosMoradores(moradores);
      
      // Carregar síndicos atuais
      const sindicosAtuais = condominio.sindicos_ids 
        ? moradores.filter(m => condominio.sindicos_ids.includes(m.id))
        : [];
      setSindicos(sindicosAtuais);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [condominio.sindicos_ids]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMoradores = todosMoradores.filter(m => {
    // Filtrar apenas administradores que não estão no condomínio
    if (m.tipo_usuario !== 'administrador') return false;
    if (sindicos.some(s => s.id === m.id)) return false;
    
    const matchSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       m.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const adicionarSindico = async (morador) => {
    setSaving(true);
    try {
      const novosSindicosIds = [...(condominio.sindicos_ids || []), morador.id];
      
      // Atualizar condomínio
      await Condominio.update(condominio.id, {
        sindicos_ids: novosSindicosIds
      });
      
      // Atualizar morador para vincular ao condomínio
      await Morador.update(morador.id, {
        condominio_id: condominio.id
      });
      
      setSindicos([...sindicos, morador]);
      setSearchTerm('');
      alert(`✅ ${morador.nome} foi adicionado como síndico!`);
      
    } catch (error) {
      console.error("Erro ao adicionar síndico:", error);
      alert("❌ Erro ao adicionar síndico");
    } finally {
      setSaving(false);
    }
  };

  const removerSindico = async (sindicoId) => {
    const sindico = sindicos.find(s => s.id === sindicoId);
    
    if (!window.confirm(`Tem certeza que deseja remover ${sindico?.nome} como síndico?`)) {
      return;
    }
    
    // Não permitir remover o administrador supremo sem antes remover o status
    if (condominio.administrador_supremo_id === sindicoId) {
      alert("❌ Não é possível remover o Administrador Supremo. Primeiro remova o status de Administrador Supremo.");
      return;
    }

    setSaving(true);
    try {
      const novosSindicosIds = (condominio.sindicos_ids || []).filter(id => id !== sindicoId);
      
      await Condominio.update(condominio.id, {
        sindicos_ids: novosSindicosIds
      });
      
      setSindicos(sindicos.filter(s => s.id !== sindicoId));
      alert(`✅ Síndico removido com sucesso!`);
      
    } catch (error) {
      console.error("Erro ao remover síndico:", error);
      alert("❌ Erro ao remover síndico");
    } finally {
      setSaving(false);
    }
  };

  const definirAdministradorSupremo = async (sindicoId) => {
    const sindico = sindicos.find(s => s.id === sindicoId);
    
    if (!window.confirm(
      `Deseja tornar ${sindico?.nome} o ADMINISTRADOR SUPREMO deste condomínio?\n\n` +
      `O Administrador Supremo terá acesso TOTAL e IRRESTRITO a todas as funcionalidades do condomínio.`
    )) {
      return;
    }

    setSaving(true);
    try {
      // Remover status de administrador supremo do anterior
      if (condominio.administrador_supremo_id) {
        await Morador.update(condominio.administrador_supremo_id, {
          is_administrador_supremo: false
        });
      }
      
      // Definir novo administrador supremo
      await Condominio.update(condominio.id, {
        administrador_supremo_id: sindicoId
      });
      
      await Morador.update(sindicoId, {
        is_administrador_supremo: true
      });
      
      alert(`✅ ${sindico?.nome} agora é o Administrador Supremo!`);
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error("Erro ao definir administrador supremo:", error);
      alert("❌ Erro ao definir administrador supremo");
    } finally {
      setSaving(false);
    }
  };

  const removerAdministradorSupremo = async () => {
    if (!window.confirm(
      `Tem certeza que deseja remover o status de Administrador Supremo?`
    )) {
      return;
    }

    setSaving(true);
    try {
      await Morador.update(condominio.administrador_supremo_id, {
        is_administrador_supremo: false
      });
      
      await Condominio.update(condominio.id, {
        administrador_supremo_id: null
      });
      
      alert(`✅ Status de Administrador Supremo removido!`);
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error("Erro:", error);
      alert("❌ Erro ao remover status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Gerenciar Síndicos: {condominio.nome}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Síndicos Atuais */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Síndicos do Condomínio</h3>
            
            {sindicos.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum síndico cadastrado para este condomínio.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {sindicos.map(sindico => (
                  <div 
                    key={sindico.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      condominio.administrador_supremo_id === sindico.id 
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {sindico.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{sindico.nome}</p>
                          {condominio.administrador_supremo_id === sindico.id && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
                              <Crown className="w-3 h-3 mr-1" />
                              Administrador Supremo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{sindico.email}</p>
                        {condominio.administrador_supremo_id === sindico.id && (
                          <p className="text-xs text-purple-700 mt-1">
                            ✨ Acesso total e irrestrito ao condomínio
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {condominio.administrador_supremo_id === sindico.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removerAdministradorSupremo}
                          disabled={saving}
                          className="border-purple-300 text-purple-700"
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Remover Status
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => definirAdministradorSupremo(sindico.id)}
                          disabled={saving}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Tornar Supremo
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerSindico(sindico.id)}
                        disabled={saving || condominio.administrador_supremo_id === sindico.id}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Novo Síndico */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Adicionar Novo Síndico</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar administrador por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredMoradores.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum administrador encontrado com essa busca.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredMoradores.map(morador => (
                    <div 
                      key={morador.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{morador.nome}</p>
                        <p className="text-sm text-gray-600">{morador.email}</p>
                        {morador.condominio_id && morador.condominio_id !== condominio.id && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ Já vinculado a outro condomínio
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => adicionarSindico(morador)}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Info sobre Administrador Supremo */}
          <Alert className="bg-purple-50 border-purple-200">
            <Crown className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800 text-sm">
              <strong>👑 Administrador Supremo:</strong> Possui acesso TOTAL e IRRESTRITO a todas as funcionalidades do condomínio, incluindo finanças, relatórios, gerenciamento de moradores e configurações. Apenas um síndico pode ter este status por vez.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}