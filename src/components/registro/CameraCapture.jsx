import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, RotateCcw, ImageIcon, Loader2 } from "lucide-react";
import { CAMERA_DESATIVADA, CAMERA_MENSAGEM } from "@/components/utils/cameraConfig";

export default function CameraCapture({ onCapture, loading, destinatario }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = (e) => {
    try {
      const file = e.target.files?.[0];
      console.log("📁 [UPLOAD] Arquivo selecionado:", file?.name);
      
      if (!file) {
        console.log("📁 [UPLOAD] Nenhum arquivo selecionado");
        return;
      }

      if (!file.type.startsWith('image/')) {
        setCameraError("Por favor, selecione uma imagem válida.");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      onCapture(file);
      setCameraError("");
      console.log("✅ [UPLOAD] Arquivo carregado com sucesso");
    } catch (error) {
      console.error("❌ [UPLOAD] Erro ao processar arquivo:", error);
      setCameraError("Erro ao processar imagem. Tente novamente.");
    } finally {
      // Reset input para permitir selecionar a mesma foto novamente
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraError("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Camera className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Fotografe a Encomenda
        </h3>
        {destinatario && (
          <p className="text-sm text-gray-600">
            Para: <strong>{destinatario.nome}</strong>
            {destinatario.apelido_endereco && ` • ${destinatario.apelido_endereco}`}
          </p>
        )}
      </div>

      {cameraError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800 text-sm">
            {cameraError}
          </AlertDescription>
        </Alert>
      )}

      {!capturedImage ? (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            
            <div className="space-y-3 max-w-xs mx-auto">
              {/* Botão Principal: Tirar Foto - DESATIVADO TEMPORARIAMENTE */}
              {!CAMERA_DESATIVADA && (
                <Button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Tirar Foto
                </Button>
              )}

              {/* Botão Secundário: Galeria */}
              <Button 
                variant={CAMERA_DESATIVADA ? "default" : "outline"}
                onClick={() => fileInputRef.current?.click()}
                className={CAMERA_DESATIVADA 
                  ? "w-full h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg"
                  : "w-full h-14 text-base border-2 hover:bg-gray-50"
                }
              >
                <Upload className="w-5 h-5 mr-2" />
                {CAMERA_DESATIVADA ? 'Selecionar Foto' : 'Escolher da Galeria'}
              </Button>
            </div>

            {CAMERA_DESATIVADA && (
              <p className="text-xs text-amber-600 mt-4 px-4 text-center">
                ⚠️ {CAMERA_MENSAGEM}
              </p>
            )}

            <p className="text-xs text-gray-500 mt-6 leading-relaxed max-w-xs mx-auto">
              💡 A foto será enviada automaticamente para o morador via notificação
            </p>
          </div>

          {/* Inputs escondidos */}
          {!CAMERA_DESATIVADA && (
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Tirar foto com câmera"
            />
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Escolher foto da galeria"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pré-visualização */}
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Encomenda capturada" 
              className="w-full rounded-xl border-2 border-green-500 shadow-lg"
            />
            <div className="absolute top-3 right-3">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                ✓ Foto Capturada
              </div>
            </div>
          </div>
          
          {loading ? (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="flex items-center justify-center text-blue-800 py-2">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="font-medium">Fazendo upload da foto...</span>
              </AlertDescription>
            </Alert>
          ) : (
            <Button 
              onClick={retakePhoto}
              variant="outline"
              className="w-full h-14 text-base font-medium border-2"
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Tirar Outra Foto
            </Button>
          )}
        </div>
      )}
    </div>
  );
}