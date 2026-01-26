import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertTriangle } from "lucide-react";
import { motion } from 'framer-motion';

export default function NovaVistoriaModal({ imovel, moradorLogado, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nova Vistoria</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Módulo em Desenvolvimento:</strong> O fluxo completo de vistoria por ambientes será implementado em breve. Esta funcionalidade incluirá registro detalhado por cômodo, checklist, fotos e geração de PDF.
              </AlertDescription>
            </Alert>

            <div className="bg-[#f7f7f7] rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Imóvel selecionado:</p>
              <p className="font-bold text-gray-900">{imovel.titulo}</p>
              <p className="text-sm text-gray-600">{imovel.subtitulo}</p>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                A funcionalidade completa de vistoria está sendo finalizada e incluirá:
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 max-w-md mx-auto mb-6">
                <li>✓ Vistoria detalhada por ambiente (quartos, sala, cozinha, etc.)</li>
                <li>✓ Upload de fotos por cômodo</li>
                <li>✓ Checklist personalizável</li>
                <li>✓ Assinatura digital</li>
                <li>✓ Geração automática de PDF</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}