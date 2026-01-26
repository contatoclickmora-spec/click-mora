import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Camera, SkipForward, Keyboard } from "lucide-react";
import { CAMERA_DESATIVADA, CAMERA_MENSAGEM } from "@/components/utils/cameraConfig";

export default function QRScannerEntrada({ onScan, onSkip }) {
  const [isScanning, setIsScanning] = useState(false);
  const [showManual, setShowManual] = useState(CAMERA_DESATIVADA);
  const [manualCode, setManualCode] = useState('');

  const simulateQRScan = () => {
    if (CAMERA_DESATIVADA) return;
    setIsScanning(true);
    // Simular leitura de QR Code após 2 segundos
    setTimeout(() => {
      const demoCode = `PKG${Date.now().toString().slice(-6)}`;
      onScan(demoCode);
      setIsScanning(false);
    }, 2000);
  };

  const handleSkipQR = () => {
    onSkip();
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  // Se câmera desativada, mostrar interface de código manual
  if (CAMERA_DESATIVADA) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Keyboard className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            1. Código da Encomenda
          </h3>
          <p className="text-gray-600">
            Digite o código da encomenda ou pule esta etapa
          </p>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-800 text-sm">
            ⚠️ {CAMERA_MENSAGEM}
          </AlertDescription>
        </Alert>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center text-blue-800">
              Digitar Código
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={handleManualSubmit} 
              disabled={!manualCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Confirmar Código
            </Button>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-500 mb-3">
            Encomenda sem código?
          </p>
          <Button variant="outline" onClick={handleSkipQR} className="w-full">
            <SkipForward className="w-4 h-4 mr-2" />
            Pular e Gerar Código Interno
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          1. Código da Encomenda
        </h3>
        <p className="text-gray-600">
          Escaneie o código QR da encomenda ou pule esta etapa
        </p>
      </div>

      {/* QR Scanner */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-center text-blue-800">
            Escanear QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {!isScanning ? (
            <>
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <Button onClick={simulateQRScan} className="w-full bg-blue-600 hover:bg-blue-700">
                <QrCode className="w-4 h-4 mr-2" />
                Ativar Câmera para QR Code
              </Button>
            </>
          ) : (
            <div className="w-48 h-48 bg-gray-800 rounded-lg mx-auto flex items-center justify-center animate-pulse">
              <p className="text-white text-sm">Escaneando...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip Option */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-500 mb-3">
          Encomenda sem código QR?
        </p>
        <Button variant="outline" onClick={handleSkipQR} className="w-full">
          <SkipForward className="w-4 h-4 mr-2" />
          Pular e Gerar Código Interno
        </Button>
      </div>
    </div>
  );
}