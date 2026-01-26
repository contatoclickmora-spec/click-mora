import React, { useState, useEffect } from 'react';
import { Chamado } from "@/entities/Chamado";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useChamados } from "../components/utils/chamadosContext";
import { base44 } from "@/api/base44Client";

import ListaChamados from '../components/chamados/ListaChamados';
import NovoChamado from '../components/chamados/NovoChamado';
import MoradorHeader from '../components/shared/MoradorHeader';
import MoradorFooter from '../components/shared/MoradorFooter';

export default function ChamadosPortaria({ userType }) {
  const [chamados, setChamados] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserType, setCurrentUserType] = useState(userType);
  const [showNovoChamado, setShowNovoChamado] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('abertos');
  const [moradorLogado, setMoradorLogado] = useState(null);

  const { chamadosPendentes, atualizarChamados } = useChamados();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError('');
        
        console.log('[CHAMADOS PORTARIA] 🔄 Iniciando carregamento...');

        // 1. Carregar usuário autenticado
        const user = await User.me();
        if (!isMounted) return;

        if (!user || !user.email) {
          setError("Usuário não autenticado.");
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        console.log('[CHAMADOS PORTARIA] ✅ Usuário autenticado:', user.email);

        // 2. Carregar todos os moradores
        const todosMoradores = await Morador.list();
        if (!isMounted) return;

        const moradorLogado = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        if (!moradorLogado || !moradorLogado.condominio_id) {
          setError("Condomínio não identificado.");
          setLoading(false);
          return;
        }

        const condominioId = moradorLogado.condominio_id;

        console.log('[CHAMADOS PORTARIA] ✅ Morador logado:', {
          nome: moradorLogado.nome,
          tipo: moradorLogado.tipo_usuario,
          condominio: condominioId
        });

        if (!isMounted) return;

        setMoradorLogado(moradorLogado);
        setUserCondominioId(condominioId);
        setCurrentUserType(moradorLogado.tipo_usuario);

        // PROTEÇÃO: Carregar APENAS moradores e chamados do condomínio
        const [moradoresDoCondominio, todosChamados] = await Promise.all([
          base44.entities.Morador.filter({ condominio_id: condominioId }),
          Chamado.list('-created_date')
        ]);

        if (!isMounted) return;

        // VALIDAÇÃO: Garantir isolamento de moradores
        const moradoresValidados = moradoresDoCondominio.filter(m => m.condominio_id === condominioId);
        setMoradores(moradoresValidados);

        console.log('[CHAMADOS PORTARIA] 📥 Total chamados:', todosChamados.length);

        // PROTEÇÃO: Filtrar chamados do condomínio
        const chamadosDoCondominio = todosChamados.filter(c => {
          const moradorDoChamado = moradoresValidados.find(m => m.id === c.morador_id);
          
          if (!moradorDoChamado) {
            return false;
          }

          // VALIDAÇÃO CRÍTICA: Garantir que o chamado pertence ao condomínio
          if (moradorDoChamado.condominio_id !== condominioId) {
            console.warn('[SECURITY] Tentativa de acesso a chamado de outro condomínio bloqueada');
            return false;
          }

          // Filtrar por tipo de usuário
          if (moradorLogado.tipo_usuario === 'porteiro') {
            return c.destinatario === 'portaria';
          }

          if (moradorLogado.tipo_usuario === 'administrador') {
            return c.destinatario === 'sindico';
          }

          return false;
        });

        if (!isMounted) return;

        console.log('[SECURITY] Chamados carregados - Condomínio:', condominioId, 'Total:', chamadosDoCondominio.length);

        setChamados(chamadosDoCondominio.sort((a, b) =>
          new Date(b.created_date) - new Date(a.created_date)
        ));
        
        atualizarChamados();
        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        
        console.error('[SECURITY] Erro ao carregar chamados:', err);
        setError(`Erro ao carregar dados: ${err.message || 'Tente novamente'}`);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []); // IMPORTANTE: array vazio - executa apenas uma vez

  const getMoradorInfo = (moradorId) => {
    const morador = moradores.find(m => m.id === moradorId);
    return morador ? {
      nome: morador.nome,
      apelido_endereco: morador.apelido_endereco || "N/A"
    } : { nome: "Não encontrado", apelido_endereco: "N/A" };
  };

  const filterChamados = (lista) => {
    let filtrados = lista;

    if (filtroStatus === 'abertos') {
      filtrados = filtrados.filter(c => c.status === 'aberto' || c.status === 'em_andamento');
    } else if (filtroStatus === 'concluidos') {
      filtrados = filtrados.filter(c => c.status === 'concluido');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c => {
        const morador = getMoradorInfo(c.morador_id);
        return (
          morador.nome.toLowerCase().includes(term) ||
          morador.apelido_endereco.toLowerCase().includes(term) ||
          c.titulo.toLowerCase().includes(term) ||
          c.descricao.toLowerCase().includes(term)
        );
      });
    }

    return filtrados;
  };

  const chamadosFiltrados = filterChamados(chamados);

  const handleRefresh = async () => {
    window.location.reload();
  };

  if (showNovoChamado) {
    return (
      <NovoChamado
        moradorLogado={moradorLogado}
        userType={currentUserType}
        onVoltar={() => setShowNovoChamado(false)}
        onSuccess={() => {
          setShowNovoChamado(false);
          handleRefresh();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Chamados" />
        <div className="flex flex-col items-center justify-center pt-24 pb-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          <p className="text-gray-600">Carregando chamados...</p>
        </div>
        <MoradorFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Chamados" />
        <div className="p-4 pt-20 pb-24">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4 w-full bg-[#3b5998] hover:bg-[#2d4373]">
            Tentar Novamente
          </Button>
        </div>
        <MoradorFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Chamados" />
      
      <div className="pt-28 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-4 mt-4">
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
            moradorInfo={getMoradorInfo}
            onRefresh={handleRefresh}
            userType={currentUserType}
          />

          <div className="fixed bottom-20 right-4 z-20">
            <Button
              onClick={() => setShowNovoChamado(true)}
              className="h-14 px-6 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Novo chamado</span>
            </Button>
          </div>
        </div>
      </div>

      <MoradorFooter />
    </div>
  );
}