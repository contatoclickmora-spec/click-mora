import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUserRole, getUserRoleSync } from "../components/utils/authUtils";
import MoradorHeader from '@/components/shared/MoradorHeader';
import DetalhesEncomenda from '../components/moradores/DetalhesEncomenda';

export default function EncomendasMorador() {
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [encomendas, setEncomendas] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState('');
  const [selectedEncomenda, setSelectedEncomenda] = useState(null);
  const [showDetalhesEncomenda, setShowDetalhesEncomenda] = useState(false);
  const [roleInfo, setRoleInfo] = useState(getUserRoleSync());
  const [accessDenied, setAccessDenied] = useState(false);

  const loadDashboardData = useCallback(async (user, morador) => {
    try {
      console.log("[ENCOMENDAS MORADOR] Carregando encomendas...");
      setError('');

      if (!user || !morador) {
        console.error("[ENCOMENDAS MORADOR] Dados incompletos:", { user: !!user, morador: !!morador });
        throw new Error("Dados de morador incompletos.");
      }

      // Usar base44 client ao invés de importação direta
      const todasEncomendas = await base44.entities.Encomenda.list('-data_entrada');
      
      if (!todasEncomendas) {
        console.warn("[ENCOMENDAS MORADOR] Nenhuma encomenda retornada");
        setEncomendas([]);
        return;
      }

      const encomendasDoMorador = todasEncomendas
        .filter(e => e && e.morador_id === morador.id)
        .sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada));

      setEncomendas(encomendasDoMorador);
      console.log(`[ENCOMENDAS MORADOR] ✅ ${encomendasDoMorador.length} encomendas carregadas`);

    } catch (err) {
      console.error("[ENCOMENDAS MORADOR] ❌ Erro ao carregar:", err);
      setError("Erro ao carregar encomendas. Tente novamente.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      setError('');
      setAccessDenied(false);

      try {
        console.log("🔐 [ENCOMENDAS MORADOR] Verificando acesso...");
        
        let role = getUserRoleSync();
        
        if (!role || !role.isAuthenticated) {
          const [roleData] = await Promise.all([
            getUserRole(),
            new Promise(resolve => setTimeout(resolve, 200))
          ]);
          role = roleData;
        } else {
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        if (!isMounted) return;

        if (!role || !role.isAuthenticated) {
          console.log("🚫 [ENCOMENDAS MORADOR] Não autenticado");
          window.location.href = '/login';
          return;
        }

        if (role.userType === 'admin_master') {
          console.log("👑 [ENCOMENDAS MORADOR] Admin Master, redirecionando...");
          window.location.href = '/AdminMaster';
          return;
        }

        if (role.userType === 'porteiro' || role.userType === 'administrador') {
          console.warn("🚫 [ENCOMENDAS MORADOR] Porteiro/Síndico tentando acessar painel de morador");
          window.location.href = '/Dashboard';
          return;
        }

        if (role.userType !== 'morador') {
          console.error("❌ [ENCOMENDAS MORADOR] Tipo de usuário não autorizado:", role.userType);
          if (isMounted) {
            setAccessDenied(true);
            setIsInitializing(false);
          }
          return;
        }

        console.log("✅ [ENCOMENDAS MORADOR] Acesso autorizado para morador.");
        
        if (!role.morador) {
          if (isMounted) {
            setError("Seu cadastro de morador não foi encontrado ou está pendente de aprovação.");
            setIsInitializing(false);
          }
          return;
        }

        if (isMounted) {
          setCurrentUser(role.user);
          setMoradorLogado(role.morador);
          setRoleInfo(role);
        }
        
        await loadDashboardData(role.user, role.morador);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isMounted) {
          setIsInitializing(false);
        }

      } catch (err) {
        if (isMounted) {
          console.error("❌ [ENCOMENDAS MORADOR] Erro na verificação:", err);
          setError("Erro ao carregar dados. Verifique sua conexão.");
          setIsInitializing(false);
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  const handleVerDetalhesEncomenda = (encomenda) => {
    console.log("[ENCOMENDAS MORADOR] Abrindo detalhes:", encomenda.codigo);
    setSelectedEncomenda(encomenda);
    setShowDetalhesEncomenda(true);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998] mx-auto mb-4" />
          <p className="text-gray-600">Carregando encomendas...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar este painel.</p>
          <Button
            onClick={() => window.location.href = '/Dashboard'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir para Meu Painel
          </Button>
        </div>
      </div>
    );
  }

  if (error && !moradorLogado) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h3>
            <p className="text-gray-600 mt-2 mb-4">
              Verifique sua conexão com a internet e tente novamente.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const encomendasAguardando = encomendas.filter(e => e.status === 'aguardando');
  const encomendasRetiradas = encomendas.filter(e => e.status === 'retirada');

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <MoradorHeader title="Minhas Encomendas" />
      
      <div className="pt-28 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Alerta de Encomendas Aguardando */}
          {encomendasAguardando.length > 0 && (
            <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-md mb-4 mt-4">
              <Package className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-900 font-medium">
                Você tem {encomendasAguardando.length} encomenda(s) aguardando retirada!
              </AlertDescription>
            </Alert>
          )}

          {/* Card Principal de Encomendas */}
          <div className="mb-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Minhas Encomendas</h3>
                </div>

                {/* Seção Aguardando Retirada */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Aguardando Retirada ({encomendasAguardando.length})
                  </h4>
                  
                  {encomendasAguardando.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma encomenda aguardando retirada</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {encomendasAguardando.map(encomenda => (
                        <Card 
                          key={encomenda.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500" 
                          onClick={() => handleVerDetalhesEncomenda(encomenda)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {encomenda.foto_encomenda && (
                                <img 
                                  src={encomenda.foto_encomenda} 
                                  alt="Encomenda"
                                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                />
                              )}
                              {!encomenda.foto_encomenda && (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                  <Package className="w-10 h-10 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Aguardando Retirada
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  Registrada em: {format(new Date(encomenda.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {encomenda.porteiro_entrada && (
                                  <p className="text-xs text-gray-500">
                                    Por: {encomenda.porteiro_entrada}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seção Retiradas */}
                {encomendasRetiradas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Retiradas ({encomendasRetiradas.length})
                    </h4>
                    
                    <div className="grid gap-4">
                      {encomendasRetiradas.slice(0, 5).map(encomenda => (
                        <Card 
                          key={encomenda.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500" 
                          onClick={() => handleVerDetalhesEncomenda(encomenda)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {encomenda.foto_encomenda && (
                                <img 
                                  src={encomenda.foto_encomenda} 
                                  alt="Encomenda"
                                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 opacity-70"
                                />
                              )}
                              {!encomenda.foto_encomenda && (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center opacity-70">
                                  <Package className="w-10 h-10 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    Retirada Concluída
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  Retirada em: {format(new Date(encomenda.data_retirada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {encomenda.porteiro_saida && (
                                  <p className="text-xs text-gray-500">
                                    Por: {encomenda.porteiro_saida}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de Detalhes */}
          {showDetalhesEncomenda && selectedEncomenda && (
            <DetalhesEncomenda 
              encomenda={selectedEncomenda} 
              onClose={() => {
                setShowDetalhesEncomenda(false);
                setSelectedEncomenda(null);
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}