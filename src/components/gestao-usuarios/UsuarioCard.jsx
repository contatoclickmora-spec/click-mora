import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Edit,
  Shield,
  Clock,
  Power,
  Trash2,
  Mail,
  MapPin,
  Building2,
  Crown,
  Key
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsuarioCard({ 
  usuario, 
  onEditar, 
  onGerenciarPermissoes, 
  onGerenciarTurnos, 
  onToggleStatus, 
  onDeletar 
}) {
  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'administrador': return <Crown className="w-5 h-5 text-purple-600" />;
      case 'porteiro': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'morador': return <Key className="w-5 h-5 text-gray-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
      case 'inativo': return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoLabel = (tipo) => {
    switch(tipo) {
      case 'administrador': return 'Síndico';
      case 'porteiro': return 'Porteiro';
      case 'morador': return 'Morador';
      default: return tipo;
    }
  };

  const getNivelAcesso = () => {
    const nivel = usuario.permissoes_detalhadas?.nivel_acesso;
    if (nivel === 'admin_master') return { label: 'Admin Master', color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' };
    if (nivel === 'sindico_supremo') return { label: 'Síndico Supremo', color: 'bg-purple-500 text-white' };
    return null;
  };

  const nivelAcesso = getNivelAcesso();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar/Icon */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {usuario.nome.charAt(0).toUpperCase()}
            </div>

            {/* Info Principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">{usuario.nome}</h3>
                {nivelAcesso && (
                  <Badge className={`${nivelAcesso.color} border-0`}>
                    {nivelAcesso.label}
                  </Badge>
                )}
                {getTipoIcon(usuario.tipo_usuario)}
                <Badge variant="outline" className={getStatusColor(usuario.status)}>
                  {usuario.status}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{usuario.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{usuario.condominio_nome}</span>
                </div>

                {usuario.residencia_info && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{usuario.residencia_info} ({usuario.apelido_endereco})</span>
                  </div>
                )}

                {usuario.tipo_usuario === 'porteiro' && usuario.permissoes_detalhadas?.turno?.tem_turno && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      Turno: {usuario.permissoes_detalhadas.turno.tipo_turno} 
                      ({usuario.permissoes_detalhadas.turno.horario_entrada} - {usuario.permissoes_detalhadas.turno.horario_saida})
                    </span>
                  </div>
                )}
              </div>

              {/* Permissões Resumidas */}
              {usuario.permissoes_detalhadas?.permissoes && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.entries(usuario.permissoes_detalhadas.permissoes)
                    .filter(([_, value]) => value === true)
                    .slice(0, 3)
                    .map(([key, _]) => (
                      <Badge key={key} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {key.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  }
                  {Object.values(usuario.permissoes_detalhadas.permissoes).filter(Boolean).length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                      +{Object.values(usuario.permissoes_detalhadas.permissoes).filter(Boolean).length - 3} mais
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onEditar(usuario)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Informações
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onGerenciarPermissoes(usuario)}>
                <Shield className="w-4 h-4 mr-2" />
                Gerenciar Permissões
              </DropdownMenuItem>

              {usuario.tipo_usuario === 'porteiro' && (
                <DropdownMenuItem onClick={() => onGerenciarTurnos(usuario)}>
                  <Clock className="w-4 h-4 mr-2" />
                  Configurar Turnos
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={() => onToggleStatus(usuario, usuario.status === 'ativo' ? 'inativo' : 'ativo')}
                className={usuario.status === 'ativo' ? 'text-orange-600' : 'text-green-600'}
              >
                <Power className="w-4 h-4 mr-2" />
                {usuario.status === 'ativo' ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={() => onDeletar(usuario)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}