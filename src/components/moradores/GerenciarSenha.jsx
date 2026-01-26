import React, { useState } from 'react';
import { Morador } from "@/entities/Morador";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GerenciarSenha({ morador, onUpdate }) {
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSalvar = async (e) => {
        e.preventDefault();
        
        if (novaSenha.length !== 4 || !/^\d+$/.test(novaSenha)) {
            setError("A senha deve ter exatamente 4 dígitos numéricos");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setError("As senhas não coincidem");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await Morador.update(morador.id, {
                senha_portaria: novaSenha
            });
            setSuccess("Senha atualizada com sucesso!");
            setNovaSenha('');
            setConfirmarSenha('');
            onUpdate();
        } catch (err) {
            console.error("Erro ao atualizar senha:", err);
            setError("Erro ao atualizar senha. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-6 h-6 text-blue-600" />
                        Senha da Portaria
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {morador.senha_portaria ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="font-semibold text-green-900">Senha Cadastrada</p>
                            </div>
                            <p className="text-sm text-green-800">
                                Você já possui uma senha cadastrada. Use-a para retirar encomendas na portaria.
                            </p>
                        </div>
                    ) : (
                        <Alert>
                            <Lock className="h-4 w-4" />
                            <AlertDescription>
                                Cadastre uma senha de 4 dígitos para facilitar a retirada de encomendas na portaria.
                            </AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">{success}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSalvar} className="space-y-4">
                        <div>
                            <Label htmlFor="nova-senha">Nova Senha (4 dígitos)</Label>
                            <div className="relative">
                                <Input
                                    id="nova-senha"
                                    type={mostrarSenha ? "text" : "password"}
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value.slice(0, 4))}
                                    placeholder="0000"
                                    maxLength={4}
                                    pattern="\d{4}"
                                    className="pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    {mostrarSenha ? (
                                        <EyeOff className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
                            <Input
                                id="confirmar-senha"
                                type={mostrarSenha ? "text" : "password"}
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value.slice(0, 4))}
                                placeholder="0000"
                                maxLength={4}
                                pattern="\d{4}"
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? "Salvando..." : "Salvar Senha"}
                        </Button>
                    </form>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Como usar a senha</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Use esta senha para identificação na portaria</li>
                            <li>• Alternativa ao QR Code para retirada de encomendas</li>
                            <li>• Mantenha sua senha segura e não compartilhe</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}