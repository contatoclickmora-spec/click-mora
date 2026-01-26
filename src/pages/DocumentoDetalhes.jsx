import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Edit } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";
import NovoDocumentoModal from "../components/documentos/NovoDocumentoModal";
import AuthGuard from "../components/utils/AuthGuard";
import { getUserRole } from "../components/utils/authUtils";

export default function DocumentoDetalhes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obter userType
      const role = await getUserRole();
      setUserType(role.userType);

      // Obter documento do state ou da URL
      const documentoId = location.state?.documentoId || new URLSearchParams(location.search).get('id');
      
      if (!documentoId) {
        navigate(-1);
        return;
      }

      // Buscar documento
      const documentos = await base44.entities.Documento.list();
      const doc = documentos.find(d => d.id === documentoId);

      if (!doc) {
        navigate(-1);
        return;
      }

      setDocumento(doc);
    } catch (error) {
      console.error("Erro ao carregar documento:", error);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getFileIcon = (tipo) => {
    const icons = {
      pdf: '📄',
      docx: '📝',
      xlsx: '📊',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️'
    };
    return icons[tipo?.toLowerCase()] || '📄';
  };

  const handleDownload = async () => {
    if (!documento?.url_arquivo) return;

    try {
      // Incrementar contador de downloads
      await base44.entities.Documento.update(documento.id, {
        total_downloads: (documento.total_downloads || 0) + 1
      });

      // Fazer download compatível com mobile
      const url = documento.url_arquivo;
      const filename = documento.nome_arquivo;

      // Fetch do arquivo como blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Criar URL do blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Criar link temporário
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      // Atualizar estado local
      setDocumento({
        ...documento,
        total_downloads: (documento.total_downloads || 0) + 1
      });
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      // Fallback: abrir em nova aba
      window.open(documento.url_arquivo, '_blank');
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    loadData(); // Recarregar dados após edição
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="Detalhes do documento" />
          <div className="flex items-center justify-center pt-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b5998]"></div>
          </div>
          <MoradorFooter />
        </div>
      </AuthGuard>
    );
  }

  if (!documento) {
    return null;
  }

  const isSindico = userType === 'administrador';

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Detalhes do documento" onBack={() => navigate(-1)} />

        <div className="pt-20 pb-32 px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            
            {/* Card do Arquivo */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">{getFileIcon(documento.tipo_arquivo)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {documento.nome_arquivo}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {documento.categoria}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(documento.tamanho_bytes)} • {documento.tipo_arquivo?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            {documento.descricao && (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Descrição</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {documento.descricao}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Informações adicionais */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 space-y-4">
                
                {/* Adicionado por */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Adicionado por</h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#3b5998] text-white">
                        {documento.publicado_por_nome?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {documento.publicado_por_nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {documento.publicado_por_cargo || 'Síndico'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Adicionado em</h4>
                    <p className="text-sm text-gray-700">
                      {documento.data_publicacao 
                        ? format(new Date(documento.data_publicacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Última atualização</h4>
                    <p className="text-sm text-gray-700">
                      {documento.data_modificacao 
                        ? format(new Date(documento.data_modificacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : documento.data_publicacao
                        ? format(new Date(documento.data_publicacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Downloads */}
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Total de downloads</h4>
                  <p className="text-sm text-gray-700">
                    {documento.total_downloads || 0} download{documento.total_downloads !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Permissões */}
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Quem pode ver</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {documento.quem_pode_ver?.map((perfil, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {perfil}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões fixos no rodapé */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <div className="max-w-2xl mx-auto flex gap-3">
            {isSindico && (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50"
              >
                <Edit className="w-5 h-5 mr-2" />
                Editar
              </Button>
            )}
            <Button
              onClick={handleDownload}
              className="flex-1 h-12 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white"
            >
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Modal de Edição */}
        {showEditModal && (
          <NovoDocumentoModal
            onClose={handleModalClose}
            documentoParaEditar={documento}
          />
        )}
      </div>
    </AuthGuard>
  );
}