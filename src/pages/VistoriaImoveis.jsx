import React, { useState, useEffect } from 'react';
import { ImovelVistoria } from "@/entities/ImovelVistoria";
import { Vistoria } from "@/entities/Vistoria";
import { Inquilino } from "@/entities/Inquilino";
import { CreditoVistoria } from "@/entities/CreditoVistoria";
import { Morador } from "@/entities/Morador";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Home,
  Plus,
  Loader2,
  AlertCircle,
  ClipboardCheck,
  UserPlus,
  Building2,
  MessageCircle,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import MoradorHeader from '../components/shared/MoradorHeader';
import ImovelCard from '../components/vistoria/ImovelCard';
import NovoImovelModal from '../components/vistoria/NovoImovelModal';
import GerenciarInquilinoModal from '../components/vistoria/GerenciarInquilinoModal';

export default function VistoriaImoveis() {
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);
  const [vistorias, setVistorias] = useState([]);
  const [inquilinos, setInquilinos] = useState([]);
  const [creditos, setCreditos] = useState(null);
  const [moradorLogado, setMoradorLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showMenu, setShowMenu] = useState(false);
  const [showNovoImovel, setShowNovoImovel] = useState(false);
  const [showInquilino, setShowInquilino] = useState(false);
  const [imovelSelecionado, setImovelSelecionado] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [imovelParaExcluir, setImovelParaExcluir] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

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

        if (!morador) {
          setError('Cadastro não encontrado.');
          setLoading(false);
          return;
        }

        setMoradorLogado(morador);

        // Carregar imóveis do morador
        const todosImoveis = await ImovelVistoria.list();
        if (!isMounted) return;

        const imoveisDoMorador = todosImoveis.filter(i => i.morador_id === morador.id);
        setImoveis(imoveisDoMorador);

        // Carregar vistorias
        const todasVistorias = await Vistoria.list('-created_date');
        if (!isMounted) return;

        const vistoriasDoMorador = todasVistorias.filter(v => v.morador_id === morador.id);
        setVistorias(vistoriasDoMorador);

        // Carregar inquilinos
        const todosInquilinos = await Inquilino.list();
        if (!isMounted) return;

        const inquilinosDoMorador = todosInquilinos.filter(i => i.morador_proprietario_id === morador.id);
        setInquilinos(inquilinosDoMorador);

        // Carregar ou criar créditos
        const todosCreditos = await CreditoVistoria.list();
        if (!isMounted) return;

        let creditoMorador = todosCreditos.find(c => c.morador_id === morador.id);

        if (!creditoMorador) {
          // Criar crédito inicial (1 imóvel grátis)
          creditoMorador = await CreditoVistoria.create({
            morador_id: morador.id,
            creditos_disponiveis: 1,
            creditos_usados: imoveisDoMorador.length,
            historico: [{
              data: new Date().toISOString(),
              acao: 'Crédito inicial',
              quantidade: 1,
              observacao: 'Crédito padrão de 1 imóvel',
              realizado_por: 'Sistema'
            }]
          });
        }

        setCreditos(creditoMorador);
        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        console.error('[VISTORIA] Erro ao carregar:', err);
        setError('Erro ao carregar dados.');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNovaVistoria = (imovel) => {
    setShowMenu(false);
    navigate(createPageUrl('NovaVistoria') + `?imovelId=${imovel.id}`);
  };

  const handleNovoImovel = () => {
    if (!creditos || creditos.creditos_usados >= creditos.creditos_disponiveis) {
      // Sem créditos - redirecionar para WhatsApp
      const telefone = '5521992509088';
      const mensagem = encodeURIComponent('Olá, quero cadastrar mais imóveis no aplicativo Click Mora. Pode me ajudar?');
      window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
      return;
    }

    setShowNovoImovel(true);
    setShowMenu(false);
  };

  const handleGerenciarInquilino = (imovel) => {
    setImovelSelecionado(imovel);
    setShowInquilino(true);
    setShowMenu(false);
  };

  const handleExcluirImovel = (imovel) => {
    setImovelParaExcluir(imovel);
    setShowConfirmDelete(true);
  };

  const confirmarExclusao = async () => {
    if (!imovelParaExcluir) return;

    setDeleting(true);
    try {
      await ImovelVistoria.delete(imovelParaExcluir.id);
      
      // Atualizar créditos (diminuir usado)
      if (creditos) {
        await CreditoVistoria.update(creditos.id, {
          creditos_usados: Math.max(0, (creditos.creditos_usados || 1) - 1)
        });
      }

      setShowConfirmDelete(false);
      setImovelParaExcluir(null);
      reloadData();
    } catch (err) {
      console.error('[VISTORIA] Erro ao excluir imóvel:', err);
      setError('Erro ao excluir imóvel. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const reloadData = async () => {
    setLoading(true);
    try {
      const todosImoveis = await ImovelVistoria.list();
      const imoveisDoMorador = todosImoveis.filter(i => i.morador_id === moradorLogado.id);
      setImoveis(imoveisDoMorador);

      const todasVistorias = await Vistoria.list('-created_date');
      const vistoriasDoMorador = todasVistorias.filter(v => v.morador_id === moradorLogado.id);
      setVistorias(vistoriasDoMorador);

      const todosInquilinos = await Inquilino.list();
      const inquilinosDoMorador = todosInquilinos.filter(i => i.morador_proprietario_id === moradorLogado.id);
      setInquilinos(inquilinosDoMorador);

      const todosCreditos = await CreditoVistoria.list();
      const creditoMorador = todosCreditos.find(c => c.morador_id === moradorLogado.id);
      setCreditos(creditoMorador);

    } catch (err) {
      console.error('[VISTORIA] Erro ao recarregar:', err);
    } finally {
      setLoading(false);
    }
  };

  const podeAdicionarImovel = creditos && creditos.creditos_usados < creditos.creditos_disponiveis;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Vistoria Imóveis" />
        <div className="flex flex-col items-center justify-center pt-24 pb-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998]" />
          <p className="text-gray-600">Carregando imóveis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="Vistoria Imóveis" />
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
    <div className="min-h-screen bg-[#f7f7f7] pb-24">
      <MoradorHeader title="Vistoria Imóveis" />
      
      <div className="pt-16 px-4">
        {/* Card de Informação de Créditos */}
        <Card className="bg-gradient-to-r from-[#3b5998] to-[#8b9dc3] text-white border-0 shadow-lg mb-4 mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Imóveis cadastrados</p>
                <p className="text-2xl font-bold">
                  {creditos?.creditos_usados || 0} / {creditos?.creditos_disponiveis || 1}
                </p>
              </div>
              <Home className="w-12 h-12 opacity-80" />
            </div>
            {!podeAdicionarImovel && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-3 bg-white text-[#3b5998] hover:bg-gray-100"
                onClick={() => {
                  const telefone = '5521992509088';
                  const mensagem = encodeURIComponent('Olá, quero cadastrar mais imóveis no aplicativo Click Mora. Pode me ajudar?');
                  window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Solicitar Mais Créditos
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Lista de Imóveis */}
        <div className="space-y-4 mt-4">
          {imoveis.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum imóvel cadastrado
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Cadastre seu primeiro imóvel para começar a fazer vistorias
                </p>
                <Button
                  onClick={handleNovoImovel}
                  className="bg-[#3b5998] hover:bg-[#2d4373]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Imóvel
                </Button>
              </CardContent>
            </Card>
          ) : (
            imoveis.map((imovel, index) => {
              const vistoriasDoImovel = vistorias.filter(v => v.imovel_id === imovel.id);
              const inquilinoAtual = inquilinos.find(i => i.imovel_id === imovel.id && i.status === 'Ativo');
              
              return (
                <motion.div
                  key={imovel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ImovelCard
                    imovel={imovel}
                    vistorias={vistoriasDoImovel}
                    inquilino={inquilinoAtual}
                    onNovaVistoria={() => handleNovaVistoria(imovel)}
                    onGerenciarInquilino={() => handleGerenciarInquilino(imovel)}
                    onExcluir={() => handleExcluirImovel(imovel)}
                  />
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Botão Flutuante de Ação (FAB) */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-4 bg-white rounded-2xl shadow-2xl p-3 z-50 min-w-[200px]"
            >
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (imoveis.length > 0) {
                      handleNovaVistoria(imoveis[0]);
                    }
                  }}
                  disabled={imoveis.length === 0}
                  className="w-full justify-start bg-[#3b5998] hover:bg-[#2d4373] text-white"
                  size="sm"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Nova Vistoria
                </Button>

                <Button
                  onClick={() => {
                    if (imoveis.length > 0) {
                      handleGerenciarInquilino(imoveis[0]);
                    }
                  }}
                  disabled={imoveis.length === 0}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Inquilino
                </Button>

                <Button
                  onClick={handleNovoImovel}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Cadastrar Imóvel
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#3b5998] text-white rounded-full shadow-2xl flex items-center justify-center z-30"
      >
        <Plus className={`w-6 h-6 transition-transform ${showMenu ? 'rotate-45' : ''}`} />
      </motion.button>

      {/* Nova Vistoria agora é uma página dedicada */}

      {showNovoImovel && (
        <NovoImovelModal
          moradorLogado={moradorLogado}
          onClose={() => setShowNovoImovel(false)}
          onSuccess={reloadData}
        />
      )}

      {showInquilino && imovelSelecionado && (
        <GerenciarInquilinoModal
          imovel={imovelSelecionado}
          moradorLogado={moradorLogado}
          inquilinoAtual={inquilinos.find(i => i.imovel_id === imovelSelecionado.id && i.status === 'Ativo')}
          onClose={() => {
            setShowInquilino(false);
            setImovelSelecionado(null);
          }}
          onSuccess={reloadData}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Excluir Imóvel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o imóvel <strong>"{imovelParaExcluir?.titulo}"</strong>?
              <br /><br />
              Esta ação não pode ser desfeita e todas as vistorias associadas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}