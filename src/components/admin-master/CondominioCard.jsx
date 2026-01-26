import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Calendar, 
  MapPin,
  Settings,
  AlertCircle,
  Crown,
  UserCheck
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CondominioCard({ condominio, moradores, onGerenciar, onGerenciarSindicos }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'ativo':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Ativo', icon: 'bg-green-500' };
      case 'inativo':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Inativo', icon: 'bg-red-500' };
      case 'teste':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Em Teste', icon: 'bg-yellow-500' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Desconhecido', icon: 'bg-gray-500' };
    }
  };

  const getPlanoLabel = (plano) => {
    const planos = {
      '30_moradores': '30 moradores - R$ 109',
      '50_moradores': '50 moradores - R$ 189',
      '100_moradores': '100 moradores - R$ 324',
      '200_moradores': '200 moradores - R$ 524',
      '500_moradores': '500 moradores - R$ 849'
    };
    return planos[plano] || plano;
  };

  const statusConfig = getStatusConfig(condominio.status);
  
  // Usar a contagem sincronizada do banco de dados como fonte principal
  const moradoresAtivos = condominio.moradores_ativos || 0;
  
  const moradoresDoCondominio = moradores.filter(m => m.condominio_id === condominio.id);
  const sindicos = moradoresDoCondominio.filter(m => m.tipo_usuario === 'administrador').length;
  const funcionarios = moradoresDoCondominio.filter(m => m.tipo_usuario === 'porteiro').length;
  const totalUsuarios = moradoresDoCondominio.length;
  
  const percentualUso = condominio.limite_moradores > 0 
    ? ((moradoresAtivos / condominio.limite_moradores) * 100).toFixed(0)
    : 0;
    
  const proximoVencimento = condominio.data_renovacao ? new Date(condominio.data_renovacao) : null;
  const diasVencimento = proximoVencimento ? Math.ceil((proximoVencimento - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const administradorSupremo = condominio.administrador_supremo_id 
    ? moradoresDoCondominio.find(m => m.id === condominio.administrador_supremo_id)
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Info Principal */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900">{condominio.nome}</h3>
                  <Badge variant="outline" className={statusConfig.color}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.icon} mr-2`}></div>
                    {statusConfig.label}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{condominio.cidade}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="w-4 h-4" />
                    <span>
                      <strong className="text-blue-600">{moradoresAtivos}</strong> / {condominio.limite_moradores} moradores ativos
                      <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {percentualUso}% do plano
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs bg-gray-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-purple-600" />
                      <strong>{sindicos}</strong> síndico(s)
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-600" />
                      <strong>{funcionarios}</strong> porteiro(s)
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-green-600" />
                      <strong>{moradoresAtivos}</strong> morador(es)
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-semibold">
                      Total: {totalUsuarios} usuário(s)
                    </span>
                  </div>

                  {administradorSupremo && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg px-3 py-2 w-fit">
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-900 font-medium text-xs">
                        Admin Supremo: {administradorSupremo.nome}
                      </span>
                    </div>
                  )}

                  {proximoVencimento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Renovação: {format(proximoVencimento, "dd/MM/yyyy", { locale: ptBR })}
                        {diasVencimento !== null && (
                          <span className={`ml-2 text-xs ${diasVencimento < 7 && diasVencimento > 0 ? 'text-red-600 font-semibold' : diasVencimento < 0 ? 'text-red-700 font-bold' : ''}`}>
                            ({diasVencimento < 0 ? `${Math.abs(diasVencimento)} dias vencido` : `${diasVencimento} dias`})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uso do Plano (apenas moradores ativos contam)</span>
                <span>{moradoresAtivos} / {condominio.limite_moradores}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    percentualUso >= 90 ? 'bg-red-500' : 
                    percentualUso >= 70 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentualUso, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Info do Plano e Ações */}
          <div className="flex flex-col justify-between items-end gap-4 md:w-64">
            <div className="text-right">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mb-2">
                {getPlanoLabel(condominio.plano)}
              </Badge>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(condominio.valor_mensalidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">por mês</p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => onGerenciarSindicos(condominio)}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <Crown className="w-4 h-4 mr-2" />
                Gerenciar Síndicos
              </Button>
              
              <Button 
                onClick={() => onGerenciar(condominio)}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {percentualUso >= 90 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Limite quase atingido!</strong> Restam apenas {condominio.limite_moradores - moradoresAtivos} vagas de moradores. Considere upgrade do plano.
            </span>
          </div>
        )}

        {diasVencimento !== null && diasVencimento < 7 && condominio.status === 'ativo' && (
          <div className={`mt-4 p-3 border rounded-lg flex items-center gap-2 text-sm ${
            diasVencimento < 0 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {diasVencimento < 0 
                ? `⚠️ Plano VENCIDO há ${Math.abs(diasVencimento)} dias! Renovação urgente necessária.`
                : `Plano vence em ${diasVencimento} dias.`
              }
            </span>
          </div>
        )}

        {!administradorSupremo && sindicos > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Nenhum Administrador Supremo definido. Defina um para dar acesso total ao condomínio.</span>
          </div>
        )}

        {/* Info Box - Explicação dos contadores */}
        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-gray-700">
            ℹ️ <strong>Importante:</strong> Apenas <strong>moradores ativos</strong> ({moradoresAtivos}) contam no limite do plano. 
            Síndicos ({sindicos}) e porteiros ({funcionarios}) não são incluídos nessa contagem.
            <br/>
            <strong>Total de usuários cadastrados:</strong> {totalUsuarios}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}