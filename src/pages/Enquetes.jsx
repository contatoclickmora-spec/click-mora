import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MoradorHeader from "../components/shared/MoradorHeader";
import OperationalFooter from "../components/shared/OperationalFooter";
import { getUserRole } from "../components/utils/authUtils";
import { getCondominioContext } from "../components/utils/condominioContext";

export default function EnquetesPage() {
  const [enquetes, setEnquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [condominioId, setCondominioId] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    loadData();
    return () => abortController.abort();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const role = await getUserRole();
      setUserType(role.userType);
      
      const context = await getCondominioContext();
      
      if (!context || !context.condominioId) {
        console.error("[SECURITY] Condomínio não identificado");
        setEnquetes([]);
        setLoading(false);
        return;
      }
      
      setCondominioId(context.condominioId);

      // PROTEÇÃO: Carregar APENAS enquetes do condomínio do usuário
      const enquetesDoCondominio = await base44.entities.Enquete.filter({ 
        condominio_id: context.condominioId 
      }, '-created_date');

      // VALIDAÇÃO: Garantir isolamento absoluto
      const enquetesValidadas = enquetesDoCondominio.filter(e => e.condominio_id === context.condominioId);

      // Verificar status baseado na data
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const enquetesAtualizadas = enquetesValidadas.map(e => {
        const dataEncerramento = new Date(e.data_encerramento);
        dataEncerramento.setHours(0, 0, 0, 0);
        
        if (dataEncerramento < hoje && e.status !== 'encerrada') {
          return { ...e, status: 'encerrada' };
        }
        return e;
      });

      setEnquetes(enquetesAtualizadas);

      console.log(`[SECURITY] Enquetes carregadas - Condomínio: ${context.condominioId}, Total: ${enquetesAtualizadas.length}`);
      
    } catch (err) {
      console.error("[SECURITY] Erro ao carregar enquetes:", err);
      setEnquetes([]);
    } finally {
      setLoading(false);
    }
  };

  const isSindico = userType === 'administrador';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Enquetes" />
        <div className="flex items-center justify-center pt-24">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-24">
      <MoradorHeader title="Enquetes" />

      <div className="pt-28 px-4 max-w-2xl mx-auto">
        <div className="space-y-3 mb-24">
          {enquetes.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <ThumbsUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhuma enquete disponível
                </h3>
                <p className="text-gray-500 text-sm">
                  {isSindico ? 'Crie a primeira enquete do condomínio' : 'Enquetes aparecerão aqui quando forem criadas'}
                </p>
              </CardContent>
            </Card>
          ) : (
            enquetes.map((enquete) => (
              <motion.div
                key={enquete.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link to={createPageUrl(`DetalhesEnquete?id=${enquete.id}`)}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <ThumbsUp className="w-6 h-6 text-[#3b5998]" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 leading-tight">
                            {enquete.nome.toUpperCase()}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {enquete.total_perguntas} {enquete.total_perguntas === 1 ? 'pergunta' : 'perguntas'}
                          </p>

                          {enquete.status === 'encerrada' && (
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              Encerrada
                            </span>
                          )}
                          
                          {enquete.status === 'ativa' && (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Ativa
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {isSindico && (
        <div className="fixed bottom-24 left-0 right-0 px-4 max-w-2xl mx-auto">
          <Link to={createPageUrl('NovaEnquete')}>
            <Button className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full shadow-lg text-base font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              Nova enquete
            </Button>
          </Link>
        </div>
      )}

      {(userType === 'administrador' || userType === 'porteiro') && <OperationalFooter />}
    </div>
  );
}