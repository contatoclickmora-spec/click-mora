import React from 'react';
import { X, Download, FileText, Calendar, User, HardDrive, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VisualizarDocumentoModal({ documento, onClose, onBaixar, isSindico }) {
  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPDF = documento.tipo_arquivo === 'pdf';
  const isImagem = ['png', 'jpg', 'jpeg'].includes(documento.tipo_arquivo);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white w-full h-full">
        {/* Header */}
        <div className="sticky top-0 bg-[#3b5998] px-4 py-4 flex items-center justify-between z-10">
          <button onClick={onClose} className="p-2 -ml-2">
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-lg font-semibold text-white flex-1 text-center truncate px-4">
            {documento.nome_arquivo}
          </h2>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-24">
          {/* Preview */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {isPDF && (
              <iframe
                src={documento.url_arquivo}
                className="w-full h-96"
                title="Preview PDF"
              />
            )}
            {isImagem && (
              <img
                src={documento.url_arquivo}
                alt={documento.nome_arquivo}
                className="w-full h-auto"
              />
            )}
            {!isPDF && !isImagem && (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Preview não disponível para este tipo de arquivo</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informações</h3>
            
            <div className="space-y-3">
              {/* Publicado por */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Publicado por</p>
                  <p className="text-sm text-gray-900">
                    {documento.publicado_por_nome} ({documento.publicado_por_cargo})
                  </p>
                </div>
              </div>

              {/* Data de publicação */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Data de publicação</p>
                  <p className="text-sm text-gray-900">
                    {formatarData(documento.data_publicacao)}
                  </p>
                </div>
              </div>

              {/* Última modificação */}
              {documento.data_modificacao && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Última modificação</p>
                    <p className="text-sm text-gray-900">
                      {formatarData(documento.data_modificacao)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tamanho */}
              <div className="flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Tamanho</p>
                  <p className="text-sm text-gray-900">
                    {formatarTamanho(documento.tamanho_bytes)}
                  </p>
                </div>
              </div>

              {/* Categoria */}
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Categoria</p>
                  <p className="text-sm text-gray-900">{documento.categoria}</p>
                </div>
              </div>

              {/* Downloads */}
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Total de downloads</p>
                  <p className="text-sm text-gray-900">
                    {documento.total_downloads || 0} download{(documento.total_downloads || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              {documento.descricao && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-900">{documento.descricao}</p>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de edições (só para síndico) */}
          {isSindico && documento.historico_edicoes && documento.historico_edicoes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Edições</h3>
              <div className="space-y-2">
                {documento.historico_edicoes.map((edicao, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium">{edicao.acao}</p>
                    <p className="text-xs text-gray-600">
                      {edicao.usuario_nome} ({edicao.usuario_cargo})
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatarData(edicao.data)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            onClick={() => onBaixar(documento)}
            className="w-full h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-full"
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar
          </Button>
        </div>
      </div>
    </div>
  );
}