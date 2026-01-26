import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Loader2, AlertCircle, Package } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import NovoRegistroEntrega from '../components/entregadores/NovoRegistroEntrega';
import DetalhesEntrega from '../components/entregadores/DetalhesEntrega';
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";

export default function Entregadores() {
  const [registros, setRegistros] = useState([]);
  const [entregadores, setEntregadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [error, setError] = useState('');
  const [showNovo, setShowNovo] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = await base44.auth.me();

      if (!user || !user.email) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      const todosMoradores = await base44.entities.Morador.list();
      const moradorAtual = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (!moradorAtual || !moradorAtual.condominio_id) {
        setError("Condomínio não identificado.");
        setLoading(false);
        return;
      }

      const condominioId = moradorAtual.condominio_id;
      setUserCondominioId(condominioId);
      setMoradorLogado(moradorAtual);

      // PROTEÇÃO: Carregar APENAS registros e entregadores do condomínio
      const [registrosData, entregadoresData] = await Promise.all([
        base44.entities.RegistroEntrega.filter({ condominio_id: condominioId }, '-data_registro'),
        base44.entities.Entregador.filter({ condominio_id: condominioId })
      ]);

      // VALIDAÇÃO: Garantir isolamento absoluto
      const registrosValidados = registrosData.filter(r => r.condominio_id === condominioId);
      const entregadoresValidados = entregadoresData.filter(e => e.condominio_id === condominioId);

      setRegistros(registrosValidados);
      setEntregadores(entregadoresValidados);

      console.log(`[SECURITY] Entregadores carregados - Condomínio: ${condominioId}, Registros: ${registrosValidados.length}`);

    } catch (err) {
      console.error("[SECURITY] Erro ao carregar entregadores:", err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = registros.filter(registro => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      registro.entregador_nome?.toLowerCase().includes(term) ||
      registro.entregador_empresa?.toLowerCase().includes(term) ||
      registro.porteiro_responsavel?.toLowerCase().includes(term)
    );
  });

  if (showNovo) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Cadastrar recebimento" onBack={() => setShowNovo(false)} />
        <div className="pt-16 pb-20">
          <NovoRegistroEntrega
            moradorLogado={moradorLogado}
            entregadores={entregadores}
            onVoltar={() => setShowNovo(false)}
            onSuccess={() => {
              setShowNovo(false);
              loadData();
            }}
          />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  if (registroSelecionado) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Detalhes da entrega" onBack={() => setRegistroSelecionado(null)} />
        <div className="pt-16 pb-20">
          <DetalhesEntrega
            registro={registroSelecionado}
            onVoltar={() => setRegistroSelecionado(null)}
          />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Entregadores" />
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#f7f7f7] min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Entregadores" />
      
      <div className="pt-28 pb-24 px-4">
        {/* Barra de Busca */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Encontrar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-0 bg-[#dfe3ee]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Registros */}
        {registrosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'Nenhum registro encontrado' : 'Nenhum recebimento registrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrosFiltrados.map((registro) => (
              <Card
                key={registro.id}
                className="bg-white hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
                onClick={() => setRegistroSelecionado(registro)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Foto ou Ícone */}
                    <div className="w-20 h-20 bg-[#dfe3ee] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {registro.fotos_pacotes && registro.fotos_pacotes.length > 0 ? (
                        <img
                          src={registro.fotos_pacotes[0]}
                          alt="Pacotes"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {registro.entregador_nome || 'Sem nome'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        {registro.entregador_empresa || 'Sem empresa'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Data de cadastro: {format(parseISO(registro.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {registro.quantidade_pacotes} {registro.quantidade_pacotes === 1 ? 'pacote' : 'pacotes'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Botão Novo */}
      <div className="fixed bottom-20 right-4 z-20">
        <Button
          onClick={() => setShowNovo(true)}
          className="h-14 px-6 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Cadastrar</span>
        </Button>
      </div>

      <MoradorFooter />
    </div>
  );
}