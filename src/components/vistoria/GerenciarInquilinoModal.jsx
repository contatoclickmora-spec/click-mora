import React, { useState } from 'react';
import { Inquilino } from "@/entities/Inquilino";
import { ImovelVistoria } from "@/entities/ImovelVistoria";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, Check, Bell, AlertCircle } from "lucide-react";
import { motion } from 'framer-motion';

export default function GerenciarInquilinoModal({ imovel, moradorLogado, inquilinoAtual, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dados, setDados] = useState(inquilinoAtual || {
    nome_completo: '',
    telefone: '',
    email: '',
    documento: '',
    data_inicio_contrato: '',
    data_fim_contrato: '',
    valor_aluguel: '',
    dia_vencimento: 10,
    observacoes: '',
    notificar_whatsapp: false
  });

  // Máscara para telefone brasileiro (99) 99999-9999
  const formatTelefone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Máscara para valor monetário R$ 0.000,00
  const formatMoeda = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    // Converte para centavos
    const cents = parseInt(numbers, 10);
    
    // Formata como moeda brasileira
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `R$ ${formatted}`;
  };

  // Converte valor formatado para número
  const parseMoeda = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return (parseInt(numbers, 10) / 100).toFixed(2);
  };

  const handleTelefoneChange = (e) => {
    const formatted = formatTelefone(e.target.value);
    setDados({...dados, telefone: formatted});
  };

  const handleValorChange = (e) => {
    const formatted = formatMoeda(e.target.value);
    setDados({...dados, valor_aluguel: formatted});
  };

  const handleSalvar = async () => {
    try {
      setLoading(true);
      setError('');

      if (!dados.nome_completo || !dados.telefone) {
        setError('Nome e telefone são obrigatórios');
        setLoading(false);
        return;
      }

      // Converte valor para número antes de salvar
      const valorNumerico = dados.valor_aluguel ? parseMoeda(dados.valor_aluguel) : '';

      const dadosInquilino = {
        imovel_id: imovel.id,
        morador_proprietario_id: moradorLogado.id,
        ...dados,
        valor_aluguel: valorNumerico,
        status: 'Ativo'
      };

      if (inquilinoAtual) {
        await Inquilino.update(inquilinoAtual.id, dadosInquilino);
      } else {
        await Inquilino.create(dadosInquilino);
        
        // Atualizar status do imóvel
        await ImovelVistoria.update(imovel.id, {
          status: 'Alugado',
          inquilino_atual_id: dadosInquilino.id
        });
      }

      console.log('[INQUILINO] Salvo com sucesso');
      onSuccess();
      onClose();

    } catch (err) {
      console.error('[INQUILINO] Erro:', err);
      setError('Erro ao salvar inquilino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formata valor inicial se existir
  const getValorFormatado = () => {
    if (!dados.valor_aluguel) return '';
    // Se já está formatado (contém R$), retorna como está
    if (String(dados.valor_aluguel).includes('R$')) return dados.valor_aluguel;
    // Se é número, formata
    const valor = parseFloat(dados.valor_aluguel);
    if (isNaN(valor)) return '';
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-white">
            <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {inquilinoAtual ? 'Editar' : 'Cadastrar'} Inquilino
                </h2>
                <p className="text-sm text-gray-600">{imovel.titulo}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={dados.nome_completo}
                  onChange={(e) => setDados({...dados, nome_completo: e.target.value})}
                  placeholder="Nome do inquilino"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                  <Input
                    id="telefone"
                    value={dados.telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(21) 99999-9999"
                    className="mt-1"
                    maxLength={16}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dados.email}
                    onChange={(e) => setDados({...dados, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="documento">CPF/Documento</Label>
                <Input
                  id="documento"
                  value={dados.documento}
                  onChange={(e) => setDados({...dados, documento: e.target.value})}
                  placeholder="000.000.000-00"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inicio">Data Início Contrato</Label>
                  <Input
                    id="inicio"
                    type="date"
                    value={dados.data_inicio_contrato}
                    onChange={(e) => setDados({...dados, data_inicio_contrato: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fim">Data Fim Contrato</Label>
                  <Input
                    id="fim"
                    type="date"
                    value={dados.data_fim_contrato}
                    onChange={(e) => setDados({...dados, data_fim_contrato: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor">Valor Aluguel</Label>
                  <Input
                    id="valor"
                    value={getValorFormatado()}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vencimento">Dia Vencimento</Label>
                  <Input
                    id="vencimento"
                    type="number"
                    min="1"
                    max="31"
                    value={dados.dia_vencimento}
                    onChange={(e) => setDados({...dados, dia_vencimento: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Observações</Label>
                <textarea
                  id="obs"
                  value={dados.observacoes}
                  onChange={(e) => setDados({...dados, observacoes: e.target.value})}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3b5998]"
                  placeholder="Informações adicionais..."
                />
              </div>

              {/* Toggle para notificação WhatsApp */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Notificar inquilino no WhatsApp</p>
                      <p className="text-sm text-gray-600">
                        Enviar lembrete mensal de pagamento do aluguel
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={dados.notificar_whatsapp || false}
                    onCheckedChange={(checked) => setDados({...dados, notificar_whatsapp: checked})}
                  />
                </div>
                {dados.notificar_whatsapp && (
                  <p className="text-xs text-green-700 mt-2 ml-13">
                    O inquilino receberá um lembrete automático no dia {dados.dia_vencimento || 10} de cada mês via WhatsApp.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleSalvar}
                disabled={loading}
                className="flex-1 bg-[#3b5998] hover:bg-[#2d4373]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}