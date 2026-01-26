import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  UserCog,
  Wrench,
  ChevronRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "../components/utils/authUtils";
import { getCondominioContext } from "../components/utils/condominioContext";
import MoradorHeader from "../components/shared/MoradorHeader";
import OperationalFooter from "../components/shared/OperationalFooter";
import { limparCachePermissoes } from "../components/utils/permissoesUtils";

export default function Permissoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState(null);
  const [condominioId, setCondominioId] = useState(null);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [permissoes, setPermissoes] = useState({});
  const [savedMessage, setSavedMessage] = useState(false);

  // Lista de perfis
  const perfis = [
    {
      id: 'morador',
      nome: 'Morador',
      descricao: 'Residentes do condomínio',
      icon: Users,
      color: '#3b82f6'
    },
    {
      id: 'porteiro',
      nome: 'Portaria',
      descricao: 'Equipe de portaria',
      icon: Shield,
      color: '#10b981'
    },
    {
      id: 'administrador',
      nome: 'Administração',
      descricao: 'Equipe administrativa',
      icon: UserCog,
      color: '#8b5cf6'
    },
    {
      id: 'zelador',
      nome: 'Zeladoria',
      descricao: 'Equipe de zeladoria',
      icon: Wrench,
      color: '#f59e0b'
    },
    {
      id: 'sindico',
      nome: 'Síndico',
      descricao: 'Personalizar menu inicial',
      icon: UserCog,
      color: '#ec4899',
      apenasOcultarDoMenu: true
    }
  ];

  // Lista de todas as páginas/funcionalidades do sistema
  // IMPORTANTE: Cada ID é único e específico para cada perfil
  // Não compartilhar IDs entre funcionalidades de perfis diferentes
  const paginasDoSistema = [
    // Geral
    { id: 'dashboard', nome: 'Dashboard', categoria: 'Geral' },
    
    // Encomendas - IDs SEPARADOS por perfil
    { id: 'encomendas', nome: 'Encomendas (Morador)', categoria: 'Encomendas', apenasParaMoradores: true },
    { id: 'registrar_encomenda', nome: 'Registrar Encomenda', categoria: 'Encomendas', apenasParaFuncionarios: true },
    { id: 'retirar_encomenda', nome: 'Retirar Encomenda', categoria: 'Encomendas', apenasParaFuncionarios: true },
    { id: 'gerenciamento_encomendas', nome: 'Gerenciar Encomendas', categoria: 'Encomendas', apenasParaFuncionarios: true },
    
    // Controle de Acesso - IDs SEPARADOS por perfil
    { id: 'visitantes', nome: 'Visitantes (Morador)', categoria: 'Controle de Acesso', apenasParaMoradores: true },
    { id: 'visitantes_portaria', nome: 'Controle de Visitantes (Portaria)', categoria: 'Controle de Acesso', apenasParaFuncionarios: true },
    
    // Comunicação - IDs SEPARADOS por perfil
    { id: 'chamados', nome: 'Chamados (Morador)', categoria: 'Comunicação', apenasParaMoradores: true },
    { id: 'chamados_portaria', nome: 'Gestão de Chamados (Portaria)', categoria: 'Comunicação', apenasParaFuncionarios: true },
    { id: 'avisos', nome: 'Avisos (Morador)', categoria: 'Comunicação', apenasParaMoradores: true },
    { id: 'enviar_avisos', nome: 'Enviar Avisos', categoria: 'Comunicação', apenasParaFuncionarios: true },
    
    // Marketplace e Documentos
    { id: 'marketplace', nome: 'Marketplace', categoria: 'Marketplace' },
    { id: 'documentos', nome: 'Documentos', categoria: 'Documentos' },
    
    // Manutenção
    { id: 'manutencoes', nome: 'Manutenções', categoria: 'Manutenção' },
    { id: 'criar_manutencao', nome: 'Criar Manutenção', categoria: 'Manutenção', apenasParaFuncionarios: true },
    
    // Enquetes
    { id: 'enquetes', nome: 'Enquetes', categoria: 'Enquetes', apenasParaMoradores: true },
    { id: 'nova_enquete', nome: 'Criar Enquete', categoria: 'Enquetes', apenasParaFuncionarios: true },
    
    // Vistoria
    { id: 'vistoria_imoveis', nome: 'Vistoria de Imóveis', categoria: 'Vistoria', apenasParaMoradores: true },
    
    // Administração
    { id: 'moradores', nome: 'Gestão de Moradores', categoria: 'Administração', apenasParaFuncionarios: true },
    { id: 'aprovacao_moradores', nome: 'Aprovar Moradores', categoria: 'Administração', apenasParaFuncionarios: true },
    { id: 'funcionarios', nome: 'Gestão de Funcionários', categoria: 'Administração', apenasParaFuncionarios: true },
    { id: 'entregadores', nome: 'Gestão de Entregadores', categoria: 'Administração', apenasParaFuncionarios: true },
    
    // Relatórios e Configurações
    { id: 'relatorios', nome: 'Relatórios', categoria: 'Relatórios', apenasParaFuncionarios: true },
    { id: 'templates', nome: 'Templates de Notificação', categoria: 'Configurações', apenasParaFuncionarios: true },
    { id: 'whatsapp', nome: 'WhatsApp', categoria: 'Configurações', apenasParaFuncionarios: true },
    { id: 'notificacoes_whatsapp', nome: 'Notificações WhatsApp', categoria: 'Configurações', apenasParaFuncionarios: true },
    
    // Ajuda
    { id: 'como_usar', nome: 'Como Usar', categoria: 'Ajuda' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const role = await getUserRole();
      setUserType(role.userType);
      
      if (role.userType !== 'administrador') {
        return;
      }

      const context = await getCondominioContext();
      setCondominioId(context.condominioId);

      // Carregar permissões existentes do condomínio
      await carregarPermissoes(context.condominioId);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarPermissoes = async (condId) => {
    try {
      // Buscar configurações de permissões salvas
      // Vamos usar a entidade Condominio para salvar as permissões
      const condominios = await base44.entities.Condominio.list();
      const condominioAtual = condominios.find(c => c.id === condId);
      
      if (condominioAtual && condominioAtual.permissoes_perfis) {
        setPermissoes(condominioAtual.permissoes_perfis);
      } else {
        // Inicializar com permissões padrão
        const permissoesDefault = {
          morador: {},
          porteiro: {},
          administrador: {},
          zelador: {}
        };
        
        // Morador: acesso apenas às funções básicas
        paginasDoSistema.forEach(pagina => {
          const acessoMorador = ['dashboard', 'encomendas', 'visitantes', 'chamados', 'avisos', 'marketplace', 'documentos', 'manutencoes', 'enquetes', 'vistoria_imoveis', 'como_usar'].includes(pagina.id);
          permissoesDefault.morador[pagina.id] = acessoMorador;
        });

        // Porteiro: acesso a funções operacionais
        paginasDoSistema.forEach(pagina => {
          const acessoPorteiro = ['dashboard', 'registrar_encomenda', 'retirar_encomenda', 'visitantes_portaria', 'chamados_portaria', 'como_usar'].includes(pagina.id);
          permissoesDefault.porteiro[pagina.id] = acessoPorteiro;
        });

        // Administrador: acesso total
        paginasDoSistema.forEach(pagina => {
          permissoesDefault.administrador[pagina.id] = true;
        });

        // Zelador: acesso a manutenções
        paginasDoSistema.forEach(pagina => {
          const acessoZelador = ['dashboard', 'manutencoes', 'criar_manutencao', 'chamados_portaria', 'como_usar'].includes(pagina.id);
          permissoesDefault.zelador[pagina.id] = acessoZelador;
        });

        // Síndico: tudo visível por padrão (pode ocultar do menu, mas ainda tem acesso)
        paginasDoSistema.forEach(pagina => {
          permissoesDefault.sindico = permissoesDefault.sindico || {};
          permissoesDefault.sindico[pagina.id] = true;
        });

        setPermissoes(permissoesDefault);
      }
    } catch (err) {
      console.error("Erro ao carregar permissões:", err);
    }
  };

  const handleTogglePermissao = async (perfilId, paginaId, valor) => {
    // CORREÇÃO: Garantir que apenas o perfil selecionado é alterado
    // Manter todos os outros perfis intactos
    const novasPermissoes = {
      ...permissoes,
      [perfilId]: {
        ...(permissoes[perfilId] || {}),
        [paginaId]: valor
      }
    };

    console.log(`[PERMISSOES] Alterando perfil: ${perfilId}, feature: ${paginaId}, valor: ${valor}`);
    console.log('[PERMISSOES] Permissões antes:', JSON.stringify(permissoes[perfilId]));
    console.log('[PERMISSOES] Permissões depois:', JSON.stringify(novasPermissoes[perfilId]));

    setPermissoes(novasPermissoes);
    await salvarPermissoes(perfilId, paginaId, valor);
  };

  const salvarPermissoes = async (perfilAlterado, featureAlterada, novoValor) => {
    try {
      setSaving(true);
      
      // CORREÇÃO: Buscar dados frescos do servidor para evitar race conditions
      const condominios = await base44.entities.Condominio.list();
      const condominioAtual = condominios.find(c => c.id === condominioId);
      
      if (!condominioAtual) {
        console.error('[PERMISSOES] Condomínio não encontrado:', condominioId);
        return;
      }

      // Pegar permissões atuais do servidor (não do estado local que pode estar desatualizado)
      const permissoesAtuaisServidor = condominioAtual.permissoes_perfis || {};
      
      // CORREÇÃO CRÍTICA: Atualizar APENAS o perfil específico, preservando todos os outros
      const permissoesAtualizadas = {
        ...permissoesAtuaisServidor,
        [perfilAlterado]: {
          ...(permissoesAtuaisServidor[perfilAlterado] || {}),
          [featureAlterada]: novoValor
        }
      };

      console.log(`[PERMISSOES] Salvando apenas perfil: ${perfilAlterado}`);
      console.log('[PERMISSOES] Feature alterada:', featureAlterada, '=', novoValor);
      console.log('[PERMISSOES] Outros perfis preservados:', Object.keys(permissoesAtualizadas).filter(p => p !== perfilAlterado));

      // Preparar registro de auditoria
      const user = await base44.auth.me();
      const historicoAtual = condominioAtual.permissoes_historico || [];
      const novoRegistro = {
        usuario_id: user?.id || 'unknown',
        usuario_nome: user?.full_name || user?.email || 'Desconhecido',
        condominio_id: condominioId,
        perfil: perfilAlterado,
        feature_key: featureAlterada,
        acao: novoValor ? 'habilitado' : 'desabilitado',
        timestamp: new Date().toISOString()
      };
      
      // Manter apenas os últimos 100 registros
      const historicoAtualizado = [novoRegistro, ...historicoAtual].slice(0, 100);
      
      // Salvar no banco
      await base44.entities.Condominio.update(condominioAtual.id, {
        permissoes_perfis: permissoesAtualizadas,
        permissoes_historico: historicoAtualizado
      });

      // Atualizar estado local com dados do servidor
      setPermissoes(permissoesAtualizadas);

      // Limpar cache para forçar recarregamento das permissões em outros componentes
      limparCachePermissoes();
      
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);

    } catch (err) {
      console.error("[PERMISSOES] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const agruparPorCategoria = () => {
    const grupos = {};
    paginasDoSistema.forEach(pagina => {
      if (!grupos[pagina.categoria]) {
        grupos[pagina.categoria] = [];
      }
      grupos[pagina.categoria].push(pagina);
    });
    return grupos;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#f7f7f7' }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#3b5998' }} />
      </div>
    );
  }

  if (userType !== 'administrador') {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#f7f7f7' }}>
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas síndicos podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  if (perfilSelecionado) {
    const perfil = perfis.find(p => p.id === perfilSelecionado);
    const grupos = agruparPorCategoria();

    return (
      <div className="min-h-screen pb-6" style={{ backgroundColor: '#f7f7f7' }}>
        <MoradorHeader 
          title={perfil.nome}
          onBack={() => setPerfilSelecionado(null)}
        />

        {/* Saved Message */}
        <AnimatePresence>
          {savedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 z-50"
            >
              <div className="px-4 py-2 rounded-lg shadow-lg flex items-center gap-2" style={{ backgroundColor: '#10b981', color: 'white' }}>
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Permissões salvas!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="px-3 pt-28 max-w-4xl mx-auto">
          {/* Info para Síndico */}
          {perfilSelecionado === 'sindico' && (
            <Card className="mb-4 border-2" style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d' }}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <UserCog className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#92400e' }}>Personalização do Menu</h4>
                    <p className="text-xs" style={{ color: '#b45309' }}>
                      Desative os itens que não deseja ver no Menu Completo da sua página inicial. 
                      Você ainda terá acesso a todas as funcionalidades, apenas não aparecerão no menu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-3">
            {Object.entries(grupos).map(([categoria, paginas]) => (
              <Card key={categoria} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#3b5998' }}>
                    {categoria}
                  </h3>
                  <div className="space-y-1">
                    {paginas.map(pagina => {
                      // Verificar se item é bloqueado para este perfil
                      const isMorador = perfilSelecionado === 'morador';
                      const isSindico = perfilSelecionado === 'sindico';
                      const isAdministrador = perfilSelecionado === 'administrador';
                      const isFuncionario = ['porteiro', 'zelador', 'administrador', 'sindico'].includes(perfilSelecionado);
                      
                      // Itens exclusivos de moradores não aparecem para funcionários
                      const bloqueadoPorPerfil = pagina.apenasParaMoradores && !isMorador && !isAdministrador && !isSindico;
                      // Itens exclusivos de funcionários não aparecem para moradores
                      const bloqueadoParaMorador = pagina.apenasParaFuncionarios && isMorador;
                      
                      const isBloqueado = bloqueadoPorPerfil || bloqueadoParaMorador;
                      
                      // Não mostrar itens bloqueados na lista
                      if (isBloqueado) return null;
                      
                      return (
                        <div
                          key={pagina.id}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 text-sm">{pagina.nome}</span>
                            {isSindico && (
                              <Badge className="text-[10px] px-1.5 py-0.5" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                                Menu
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={permissoes[perfilSelecionado]?.[pagina.id] ?? true}
                            onCheckedChange={(valor) => handleTogglePermissao(perfilSelecionado, pagina.id, valor)}
                            disabled={saving}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6" style={{ backgroundColor: '#f7f7f7' }}>
      <MoradorHeader title="Permissões" />

      {/* Content */}
      <div className="px-3 pt-28 max-w-4xl mx-auto">
        <div className="grid gap-3 md:grid-cols-2">
          {perfis.map(perfil => (
            <motion.div
              key={perfil.id}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer bg-white shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setPerfilSelecionado(perfil.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${perfil.color}20` }}
                      >
                        <perfil.icon className="w-6 h-6" style={{ color: perfil.color }} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{perfil.nome}</h3>
                        <p className="text-xs text-gray-500">{perfil.descricao}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: '#3b5998' }} />
                  </div>

                  {/* Preview de permissões ativas */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Funções ativas:</span>
                      <Badge 
                        className="text-xs"
                        style={{ backgroundColor: '#dfe3ee', color: '#3b5998' }}
                      >
                        {Object.values(permissoes[perfil.id] || {}).filter(Boolean).length} / {paginasDoSistema.length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <Card className="mt-4 border-2" style={{ backgroundColor: '#e3f2fd', borderColor: '#90caf9' }}>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#3b5998' }} />
              <div>
                <h4 className="font-semibold mb-1" style={{ color: '#3b5998' }}>Importante:</h4>
                <ul className="text-xs space-y-1" style={{ color: '#1565c0' }}>
                  <li>• Apenas moradores contam no limite do plano contratado</li>
                  <li>• Funcionários não recebem notificações de encomendas nem participam de enquetes</li>
                  <li>• As permissões são aplicadas imediatamente após salvar</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <OperationalFooter />
    </div>
  );
}