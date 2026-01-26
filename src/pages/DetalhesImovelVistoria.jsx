import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImovelVistoria } from "@/entities/ImovelVistoria";
import { Vistoria } from "@/entities/Vistoria";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft, QrCode } from "lucide-react";

import AbaImovel from '../components/vistoria/AbaImovel';
import AbaAmbientes from '../components/vistoria/AbaAmbientes';

export default function DetalhesImovelVistoria() {
  const { imovelId } = useParams();
  const navigate = useNavigate();
  
  const [imovel, setImovel] = useState(null);
  const [vistoriaAtual, setVistoriaAtual] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('imovel');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log('[DETALHES IMOVEL] 🔄 Iniciando carregamento...', { imovelId });
        setLoading(true);
        setError('');

        const user = await User.me();
        if (!isMounted) return;

        console.log('[DETALHES IMOVEL] ✅ Usuário autenticado:', user?.email);

        if (!user || !user.email) {
          console.error('[DETALHES IMOVEL] ❌ Usuário não autenticado');
          setError('Usuário não autenticado.');
          setLoading(false);
          return;
        }

        const todosMoradores = await Morador.list();
        if (!isMounted) return;

        const morador = todosMoradores.find(
          m => m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        if (!morador) {
          console.error('[DETALHES IMOVEL] ❌ Cadastro não encontrado');
          setError('Cadastro não encontrado.');
          setLoading(false);
          return;
        }

        console.log('[DETALHES IMOVEL] ✅ Morador carregado:', morador.nome);
        setMoradorLogado(morador);

        const todosImoveis = await ImovelVistoria.list();
        if (!isMounted) return;

        console.log('[DETALHES IMOVEL] 📥 Total de imóveis:', todosImoveis.length);

        const imovelEncontrado = todosImoveis.find(i => i.id === imovelId);

        if (!imovelEncontrado) {
          console.error('[DETALHES IMOVEL] ❌ Imóvel não encontrado:', imovelId);
          setError('Imóvel não encontrado.');
          setLoading(false);
          return;
        }

        if (imovelEncontrado.morador_id !== morador.id) {
          console.error('[DETALHES IMOVEL] ❌ Imóvel não pertence ao morador');
          setError('Você não tem permissão para acessar este imóvel.');
          setLoading(false);
          return;
        }

        console.log('[DETALHES IMOVEL] ✅ Imóvel carregado:', imovelEncontrado.titulo);
        setImovel(imovelEncontrado);

        const todasVistorias = await Vistoria.list('-created_date');
        if (!isMounted) return;

        const vistoriaRascunho = todasVistorias.find(
          v => v.imovel_id === imovelId && v.rascunho === true
        );

        if (vistoriaRascunho) {
          console.log('[DETALHES IMOVEL] ✅ Vistoria em andamento encontrada');
          setVistoriaAtual(vistoriaRascunho);
        } else {
          console.log('[DETALHES IMOVEL] 📝 Criando nova vistoria...');
          const novaVistoria = await Vistoria.create({
            imovel_id: imovelId,
            morador_id: morador.id,
            data_vistoria: new Date().toISOString().split('T')[0],
            tipo_vistoria: 'Entrada',
            status_geral: 'Bom',
            rascunho: true,
            realizado_por: morador.nome,
            etapa_atual: 1,
            ambientes: []
          });
          console.log('[DETALHES IMOVEL] ✅ Nova vistoria criada');
          setVistoriaAtual(novaVistoria);
        }

        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        console.error('[DETALHES IMOVEL] ❌ Erro ao carregar:', err);
        setError(`Erro ao carregar imóvel: ${err.message}`);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [imovelId]);

  const handleFinalizarVistoria = async () => {
    if (!vistoriaAtual) return;

    if (!window.confirm('Deseja finalizar a vistoria? Após finalizar, não será possível editá-la.')) {
      return;
    }

    try {
      await Vistoria.update(vistoriaAtual.id, {
        rascunho: false
      });

      await ImovelVistoria.update(imovel.id, {
        ultima_vistoria_data: new Date().toISOString()
      });

      alert('✅ Vistoria finalizada com sucesso!');
      navigate('/VistoriaImoveis');

    } catch (err) {
      console.error('[DETALHES IMOVEL] Erro ao finalizar:', err);
      alert('Erro ao finalizar vistoria.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998] mx-auto mb-4" />
          <p className="text-gray-600">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (error || !imovel) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-4 pt-20">
        <Button
          onClick={() => navigate('/VistoriaImoveis')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Imóvel não encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header Fixo */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ backgroundColor: '#3b5998' }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <h1 className="flex-1 text-lg font-semibold text-center pr-10 text-white truncate px-4">
            {imovel.titulo}
          </h1>

          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <QrCode className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white/10">
          <button
            onClick={() => setActiveTab('imovel')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'imovel'
                ? 'text-white border-b-2 border-white'
                : 'text-white/70'
            }`}
          >
            IMÓVEL
          </button>
          <button
            onClick={() => setActiveTab('ambientes')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'ambientes'
                ? 'text-white border-b-2 border-white'
                : 'text-white/70'
            }`}
          >
            AMBIENTES
          </button>
          <button
            disabled
            className="flex-1 py-3 text-sm font-medium text-white/40"
          >
            CHAVES
          </button>
          <button
            disabled
            className="flex-1 py-3 text-sm font-medium text-white/40"
          >
            MEDIDORES
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pt-32 pb-24 px-4">
        {activeTab === 'imovel' && (
          <AbaImovel 
            imovel={imovel} 
            vistoria={vistoriaAtual}
            moradorLogado={moradorLogado}
          />
        )}

        {activeTab === 'ambientes' && (
          <AbaAmbientes 
            vistoria={vistoriaAtual}
            onUpdate={(vistoriaAtualizada) => setVistoriaAtual(vistoriaAtualizada)}
          />
        )}
      </div>

      {/* Botão Fixo Inferior */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button
          onClick={handleFinalizarVistoria}
          className="w-full h-14 text-lg font-semibold rounded-full"
          style={{ backgroundColor: '#4a4a4a' }}
        >
          Finalizar vistoria
        </Button>
      </div>
    </div>
  );
}