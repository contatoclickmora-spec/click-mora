import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2 } from "lucide-react";
import { getCondominioContext } from "../components/utils/condominioContext";
import MoradorHeader from "../components/shared/MoradorHeader";
import AuthGuard from "../components/utils/AuthGuard";
import { createPageUrl } from "@/utils";

export default function NovoDocumento() {
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [documentoId, setDocumentoId] = useState(null);
  
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
    const loadDocumento = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        
        if (id) {
          setIsEditing(true);
          setDocumentoId(id);
          
          const doc = await base44.entities.Documento.filter({ id })[0];
          if (doc) {
            setArquivo({
              url: doc.url_arquivo,
              nome: doc.nome_arquivo,
              tipo: doc.tipo_arquivo,
              tamanho: doc.tamanho_bytes
            });
            setArquivoPreview({
              nome: doc.nome_arquivo,
              url: doc.url_arquivo
            });
            setCategoria(doc.categoria);
            setDescricao(doc.descricao || '');
            setLocal(doc.local);
            setCompartilharCom(doc.compartilhar_com);
            setQuemPodeVer(doc.quem_pode_ver || ['Proprietário', 'Inquilino', 'Morador']);
            setNotificarMoradores(doc.notificar_moradores || false);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar documento:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDocumento();
  }, []);

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
    if (!arquivo) {
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

      const documentoData = {
        nome_arquivo: arquivo.nome,
        url_arquivo: arquivo.url,
        tipo_arquivo: getTipoArquivo(arquivo.tipo),
        tamanho_bytes: arquivo.tamanho,
        categoria,
        descricao: descricao.trim(),
        local,
        compartilhar_com: compartilharCom,
        quem_pode_ver: quemPodeVer,
        condominio_id: context.condominioId,
        notificar_moradores: notificarMoradores,
        data_modificacao: agora
      };

      if (isEditing && documentoId) {
        await base44.entities.Documento.update(documentoId, documentoData);
      } else {
        await base44.entities.Documento.create({
          ...documentoData,
          publicado_por_id: context.userId,
          publicado_por_nome: context.userName,
          publicado_por_cargo: context.userType === 'administrador' ? 'Síndico' : 'Administrador',
          data_publicacao: agora,
          total_downloads: 0,
          historico_edicoes: [{
            data: agora,
            acao: 'Criou o documento',
            usuario_nome: context.userName,
            usuario_cargo: context.userType === 'administrador' ? 'Síndico' : 'Administrador'
          }]
        });
      }

      window.location.href = createPageUrl('Documentos');
    } catch (err) {
      console.error("Erro ao salvar documento:", err);
      setError("Erro ao salvar documento. Tente novamente.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title={isEditing ? "Editar documento" : "Adicionar documentos"} />
          <div className="flex items-center justify-center pt-24">
            <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title={isEditing ? "Editar documento" : "Adicionar documentos"} />

        <div className="pt-20 pb-28 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Upload de arquivo */}
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

            {/* Categoria */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-12 px-3 bg-white border border-gray-300 rounded-md text-gray-900"
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
                className="min-h-24 bg-white border-gray-300 resize-none"
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
                className="w-full h-12 px-3 bg-white border border-gray-300 rounded-md text-gray-900"
              >
                <option value="Todos os documentos">Todos os documentos</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Assembleia">Assembleia</option>
                <option value="Jurídico">Jurídico</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>

            {/* Permissão */}
            <div className="border border-gray-300 rounded-lg p-4 space-y-3 bg-white">
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
        </div>

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            onClick={handleSalvar}
            disabled={uploadingFile || !arquivo}
            className="w-full h-12 text-white rounded-full"
            style={{ backgroundColor: '#2c2c2c' }}
          >
            {uploadingFile ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isEditing ? 'Salvar alterações' : 'Concluir'
            )}
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}