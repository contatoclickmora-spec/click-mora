import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getUserRole } from "../components/utils/authUtils";
import AuthGuard from "../components/utils/AuthGuard";
import MoradorHeader from "../components/shared/MoradorHeader";
import MoradorFooter from "../components/shared/MoradorFooter";

export default function WhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [items, setItems] = useState([]); // {resident_id, name, phone, package_count}
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [statuses, setStatuses] = useState({}); // id -> {status}
  const [statusByResident, setStatusByResident] = useState({}); // resident_id -> status
  const [batch, setBatch] = useState(null);
  const [logIds, setLogIds] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const role = await getUserRole();
        if (!role?.isAuthenticated) { window.location.href = '/login'; return; }
        if (!['administrador', 'porteiro', 'admin_master'].includes(role.userType)) {
          // Bloquear acesso para moradores
          window.location.href = '/DashboardMorador';
          return;
        }
        await loadPending();
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally { setLoading(false); }
    };
    init();
  }, []);

  const loadPending = async () => {
    const { data } = await base44.functions.invoke('listWhatsAppPending');
    const list = Array.isArray(data?.items) ? data.items : [];
    setItems(list);
    setSelected(new Set(list.map(i => i.resident_id)));
  };

  const allChecked = useMemo(() => items.length > 0 && selected.size === items.length, [items, selected]);

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.resident_id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const startPolling = (ids) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await base44.functions.invoke('getWhatsAppDispatchStatus', { log_ids: ids });
        const arr = Array.isArray(data?.items) ? data.items : [];
        setStatuses(prev => ({ ...prev, ...Object.fromEntries(arr.map(i => [i.id, { status: i.status, attempts: i.attempts, error: i.error_message, resident_id: i.resident_id }])) }));
        setStatusByResident(prev => ({ ...prev, ...Object.fromEntries(arr.map(i => [i.resident_id, i.status])) }));
        const done = arr.every(i => i.status === 'sent' || i.status === 'error');
        if (done) { clearInterval(interval); setSending(false); setSuccess('Envio concluído'); setTimeout(()=>setSuccess(''), 4000); }
      } catch {}
    }, 2000);
  };

  const handleSend = async () => {
    if (selected.size === 0) { setError('Selecione ao menos um morador'); setTimeout(()=>setError(''), 3000); return; }
    const total = selected.size;
    const confirmSend = window.confirm(`Notificar ${total} morador(es)?`);
    if (!confirmSend) return;
    try {
      setSending(true); setError(''); setSuccess(''); setStatuses({});
      const resident_ids = Array.from(selected);
      const { data } = await base44.functions.invoke('startWhatsAppDispatch', { resident_ids });
      const ids = Array.isArray(data?.log_ids) ? data.log_ids : [];
      setBatch(data?.batch_id || null);
      setLogIds(ids);
      startPolling(ids);
    } catch (err) {
      setSending(false);
      setError('Falha ao iniciar envios');
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f7f7f7]">
          <MoradorHeader title="WhatsApp" />
          <div className="flex items-center justify-center pt-24 pb-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#3b5998]" />
          </div>
          <MoradorFooter />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f7]">
        <MoradorHeader title="WhatsApp" />
        <div className="pt-28 pb-24 px-4">
          <div className="max-w-2xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-3 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Card className="bg-white border-0 shadow-sm mb-3">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#3b5998]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Moradores com encomendas</p>
                    <p className="text-xs text-gray-600">{items.length} encontrado(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                  <span className="text-xs text-gray-900">Selecionar todos</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {items.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-gray-600 text-sm">
                    Nenhum morador com encomendas pendentes.
                  </CardContent>
                </Card>
              ) : (
                items.map((it) => (
                  <Card key={it.resident_id} className="bg-white border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={selected.has(it.resident_id)} onCheckedChange={() => toggleOne(it.resident_id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 text-sm truncate">{it.name}</p>
                            <span className="text-xs text-gray-600">{it.package_count} pendente(s)</span>
                          </div>
                          {logIds.length > 0 && (
                            <div className="mt-1 text-xs">
                              {(() => {
                                const log = Object.values(statuses).find(s => s && s.resident_id === it.resident_id);
                                const entry = Object.entries(statuses).find(([id,s]) => s && logIds.includes(id));
                                const val = entry ? entry[1] : null;
                                const st = val?.status;
                                if (!st) return <span className="text-gray-400">Pendente</span>;
                                if (st === 'sent') return <span className="text-green-700">Enviado</span>;
                                if (st === 'error') return <span className="text-red-600">Erro</span>;
                                if (st === 'sending') return <span className="text-blue-600">Enviando...</span>;
                                return <span className="text-gray-500">{st}</span>;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="mt-4">
                <Button onClick={handleSend} disabled={sending || selected.size === 0} className="w-full h-12 bg-[#3b5998] hover:bg-[#2d4373]">
                  {sending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>) : 'Notificar moradores'}
                </Button>
              </div>
            )}
          </div>
        </div>
        <MoradorFooter />
      </div>
    </AuthGuard>
  );
}