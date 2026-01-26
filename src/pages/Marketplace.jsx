import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Loader2, 
  ShoppingBag,
  Filter,
  Home,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import FixedFooter from "../components/shared/FixedFooter";
import MoradorHeader from "../components/shared/MoradorHeader";
import OperationalFooter from "../components/shared/OperationalFooter";
import AnuncioForm from "../components/marketplace/AnuncioForm";
import AnuncioDetalhes from "../components/marketplace/AnuncioDetalhes";
import { getUserRole } from "../components/utils/authUtils";
import { getCondominioContext } from "../components/utils/condominioContext";

export default function Marketplace() {
  const [anuncios, setAnuncios] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [anuncioSelecionado, setAnuncioSelecionado] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [userType, setUserType] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showCategoriaFilter, setShowCategoriaFilter] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const role = await getUserRole();
      setUserType(role.userType);
      
      const context = await getCondominioContext();
      
      const user = await base44.auth.me();
      setCurrentUser(user);

      const todosMoradores = await base44.entities.Morador.list();
      setMoradores(todosMoradores);

      const moradorAtual = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );
      setMoradorLogado(moradorAtual);

      const todosAnuncios = await base44.entities.Anuncio.list('-created_date');
      const anunciosAtivos = todosAnuncios.filter(a => {
        const vendedor = todosMoradores.find(m => m.id === a.morador_id);
        return a.status === 'ativo' && 
               vendedor && 
               vendedor.condominio_id === context.condominioId;
      });
      
      setAnuncios(anunciosAtivos);
    } catch (err) {
      console.error("Erro ao carregar marketplace:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalhes = (anuncio) => {
    setAnuncioSelecionado(anuncio);
    setShowDetalhes(true);
  };

  const handleNovoAnuncio = () => {
    setShowForm(true);
  };

  const handleVoltarLista = () => {
    setShowForm(false);
    setShowDetalhes(false);
    setAnuncioSelecionado(null);
    loadData();
  };

  const categorias = [
    { value: "todos", label: "Todos" },
    { value: "moveis", label: "Móveis" },
    { value: "eletronicos", label: "Eletrônicos" },
    { value: "eletrodomesticos", label: "Eletrodomésticos" },
    { value: "decoracao", label: "Decoração" },
    { value: "livros", label: "Livros" },
    { value: "brinquedos", label: "Brinquedos" },
    { value: "roupas", label: "Roupas" },
    { value: "servicos", label: "Serviços" },
    { value: "vagas_garagem", label: "Vagas de Garagem" },
    { value: "outros", label: "Outros" }
  ];

  const anunciosFiltrados = anuncios.filter(anuncio => {
    const matchCategoria = selectedCategoria === "todos" || anuncio.categoria === selectedCategoria;
    const matchSearch = searchTerm === "" || 
      anuncio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anuncio.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategoria && matchSearch;
  });

  const formatPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const footerItems = [
    {
      icon: Home,
      label: 'Início',
      path: createPageUrl('DashboardMorador'),
      key: 'inicio'
    },
    {
      icon: ShoppingBag,
      label: 'Marketplace',
      path: createPageUrl('Marketplace'),
      key: 'marketplace'
    }
  ];

  if (showForm) {
    return (
      <AnuncioForm
        moradorLogado={moradorLogado}
        onVoltar={handleVoltarLista}
        onSuccess={handleVoltarLista}
      />
    );
  }

  if (showDetalhes && anuncioSelecionado) {
    return (
      <AnuncioDetalhes
        anuncio={anuncioSelecionado}
        moradores={moradores}
        onVoltar={handleVoltarLista}
        isSindico={userType === 'administrador'}
      />
    );
  }

  const isSindico = userType === 'administrador';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {isSindico && <MoradorHeader title="Marketplace" />}
      
      {/* Header */}
      <div className={`bg-white border-b border-gray-200 sticky ${isSindico ? 'top-16' : 'top-0'} z-40`}>
        <div className="px-4 pt-10 pb-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {!isSindico && <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>}
            {isSindico && <div className="flex-1" />}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search className="w-6 h-6 text-gray-900" />
              </button>
              <button
                onClick={() => setShowCategoriaFilter(!showCategoriaFilter)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Filter className="w-6 h-6 text-gray-900" />
              </button>
              <button
                onClick={handleNovoAnuncio}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-900" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-[#3b5998] text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Filtro de Categoria */}
      <AnimatePresence>
        {showCategoriaFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowCategoriaFilter(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filtrar por categoria</h2>
                <button
                  onClick={() => setShowCategoriaFilter(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {categorias.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategoria(cat.value);
                      setShowCategoriaFilter(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                      selectedCategoria === cat.value ? 'bg-[#3b5998] text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`px-2 pt-2 max-w-2xl mx-auto ${isSindico ? 'mt-16' : ''}`}>
        {anunciosFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-base mb-1">Nenhum anúncio encontrado</p>
            <p className="text-gray-400 text-xs">
              {searchTerm || selectedCategoria !== "todos" 
                ? "Tente ajustar os filtros" 
                : "Seja o primeiro a vender algo!"}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-1"
          >
            {anunciosFiltrados.map((anuncio) => (
              <motion.div
                key={anuncio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="cursor-pointer active:opacity-80 transition-opacity"
                onClick={() => handleVerDetalhes(anuncio)}
              >
                <div className="bg-white">
                  <div className="relative w-full" style={{ paddingBottom: '156%' }}>
                    <img
                      src={anuncio.imagens[0]}
                      alt={anuncio.titulo}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-base font-bold text-gray-900 mb-1">
                      {formatPreco(anuncio.valor)}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-snug">
                      {anuncio.titulo}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {isSindico ? <OperationalFooter /> : <FixedFooter items={footerItems} />}
    </div>
  );
}