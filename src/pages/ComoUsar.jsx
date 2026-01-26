
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  Building2, 
  Users, 
  UserCheck, 
  Key,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export default function ComoUsarPage() {
  const [activeTab, setActiveTab] = useState("visao-geral");

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Como Usar o Sistema</h1>
        <p className="text-gray-600">Guia completo para gerenciar usuários e permissões</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="condominio">Criar Condomínio</TabsTrigger>
          <TabsTrigger value="usuarios">Adicionar Usuários</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
        </TabsList>

        {/* VISÃO GERAL */}
        <TabsContent value="visao-geral">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                Como Funciona o Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Hierarquia de Usuários</h3>
                
                <div className="space-y-4">
                  {/* Admin Master */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Crown className="w-6 h-6 text-yellow-600" />
                      <h4 className="font-bold text-gray-900">Admin Master (Você)</h4>
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        Acesso Total
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">
                      Dono da plataforma. Gerencia todos os condomínios, planos e usuários.
                    </p>
                  </div>

                  {/* Síndico */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 ml-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-6 h-6 text-purple-600" />
                      <h4 className="font-bold text-gray-900">Síndico (Administrador)</h4>
                      <Badge className="bg-purple-100 text-purple-700">
                        Gerencia Condomínio
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">
                      Administra UM condomínio específico. Pode adicionar moradores, enviar avisos, ver relatórios.
                    </p>
                  </div>

                  {/* Porteiro */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 ml-16">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-6 h-6 text-blue-600" />
                      <h4 className="font-bold text-gray-900">Porteiro</h4>
                      <Badge className="bg-blue-100 text-blue-700">
                        Acesso Operacional
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">
                      Registra e retira encomendas, controla visitantes. NAO gerencia moradores.
                    </p>
                  </div>

                  {/* Morador */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-400 ml-16">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-6 h-6 text-gray-600" />
                      <h4 className="font-bold text-gray-900">Morador</h4>
                      <Badge className="bg-gray-100 text-gray-700">
                        Acesso Básico
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">
                      Visualiza suas encomendas, recebe avisos, agenda visitantes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">O que você precisa fazer:</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>1. Criar condomínios</li>
                          <li>2. Adicionar o síndico de cada um</li>
                          <li>3. O síndico adiciona porteiros e moradores</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Importante saber:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Todos são cadastrados como "moradores"</li>
                          <li>• A diferença está no "Tipo de Usuário"</li>
                          <li>• O tipo define as permissões</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRIAR CONDOMÍNIO */}
        <TabsContent value="condominio">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-purple-600" />
                Passo 1: Criar um Condomínio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Apenas Admin Master pode fazer isso
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { num: "1", text: "Entre no Dashboard Master (menu lateral)" },
                      { num: "2", text: "Clique no botão verde '+ Novo Condomínio'" },
                      { num: "3", text: "Preencha os dados:", details: [
                        "Nome do condomínio (ex: Residencial Jardim das Flores)",
                        "Cidade",
                        "Email do administrador/síndico",
                        "Escolha o plano (30, 50, 100 moradores...)",
                        "Valor da mensalidade"
                      ]},
                      { num: "4", text: "Clique em 'Criar Condomínio'" }
                    ].map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                          {step.num}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{step.text}</p>
                          {step.details && (
                            <ul className="mt-2 ml-4 space-y-1">
                              {step.details.map((detail, i) => (
                                <li key={i} className="text-sm text-gray-600">• {detail}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Condomínio criado!</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Agora você pode adicionar o síndico e outros usuários.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADICIONAR USUÁRIOS */}
        <TabsContent value="usuarios">
          <div className="space-y-6">
            {/* Adicionar Síndico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                  Passo 2: Adicionar o Síndico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        <strong>ATENCAO:</strong> O síndico é adicionado como um "morador", mas você seleciona o tipo "Administrador". E isso que da os poderes de síndico para ele!
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-4">
                    {[
                      "Vá em 'Moradores' no menu lateral",
                      "Clique em 'Adicionar Individual'",
                      "Preencha os dados do síndico:",
                      "NO CAMPO 'Tipo de Usuário' → Selecione 'Administrador'",
                      "Clique em 'Salvar'"
                    ].map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                          {index + 1}
                        </div>
                        <p className="flex-1 pt-1 text-gray-800">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mt-4">
                    <h4 className="font-bold text-purple-900 mb-2">Campo Mais Importante:</h4>
                    <div className="bg-white p-3 rounded border-2 border-purple-400">
                      <p className="text-sm font-mono text-gray-700 mb-1">Tipo de Usuário:</p>
                      <select className="w-full p-2 border-2 border-purple-500 rounded font-bold text-purple-900" disabled>
                        <option>Administrador</option>
                      </select>
                      <p className="text-xs text-purple-700 mt-2">
                        Isso transforma um morador comum em SINDICO!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adicionar Porteiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-6 h-6 text-blue-600" />
                  Passo 3: Adicionar Porteiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Quem faz:</strong> O síndico (depois de cadastrado) ou você (Admin Master)
                    </p>
                  </div>

                  <ol className="space-y-4">
                    {[
                      "Entre com a conta do síndico (ou como Admin Master)",
                      "Vá em 'Moradores'",
                      "Clique em 'Adicionar Individual'",
                      "Preencha os dados do porteiro",
                      "NO CAMPO 'Tipo de Usuário' → Selecione 'Porteiro'",
                      "Clique em 'Salvar'"
                    ].map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                          {index + 1}
                        </div>
                        <p className="flex-1 pt-1 text-gray-800">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-4">
                    <h4 className="font-bold text-blue-900 mb-2">Diferença do Porteiro:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-300 rounded p-3">
                        <h5 className="font-semibold text-green-900 mb-2 text-sm">Pode fazer:</h5>
                        <ul className="text-xs text-green-800 space-y-1">
                          <li>• Registrar encomendas</li>
                          <li>• Retirar encomendas</li>
                          <li>• Controlar visitantes</li>
                        </ul>
                      </div>
                      <div className="bg-red-50 border border-red-300 rounded p-3">
                        <h5 className="font-semibold text-red-900 mb-2 text-sm">NAO pode:</h5>
                        <ul className="text-xs text-red-800 space-y-1">
                          <li>• Adicionar/remover moradores</li>
                          <li>• Enviar avisos gerais</li>
                          <li>• Ver relatórios completos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adicionar Moradores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-gray-600" />
                  Passo 4: Adicionar Moradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <p className="text-sm text-gray-800">
                      <strong>Quem faz:</strong> Síndico, Porteiro ou você (Admin Master)
                    </p>
                  </div>

                  <ol className="space-y-4">
                    {[
                      "Vá em 'Moradores'",
                      "Clique em 'Adicionar Individual' (ou use importação em massa)",
                      "Preencha: Nome, Email, Telefone, Endereço, Abreviação",
                      "NO CAMPO 'Tipo de Usuário' → Deixe 'Morador' (padrão)",
                      "Clique em 'Salvar'"
                    ].map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                          {index + 1}
                        </div>
                        <p className="flex-1 pt-1 text-gray-800">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Dica: Importação em Massa</h4>
                    <p className="text-sm text-green-800">
                      Se você tem muitos moradores, use o botão "Importar Planilha" para adicionar vários de uma vez!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PERMISSÕES */}
        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-6 h-6 text-blue-600" />
                Tabela de Permissões Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left font-semibold">Funcionalidade</th>
                      <th className="border p-3 text-center font-semibold">
                        <Crown className="w-5 h-5 mx-auto text-yellow-600" />
                        Admin Master
                      </th>
                      <th className="border p-3 text-center font-semibold">
                        <Building2 className="w-5 h-5 mx-auto text-purple-600" />
                        Síndico
                      </th>
                      <th className="border p-3 text-center font-semibold">
                        <Key className="w-5 h-5 mx-auto text-blue-600" />
                        Porteiro
                      </th>
                      <th className="border p-3 text-center font-semibold">
                        <Users className="w-5 h-5 mx-auto text-gray-600" />
                        Morador
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { funcao: "Gerenciar condomínios", master: true, sindico: false, porteiro: false, morador: false },
                      { funcao: "Criar/editar planos", master: true, sindico: false, porteiro: false, morador: false },
                      { funcao: "Adicionar moradores", master: true, sindico: true, porteiro: false, morador: false },
                      { funcao: "Remover moradores", master: true, sindico: true, porteiro: false, morador: false },
                      { funcao: "Registrar encomendas", master: true, sindico: true, porteiro: true, morador: false },
                      { funcao: "Retirar encomendas", master: true, sindico: true, porteiro: true, morador: false },
                      { funcao: "Enviar avisos gerais", master: true, sindico: true, porteiro: false, morador: false },
                      { funcao: "Ver relatórios completos", master: true, sindico: true, porteiro: false, morador: false },
                      { funcao: "Controlar visitantes", master: true, sindico: true, porteiro: true, morador: true },
                      { funcao: "Ver suas encomendas", master: false, sindico: false, porteiro: false, morador: true },
                      { funcao: "Receber avisos", master: false, sindico: false, porteiro: false, morador: true }
                    ].map((perm, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border p-3 font-medium">{perm.funcao}</td>
                        <td className="border p-3 text-center">
                          {perm.master ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="border p-3 text-center">
                          {perm.sindico ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="border p-3 text-center">
                          {perm.porteiro ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="border p-3 text-center">
                          {perm.morador ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Lembre-se:
                  </h4>
                  <p className="text-sm text-yellow-800">
                    A única diferença entre um morador comum e um síndico/porteiro é o campo "Tipo de Usuário" no cadastro!
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Dica Pro:
                  </h4>
                  <p className="text-sm text-blue-800">
                    Você pode mudar o tipo de usuário a qualquer momento editando o cadastro da pessoa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Card de ajuda rápida no final */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-xl mb-4 text-center">Resumo Rápido</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Crie o Condomínio</h4>
              <p className="text-sm text-gray-600">Dashboard Master - Novo Condomínio</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Adicione o Síndico</h4>
              <p className="text-sm text-gray-600">Tipo de Usuário: Administrador</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Síndico Adiciona Resto</h4>
              <p className="text-sm text-gray-600">Porteiros e Moradores</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
