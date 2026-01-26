import React, { useState } from 'react';
import { Plus, ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Funções de máscara
const formatTelefone = (value) => {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return nums;
  if (nums.length <= 7) return `(${nums.slice(0, 2)})${nums.slice(2)}`;
  return `(${nums.slice(0, 2)})${nums.slice(2, 7)}-${nums.slice(7)}`;
};

const formatDocumento = (value) => {
  const nums = value.replace(/\D/g, '');
  if (nums.length <= 11) {
    // CPF: 000.000.000-00
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
  } else {
    // CNPJ: 00.000.000/0000-00
    const cnpj = nums.slice(0, 14);
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  }
};

const TIPOS_INTERVENIENTE = [
  'Locador',
  'Fiador',
  'Testemunha',
  'Locatário',
  'Proprietário',
  'Comprador',
  'Inquilino',
  'Imobiliária'
];

export default function AssinaturasVistoria({
  intervenientes = [],
  onIntervenientesChange,
  onFinalizarVistoria,
  vistoriadorNome = '',
  vistoriadorEmail = ''
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarSelectTipo, setMostrarSelectTipo] = useState(false);
  const [novoInterveniente, setNovoInterveniente] = useState({
    tipo: '',
    nome: '',
    documento: '',
    telefone: '',
    email: ''
  });

  const handleSalvarInterveniente = () => {
    if (!novoInterveniente.nome.trim() || !novoInterveniente.tipo) return;
    
    const intervenienteCompleto = {
      ...novoInterveniente,
      id: Date.now().toString(),
      assinado: false,
      dataAssinatura: null
    };

    onIntervenientesChange([...intervenientes, intervenienteCompleto]);
    setNovoInterveniente({
      tipo: '',
      nome: '',
      documento: '',
      telefone: '',
      email: ''
    });
    setMostrarFormulario(false);
  };

  const handleSelecionarTipo = (tipo) => {
    setNovoInterveniente({ ...novoInterveniente, tipo });
    setMostrarSelectTipo(false);
  };

  // Tela de seleção de tipo
  if (mostrarSelectTipo) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#3b5998] text-white px-4 py-4 flex items-center gap-4">
          <button onClick={() => setMostrarSelectTipo(false)} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Adicionar interveniente</h1>
        </div>

        {/* Lista de tipos */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gray-100 px-4 py-3">
            <span className="text-gray-600 font-medium">Interveniente</span>
          </div>
          {TIPOS_INTERVENIENTE.map((tipo) => (
            <button
              key={tipo}
              onClick={() => handleSelecionarTipo(tipo)}
              className="w-full px-4 py-4 text-left text-gray-800 hover:bg-gray-50 border-b border-gray-100 flex items-center justify-between"
            >
              <span>{tipo}</span>
              {novoInterveniente.tipo === tipo && (
                <Check className="w-5 h-5 text-[#3b5998]" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Tela de formulário
  if (mostrarFormulario) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#3b5998] text-white px-4 py-4 flex items-center gap-4">
          <button onClick={() => setMostrarFormulario(false)} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Adicionar interveniente</h1>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tipo de interveniente */}
          <button
            onClick={() => setMostrarSelectTipo(true)}
            className="w-full px-4 py-4 border-b-2 border-[#3b5998] flex items-center justify-between text-left"
          >
            <span className={novoInterveniente.tipo ? 'text-gray-900' : 'text-gray-400'}>
              {novoInterveniente.tipo || 'Tipo de interveniente'}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>

          {/* Nome */}
          <div className="relative">
            <Input
              placeholder="Nome"
              value={novoInterveniente.nome}
              onChange={(e) => setNovoInterveniente({ ...novoInterveniente, nome: e.target.value })}
              className="w-full px-4 py-4 border border-gray-200 rounded-full text-base"
            />
          </div>

          {/* CPF/CNPJ */}
          <div className="relative">
            <Input
              placeholder="CPF/CNPJ"
              value={novoInterveniente.documento}
              onChange={(e) => setNovoInterveniente({ ...novoInterveniente, documento: formatDocumento(e.target.value) })}
              className="w-full px-4 py-4 border border-gray-200 rounded-full text-base"
            />
          </div>

          {/* Telefone */}
          <div className="relative">
            <Input
              placeholder="Telefone (00)00000-0000"
              value={novoInterveniente.telefone}
              onChange={(e) => setNovoInterveniente({ ...novoInterveniente, telefone: formatTelefone(e.target.value) })}
              className="w-full px-4 py-4 border border-gray-200 rounded-full text-base"
            />
          </div>

          {/* E-mail */}
          <div className="relative">
            <Input
              placeholder="E-mail"
              value={novoInterveniente.email}
              onChange={(e) => setNovoInterveniente({ ...novoInterveniente, email: e.target.value })}
              className="w-full px-4 py-4 border border-gray-200 rounded-full text-base"
            />
          </div>

          {/* Botão Salvar */}
          <Button
            onClick={handleSalvarInterveniente}
            disabled={!novoInterveniente.nome.trim() || !novoInterveniente.tipo}
            className="w-full py-4 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-full text-base font-medium mt-4"
          >
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  // Tela principal de assinaturas
  return (
    <div className="flex-1 flex flex-col">
      {/* Aviso */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm text-gray-600">
          Ao terminar as assinaturas, faça sincronização da vistoria para a geração do laudo autorizado.
        </p>
      </div>

      {/* Lista de intervenientes */}
      <div className="flex-1 overflow-y-auto">
        {/* Vistoriador (sempre aparece) */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{vistoriadorNome || 'Vistoriador'}</p>
            <p className="text-sm text-gray-500">{vistoriadorEmail}</p>
            <p className="text-xs text-gray-400">Vistoriador</p>
          </div>
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Intervenientes adicionados */}
        {intervenientes.map((interveniente) => (
          <div 
            key={interveniente.id} 
            className="px-4 py-4 border-b border-gray-100 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-gray-900">{interveniente.nome}</p>
              <p className="text-sm text-gray-500">{interveniente.email || interveniente.documento}</p>
              <p className="text-xs text-gray-400">{interveniente.tipo}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              interveniente.assinado ? 'bg-green-500' : 'bg-gray-200'
            }`}>
              {interveniente.assinado ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <span className="text-gray-400 text-xs">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botão flutuante + */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMostrarFormulario(true)}
          className="w-14 h-14 bg-[#3b5998] rounded-full flex items-center justify-center shadow-xl hover:bg-[#2d4373] transition-colors"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Botão Finalizar vistoria */}
      <div className="px-4 py-4 bg-white border-t border-gray-100">
        <Button
          onClick={onFinalizarVistoria}
          className="w-full py-4 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-full text-base font-medium"
        >
          Finalizar vistoria
        </Button>
      </div>
    </div>
  );
}