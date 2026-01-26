import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, QrCode, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoEncomendas({ encomendas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          Histórico de Encomendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {encomendas.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma encomenda no histórico.</p>
        ) : (
          <div className="space-y-3">
            {encomendas.map(encomenda => (
              <div key={encomenda.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{encomenda.remetente || 'Remetente não informado'}</p>
                  <p className="text-sm text-gray-500">Código: {encomenda.codigo}</p>
                </div>
                <div className="text-right">
                   <Badge variant="outline" className="flex items-center gap-1 mb-1">
                      <QrCode className="w-3 h-3" />
                      Retirada via QR Code
                    </Badge>
                  <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3"/>
                    {format(new Date(encomenda.data_retirada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}