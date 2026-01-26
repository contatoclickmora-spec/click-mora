import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Shield,
  CheckCircle,
  User
} from "lucide-react";

export default function FuncionarioCard({ funcionario, onEdit, onDelete }) {
  const getCargoLabel = (cargo) => {
    const cargos = {
      porteiro: "Porteiro",
      zelador: "Zelador",
      seguranca: "Segurança",
      faxineiro: "Faxineiro",
      assistente: "Assistente"
    };
    return cargos[cargo] || cargo;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
      case 'inativo': return 'bg-red-100 text-red-800 border-red-200';
      case 'ferias': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCargoColor = (cargo) => {
    switch (cargo) {
      case 'porteiro': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seguranca': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'zelador': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const contarPermissoes = () => {
    if (!funcionario.permissoes) return 2;
    return Object.values(funcionario.permissoes).filter(Boolean).length;
  };

  const getInitials = (name) => {
    if (!name) return 'F';
    const names = name.split(' ');
    if (names.length === 0) return 'F';
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'F';
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-blue-200">
      <CardContent className="p-6">
        {/* Header com Foto e Nome */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            {funcionario.foto_url ? (
              <img 
                src={funcionario.foto_url} 
                alt={funcionario.nome}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              funcionario.status === 'ativo' ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate">{funcionario.nome}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={getCargoColor(funcionario.cargo)}>
                {getCargoLabel(funcionario.cargo)}
              </Badge>
              <Badge variant="outline" className={getStatusColor(funcionario.status)}>
                {funcionario.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{funcionario.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{funcionario.telefone}</span>
          </div>
        </div>

        {/* Permissões */}
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              {contarPermissoes()} Permissões Ativas
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {funcionario.permissoes?.registrar_encomenda && (
              <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-blue-200">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Registrar</span>
              </div>
            )}
            {funcionario.permissoes?.retirar_encomenda && (
              <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-blue-200">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Retirar</span>
              </div>
            )}
            {funcionario.permissoes?.controlar_visitantes && (
              <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-blue-200">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Visitantes</span>
              </div>
            )}
            {funcionario.permissoes?.ver_relatorios && (
              <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-blue-200">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Relatórios</span>
              </div>
            )}
          </div>
        </div>

        {/* Observações (se houver) */}
        {funcionario.observacoes && (
          <p className="text-xs text-gray-600 italic mb-4 line-clamp-2">
            "{funcionario.observacoes}"
          </p>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => onEdit(funcionario)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onDelete(funcionario)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remover
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}