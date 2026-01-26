import React from 'react';
import { MessageSquare } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Templates de Notificação</h1>
        <div className="text-center p-20 bg-gray-100 rounded-lg border-2 border-dashed">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700">Em Breve</h2>
            <p className="text-gray-500 mt-2">
                Aqui você poderá editar os modelos de mensagens enviadas por WhatsApp, E-mail e Push.
            </p>
        </div>
    </div>
  );
}