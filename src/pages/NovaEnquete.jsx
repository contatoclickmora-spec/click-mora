import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  List,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "../components/utils/authUtils";
import { getCondominioContext } from "../components/utils/condominioContext";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NovaEnquetePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [nome, setNome] = useState("");
  const [dataEncerramento, setDataEncerramento] = useState(null);
  const [perguntas, setPerguntas] = useState([]);
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPerguntaModal, setShowPerguntaModal] = useState(false);
  const [showTipoRespostaModal, setShowTipoRespostaModal] = useState(false);
  
  const [perguntaAtual, setPerguntaAtual] = useState({
    pergunta: "",
    tipo_resposta: "",
    alternativas: []
  });
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleContinuarStep1 = () => {
    if (!nome.trim()) {
      setError("Digite o nome da enquete");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (!dataEncerramento) {
      setError("Selecione a data de encerramento");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setStep(2);
  };

  const handleContinuarStep2 = () => {
    if (perguntas.length === 0) {
      setError("Adicione pelo menos uma pergunta");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setStep(3);
  };

  const handleIncluirPergunta = () => {
    setPerguntaAtual({
      pergunta: "",
      tipo_resposta: "",
      alternativas: []
    });
    setShowPerguntaModal(true);
  };

  const handleSelecionarTipoResposta = (tipo) => {
    setPerguntaAtual(prev => ({ ...prev, tipo_resposta: tipo }));
    setShowTipoRespostaModal(false);
    
    if (tipo === 'multipla_escolha') {
      setPerguntaAtual(prev => ({
        ...prev,
        alternativas: [
          { letra: 'A', texto: '' },
          { letra: 'B', texto: '' },
          { letra: 'C', texto: '' },
          { letra: 'D', texto: '' },
          { letra: 'E', texto: '' }
        ]
      }));
    } else {
      setPerguntaAtual(prev => ({ ...prev, alternativas: [] }));
    }
  };

  const handleSalvarPergunta = () => {
    if (!perguntaAtual.pergunta.trim()) {
      setError("Digite a pergunta");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (!perguntaAtual.tipo_resposta) {
      setError("Selecione o tipo de resposta");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (perguntaAtual.tipo_resposta === 'multipla_escolha') {
      const alternativasPreenchidas = perguntaAtual.alternativas.filter(a => a.texto.trim());
      if (alternativasPreenchidas.length < 2) {
        setError("Preencha pelo menos 2 alternativas");
        setTimeout(() => setError(""), 3000);
        return;
      }
    }
    
    setPerguntas([...perguntas, { ...perguntaAtual, ordem: perguntas.length + 1 }]);
    setShowPerguntaModal(false);
    setPerguntaAtual({ pergunta: "", tipo_resposta: "", alternativas: [] });
  };

  const handleRemoverPergunta = (index) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const handleAdicionarAlternativa = () => {
    const proximaLetra = String.fromCharCode(65 + perguntaAtual.alternativas.length);
    setPerguntaAtual(prev => ({
      ...prev,
      alternativas: [...prev.alternativas, { letra: proximaLetra, texto: '' }]
    }));
  };

  const handleAlternativaChange = (index, texto) => {
    const novasAlternativas = [...perguntaAtual.alternativas];
    novasAlternativas[index].texto = texto;
    setPerguntaAtual(prev => ({ ...prev, alternativas: novasAlternativas }));
  };

  const handleFinalizarEnquete = async () => {
    try {
      setLoading(true);
      setError("");

      const role = await getUserRole();
      const context = await getCondominioContext();

      const enqueteData = {
        nome,
        data_encerramento: format(dataEncerramento, 'yyyy-MM-dd'),
        status: 'ativa',
        criado_por: role.user.email,
        criado_por_nome: role.user.full_name,
        total_perguntas: perguntas.length,
        total_votos: 0,
        condominio_id: context.condominioId
      };

      const enqueteCriada = await base44.entities.Enquete.create(enqueteData);

      for (const pergunta of perguntas) {
        await base44.entities.PerguntaEnquete.create({
          enquete_id: enqueteCriada.id,
          condominio_id: context.condominioId,
          pergunta: pergunta.pergunta,
          tipo_resposta: pergunta.tipo_resposta,
          alternativas: pergunta.tipo_resposta === 'multipla_escolha' 
            ? pergunta.alternativas.filter(a => a.texto.trim()).map(a => ({ ...a, votos: 0 }))
            : [],
          ordem: pergunta.ordem
        });
      }

      window.history.back();
    } catch (err) {
      console.error("Erro ao criar enquete:", err);
      setError("Erro ao criar enquete. Tente novamente.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
  };

  const handleConfirmarData = () => {
    if (selectedDate) {
      setDataEncerramento(selectedDate);
      setShowCalendar(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const hoje = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-[#3b5998] text-white p-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <h1 className="text-2xl font-semibold">Nova enquete</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="bg-white py-4 px-4 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-gray-600 mb-3">
            {step === 1 && 'Informacoes gerais'}
            {step === 2 && 'Perguntas'}
            {step === 3 && 'Revisar e enviar'}
          </p>
          <div className="flex gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#3b5998]' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#3b5998]' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-[#3b5998]' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-14 bg-white border border-gray-300 rounded-lg text-base"
            />

            <div className="relative">
              <Input
                placeholder="Data de encerramento"
                value={dataEncerramento ? format(dataEncerramento, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                readOnly
                onClick={() => setShowCalendar(true)}
                className="h-14 bg-white border border-gray-300 rounded-lg text-base pr-12 cursor-pointer"
              />
              <CalendarIcon 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
              />
            </div>

            <Button
              onClick={handleContinuarStep1}
              className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-base font-semibold mt-8"
            >
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {perguntas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-6">
                  Nenhuma pergunta cadastrada, inclua as perguntas da enquete para avancar
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {perguntas.map((p, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">{p.pergunta}</p>
                        {p.tipo_resposta === 'multipla_escolha' && (
                          <div className="space-y-1 mt-2">
                            {p.alternativas.filter(a => a.texto.trim()).map((alt) => (
                              <p key={alt.letra} className="text-sm text-gray-700">
                                {alt.letra} - {alt.texto}
                              </p>
                            ))}
                          </div>
                        )}
                        {p.tipo_resposta === 'descritiva' && (
                          <p className="text-sm text-gray-500 italic">Resposta descritiva</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoverPergunta(index)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleIncluirPergunta}
              variant="outline"
              className="w-full h-14 border-2 border-gray-300 rounded-full text-base font-semibold hover:bg-gray-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Incluir pergunta
            </Button>

            <Button
              onClick={handleContinuarStep2}
              disabled={perguntas.length === 0}
              className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-base font-semibold mt-8 disabled:opacity-50"
            >
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Nome</p>
                <p className="text-base text-gray-900">{nome}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Data de encerramento</p>
                <p className="text-base text-gray-900">
                  {format(dataEncerramento, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Perguntas</p>
                <div className="space-y-4">
                  {perguntas.map((p, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-medium text-gray-900 mb-2">{p.pergunta}</p>
                      {p.tipo_resposta === 'multipla_escolha' && (
                        <div className="space-y-1">
                          {p.alternativas.filter(a => a.texto.trim()).map((alt) => (
                            <p key={alt.letra} className="text-sm text-gray-700">
                              {alt.letra} - {alt.texto}
                            </p>
                          ))}
                        </div>
                      )}
                      {p.tipo_resposta === 'descritiva' && (
                        <p className="text-sm text-gray-500 italic">Resposta descritiva</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleFinalizarEnquete}
              disabled={loading}
              className="w-full h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-full text-base font-semibold mt-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#3b5998]">Data de encerramento</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {daysInMonth.map((day, i) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isPast = !isAfter(day, hoje) && !isSameDay(day, hoje);
                  const isToday = isSameDay(day, hoje);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => !isPast && handleSelectDate(day)}
                      disabled={isPast}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm
                        ${isSelected ? 'bg-[#3b5998] text-white font-semibold' : ''}
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                        ${isToday && !isSelected ? 'border-2 border-[#3b5998]' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCalendar(false)}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarData}
                  disabled={!selectedDate}
                  className="flex-1 h-12 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-lg"
                >
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPerguntaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPerguntaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#3b5998]">Criar uma pergunta</h3>
                <button
                  onClick={() => setShowPerguntaModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Textarea
                  placeholder="Qual a pergunta"
                  value={perguntaAtual.pergunta}
                  onChange={(e) => setPerguntaAtual(prev => ({ ...prev, pergunta: e.target.value }))}
                  rows={4}
                  className="border border-gray-300 rounded-lg resize-none"
                />

                <div className="relative">
                  <Input
                    placeholder="Tipo da resposta"
                    value={perguntaAtual.tipo_resposta === 'descritiva' ? 'Descritiva' : perguntaAtual.tipo_resposta === 'multipla_escolha' ? 'Multipla escolha' : ''}
                    readOnly
                    onClick={() => setShowTipoRespostaModal(true)}
                    className="h-14 border border-gray-300 rounded-lg pr-12 cursor-pointer"
                  />
                  <List className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {perguntaAtual.tipo_resposta === 'multipla_escolha' && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Alternativas</p>
                    {perguntaAtual.alternativas.map((alt, index) => (
                      <Input
                        key={index}
                        placeholder={`Alternativa ${alt.letra}`}
                        value={alt.texto}
                        onChange={(e) => handleAlternativaChange(index, e.target.value)}
                        className="border border-gray-300 rounded-lg"
                      />
                    ))}
                    
                    {perguntaAtual.alternativas.length < 10 && (
                      <Button
                        onClick={handleAdicionarAlternativa}
                        variant="outline"
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar alternativa
                      </Button>
                    )}
                  </div>
                )}

                {perguntaAtual.tipo_resposta === 'descritiva' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Os moradores poderao responder esta pergunta com texto livre.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSalvarPergunta}
                  className="w-full h-12 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-lg"
                >
                  Salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTipoRespostaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowTipoRespostaModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#3b5998]">Tipo da resposta</h3>
                <button
                  onClick={() => setShowTipoRespostaModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSelecionarTipoResposta('descritiva')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                  <Edit3 className="w-6 h-6 text-[#3b5998]" />
                  <span className="text-base font-medium text-gray-900">Descritiva</span>
                </button>

                <button
                  onClick={() => handleSelecionarTipoResposta('multipla_escolha')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                  <List className="w-6 h-6 text-[#3b5998]" />
                  <span className="text-base font-medium text-gray-900">Multipla escolha</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}