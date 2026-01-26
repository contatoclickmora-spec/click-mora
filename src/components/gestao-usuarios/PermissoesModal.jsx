import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function PermissoesModal({ usuario, permissoesAtuais, onClose, onSave }) {
  const [permissoes, setPermissoes] = useState(
    permissoesAtuais?.permissoes || {
      gerenciar_moradores: false,
      gerenciar_porteiros: false,
      gerenciar_sindicos: false,
      registrar_encomendas: false,
      retirar_encomendas: false,
      visualizar_relatorios: false,
      exportar_dados: false,
      enviar_avisos: false,
      aprovar_cadastros: false,
      gerenciar_visitantes: false,
      configurar_whatsapp: false,
      visualizar_financeiro: false,
      alterar_configuracoes: false
    }
  );

  const [nivelAcesso, setNivelAcesso] = useState(
    permissoesAtuais?.nivel_acesso || 'morador'
  );

  const handleSave = () => {
    onSave({
      nivel_acesso: nivelAcesso,
      permissoes: permissoes
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões - {usuario.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Nível de Acesso</h3>
                <p className="text-sm text-gray-600">Tipo: {usuario.tipo_usuario}</p>
              </div>
              <Badge className="text-sm px-3 py-1">
                {nivelAcesso.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Permissões Específicas</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(permissoes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor={key} className="text-sm cursor-pointer">
                    {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                  </Label>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => 
                      setPermissoes(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Salvar Permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}