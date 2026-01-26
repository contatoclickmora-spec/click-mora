import React, { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, MapPin, Camera, Loader2, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExtractDataFromUploadedFile, UploadFile } from "@/integrations/Core";

export default function MoradorSearch({ moradores, residencias, onMoradorSelect, moradorSelecionado }) {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultados, setResultados] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [nomeOCR, setNomeOCR] = useState("");

  const buscarPorApelido = useCallback((termo) => {
    if (!termo || termo.length < 2) {
      setResultados([]);
      setShowResults(false);
      return;
    }
    const termoLowerCase = termo.toLowerCase();

    const moradoresEncontrados = moradores.filter((morador) =>
      morador.apelido_endereco && morador.apelido_endereco.toLowerCase().includes(termoLowerCase)
    ).map((morador) => {
      const residencia = residencias.find((r) => r.id === morador.residencia_id);
      return {
        ...morador,
        residencia: residencia
      };
    });

    setResultados(moradoresEncontrados);
    setShowResults(moradoresEncontrados.length > 0);
  }, [moradores, residencias]);

  const buscarPorNome = useCallback((nome) => {
    if (!nome || nome.length < 2) {
      setResultados([]);
      setShowResults(false);
      return;
    }

    const moradoresEncontrados = moradores.filter((morador) =>
      morador.nome.toLowerCase().includes(nome.toLowerCase())
    ).map((morador) => {
      const residencia = residencias.find((r) => r.id === morador.residencia_id);
      return {
        ...morador,
        residencia: residencia
      };
    });

    setResultados(moradoresEncontrados);
    setShowResults(moradoresEncontrados.length > 0);
  }, [moradores, residencias]);

  const handleManualSearch = (termo) => {
    setSearchTerm(termo);
    buscarPorApelido(termo);
  };

  const handleReadNameWithOCR = async (file) => {
    setOcrLoading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const ocrResponse = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            nome_destinatario: { type: "string", description: "O nome da pessoa que vai receber a encomenda. Extraia apenas o nome." }
          }
        }
      });

      if (ocrResponse.status === "success" && ocrResponse.output?.nome_destinatario) {
        const nome = ocrResponse.output.nome_destinatario;
        setNomeOCR(nome);
        buscarPorNome(nome);
      } else {
        alert("Não foi possível ler o nome da foto. Tente novamente ou use a busca manual.");
      }
    } catch (err) {
      console.error("Erro no OCR:", err);
      if (err.response?.status === 429) {
        alert("Muitas tentativas em pouco tempo. Por favor, aguarde um minuto e tente novamente.");
      } else {
        alert("Erro ao processar imagem. Tente novamente ou use a busca manual.");
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const handleMoradorClick = (morador) => {
    if (morador.residencia_id) {
      const residencia = residencias.find(r => r.id === morador.residencia_id);
      if (residencia) {
        morador.residencia = residencia;
        console.log("✅ Morador selecionado com residência:", morador.nome, residencia.identificador_principal);
      } else {
        console.warn("⚠️ Residência não encontrada no cache para morador:", morador.nome);
      }
    } else {
      console.log("ℹ️ Morador sem residencia_id:", morador.nome, "- Usando condominio_id direto");
    }
    
    onMoradorSelect(morador);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      {/* Seleção de Opção */}
      {!opcaoSelecionada && !moradorSelecionado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setOpcaoSelecionada('manual')}
            className="h-24 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 text-gray-900 flex flex-col items-center gap-3 transition-all"
            variant="outline"
          >
            <Edit3 className="w-8 h-8 text-blue-600" />
            <div className="text-center">
              <span className="font-semibold">Busca Manual</span>
              <p className="text-xs text-gray-500 mt-1">Digite abreviação do endereço</p>
            </div>
          </Button>

          <Button
            onClick={() => setOpcaoSelecionada('ocr')}
            className="h-24 bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-400 text-gray-900 flex flex-col items-center gap-3 transition-all"
            variant="outline"
          >
            <Camera className="w-8 h-8 text-green-600" />
            <div className="text-center">
              <span className="font-semibold">Foto (OCR)</span>
              <p className="text-xs text-gray-500 mt-1">Lê o nome da etiqueta</p>
            </div>
          </Button>
        </div>
      )}

      {/* Opção Manual */}
      {opcaoSelecionada === 'manual' && !moradorSelecionado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-800">Busca Manual</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpcaoSelecionada(null);
                setSearchTerm("");
                setShowResults(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Voltar
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input
              placeholder="Digite a abreviação (ex: 9-103)"
              value={searchTerm}
              onChange={(e) => handleManualSearch(e.target.value)}
              className="pl-10 py-3 text-lg border-blue-200 focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Resultados com scroll independente */}
          <AnimatePresence>
            {showResults && resultados.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2 max-h-[50vh] overflow-y-auto border rounded-lg bg-white shadow-lg"
                style={{ 
                  position: 'relative',
                  zIndex: 50
                }}
              >
                <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b">
                  <h5 className="font-semibold text-gray-800 text-sm">
                    {resultados.length} morador{resultados.length !== 1 ? 'es' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                  </h5>
                </div>
                {resultados.map((morador) => (
                  <div
                    key={morador.id}
                    className="p-4 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 transition-all active:bg-blue-100"
                    onClick={() => handleMoradorClick(morador)}
                  >
                    <p className="font-semibold text-gray-900">{morador.nome}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      {morador.residencia?.identificador_principal}, {morador.residencia?.complemento} ({morador.apelido_endereco})
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            {showResults && resultados.length === 0 && searchTerm.length >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
              >
                <p className="text-yellow-800">
                  ⚠️ Nenhum morador encontrado. Verifique a digitação.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Opção OCR */}
      {opcaoSelecionada === 'ocr' && !moradorSelecionado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-green-800">📷 Leitura por Foto (OCR)</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpcaoSelecionada(null);
                setNomeOCR("");
                setShowResults(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Voltar
            </Button>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleReadNameWithOCR(e.target.files[0])}
            id="ocr-upload"
            className="hidden"
          />
          
          <Button
            asChild
            variant="outline"
            className="w-full py-6 border-green-200 hover:bg-green-50"
          >
            <label htmlFor="ocr-upload" className="cursor-pointer flex items-center justify-center">
              {ocrLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin text-green-600" />
                  <span className="text-green-700">Lendo nome na foto...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-3 text-green-600" />
                  <span className="text-green-700">Fotografar etiqueta para ler nome</span>
                </>
              )}
            </label>
          </Button>

          {nomeOCR && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <strong>✅ Nome encontrado:</strong> {nomeOCR}
              </p>
            </div>
          )}

          {/* Resultados OCR com scroll independente */}
          <AnimatePresence>
            {showResults && resultados.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2 max-h-[50vh] overflow-y-auto border rounded-lg bg-white shadow-lg"
                style={{ 
                  position: 'relative',
                  zIndex: 50
                }}
              >
                <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b">
                  <h5 className="font-semibold text-gray-800 text-sm">
                    {resultados.length} morador{resultados.length !== 1 ? 'es' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                  </h5>
                </div>
                {resultados.map((morador) => (
                  <div
                    key={morador.id}
                    className="p-4 cursor-pointer hover:bg-green-50 border-b last:border-b-0 transition-all active:bg-green-100"
                    onClick={() => handleMoradorClick(morador)}
                  >
                    <p className="font-semibold text-gray-900">{morador.nome}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      {morador.residencia?.identificador_principal}, {morador.residencia?.complemento}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            {showResults && resultados.length === 0 && nomeOCR && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
              >
                <p className="text-yellow-800">
                  ⚠️ Nenhum morador encontrado com esse nome.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-gray-500">
            💡 Aponte a câmera para a etiqueta com o nome do destinatário
          </p>
        </motion.div>
      )}

      {/* Morador Selecionado */}
      {moradorSelecionado && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-50 border-2 border-green-200 rounded-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-green-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                {moradorSelecionado.nome}
              </p>
              {moradorSelecionado.residencia && (
                <p className="text-sm text-green-700 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {moradorSelecionado.residencia?.identificador_principal}, {moradorSelecionado.residencia?.complemento}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onMoradorSelect(null);
                setOpcaoSelecionada(null);
                setSearchTerm("");
                setNomeOCR("");
                setShowResults(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Alterar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}