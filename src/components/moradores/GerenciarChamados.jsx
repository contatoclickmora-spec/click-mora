import React, { useState, useEffect } from 'react';
import { Chamado } from "@/entities/Chamado";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, AlertCircle, Search } from "lucide-react";

import NovoChamado from '../chamados/NovoChamado';
import ListaChamados from '../chamados/ListaChamados';
import MoradorHeader from '../shared/MoradorHeader';

export default function GerenciarChamados({ moradorId }) {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('abertos');
  const [moradorLogado, setMoradorLogado] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('[GERENCIAR CHAMADOS] 🔄 Carregando dados...');

        const user = await User.me();
        if (!isMounted) return;

        if (!user || !user.email) {
          setError("Usuário não autenticado.");
          setLoading(false);
          return;
        }

        const todosMoradores = await Morador.list();
        if (!isMounted) return;

        const morador = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        if (!morador) {
          setError("Cadastro não encontrado.");
          setLoading(false);
          return;
        }

        setMoradorLogado(morador);
        console.log('[GERENCIAR CHAMADOS] ✅ Morador carregado:', morador.nome);

        const todosChamados = await Chamado.list('-created_date');
        if (!isMounted) return;

        // Filtrar APENAS chamados criados pelo morador logado
        const meusChamados = todosChamados.filter(c => c.criado_por_id === morador.id);

        console.log('[GERENCIAR CHAMADOS] ✅ Meus chamados:', meusChamados.length);

        setChamados(meusChamados);
        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        
        console.error("[GERENCIAR CHAMADOS] ❌ Erro:", err);
        setError("Erro ao carregar chamados");
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [moradorId]);

  const handleSuccess = () => {
    setSuccess("Chamado criado com sucesso!");
    setTimeout(() => setSuccess(""), 3000);
    setShowNovo(false);
    window.location.reload();
  };

  if (showNovo) {
    return (
      <NovoChamado
        moradorLogado={moradorLogado}
        userType="morador"
        onVoltar={() => setShowNovo(false)}
        onSuccess={handleSuccess}
        hideHeader={true}
      />
    );
  }

  const filterChamados = (lista) => {
    let filtrados = lista;

    if (filtroStatus === 'abertos') {
      filtrados = filtrados.filter(c => c.status === 'aberto' || c.status === 'em_andamento');
    } else if (filtroStatus === 'concluidos') {
      filtrados = filtrados.filter(c => c.status === 'concluido');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c =>
        c.titulo.toLowerCase().includes(term) ||
        c.descricao.toLowerCase().includes(term)
      );
    }

    return filtrados;
  };

  const chamadosFiltrados = filterChamados(chamados);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
        <MoradorHeader title="Meus Chamados" />
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b5998' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <MoradorHeader title="Meus Chamados" />
      
      <div className="pt-16 pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar chamado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-0 bg-[#dfe3ee]"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={() => setFiltroStatus('abertos')}
              variant={filtroStatus === 'abertos' ? 'default' : 'outline'}
              className={`flex-1 ${
                filtroStatus === 'abertos' 
                  ? 'bg-[#3b5998] text-white hover:bg-[#2d4373]' 
                  : 'border-[#8b9dc3] text-[#3b5998] hover:bg-[#dfe3ee]'
              }`}
            >
              Abertos ({chamados.filter(c => c.status === 'aberto' || c.status === 'em_andamento').length})
            </Button>
            <Button
              onClick={() => setFiltroStatus('concluidos')}
              variant={filtroStatus === 'concluidos' ? 'default' : 'outline'}
              className={`flex-1 ${
                filtroStatus === 'concluidos' 
                  ? 'bg-[#3b5998] text-white hover:bg-[#2d4373]' 
                  : 'border-[#8b9dc3] text-[#3b5998] hover:bg-[#dfe3ee]'
              }`}
            >
              Concluídos ({chamados.filter(c => c.status === 'concluido').length})
            </Button>
          </div>

          <ListaChamados
            chamados={chamadosFiltrados}
            onRefresh={() => window.location.reload()}
            userType="morador"
          />
        </div>
      </div>

      <div className="fixed bottom-20 right-4 z-20">
        <button
          onClick={() => setShowNovo(true)}
          className="h-14 px-6 rounded-full shadow-lg flex items-center gap-2 font-semibold text-white"
          style={{ 
            backgroundColor: '#2c2c2c',
            minWidth: '48px',
            minHeight: '48px'
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Novo chamado</span>
        </button>
      </div>
    </div>
  );
}