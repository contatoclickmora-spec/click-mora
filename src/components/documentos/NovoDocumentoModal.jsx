import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Upload, Loader2, ArrowLeft } from "lucide-react";
import { getCondominioContext } from "../utils/condominioContext";

export default function NovoDocumentoModal({ onClose, onSuccess, documento }) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');
  
  const [arquivo, setArquivo] = useState(null);
  const [arquivoPreview, setArquivoPreview] = useState(null);
  const [categoria, setCategoria] = useState('Financeiro');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('Todos os documentos');
  const [compartilharCom, setCompartilharCom] = useState('Condomínio');
  const [quemPodeVer, setQuemPodeVer] = useState(['Proprietário', 'Inquilino', 'Morador']);
  const [notificarMoradores, setNotificarMoradores] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (documento) {
      // Preencher campos para edição
      setCategoria(documento.categoria || 'Financeiro');
      setDescricao(documento.descricao || '');
      setLocal(documento.local || 'Todos os documentos');
      setCompartilharCom(documento.compartilhar_com || 'Condomínio');
      setQuemPodeVer(documento.quem_pode_ver || ['Proprietário', 'Inquilino', 'Morador']);
      setArquivoPreview({ nome: documento.nome_arquivo, url: documento.url_arquivo });
    }
  }, [documento]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    const tiposPermitidos = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'image/jpg'];
    
    if (!tiposPermitidos.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use PDF, DOCX, XLSX, PNG ou JPG.');
      return;
    }

    // Validar tamanho (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 50MB');
      return;
    }

    try {
      setUploadingFile(true);
      setError('');
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setArquivo({
        url: file_url,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size
      });
      
      setArquivoPreview({
        nome: file.name,
        url: file_url
      });
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploadingFile(false);
    }
  };

  const getTipoArquivo = (tipo) => {
    if (tipo === 'application/pdf') return 'pdf';
    if (tipo === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (tipo === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
    if (tipo === 'image/png') return 'png';
    if (tipo === 'image/jpeg' || tipo === 'image/jpg') return 'jpg';
    return 'outro';
  };

  const toggleQuemPodeVer = (opcao) => {
    setQuemPodeVer(prev => 
      prev.includes(opcao) ? prev.filter(o => o !== opcao) : [...prev, opcao]
    );
  };

  const handleSalvar = async () => {
    // Validações
    if (!documento && !arquivo) {
      setError('Selecione um arquivo');
      return;
    }
    
    if (!categoria) {
      setError('Selecione uma categoria');
      return;
    }

    if (descricao.length > 200) {
      setError('Descrição deve ter no máximo 200 caracteres');
      return;
    }

    if (quemPodeVer.length === 0) {
      setError('Selecione ao menos uma opção em "Quem pode ver"');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const context = await getCondominioContext();
      const agora = new Date().toISOString();

      const dadosDocumento = {
        categoria,
        descricao: descricao.trim(),
        local,
        compartilhar_com: compartilharCom,
        quem_pode_ver: quemPodeVer,
        data_modificacao: agora,
        modificado_por_id: context.userId,
        modificado_por_nome: context.userName,
        notificar_moradores: notificarMoradores
      };

      if (documento) {
        // Editar documento existente
        const historicoEdicao = {
          data: agora,
          acao: 'Editou o documento',
          usuario_nome: context.userName,
          usuario_cargo: context.userType === 'administrador' ? 'Síndico' : 'Administrador'
        };

        await base44.entities.Documento.update(documento.id, {
          ...dadosDocumento,
          historico_edicoes: [...(documento.historico_edicoes || []), historicoEdicao]
        });
      } else {
        // Criar novo documento
        await base44.entities.Documento.create({
          ...dadosDocumento,
          nome_arquivo: arquivo.nome,
          url_arquivo: arquivo.url,
          tipo_arquivo: getTipoArquivo(arquivo.tipo),
          tamanho_bytes: arquivo.tamanho,
          condominio_id: context.condominioId,
          publicado_por_id: context.userId,
          publicado_por_nome: context.userName,
          publicado_por_cargo: context.userType === 'administrador' ? 'Síndico' : 'Administrador',
          data_publicacao: agora,
          data_modificacao: agora,
          total_downloads: 0,
          historico_edicoes: [{
            data: agora,
            acao: 'Criou o documento',
            usuario_nome: context.userName,
            usuario_cargo: context.userType === 'administrador' ? 'Síndico' : 'Administrador'
          }]
        });
      }

      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar documento:", err);
      setError("Erro ao salvar documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white w-full h-full">
        {/* Header */}
        <div className="bg-[#3b5998] px-4 h-16 flex items-center justify-between">
          <button onClick={onClose} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-lg font-semibold text-white flex-1 text-center">
            {documento ? 'Editar documento' : 'Adicionar documentos'}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-28">
          {/* Upload de arquivo */}
          {!documento && (
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    <span className="text-gray-600">Enviando arquivo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-600 font-medium">Carregar arquivo</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {arquivoPreview && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Arquivo selecionado:</p>
                  <p className="text-sm font-medium text-gray-900">{arquivoPreview.nome}</p>
                </div>
              )}
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full h-12 px-3 bg-[#f7f7f7] border border-gray-300 rounded-md text-gray-900"
            >
              <option value="Financeiro">Financeiro</option>
              <option value="Regimento">Regimento</option>
              <option value="Assembleia">Assembleia</option>
              <option value="Obras">Obras</option>
              <option value="Jurídico">Jurídico</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Descrição</label>
            <Textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={200}
              className="min-h-24 bg-[#f7f7f7] border-gray-300 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {descricao.length}/200
            </p>
          </div>

          {/* Local */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Local</label>
            <select
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full h-12 px-3 bg-[#f7f7f7] border border-gray-300 rounded-md text-gray-900"
            >
              <option value="Todos os documentos">Todos os documentos</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Assembleia">Assembleia</option>
              <option value="Jurídico">Jurídico</option>
              <option value="Administrativo">Administrativo</option>
            </select>
          </div>

          {/* Permissão */}
          <div className="border border-gray-300 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Permissão</h3>
            
            {/* Compartilhar com */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Compartilhar com</label>
              <select
                value={compartilharCom}
                onChange={(e) => setCompartilharCom(e.target.value)}
                className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-300 rounded-md text-sm"
              >
                <option value="Condomínio">Condomínio</option>
                <option value="Bloco">Bloco</option>
                <option value="Unidade">Unidade</option>
              </select>
            </div>

            {/* Quem pode ver */}
            <div>
              <label className="text-xs text-gray-600 mb-2 block">Quem pode ver</label>
              <div className="space-y-2">
                {['Proprietário', 'Inquilino', 'Morador'].map(opcao => (
                  <div key={opcao} className="flex items-center gap-2">
                    <Checkbox
                      checked={quemPodeVer.includes(opcao)}
                      onCheckedChange={() => toggleQuemPodeVer(opcao)}
                    />
                    <label className="text-sm text-gray-900">{opcao}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notificar moradores */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Checkbox
              checked={notificarMoradores}
              onCheckedChange={setNotificarMoradores}
            />
            <label className="text-sm text-gray-900">Notificar moradores</label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Aviso de armazenamento */}
          <div className="pt-2">
            <p className="text-xs text-red-600">
              Atenção: Este documento será exibido apenas para consulta. Ele não é armazenado de forma permanente e poderá ser removido futuramente.
            </p>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            onClick={handleSalvar}
            disabled={loading || uploadingFile || (!documento && !arquivo)}
            className="w-full h-12 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Concluir'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}