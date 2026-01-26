import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import AuthGuard from "../components/utils/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  X, 
  User as UserIcon,
  Calendar,
  Loader2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import MoradorHeader from '../components/shared/MoradorHeader';
import MoradorFooter from '../components/shared/MoradorFooter';
import DetalhesEncomenda from '../components/moradores/DetalhesEncomenda'; // New import

const ITEMS_PER_PAGE = 20;

export default function GerenciamentoEncomendas() {
  const [encomendas, setEncomendas] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('todos');
  const [userCondominioId, setUserCondominioId] = useState(null);
  const [error, setError] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedEncomenda, setSelectedEncomenda] = useState(null);
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  // Reset para página 1 quando mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, abaAtiva]);

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
      const moradorLogado = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (!moradorLogado || !moradorLogado.condominio_id) {
        setError("Condomínio não identificado.");
        setLoading(false);
        return;
      }

      const condominioId = moradorLogado.condominio_id;
      setUserCondominioId(condominioId);

      // PROTEÇÃO: Carregar APENAS dados do condomínio do usuário
      const [encomendasDoCondominio, moradoresDoCondominio] = await Promise.all([
        base44.entities.Encomenda.filter({ condominio_id: condominioId }, '-created_date'),
        base44.entities.Morador.filter({ condominio_id: condominioId })
      ]);

      // VALIDAÇÃO FINAL: Garantir isolamento absoluto
      const encomendasValidadas = encomendasDoCondominio.filter(e => e.condominio_id === condominioId);
      const moradoresValidados = moradoresDoCondominio.filter(m => m.condominio_id === condominioId);

      setEncomendas(encomendasValidadas);
      setMoradores(moradoresValidados);

      console.log(`[SECURITY] Encomendas carregadas - Condomínio: ${condominioId}, Total: ${encomendasValidadas.length}`);

    } catch (err) {
      console.error("[SECURITY] Erro ao carregar encomendas:", err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const getMoradorInfo = (moradorId) => {
    // PROTEÇÃO: Validar entrada
    if (!moradorId) {
      return { nome: "Sem morador", endereco: "N/A", telefone: "" };
    }

    const morador = moradores.find(m => m.id === moradorId);
    
    // VALIDAÇÃO: Morador encontrado e do condomínio correto
    if (!morador) {
      return { nome: "Não encontrado", endereco: "N/A", telefone: "" };
    }

    if (morador.condominio_id !== userCondominioId) {
      console.warn('[SECURITY] Acesso a morador de outro condomínio detectado');
      return { nome: "Erro de dados", endereco: "N/A", telefone: "" };
    }

    return {
      nome: morador.nome || "Sem nome",
      endereco: morador.apelido_endereco || morador.abreviacao || "N/A",
      telefone: morador.telefone || ""
    };
  };

  const handleDeleteEncomenda = async (encomendaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta encomenda?')) {
      return;
    }

    try {
      // VALIDAÇÃO: Encomenda existe
      const encomenda = encomendas.find(e => e.id === encomendaId);
      
      if (!encomenda) {
        alert("Encomenda não encontrada");
        return;
      }

      // VALIDAÇÃO: Ownership (pertence ao condomínio)
      if (encomenda.condominio_id !== userCondominioId) {
        console.error('[SECURITY] Tentativa de deletar encomenda de outro condomínio');
        alert("Erro de segurança: não é possível excluir encomenda de outro condomínio");
        return;
      }

      // PROTEÇÃO: Confirmar deleção de encomenda já retirada
      if (encomenda.status === 'retirada') {
        if (!confirm('Esta encomenda já foi retirada. Tem certeza que deseja excluir o registro?')) {
          return;
        }
      }
      
      await base44.entities.Encomenda.delete(encomendaId);
      
      console.log(`[DATA_INTEGRITY] Encomenda ${encomenda.codigo} deletada`);
      
      loadData();
    } catch (err) {
      console.error("[DATA_INTEGRITY] Erro ao excluir encomenda:", err);
      alert("Erro ao excluir encomenda. Tente novamente.");
    }
  };

  const handleEntregarEncomenda = (encomenda) => {
    window.location.href = createPageUrl('RetirarEncomenda') + `?codigo=${encomenda.codigo}`;
  };

  const handleVerDetalhes = (encomenda) => {
    console.log('[GerenciamentoEncomendas] Abrindo detalhes da encomenda:', encomenda);
    setSelectedEncomenda(encomenda);
    setDetalhesModalOpen(true);
  };

  const filterEncomendas = () => {
    // PROTEÇÃO: Garantir array válido
    if (!Array.isArray(encomendas)) {
      console.error('[DATA_INTEGRITY] Encomendas não é um array');
      return [];
    }

    let filtered = [...encomendas];

    // FILTRO: Por aba
    if (abaAtiva === 'pendentes') {
      filtered = filtered.filter(e => e?.status === 'aguardando');
    } else if (abaAtiva === 'entregues') {
      filtered = filtered.filter(e => e?.status === 'retirada');
    }

    // FILTRO: Por busca
    if (searchTerm && searchTerm.trim()) {
      const term = String(searchTerm).toLowerCase().trim().slice(0, 100);
      
      filtered = filtered.filter(enc => {
        if (!enc) return false;
        
        try {
          const morador = getMoradorInfo(enc.morador_id);
          const nomeMatch = morador.nome.toLowerCase().includes(term);
          const enderecoMatch = morador.endereco.toLowerCase().includes(term);
          const porteiroMatch = enc.porteiro_entrada && String(enc.porteiro_entrada).toLowerCase().includes(term);
          
          return nomeMatch || enderecoMatch || porteiroMatch;
        } catch (err) {
          console.error('[DATA_INTEGRITY] Erro ao filtrar encomenda:', err);
          return false;
        }
      });
    }

    return filtered;
  };

  const encomendasFiltradas = filterEncomendas();
  
  // Cálculos de paginação
  const totalPages = Math.ceil(encomendasFiltradas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const encomendasPaginadas = encomendasFiltradas.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll suave para o topo da lista
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Footer items removed - using MoradorFooter component

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Encomendas" />
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Encomendas" />
        <div className="p-4 pb-24 pt-20">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
        <MoradorFooter />
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Encomendas" />
      
      <div className="pt-28 pb-24 px-4">
        {/* Barra de Busca */}
        <Card className="mb-4 border-0 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b9dc3] w-5 h-5" />
              <Input
                placeholder="Buscar por nome, endereço ou porteiro"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-lg border-0 bg-[#dfe3ee] text-gray-900 placeholder:text-[#8b9dc3]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filtros de Abas */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setAbaAtiva('todos')}
            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              abaAtiva === 'todos'
                ? 'bg-[#3b5998] text-white shadow-md'
                : 'bg-white text-[#3b5998] border border-[#dfe3ee]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setAbaAtiva('pendentes')}
            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              abaAtiva === 'pendentes'
                ? 'bg-[#3b5998] text-white shadow-md'
                : 'bg-white text-[#3b5998] border border-[#dfe3ee]'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setAbaAtiva('entregues')}
            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              abaAtiva === 'entregues'
                ? 'bg-[#3b5998] text-white shadow-md'
                : 'bg-white text-[#3b5998] border border-[#dfe3ee]'
            }`}
          >
            Entregues
          </button>
        </div>

        {/* Contador de resultados */}
        {encomendasFiltradas.length > 0 && (
          <div className="mb-3 text-sm text-gray-600">
            Mostrando {startIndex + 1}-{Math.min(endIndex, encomendasFiltradas.length)} de {encomendasFiltradas.length} encomenda(s)
          </div>
        )}

        {/* Lista de Encomendas */}
        <div className="space-y-3">
          {encomendasPaginadas.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm 
                  ? "Nenhuma encomenda encontrada" 
                  : abaAtiva === 'pendentes'
                  ? "Nenhuma encomenda pendente"
                  : abaAtiva === 'entregues'
                  ? "Nenhuma encomenda entregue"
                  : "Nenhuma encomenda registrada"
                }
              </p>
            </div>
          ) : (
            encomendasPaginadas.map(enc => {
              const moradorInfo = getMoradorInfo(enc.morador_id);
              const isEntregue = enc.status === 'retirada';

              return (
                <Card 
                  key={enc.id} 
                  className="overflow-hidden shadow-sm border-0 bg-white cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleVerDetalhes(enc)}
                >
                  {/* Status Banner */}
                  <div className={`p-2 flex items-center justify-between ${
                    isEntregue ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-sm font-medium ${
                      isEntregue ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isEntregue ? 'Entregue ao morador' : 'Não entregue ao morador'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEncomenda(enc.id);
                      }}
                      className={`p-1 rounded hover:bg-white/50 transition-colors ${
                        isEntregue ? 'text-green-700' : 'text-red-700'
                      }`}
                      aria-label="Excluir encomenda"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Foto da Encomenda */}
                      {enc.foto_encomenda && (
                        <div 
                          className="flex-shrink-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(enc.foto_encomenda);
                            setImageModalOpen(true);
                          }}
                        >
                          <img
                            src={enc.foto_encomenda}
                            alt="Encomenda"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-[#dfe3ee]"
                          />
                        </div>
                      )}

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-[#3b5998] mb-1 truncate">
                          {moradorInfo.nome}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {moradorInfo.endereco}
                        </p>
                        
                        <div className="space-y-1 text-sm text-[#8b9dc3]">
                          {enc.porteiro_entrada && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Porteiro: {enc.porteiro_entrada}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Recebido em: {format(parseISO(enc.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botão Entregar */}
                    {!isEntregue && (
                      <div className="mt-4 pt-4 border-t border-[#dfe3ee]">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEntregarEncomenda(enc);
                          }}
                          className="w-full bg-white border-2 border-[#3b5998] text-[#3b5998] hover:bg-[#3b5998] hover:text-white transition-all h-12 font-medium"
                        >
                          <Package className="w-5 h-5 mr-2" />
                          Entregar ao morador
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-6 mb-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Botão Anterior */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Números das páginas */}
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`h-10 min-w-[40px] ${
                          currentPage === page 
                            ? 'bg-[#3b5998] text-white hover:bg-[#2d4373]' 
                            : 'hover:bg-[#dfe3ee]'
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  ))}

                  {/* Botão Próximo */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-10 px-3"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Info adicional */}
                <div className="text-center mt-3 text-xs text-gray-500">
                  Página {currentPage} de {totalPages}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Imagem Ampliada */}
      {imageModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <img
            src={selectedImage}
            alt="Encomenda Ampliada"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Fechar imagem"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* Modal de Detalhes da Encomenda (now using the imported component) */}
      {detalhesModalOpen && selectedEncomenda && (
        <DetalhesEncomenda
          encomenda={selectedEncomenda}
          onClose={() => {
            setDetalhesModalOpen(false);
            setSelectedEncomenda(null);
          }}
        />
      )}

      <MoradorFooter />
    </div>
    </AuthGuard>
  );
}