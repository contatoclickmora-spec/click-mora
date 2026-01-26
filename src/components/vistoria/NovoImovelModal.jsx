import React, { useState } from 'react';
import { ImovelVistoria } from "@/entities/ImovelVistoria";
import { CreditoVistoria } from "@/entities/CreditoVistoria";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import { motion } from 'framer-motion';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function NovoImovelModal({ moradorLogado, onClose, onSuccess }) {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dados, setDados] = useState({
    titulo: '',
    subtitulo: '',
    tipo: 'Apartamento',
    mobiliado: 'Não mobiliado',
    endereco: {
      estado: '',
      cidade: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: ''
    },
    observacoes_gerais: ''
  });

  const handleContinuar = () => {
    if (etapa === 1) {
      if (!dados.titulo || !dados.tipo) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
    }
    
    if (etapa === 2) {
      if (!dados.endereco.estado || !dados.endereco.cidade || !dados.endereco.logradouro) {
        setError('Preencha todos os campos obrigatórios do endereço');
        return;
      }
    }
    
    setError('');
    setEtapa(etapa + 1);
  };

  const handleVoltar = () => {
    setError('');
    setEtapa(etapa - 1);
  };

  const handleSalvar = async () => {
    try {
      setLoading(true);
      setError('');

      const novoImovel = await ImovelVistoria.create({
        morador_id: moradorLogado.id,
        condominio_id: moradorLogado.condominio_id,
        titulo: dados.titulo,
        subtitulo: dados.subtitulo,
        tipo: dados.tipo,
        mobiliado: dados.mobiliado,
        endereco_completo: dados.endereco,
        observacoes_gerais: dados.observacoes_gerais,
        status: 'Vazio',
        data_cadastro: new Date().toISOString()
      });

      // Atualizar créditos
      const todosCreditos = await CreditoVistoria.list();
      const creditoMorador = todosCreditos.find(c => c.morador_id === moradorLogado.id);

      if (creditoMorador) {
        await CreditoVistoria.update(creditoMorador.id, {
          creditos_usados: creditoMorador.creditos_usados + 1,
          historico: [
            ...(creditoMorador.historico || []),
            {
              data: new Date().toISOString(),
              acao: 'Imóvel cadastrado',
              quantidade: -1,
              observacao: `Imóvel: ${dados.titulo}`,
              realizado_por: moradorLogado.nome
            }
          ]
        });
      }

      console.log('[NOVO IMOVEL] Imóvel cadastrado com sucesso');
      onSuccess();
      onClose();

    } catch (err) {
      console.error('[NOVO IMOVEL] Erro:', err);
      setError('Erro ao cadastrar imóvel. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl my-8"
      >
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cadastrar Imóvel</h2>
                <p className="text-sm text-gray-600">Etapa {etapa} de 3</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Barra de Progresso */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  className={`h-2 rounded-full flex-1 transition-colors ${
                    num <= etapa ? 'bg-[#3b5998]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Etapa 1 - Dados Básicos */}
            {etapa === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Nome/Identificador do Imóvel *</Label>
                  <Input
                    id="titulo"
                    value={dados.titulo}
                    onChange={(e) => setDados({...dados, titulo: e.target.value})}
                    placeholder="Ex: Apartamento Centro"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitulo">Descrição Rápida</Label>
                  <Input
                    id="subtitulo"
                    value={dados.subtitulo}
                    onChange={(e) => setDados({...dados, subtitulo: e.target.value})}
                    placeholder="Ex: Condomínio X - 2 dormitórios"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Imóvel *</Label>
                  <select
                    id="tipo"
                    value={dados.tipo}
                    onChange={(e) => setDados({...dados, tipo: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3b5998]"
                  >
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="mobiliado">Mobiliado? *</Label>
                  <select
                    id="mobiliado"
                    value={dados.mobiliado}
                    onChange={(e) => setDados({...dados, mobiliado: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3b5998]"
                  >
                    <option value="Não mobiliado">Não mobiliado</option>
                    <option value="Semi-mobiliado">Semi-mobiliado</option>
                    <option value="Mobiliado">Mobiliado</option>
                    <option value="Super mobiliado">Super mobiliado</option>
                  </select>
                </div>
              </div>
            )}

            {/* Etapa 2 - Endereço */}
            {etapa === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <select
                      id="estado"
                      value={dados.endereco.estado}
                      onChange={(e) => setDados({...dados, endereco: {...dados.endereco, estado: e.target.value}})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3b5998]"
                    >
                      <option value="">Selecione</option>
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={dados.endereco.cidade}
                      onChange={(e) => setDados({...dados, endereco: {...dados.endereco, cidade: e.target.value}})}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logradouro">Logradouro/Endereço *</Label>
                  <Input
                    id="logradouro"
                    value={dados.endereco.logradouro}
                    onChange={(e) => setDados({...dados, endereco: {...dados.endereco, logradouro: e.target.value}})}
                    placeholder="Rua, Avenida..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={dados.endereco.numero}
                      onChange={(e) => setDados({...dados, endereco: {...dados.endereco, numero: e.target.value}})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={dados.endereco.complemento}
                      onChange={(e) => setDados({...dados, endereco: {...dados.endereco, complemento: e.target.value}})}
                      placeholder="Apto, Bloco..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={dados.endereco.bairro}
                    onChange={(e) => setDados({...dados, endereco: {...dados.endereco, bairro: e.target.value}})}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Etapa 3 - Resumo */}
            {etapa === 3 && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Check className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Imóvel pronto para ser cadastrado! Revise as informações abaixo.
                  </AlertDescription>
                </Alert>

                <div className="bg-[#f7f7f7] rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Imóvel</p>
                    <p className="font-semibold text-gray-900">{dados.titulo}</p>
                    <p className="text-sm text-gray-600">{dados.subtitulo}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Tipo</p>
                      <p className="text-sm font-medium">{dados.tipo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mobília</p>
                      <p className="text-sm font-medium">{dados.mobiliado}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Endereço</p>
                    <p className="text-sm font-medium">
                      {dados.endereco.logradouro}, {dados.endereco.numero}
                      {dados.endereco.complemento && ` - ${dados.endereco.complemento}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {dados.endereco.bairro} - {dados.endereco.cidade}/{dados.endereco.estado}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações Gerais (Opcional)</Label>
                  <textarea
                    id="observacoes"
                    value={dados.observacoes_gerais}
                    onChange={(e) => setDados({...dados, observacoes_gerais: e.target.value})}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3b5998]"
                    placeholder="Informações adicionais sobre o imóvel..."
                  />
                </div>
              </div>
            )}

            {/* Botões de Navegação */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
              {etapa > 1 && (
                <Button
                  variant="outline"
                  onClick={handleVoltar}
                  disabled={loading}
                  className="flex-1"
                >
                  Voltar
                </Button>
              )}
              
              {etapa < 3 ? (
                <Button
                  onClick={handleContinuar}
                  className="flex-1 bg-[#3b5998] hover:bg-[#2d4373]"
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  onClick={handleSalvar}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar Cadastro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}