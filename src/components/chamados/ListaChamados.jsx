import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Lightbulb,
  Wrench,
  Frown,
  FileText,
  Calendar,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DetalhesChamado from './DetalhesChamado';

const tiposIcones = {
  'duvida': HelpCircle,
  'sugestao': Lightbulb,
  'manutencao': Wrench,
  'reclamacao': Frown,
  'solicitacao': FileText,
  'agendamento_mudanca': Calendar
};

const tiposLabels = {
  'duvida': 'Dúvida',
  'sugestao': 'Sugestão',
  'manutencao': 'Manutenção',
  'reclamacao': 'Reclamação',
  'solicitacao': 'Solicitação',
  'agendamento_mudanca': 'Agendamento de mudança'
};

const tiposCores = {
  'duvida': 'bg-blue-100 text-blue-700',
  'sugestao': 'bg-purple-100 text-purple-700',
  'manutencao': 'bg-orange-100 text-orange-700',
  'reclamacao': 'bg-red-100 text-red-700',
  'solicitacao': 'bg-green-100 text-green-700',
  'agendamento_mudanca': 'bg-indigo-100 text-indigo-700'
};

export default function ListaChamados({ chamados, moradorInfo, onRefresh, userType }) {
  const [chamadoSelecionado, setSelection] = useState(null);

  if (chamadoSelecionado) {
    return (
      <DetalhesChamado
        chamado={chamadoSelecionado}
        moradorInfo={moradorInfo}
        onVoltar={() => {
          setSelection(null);
          if (onRefresh) onRefresh();
        }}
        userType={userType}
      />
    );
  }

  if (chamados.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Nenhum chamado encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4">
      {chamados.map((chamado, index) => {
        const TipoIcon = tiposIcones[chamado.tipo] || FileText;
        const morador = moradorInfo ? moradorInfo(chamado.morador_id) : null;

        return (
          <Card
            key={chamado.id}
            className="bg-white hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
            onClick={() => setSelection(chamado)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Ícone */}
                <div className="w-12 h-12 bg-[#3b5998]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TipoIcon className="w-6 h-6 text-[#3b5998]" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  {/* Título */}
                  <h3 className="font-bold text-gray-900 text-base mb-1 uppercase">
                    {chamado.titulo}
                  </h3>

                  {/* Número do Chamado */}
                  <p className="text-[#3b5998] font-semibold text-sm mb-2">
                    #{chamados.length - index}
                  </p>

                  {/* Data e Hora */}
                  <p className="text-gray-600 text-sm mb-2">
                    {format(parseISO(chamado.created_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>

                  {/* Info do Morador */}
                  {morador && (
                    <p className="text-gray-600 text-sm mb-3">
                      {morador.nome} - {morador.apelido_endereco || 'Sem endereço'} 
                      {chamado.destinatario === 'sindico' && ' (Síndico)'}
                      {chamado.destinatario === 'portaria' && ' (Portaria)'}
                    </p>
                  )}

                  {/* Badge do Tipo */}
                  <Badge className={`${tiposCores[chamado.tipo]} border-0 text-xs px-3 py-1`}>
                    {tiposLabels[chamado.tipo]}
                  </Badge>
                </div>

                {/* Seta */}
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}