import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  FileImage,
  File,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import AuthGuard from "../components/utils/AuthGuard";
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import { getCondominioContext } from "../components/utils/condominioContext";
import VisualizarDocumentoModal from "../components/documentos/VisualizarDocumentoModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";

export default function Documentos() {
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);
  
  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [localFiltro, setLocalFiltro] = useState('Todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Modais
  const [showVisualizarDocumento, setShowVisualizarDocumento] = useState(false);
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [documentos, busca, categoriaFiltro, localFiltro]);

  const loadData = async () => {
    try {
      setLoading(true);
      const context = await getCondominioContext();
      setUserContext(context);

      const todosDocumentos = await base44.entities.Documento.list();
      const documentosDoCondominio = todosDocumentos.filter(
        d => d.condominio_id === context.condominioId
      );

      // Filtrar por permissões do usuário
      const documentosVisiveis = documentosDoCondominio.filter(doc => {
        // Síndico vê tudo
        if (context.userType === 'administrador') return true;
        
        // Validar compartilhamento
        if (doc.compartilhar_com === 'Condomínio') return true;
        if (doc.compartilhar_com === 'Bloco' && doc.filtro_bloco) {
          // TODO: validar bloco do usuário
          return true;
        }
        if (doc.compartilhar_com === 'Unidade' && doc.filtro_unidade) {
          // TODO: validar unidade do usuário
          return true;
        }
        return true;
      });

      // Ordenar por data de modificação (mais recente primeiro)
      documentosVisiveis.sort((a, b) => 
        new Date(b.data_modificacao || b.data_publicacao) - new Date(a.data_modificacao || a.data_publicacao)
      );

      setDocumentos(documentosVisiveis);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
      setError("Erro ao carregar documentos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...documentos];

    // Busca por nome
    if (busca.trim()) {
      filtrados = filtrados.filter(doc =>
        doc.nome_arquivo.toLowerCase().includes(busca.toLowerCase()) ||
        (doc.descricao && doc.descricao.toLowerCase().includes(busca.toLowerCase()))
      );
    }

    // Filtro por categoria
    if (categoriaFiltro !== 'Todos') {
      filtrados = filtrados.filter(doc => doc.categoria === categoriaFiltro);
    }

    // Filtro por local
    if (localFiltro !== 'Todos') {
      filtrados = filtrados.filter(doc => doc.local === localFiltro);
    }

    setDocumentosFiltrados(filtrados);
    setPaginaAtual(1);
  };

  const getIconeArquivo = (tipo) => {
    if (tipo === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (['png', 'jpg', 'jpeg'].includes(tipo)) return <FileImage className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleBaixar = async (doc) => {
    try {
      // Incrementar contador de downloads
      await base44.entities.Documento.update(doc.id, {
        total_downloads: (doc.total_downloads || 0) + 1
      });

      // Abrir em nova aba para download
      window.open(doc.url_arquivo, '_blank');
      
      setSuccess('Download iniciado!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recarregar dados
      loadData();
    } catch (err) {
      console.error("Erro ao baixar:", err);
      setError("Erro ao baixar documento.");
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleVisualizar = (doc) => {
    window.location.href = `/DocumentoDetalhes?id=${doc.id}`;
  };

  const handleEditar = (doc) => {
    window.location.href = `${createPageUrl('NovoDocumento')}?id=${doc.id}`;
  };

  const handleExcluir = async (doc) => {
    if (!confirm(`Deseja realmente excluir "${doc.nome_arquivo}"?`)) return;

    try {
      await base44.entities.Documento.delete(doc.id);
      setSuccess('Documento excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      setError("Erro ao excluir documento.");
      setTimeout(() => setError(''), 3000);
    }
  };

  // Paginação
  const totalPaginas = Math.ceil(documentosFiltrados.length / itensPorPagina);
  const documentosPaginados = documentosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const isSindico = userContext?.userType === 'administrador';

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="Documentos" />
          <div className="flex items-center justify-center pt-24 pb-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          </div>
          <MoradorFooter />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Documentos" />

        <div className="pt-28 pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Busca e filtros */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Encontrar"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10 h-12 bg-white border-gray-300"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="h-12 w-12"
                >
                  <Filter className="w-5 h-5 text-gray-600" />
                </Button>
              </div>

              {mostrarFiltros && (
                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Categoria</label>
                      <select
                        value={categoriaFiltro}
                        onChange={(e) => setCategoriaFiltro(e.target.value)}
                        className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-300 rounded-md"
                      >
                        <option value="Todos">Todos</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Regimento">Regimento</option>
                        <option value="Assembleia">Assembleia</option>
                        <option value="Obras">Obras</option>
                        <option value="Jurídico">Jurídico</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Local</label>
                      <select
                        value={localFiltro}
                        onChange={(e) => setLocalFiltro(e.target.value)}
                        className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-300 rounded-md"
                      >
                        <option value="Todos">Todos</option>
                        <option value="Todos os documentos">Todos os documentos</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Assembleia">Assembleia</option>
                        <option value="Jurídico">Jurídico</option>
                        <option value="Administrativo">Administrativo</option>
                      </select>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setCategoriaFiltro('Todos');
                        setLocalFiltro('Todos');
                        setBusca('');
                      }}
                      className="w-full"
                    >
                      Limpar filtros
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Mensagens */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Lista de documentos */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Arquivos</h3>
              
              {documentosPaginados.length === 0 ? (
                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum documento encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {documentosPaginados.map((doc) => (
                    <Card key={doc.id} className="bg-white shadow-sm border-0">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getIconeArquivo(doc.tipo_arquivo)}
                          </div>

                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleVisualizar(doc)}
                          >
                            <h4 className="font-medium text-gray-900 truncate mb-1">
                              {doc.nome_arquivo}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Modificado em {formatarData(doc.data_modificacao || doc.data_publicacao)}
                            </p>
                            {doc.descricao && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                {doc.descricao}
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleVisualizar(doc)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBaixar(doc)}>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar
                              </DropdownMenuItem>
                              {isSindico && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditar(doc)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleExcluir(doc)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Botão flutuante (só para síndico) */}
        {isSindico && (
          <button
            onClick={() => window.location.href = createPageUrl('NovoDocumento')}
            className="fixed bottom-28 right-6 w-14 h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        <MoradorFooter />

        {/* Modais */}
        {showVisualizarDocumento && documentoSelecionado && (
          <VisualizarDocumentoModal
            documento={documentoSelecionado}
            onClose={() => {
              setShowVisualizarDocumento(false);
              setDocumentoSelecionado(null);
            }}
            onBaixar={handleBaixar}
            isSindico={isSindico}
          />
        )}
      </div>
    </AuthGuard>
  );
}