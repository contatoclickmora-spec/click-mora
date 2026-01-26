import React, { useState, useEffect } from 'react';
import { Aviso } from "@/entities/Aviso";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

import MoradorHeader from '../components/shared/MoradorHeader';

export default function AvisosMorador() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moradorLogado, setMoradorLogado] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('[AVISOS MORADOR] Carregando dados...');

        const user = await User.me();
        if (!isMounted) return;

        if (!user || !user.email) {
          setError('Usuário não autenticado.');
          setLoading(false);
          return;
        }

        const todosMoradores = await Morador.list();
        if (!isMounted) return;

        const morador = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        if (!morador || !morador.condominio_id) {
          setError('Cadastro não encontrado.');
          setLoading(false);
          return;
        }

        setMoradorLogado(morador);
        console.log('[AVISOS MORADOR] Morador carregado:', morador.nome);

        const todosAvisos = await Aviso.list('-data_envio');
        if (!isMounted) return;

        const avisosDoCondominio = todosAvisos.filter(aviso => 
          aviso.condominio_id === morador.condominio_id &&
          aviso.status === 'enviado'
        );

        console.log('[AVISOS MORADOR] Avisos carregados:', avisosDoCondominio.length);
        setAvisos(avisosDoCondominio);
        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        console.error('[AVISOS MORADOR] Erro:', err);
        setError('Erro ao carregar avisos. Tente novamente.');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getTipoDestinatarioLabel = (aviso) => {
    switch(aviso.tipo_destinatario) {
      case 'todos':
        return 'Todos do Condomínio';
      case 'bloco':
        return `Bloco ${aviso.filtro_bloco}`;
      case 'apartamento':
        return `${aviso.filtro_apartamento}`;
      case 'individuais':
        return 'Aviso Individual';
      default:
        return 'Aviso';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Avisos" />
        <div className="flex flex-col items-center justify-center pt-24 pb-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          <p className="text-gray-600">Carregando avisos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Avisos" />
        <div className="p-4 pt-20 pb-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Avisos" />
      
      <div className="pt-28 pb-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4 mt-4">
          {avisos.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum aviso no momento
                </h3>
                <p className="text-gray-500 text-sm">
                  Você será notificado quando houver novos avisos
                </p>
              </CardContent>
            </Card>
          ) : (
            avisos.map((aviso, index) => (
              <motion.div
                key={aviso.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#3b5998]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-[#3b5998]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {getTipoDestinatarioLabel(aviso)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(parseISO(aviso.data_envio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <h2 className="font-bold text-xl text-gray-900 mb-3">
                      {aviso.titulo}
                    </h2>

                    <div className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                      {aviso.mensagem}
                    </div>

                    {aviso.imagem_url && (
                      <div className="mb-4">
                        <img 
                          src={aviso.imagem_url} 
                          alt="Imagem do aviso" 
                          className="w-full rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Atenciosamente, {aviso.enviado_por}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}