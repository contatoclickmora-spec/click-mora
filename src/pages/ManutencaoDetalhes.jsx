import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MoradorHeader from '../components/shared/MoradorHeader';
import AuthGuard from '../components/utils/AuthGuard';
import { getUserRole } from "../components/utils/authUtils";
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Loader2, Image as ImageIcon, Camera, Trash2, Plus, X } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManutencaoDetalhes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [manutencao, setManutencao] = useState(null);
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [condominio, setCondominio] = useState(null);
  const [morador, setMorador] = useState(null);
  const [activeTab, setActiveTab] = useState('geral');
  
  // Estados para fotos
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Estados para comentários
  const [showComentarioModal, setShowComentarioModal] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [savingComentario, setSavingComentario] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Pegar ID da manutenção da URL
      const urlParams = new URLSearchParams(window.location.search);
      const manutencaoId = urlParams.get('id');
      
      if (!manutencaoId) {
        navigate(createPageUrl('Manutencoes'));
        return;
      }

      const role = await getUserRole();
      setUserType(role.userType);
      setCurrentUser(role.user);
      setMorador(role.morador);

      // Buscar a manutenção
      const todasManutencoes = await base44.entities.Manutencao.list();
      const manutencaoEncontrada = todasManutencoes.find(m => m.id === manutencaoId);

      if (!manutencaoEncontrada) {
        navigate(createPageUrl('Manutencoes'));
        return;
      }

      setManutencao(manutencaoEncontrada);

      // Buscar condomínio se necessário
      if (manutencaoEncontrada.condominio_id) {
        const todosCondominios = await base44.entities.Condominio.list();
        const cond = todosCondominios.find(c => c.id === manutencaoEncontrada.condominio_id);
        setCondominio(cond);
      }

      setLoading(false);
    } catch (error) {
      console.error('[MANUTENCAO DETALHES] Erro ao carregar:', error);
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    navigate(createPageUrl('Manutencoes'));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getTipoLabel = (tipo) => {
    return tipo === 'preventiva' ? 'Preventiva' : 'Eventual';
  };

  const getStatusBadge = (status) => {
    if (status === 'pendente') {
      return <Badge className="bg-orange-500 text-white">Pendente</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Em andamento</Badge>;
  };

  const getRecorrenciaLabel = (recorrencia) => {
    const labels = {
      nenhuma: 'Nenhuma',
      semanal: 'Semanal',
      mensal: 'Mensal',
      anual: 'Anual'
    };
    return labels[recorrencia] || 'Nenhuma';
  };

  const handleUploadFoto = async (file) => {
    try {
      setUploadingPhoto(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const fotosAtuais = manutencao.fotos || [];
      const novaFoto = {
        url: file_url,
        autor_nome: currentUser?.full_name || currentUser?.email,
        autor_tipo: userType === 'administrador' ? 'Síndico' : 'Porteiro',
        autor_foto: morador?.foto_url || '',
        data: new Date().toISOString()
      };
      
      await base44.entities.Manutencao.update(manutencao.id, {
        fotos: [...fotosAtuais, novaFoto]
      });
      
      setManutencao({
        ...manutencao,
        fotos: [...fotosAtuais, novaFoto]
      });
      
      setShowUploadModal(false);
      setUploadingPhoto(false);
    } catch (error) {
      console.error('[FOTO] Erro ao fazer upload:', error);
      alert('Erro ao enviar foto');
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUploadFoto(file);
    }
  };

  const handleDeleteFoto = async (fotoIndex) => {
    if (!confirm('Deseja remover esta foto?')) return;
    
    try {
      const fotosAtualizadas = (manutencao.fotos || []).filter((_, idx) => idx !== fotoIndex);
      await base44.entities.Manutencao.update(manutencao.id, {
        fotos: fotosAtualizadas
      });
      
      setManutencao({
        ...manutencao,
        fotos: fotosAtualizadas
      });
    } catch (error) {
      console.error('[FOTO] Erro ao deletar:', error);
      alert('Erro ao remover foto');
    }
  };

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim()) return;
    
    try {
      setSavingComentario(true);
      
      const comentariosAtuais = manutencao.comentarios || [];
      const novoComentarioObj = {
        id: Date.now().toString(),
        autor_nome: currentUser?.full_name || currentUser?.email,
        autor_tipo: userType === 'administrador' ? 'Síndico' : 'Porteiro',
        autor_foto: morador?.foto_url || '',
        texto: novoComentario.trim(),
        data: new Date().toISOString()
      };
      
      await base44.entities.Manutencao.update(manutencao.id, {
        comentarios: [...comentariosAtuais, novoComentarioObj]
      });
      
      setManutencao({
        ...manutencao,
        comentarios: [...comentariosAtuais, novoComentarioObj]
      });
      
      setNovoComentario('');
      setShowComentarioModal(false);
      setSavingComentario(false);
    } catch (error) {
      console.error('[COMENTARIO] Erro ao adicionar:', error);
      alert('Erro ao adicionar comentário');
      setSavingComentario(false);
    }
  };

  const handleDeleteComentario = async (comentarioId) => {
    if (!confirm('Deseja remover este comentário?')) return;
    
    try {
      const comentariosAtualizados = (manutencao.comentarios || []).filter(c => c.id !== comentarioId);
      await base44.entities.Manutencao.update(manutencao.id, {
        comentarios: comentariosAtualizados
      });
      
      setManutencao({
        ...manutencao,
        comentarios: comentariosAtualizados
      });
    } catch (error) {
      console.error('[COMENTARIO] Erro ao deletar:', error);
      alert('Erro ao remover comentário');
    }
  };

  const formatDataComentario = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCargoLabel = (tipo) => {
    if (tipo === 'administrador' || tipo === 'Síndico') return 'Síndico';
    if (tipo === 'porteiro' || tipo === 'Porteiro') return 'Porteiro';
    return tipo || 'Administração';
  };

  const formatAutorFoto = (foto) => {
    const nome = typeof foto === 'object' ? (foto.autor_nome || currentUser?.full_name || 'Usuário') : currentUser?.full_name || 'Usuário';
    const cargo = typeof foto === 'object' ? getCargoLabel(foto.autor_tipo) : getCargoLabel(userType);
    const tituloManutencao = manutencao?.titulo || 'Manutenção';
    
    return `${nome} - ${cargo} - ${tituloManutencao}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3b5998]" />
      </div>
    );
  }

  if (!manutencao) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p>Manutenção não encontrada</p>
      </div>
    );
  }

  const showVisivelMoradores = userType === 'administrador';

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f7]">
        {userType === 'morador' ? (
          <MoradorHeader title={manutencao.titulo} onBack={handleVoltar} />
        ) : (
          <div 
            className="fixed top-0 left-0 right-0 z-40 shadow-md"
            style={{ backgroundColor: '#3b5998' }}
          >
            <div className="flex items-center h-16 px-4">
              <button
                onClick={handleVoltar}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="flex-1 text-xl font-semibold text-center text-white pr-10">
                {manutencao.titulo}
              </h1>
            </div>
          </div>
        )}

        <div className="pt-16">
          {/* Abas */}
          <div className="bg-white border-b sticky top-16 z-30">
            <div className="flex">
              <button
                onClick={() => setActiveTab('geral')}
                className={`flex-1 py-4 text-sm font-semibold uppercase transition-colors ${
                  activeTab === 'geral'
                    ? 'text-[#3b5998] border-b-2 border-[#3b5998]'
                    : 'text-gray-500'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveTab('fotos')}
                className={`flex-1 py-4 text-sm font-semibold uppercase transition-colors ${
                  activeTab === 'fotos'
                    ? 'text-[#3b5998] border-b-2 border-[#3b5998]'
                    : 'text-gray-500'
                }`}
              >
                Fotos
              </button>
              <button
                onClick={() => setActiveTab('comentarios')}
                className={`flex-1 py-4 text-sm font-semibold uppercase transition-colors ${
                  activeTab === 'comentarios'
                    ? 'text-[#3b5998] border-b-2 border-[#3b5998]'
                    : 'text-gray-500'
                }`}
              >
                Comentários
              </button>
            </div>
          </div>

          {/* Conteúdo das abas */}
          <div className="px-4 py-4 pb-24">
            {activeTab === 'geral' && (
              <div className="space-y-4">
                {/* Card Principal */}
                <Card className="bg-white">
                  <CardContent className="p-6 space-y-6">
                    {/* Título */}
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Título</p>
                      <p className="text-base text-gray-900">{manutencao.titulo}</p>
                    </div>

                    {/* Descrição */}
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Descrição</p>
                      <p className="text-base text-gray-900">{manutencao.descricao || 'Não tem descrição'}</p>
                    </div>

                    {/* Tipo e Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Tipo</p>
                        <p className="text-base text-gray-900">{getTipoLabel(manutencao.tipo)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                        {getStatusBadge(manutencao.status)}
                      </div>
                    </div>

                    {/* Início e Fim */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Início</p>
                        <p className="text-base text-gray-900">{formatDate(manutencao.data_inicio)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Fim</p>
                        <p className="text-base text-gray-900">{formatDate(manutencao.data_fim)}</p>
                      </div>
                    </div>

                    {/* Valor */}
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Valor</p>
                      <p className="text-base text-gray-900">{formatCurrency(manutencao.valor)}</p>
                    </div>

                    {/* Visível aos moradores - apenas se for síndico */}
                    {showVisivelMoradores && (
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          manutencao.visivel_moradores ? 'bg-[#3b5998] border-[#3b5998]' : 'border-gray-300'
                        }`}>
                          {manutencao.visivel_moradores && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <p className="text-base text-gray-900">Visível aos moradores</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Card Recorrência */}
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Recorrência</p>
                    <p className="text-base text-gray-900">{getRecorrenciaLabel(manutencao.recorrencia)}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'fotos' && (
              <div className="space-y-4 pb-20">
                {(!manutencao.fotos || manutencao.fotos.length === 0) ? (
                  <Card className="bg-white">
                    <CardContent className="p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">Nenhuma foto adicionada</p>
                    </CardContent>
                  </Card>
                ) : (
                  manutencao.fotos.map((foto, idx) => {
                    // Suporte a formato antigo (string) e novo (objeto)
                    const fotoUrl = typeof foto === 'string' ? foto : foto.url;
                    const autorFoto = typeof foto === 'object' ? foto.autor_foto : morador?.foto_url || '';
                    const data = typeof foto === 'object' ? foto.data : new Date().toISOString();
                    const nomeCompleto = formatAutorFoto(foto);

                    return (
                      <Card key={idx} className="bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="w-12 h-12">
                              {autorFoto ? (
                                <AvatarImage src={autorFoto} />
                              ) : (
                                <AvatarFallback className="bg-[#3b5998] text-white">
                                  {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {nomeCompleto}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDataComentario(data)}
                                  </p>
                                </div>
                                {userType === 'administrador' && (
                                  <button
                                    onClick={() => handleDeleteFoto(idx)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <img
                            src={fotoUrl}
                            alt="Foto da manutenção"
                            className="w-full rounded-lg cursor-pointer"
                            onClick={() => setSelectedImage(fotoUrl)}
                          />
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {userType === 'administrador' && (
                  <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-40">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Foto
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comentarios' && (
              <div className="space-y-4 pb-20">
                {(!manutencao.comentarios || manutencao.comentarios.length === 0) ? (
                  <Card className="bg-white">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-600">Nenhum comentário</p>
                    </CardContent>
                  </Card>
                ) : (
                  manutencao.comentarios.map((comentario) => (
                    <Card key={comentario.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12">
                            {comentario.autor_foto ? (
                              <AvatarImage src={comentario.autor_foto} />
                            ) : (
                              <AvatarFallback className="bg-[#3b5998] text-white">
                                {comentario.autor_nome?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {comentario.autor_nome} - {comentario.autor_tipo}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDataComentario(comentario.data)}
                                </p>
                              </div>
                              {userType === 'administrador' && (
                                <button
                                  onClick={() => handleDeleteComentario(comentario.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-700 mt-2">{comentario.texto}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {userType === 'administrador' && (
                  <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-40">
                    <button
                      onClick={() => setShowComentarioModal(true)}
                      className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Comentário
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Upload Foto */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#3b5998] text-2xl">Imagem</DialogTitle>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogHeader>
            <div className="space-y-2">
              <label className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 border-b cursor-pointer">
                <ImageIcon className="w-6 h-6 text-[#3b5998]" />
                <span className="text-lg">Selecionar da galeria</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
              
              <label className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer">
                <Camera className="w-6 h-6 text-[#3b5998]" />
                <span className="text-lg">Tirar foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            {uploadingPhoto && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#3b5998] mx-auto" />
                <p className="text-sm text-gray-600 mt-2">Enviando foto...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Visualizar Foto */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-2xl p-0">
            <img
              src={selectedImage}
              alt="Foto"
              className="w-full h-auto"
            />
          </DialogContent>
        </Dialog>

        {/* Modal Novo Comentário */}
        <Dialog open={showComentarioModal} onOpenChange={setShowComentarioModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#3b5998] text-2xl">Novo comentário</DialogTitle>
                <button
                  onClick={() => setShowComentarioModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Comentário"
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                className="min-h-[150px] bg-gray-100 border-0 resize-none"
              />
              <button
                onClick={handleAdicionarComentario}
                disabled={savingComentario || !novoComentario.trim()}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-full disabled:opacity-50"
              >
                {savingComentario ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}