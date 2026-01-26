import React, { useState } from 'react';
import { Chamado } from "@/entities/Chamado";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HelpCircle,
  Lightbulb,
  Wrench,
  Frown,
  FileText,
  Calendar as CalendarIcon,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

import MoradorHeader from '../shared/MoradorHeader';
import MoradorFooter from '../shared/MoradorFooter';
import { useChamados } from '../utils/chamadosContext';

const tiposIcones = {
  'duvida': HelpCircle,
  'sugestao': Lightbulb,
  'manutencao': Wrench,
  'reclamacao': Frown,
  'solicitacao': FileText,
  'agendamento_mudanca': CalendarIcon
};

const tiposLabels = {
  'duvida': 'Dúvida',
  'sugestao': 'Sugestão',
  'manutencao': 'Manutenção',
  'reclamacao': 'Reclamação',
  'solicitacao': 'Solicitação',
  'agendamento_mudanca': 'Agendamento de mudança'
};

export default function DetalhesChamado({ chamado, moradorInfo, onVoltar, userType }) {
  const [resposta, setResposta] = useState('');
  const [respondendo, setRespondendo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { atualizarChamados } = useChamados();

  const TipoIcon = tiposIcones[chamado.tipo] || FileText;
  const morador = moradorInfo ? moradorInfo(chamado.morador_id) : null;

  const podResponder = userType === 'administrador' || userType === 'porteiro';
  const jaRespondido = chamado.status === 'concluido' && chamado.resposta;

  const handleResponder = async () => {
    if (!resposta.trim()) {
      setError('Por favor, escreva uma resposta');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setRespondendo(true);
      setError('');
      
      console.log('[CHAMADOS] Respondendo chamado:', chamado.id);

      const nomeResponsavel = userType === 'administrador' ? 'Sindico' : 'Portaria';

      await Chamado.update(chamado.id, {
        status: 'concluido',
        resposta: resposta.trim(),
        respondido_por: nomeResponsavel,
        respondido_por_tipo: userType,
        data_resposta: new Date().toISOString()
      });

      console.log('[CHAMADOS] Resposta enviada com sucesso');

      setSuccess('Resposta enviada com sucesso!');
      atualizarChamados();
      
      setTimeout(() => {
        if (onVoltar) onVoltar();
      }, 1500);

    } catch (err) {
      console.error('[CHAMADOS] Erro ao responder chamado:', err);
      setError(`Erro ao enviar resposta: ${err.message || 'Tente novamente'}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setRespondendo(false);
    }
  };

  const handleReabrir = async () => {
    if (!window.confirm('Deseja reabrir este chamado?')) return;

    try {
      setError('');
      console.log('[CHAMADOS] Reabrindo chamado:', chamado.id);

      await Chamado.update(chamado.id, {
        status: 'em_andamento'
      });

      console.log('[CHAMADOS] Chamado reaberto com sucesso');

      setSuccess('Chamado reaberto!');
      atualizarChamados();
      
      setTimeout(() => {
        if (onVoltar) onVoltar();
      }, 1500);

    } catch (err) {
      console.error('[CHAMADOS] Erro ao reabrir chamado:', err);
      setError(`Erro ao reabrir chamado: ${err.message || 'Tente novamente'}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Detalhes do Chamado" onBack={onVoltar} />

      <div className="pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-4 mt-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-[#dfe3ee] bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#3b5998]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TipoIcon className="w-6 h-6 text-[#3b5998]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#3b5998] mb-2">
                    {chamado.titulo}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#3b5998]/10 text-[#3b5998] border-0">
                      {tiposLabels[chamado.tipo]}
                    </Badge>
                    <Badge className={
                      chamado.status === 'concluido' ? 'bg-green-100 text-green-800 border-0' :
                      chamado.status === 'em_andamento' ? 'bg-blue-100 text-blue-800 border-0' :
                      'bg-yellow-100 text-yellow-800 border-0'
                    }>
                      {chamado.status === 'concluido' ? 'Concluído' :
                       chamado.status === 'em_andamento' ? 'Em Andamento' :
                       'Aberto'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {morador && (
                <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[#3b5998]" />
                    <h3 className="font-semibold text-[#3b5998]">Solicitante</h3>
                  </div>
                  <p className="text-gray-900 font-medium">{morador.nome}</p>
                  <p className="text-sm text-gray-600">{morador.apelido_endereco}</p>
                </div>
              )}

              <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#3b5998]" />
                  <h3 className="font-semibold text-[#3b5998]">Data de Abertura</h3>
                </div>
                <p className="text-gray-900">
                  {format(parseISO(chamado.created_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
                <h3 className="font-semibold text-[#3b5998] mb-2">Descrição</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{chamado.descricao}</p>
              </div>

              {chamado.arquivos_anexos && chamado.arquivos_anexos.length > 0 && (
                <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
                  <h3 className="font-semibold text-[#3b5998] mb-3">Anexos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {chamado.arquivos_anexos.map((arquivo, index) => (
                      <img
                        key={index}
                        src={arquivo.url}
                        alt={`Anexo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#3b5998] transition-colors"
                        onClick={() => window.open(arquivo.url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {jaRespondido && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 p-4 rounded-lg border-2 border-green-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Resposta</h3>
                  </div>
                  <p className="text-green-900 mb-3 whitespace-pre-wrap">{chamado.resposta}</p>
                  <div className="flex items-center gap-4 text-sm text-green-700">
                    <span>Por: {chamado.respondido_por}</span>
                    <span>Em: {format(parseISO(chamado.data_resposta), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  
                  {podResponder && (
                    <Button
                      onClick={handleReabrir}
                      variant="outline"
                      className="mt-4 w-full border-green-600 text-green-600 hover:bg-green-50"
                    >
                      Reabrir Chamado
                    </Button>
                  )}
                </motion.div>
              )}

              {podResponder && !jaRespondido && (
                <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#dfe3ee]">
                  <h3 className="font-semibold text-[#3b5998] mb-3">Responder Chamado</h3>
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={5}
                    className="mb-3 bg-white border-gray-300"
                    disabled={respondendo}
                  />
                  <Button
                    onClick={handleResponder}
                    disabled={respondendo || !resposta.trim()}
                    className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white h-12"
                  >
                    {respondendo ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Enviar Resposta
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MoradorFooter />
    </div>
  );
}