import React, { useState, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Loader2,
  X,
  Search,
  Check
} from "lucide-react";

export default function NovoRegistroEntrega({ moradorLogado, entregadores, onVoltar, onSuccess }) {
  const [registro, setRegistro] = useState({
    nome: '',
    telefone: '',
    documento: '',
    empresa: '',
    quantidade_pacotes: '',
    fotos_pacotes: [],
    observacoes: '',
    salvar_entregador: false,
    entregador_id: null
  });
  
  const [searchEntregador, setSearchEntregador] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const cameraInputRef = useRef(null);

  const formatTelefone = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleTelefoneChange = (value) => {
    const formatted = formatTelefone(value);
    setRegistro(prev => ({ ...prev, telefone: formatted }));
  };

  const selecionarEntregador = (entregador) => {
    setRegistro(prev => ({
      ...prev,
      entregador_id: entregador.id,
      nome: entregador.nome || '',
      telefone: entregador.telefone || '',
      documento: entregador.documento || '',
      empresa: entregador.empresa || ''
    }));
    setSearchEntregador('');
  };

  const entregadoresFiltrados = entregadores.filter(e =>
    e.nome.toLowerCase().includes(searchEntregador.toLowerCase()) ||
    e.empresa?.toLowerCase().includes(searchEntregador.toLowerCase())
  );

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (registro.fotos_pacotes.length + files.length > 5) {
      setError('Máximo de 5 fotos por registro');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          setError('Formato inválido. Use: JPG, PNG ou WEBP');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setError('Imagem muito grande. Máximo 5MB');
          continue;
        }

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedFiles.push(file_url);
      }

      if (uploadedFiles.length > 0) {
        setRegistro(prev => ({
          ...prev,
          fotos_pacotes: [...prev.fotos_pacotes, ...uploadedFiles]
        }));
      }
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError('Erro ao enviar fotos');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const removeFoto = (index) => {
    setRegistro(prev => ({
      ...prev,
      fotos_pacotes: prev.fotos_pacotes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // Validações
    if (!registro.nome.trim()) {
      setError('Informe o nome do entregador');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!registro.telefone.trim()) {
      setError('Informe o telefone');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!registro.quantidade_pacotes || registro.quantidade_pacotes <= 0) {
      setError('Informe a quantidade de pacotes');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (registro.fotos_pacotes.length === 0) {
      setError('Adicione pelo menos uma foto dos pacotes');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');

      let entregadorId = registro.entregador_id;

      // Salvar entregador se marcado
      if (registro.salvar_entregador && !entregadorId) {
        const novoEntregador = await base44.entities.Entregador.create({
          nome: registro.nome.trim(),
          telefone: registro.telefone.trim(),
          documento: registro.documento.trim(),
          empresa: registro.empresa.trim(),
          condominio_id: moradorLogado.condominio_id
        });
        entregadorId = novoEntregador.id;
      }

      // Criar registro de entrega
      await base44.entities.RegistroEntrega.create({
        entregador_id: entregadorId,
        entregador_nome: registro.nome.trim(),
        entregador_telefone: registro.telefone.trim(),
        entregador_empresa: registro.empresa.trim(),
        quantidade_pacotes: Number(registro.quantidade_pacotes),
        fotos_pacotes: registro.fotos_pacotes,
        observacoes: registro.observacoes.trim(),
        porteiro_responsavel: moradorLogado.nome,
        porteiro_id: moradorLogado.id,
        data_registro: new Date().toISOString(),
        condominio_id: moradorLogado.condominio_id
      });

      if (onSuccess) onSuccess();
      if (onVoltar) onVoltar();

    } catch (err) {
      console.error("Erro ao salvar registro:", err);
      setError('Erro ao salvar registro. Tente novamente.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="p-4 max-w-2xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Buscar Entregador Existente */}
        <div className="mb-4">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar entregador cadastrado..."
              value={searchEntregador}
              onChange={(e) => setSearchEntregador(e.target.value)}
              className="pl-10 h-12 bg-[#dfe3ee] border-0 rounded-lg"
            />
          </div>

          {/* Lista de Entregadores Filtrados */}
          {searchEntregador && (
            <div className="border rounded-lg max-h-60 overflow-y-auto bg-white shadow-sm">
              {entregadoresFiltrados.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhum entregador encontrado
                </div>
              ) : (
                entregadoresFiltrados.map(entregador => (
                  <div 
                    key={entregador.id} 
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                    onClick={() => selecionarEntregador(entregador)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{entregador.nome}</p>
                      <p className="text-sm text-gray-500">{entregador.empresa || 'Sem empresa'}</p>
                    </div>
                    {registro.entregador_id === entregador.id && (
                      <Check className="w-5 h-5 text-[#3b5998]" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Formulário */}
        <div className="space-y-3">
          <Input
            placeholder="Nome"
            value={registro.nome}
            onChange={(e) => setRegistro(prev => ({ ...prev, nome: e.target.value }))}
            className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
          />

          <Input
            placeholder="Telefone"
            value={registro.telefone}
            onChange={(e) => handleTelefoneChange(e.target.value)}
            maxLength={15}
            className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
          />

          <Input
            placeholder="Documento (RG ou CPF)"
            value={registro.documento}
            onChange={(e) => setRegistro(prev => ({ ...prev, documento: e.target.value }))}
            className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
          />

          <Input
            placeholder="Empresa que trabalha"
            value={registro.empresa}
            onChange={(e) => setRegistro(prev => ({ ...prev, empresa: e.target.value }))}
            className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
          />

          <Input
            placeholder="Quantidade de pacotes"
            type="number"
            min="1"
            value={registro.quantidade_pacotes}
            onChange={(e) => setRegistro(prev => ({ ...prev, quantidade_pacotes: e.target.value }))}
            className="h-14 bg-[#dfe3ee] border-0 rounded-lg text-base px-4"
          />

          <Textarea
            placeholder="Observações"
            value={registro.observacoes}
            onChange={(e) => setRegistro(prev => ({ ...prev, observacoes: e.target.value }))}
            rows={4}
            className="bg-[#dfe3ee] border-0 rounded-lg text-base p-4 resize-none"
          />

          {/* Fotos Anexadas */}
          {registro.fotos_pacotes.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {registro.fotos_pacotes.map((foto, index) => (
                <div key={index} className="relative">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => removeFoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botão Câmera */}
          <div className="flex justify-center">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading || registro.fotos_pacotes.length >= 5}
              className="flex flex-col items-center gap-2 p-4 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-[#dfe3ee] rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <span className="text-sm text-gray-700 font-medium">Câmera</span>
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Checkbox Salvar Entregador */}
          {!registro.entregador_id && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="salvar"
                checked={registro.salvar_entregador}
                onChange={(e) => setRegistro(prev => ({ ...prev, salvar_entregador: e.target.checked }))}
                className="w-5 h-5 text-[#3b5998] rounded"
              />
              <label htmlFor="salvar" className="text-sm text-gray-700 cursor-pointer">
                Salvar entregador na base de dados para futuros recebimentos
              </label>
            </div>
          )}

          {/* Botão Salvar */}
          <Button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-lg font-semibold mt-6 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </div>


    </div>
  );
}