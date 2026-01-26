import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Smartphone, Keyboard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CAMERA_DESATIVADA, CAMERA_MENSAGEM } from "@/components/utils/cameraConfig";

export default function QRScanner({ onQRScan }) {
  // Se câmera desativada, mostrar modo manual direto
  const [showManual, setShowManual] = useState(CAMERA_DESATIVADA);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Simular escaneamento de QR (em produção usaria uma biblioteca como ZXing)
  const startScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Simular detecção de QR após 3 segundos (para demo)
      setTimeout(() => {
        const demoCode = `PKG${Date.now().toString().slice(-6)}`;
        onQRScan(demoCode);
        stopScanning();
      }, 3000);
      
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onQRScan(manualCode.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Escaneie o QR Code da Encomenda
        </h3>
        <p className="text-gray-600">
          Use a câmera do dispositivo para ler o código ou digite manualmente
        </p>
      </div>

      {!showManual && !CAMERA_DESATIVADA ? (
        <div className="space-y-4">
          {!isScanning ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Posicione o QR Code da encomenda na frente da câmera
              </p>
              <Button 
                onClick={startScanning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Iniciar Scanner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50">
                    <div className="absolute inset-0 border border-white animate-pulse rounded-lg"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    Escaneando QR Code...
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={stopScanning}
                variant="outline"
                className="w-full"
              >
                Cancelar Scanner
              </Button>

              <Alert>
                <AlertDescription>
                  <div className="animate-pulse flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-bounce"></div>
                    Procurando por QR Code... Mantenha o código visível na tela.
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">ou</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowManual(true)}
            className="w-full"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Digitar Código Manualmente
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {CAMERA_DESATIVADA && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800 text-sm">
                ⚠️ {CAMERA_MENSAGEM}
              </AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="manual-code">Código da Encomenda</Label>
            <Input
              id="manual-code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Digite o código da encomenda"
              className="mt-1"
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>
          
          <div className="flex gap-3">
            {!CAMERA_DESATIVADA && (
              <Button
                variant="outline"
                onClick={() => setShowManual(false)}
                className="flex-1"
              >
                Voltar ao Scanner
              </Button>
            )}
            <Button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}