import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { User } from "@/entities/all";

export default function GerenciarSenha({ morador }) {
  const [senha, setSenha] = useState(morador?.senha_acesso || "");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSalvarSenha = async () => {
    if (!novaSenha.trim()) {
      setError("Por favor, digite uma nova senha.");
      return;
    }

    if (novaSenha.length < 4) {
      setError("A senha deve ter pelo menos 4 dígitos.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await User.updateMyUserData({ senha_acesso: novaSenha });
      setSenha(novaSenha);
      setNovaSenha("");
      setConfirmarSenha("");
      setEditando(false);
      setSuccess("Senha atualizada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Erro ao atualizar senha. Tente novamente.");
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setNovaSenha("");
    setConfirmarSenha("");
    setEditando(false);
    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Senha de Acesso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!editando ? (
          <div className="space-y-4">
            <div>
              <Label>Senha Atual</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    type={mostrarSenhaAtual ? "text" : "password"}
                    value={senha || "Nenhuma senha cadastrada"}
                    readOnly
                    className="pr-10 bg-gray-50"
                  />
                  {senha && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                    >
                      {mostrarSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <Lock className="w-4 h-4 inline mr-2" />
                Esta senha será usada para retirar suas encomendas na portaria.
                {!senha && " Você ainda não possui uma senha cadastrada."}
              </p>
            </div>

            <Button onClick={() => setEditando(true)} className="w-full">
              {senha ? "Alterar Senha" : "Criar Senha"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="novaSenha"
                  type={mostrarNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite uma senha (mín. 4 dígitos)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                >
                  {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancelar} 
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvarSenha} 
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Senha"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}