import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, QrCode } from "lucide-react";

export default function EncomendasPendentes({ encomendas }) {
  const QRCodeGenerator = ({ text }) => {
    if (!text) return null;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    return <img src={qrCodeUrl} alt={`QR Code para ${text}`} className="mx-auto rounded-lg shadow-md" />;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-blue-600" />
          Encomendas para Retirar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {encomendas.length === 0 ? (
          <Alert>
            <Package className="h-4 w-4"/>
            <AlertDescription>
              Você não tem encomendas aguardando retirada.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {encomendas.map(encomenda => (
              <div key={encomenda.id} className="p-4 border rounded-lg text-center space-y-3 bg-white">
                <h4 className="font-semibold">Código: {encomenda.codigo}</h4>
                <QRCodeGenerator text={encomenda.codigo} />
                <p className="text-sm text-gray-600">
                  Apresente este QR Code na portaria para retirar sua encomenda.
                </p>
                {encomenda.foto_encomenda && (
                   <img src={encomenda.foto_encomenda} alt="Foto da encomenda" className="w-full h-32 object-contain rounded-md border mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}