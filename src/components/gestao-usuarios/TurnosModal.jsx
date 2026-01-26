import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TurnosModal({ usuario, turnoAtual, onClose, onSave }) {
  const [turno, setTurno] = useState(turnoAtual || {
    tem_turno: false,
    tipo_turno: "manha",
    horario_entrada: "08:00",
    horario_saida: "17:00",
    dias_semana: ["seg", "ter", "qua", "qui", "sex"]
  });

  const toggleDia = (dia) => {
    setTurno(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia]
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Turnos - {usuario.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label htmlFor="tem_turno">Trabalha em Turnos</Label>
            <Switch
              id="tem_turno"
              checked={turno.tem_turno}
              onCheckedChange={(checked) => setTurno(prev => ({ ...prev, tem_turno: checked }))}
            />
          </div>

          {turno.tem_turno && (
            <>
              <div>
                <Label>Tipo de Turno</Label>
                <Select 
                  value={turno.tipo_turno} 
                  onValueChange={(value) => setTurno(prev => ({ ...prev, tipo_turno: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="madrugada">Madrugada</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entrada</Label>
                  <Input
                    type="time"
                    value={turno.horario_entrada}
                    onChange={(e) => setTurno(prev => ({ ...prev, horario_entrada: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Saída</Label>
                  <Input
                    type="time"
                    value={turno.horario_saida}
                    onChange={(e) => setTurno(prev => ({ ...prev, horario_saida: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Dias da Semana</Label>
                <div className="flex gap-2 flex-wrap">
                  {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(dia => (
                    <Button
                      key={dia}
                      type="button"
                      variant={turno.dias_semana.includes(dia) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDia(dia)}
                    >
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(turno)} className="bg-blue-600 hover:bg-blue-700">
            Salvar Turnos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}