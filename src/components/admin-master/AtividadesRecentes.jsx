import React, { useState, useEffect, useCallback } from 'react';
import { LogSistema } from "@/entities/LogSistema";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Clock, Package, UserCheck, Building2, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Plus, LogIn, LogOut, Send } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ICONS = {
    login: LogIn,
    logout: LogOut,
    criar_morador: Plus,
    aprovar_morador: CheckCircle,
    recusar_morador: XCircle,
    editar_morador: Edit,
    deletar_morador: Trash2,
    registrar_encomenda: Package,
    retirar_encomenda: UserCheck,
    enviar_aviso: Send,
    criar_condominio: Building2,
    editar_condominio: Edit,
    alterar_plano: Activity,
    configurar_whatsapp: Send,
    erro_sistema: AlertTriangle
};

const COLORS = {
    login: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
    logout: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-600' },
    criar_morador: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
    aprovar_morador: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
    recusar_morador: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' },
    editar_morador: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-600' },
    deletar_morador: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' },
    registrar_encomenda: { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'text-purple-600' },
    retirar_encomenda: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-600' },
    enviar_aviso: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
    criar_condominio: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
    editar_condominio: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-600' },
    alterar_plano: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-600' },
    configurar_whatsapp: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
    erro_sistema: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' }
};

export default function AtividadesRecentes({ limit = 10, showAll = false }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLogs = useCallback(async () => {
        try {
            const allLogs = await LogSistema.list('-timestamp', showAll ? 100 : limit);
            setLogs(allLogs);
        } catch (err) {
            console.error("Erro ao carregar logs:", err);
        } finally {
            setLoading(false);
        }
    }, [showAll, limit]);

    useEffect(() => {
        const abortController = new AbortController();
        loadLogs();
        // Atualizar a cada 30 segundos
        const interval = setInterval(loadLogs, 30000);
        return () => {
            abortController.abort();
            clearInterval(interval);
        };
    }, [loadLogs]);

    if (loading) {
        return <div className="text-center p-4">Carregando atividades...</div>;
    }

    return (
        <div className="space-y-3">
            {logs.map((log) => {
                const Icon = ICONS[log.tipo_acao] || Activity;
                const colors = COLORS[log.tipo_acao] || COLORS.erro_sistema;

                return (
                    <div 
                        key={log.id} 
                        className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-white"
                    >
                        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-gray-900">{log.descricao}</p>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{log.usuario_nome || log.usuario_email}</span>
                                        </div>
                                        {log.condominio_nome && (
                                            <div className="flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                <span>{log.condominio_nome}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Badge className={`${colors.bg} ${colors.text} border-0`}>
                                    {log.tipo_acao.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                                {!log.sucesso && (
                                    <Badge variant="destructive" className="text-xs">
                                        Erro: {log.erro_mensagem}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {logs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>Nenhuma atividade registrada ainda</p>
                </div>
            )}
        </div>
    );
}