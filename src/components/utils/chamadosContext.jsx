import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { safeAuthCall, safeEntityCall, SessionCache } from "./apiCache";

const ChamadosContext = createContext();

export function useChamados() {
  const context = useContext(ChamadosContext);
  if (!context) {
    throw new Error('useChamados must be used within a ChamadosProvider');
  }
  return context;
}

export function ChamadosProvider({ children }) {
  const [chamadosPendentes, setChamadosPendentes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [condominioId, setCondominioId] = useState(null);
  const [forcarAtualizacao, setForcarAtualizacao] = useState(0);
  
  const isLoadingRef = useRef(false);
  const lastLoadRef = useRef(0);

  const contarChamadosPendentes = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingRef.current) {
      console.log('[CHAMADOS CONTEXT] Já está carregando, ignorando...');
      return;
    }

    // Throttle: não carregar mais de uma vez a cada 30 segundos
    const now = Date.now();
    if (now - lastLoadRef.current < 30000) {
      console.log('[CHAMADOS CONTEXT] Throttle ativo, ignorando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      lastLoadRef.current = now;
      
      console.log('[CHAMADOS CONTEXT] Iniciando contagem de chamados...');
      
      // Cache de 10 minutos
      const cachedCount = SessionCache.get('chamados_pendentes_count');
      const cachedTime = SessionCache.get('chamados_pendentes_time');
      
      // Se cache válido (< 10 minutos), usar
      if (cachedCount !== null && cachedTime && (now - cachedTime) < 600000) {
        console.log('[CHAMADOS CONTEXT] ✅ Usando cache:', cachedCount);
        setChamadosPendentes(cachedCount);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      console.log('[CHAMADOS CONTEXT] Buscando usuário atual via safeAuthCall...');
      
      // Delay inicial para garantir inicialização
      await new Promise(resolve => setTimeout(resolve, 500));

      // Usar safeAuthCall que tem retry automático
      let user;
      try {
        user = await safeAuthCall('me');
      } catch (err) {
        console.error('[CHAMADOS CONTEXT] Erro ao obter usuário:', err);
        setChamadosPendentes(0);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      if (!user || !user.email) {
        console.log('[CHAMADOS CONTEXT] Usuário não autenticado');
        setChamadosPendentes(0);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      console.log('[CHAMADOS CONTEXT] ✅ Usuário autenticado:', user.email);

      // Delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));

      // Cache de moradores - usar SessionCache
      let todosMoradores;
      const cachedMoradores = SessionCache.get('moradores_cache');
      
      if (cachedMoradores) {
        console.log('[CHAMADOS CONTEXT] ✅ Usando cache de moradores');
        todosMoradores = cachedMoradores;
      } else {
        console.log('[CHAMADOS CONTEXT] Carregando moradores via safeEntityCall...');
        
        try {
          todosMoradores = await safeEntityCall('Morador', 'list');
          
          if (todosMoradores && todosMoradores.length > 0) {
            SessionCache.set('moradores_cache', todosMoradores, 20); // 20 minutos
            console.log('[CHAMADOS CONTEXT] 💾 Cache de moradores salvo');
          }
        } catch (err) {
          console.error('[CHAMADOS CONTEXT] ❌ Erro ao carregar moradores:', err);
          setChamadosPendentes(0);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
      }

      const moradorLogado = todosMoradores.find(
        m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (!moradorLogado) {
        console.log('[CHAMADOS CONTEXT] Morador não encontrado para:', user.email);
        setChamadosPendentes(0);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      console.log('[CHAMADOS CONTEXT] ✅ Morador encontrado:', moradorLogado.nome, '- Tipo:', moradorLogado.tipo_usuario);

      setUserType(moradorLogado.tipo_usuario);
      setCondominioId(moradorLogado.condominio_id);

      if (moradorLogado.tipo_usuario !== 'administrador' && moradorLogado.tipo_usuario !== 'porteiro') {
        console.log('[CHAMADOS CONTEXT] Usuário não é admin/porteiro, sem chamados');
        setChamadosPendentes(0);
        SessionCache.set('chamados_pendentes_count', 0, 10);
        SessionCache.set('chamados_pendentes_time', now, 10);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      // Delay antes da próxima requisição
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[CHAMADOS CONTEXT] Carregando chamados via safeEntityCall...');
      
      let todosChamados;
      try {
        todosChamados = await safeEntityCall('Chamado', 'list', '-created_date');
      } catch (err) {
        console.error('[CHAMADOS CONTEXT] ❌ Erro ao carregar chamados:', err);
        setChamadosPendentes(0);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }
      
      let chamadosFiltrados = todosChamados.filter(chamado => {
        const moradorDoChamado = todosMoradores.find(m => m.id === chamado.morador_id);
        if (!moradorDoChamado || moradorDoChamado.condominio_id !== moradorLogado.condominio_id) {
          return false;
        }

        if (moradorLogado.tipo_usuario === 'administrador') {
          return chamado.destinatario === 'sindico';
        } else if (moradorLogado.tipo_usuario === 'porteiro') {
          return chamado.destinatario === 'portaria';
        }
        return false;
      });

      const pendentesCount = chamadosFiltrados.filter(
        c => c.status === 'aberto' || c.status === 'em_andamento'
      ).length;

      console.log('[CHAMADOS CONTEXT] ✅ Chamados pendentes:', pendentesCount);

      setChamadosPendentes(pendentesCount);
      
      SessionCache.set('chamados_pendentes_count', pendentesCount, 10);
      SessionCache.set('chamados_pendentes_time', now, 10);
      
      setLoading(false);
    } catch (error) {
      console.error('[CHAMADOS CONTEXT] ❌ Erro ao contar chamados pendentes:', error.message || error);
      console.error('[CHAMADOS CONTEXT] Stack trace:', error.stack);
      setChamadosPendentes(0);
      setLoading(false);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Delay inicial maior para garantir que tudo está carregado
    const timer = setTimeout(() => {
      contarChamadosPendentes();
    }, 1500); // Aumentado para 1.5s
    
    // Atualizar a cada 10 minutos
    const interval = setInterval(contarChamadosPendentes, 600000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [contarChamadosPendentes, forcarAtualizacao]);

  const notificarNovoChamado = useCallback(() => {
    console.log('[CHAMADOS CONTEXT] Notificando novo chamado');
    SessionCache.remove('chamados_pendentes_count');
    SessionCache.remove('chamados_pendentes_time');
    
    // Aguardar 2 segundos antes de atualizar
    setTimeout(() => {
      setForcarAtualizacao(prev => prev + 1);
    }, 2000);
  }, []);

  const atualizarChamados = useCallback(() => {
    console.log('[CHAMADOS CONTEXT] Atualizando chamados');
    SessionCache.remove('chamados_pendentes_count');
    SessionCache.remove('chamados_pendentes_time');
    
    // Aguardar 2 segundos antes de atualizar
    setTimeout(() => {
      setForcarAtualizacao(prev => prev + 1);
    }, 2000);
  }, []);

  return (
    <ChamadosContext.Provider value={{ 
      chamadosPendentes, 
      loading,
      notificarNovoChamado,
      atualizarChamados,
      forcarAtualizacao,
      userType,
      condominioId
    }}>
      {children}
    </ChamadosContext.Provider>
  );
}