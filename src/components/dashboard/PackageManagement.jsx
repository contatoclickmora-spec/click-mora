import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, PackageCheck, Search } from 'lucide-react';
import { format } from 'date-fns';

function EncomendaItem({ encomenda, morador }) {
    return (
        <div className="p-3 border-b last:border-b-0 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium text-gray-800">{morador?.nome || 'Morador não encontrado'}</p>
                    <p className="text-sm text-gray-500">{morador?.apelido_endereco || 'Endereço não encontrado'}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-mono">{encomenda.codigo}</p>
                    <p className="text-xs text-gray-500">
                        {encomenda.status === 'aguardando' ? 'Chegou em:' : 'Retirado em:'} {format(new Date(encomenda.status === 'aguardando' ? encomenda.data_entrada : encomenda.data_retirada), 'dd/MM HH:mm')}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PackageManagement({ encomendas, moradores }) {
    const [searchTerm, setSearchTerm] = useState('');

    const getMorador = (moradorId) => moradores.find(m => m.id === moradorId);

    const filterEncomendas = (list) => {
        if (!searchTerm) return list;
        const term = searchTerm.toLowerCase();
        return list.filter(encomenda => {
            const morador = getMorador(encomenda.morador_id);
            return (
                encomenda.codigo.toLowerCase().includes(term) ||
                (morador && morador.nome.toLowerCase().includes(term)) ||
                (morador && morador.apelido_endereco.toLowerCase().includes(term))
            );
        });
    };

    const encomendasAguardando = filterEncomendas(encomendas.filter(e => e.status === 'aguardando'));
    const encomendasRetiradas = filterEncomendas(encomendas.filter(e => e.status === 'retirada'));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Encomendas</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="aguardando">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <TabsList>
                            <TabsTrigger value="aguardando">
                                <Package className="w-4 h-4 mr-2"/>
                                Aguardando ({encomendasAguardando.length})
                            </TabsTrigger>
                            <TabsTrigger value="retiradas">
                                <PackageCheck className="w-4 h-4 mr-2"/>
                                Retiradas ({encomendasRetiradas.length})
                            </TabsTrigger>
                        </TabsList>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input 
                                placeholder="Buscar por código ou morador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    
                    <TabsContent value="aguardando" className="mt-4 border rounded-lg max-h-96 overflow-y-auto">
                        {encomendasAguardando.length > 0 ? (
                           encomendasAguardando.map(enc => (
                                <EncomendaItem key={enc.id} encomenda={enc} morador={getMorador(enc.morador_id)} />
                            ))
                        ) : (
                            <p className="p-6 text-center text-gray-500">Nenhuma encomenda aguardando retirada.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="retiradas" className="mt-4 border rounded-lg max-h-96 overflow-y-auto">
                        {encomendasRetiradas.length > 0 ? (
                            encomendasRetiradas.map(enc => (
                                <EncomendaItem key={enc.id} encomenda={enc} morador={getMorador(enc.morador_id)} />
                            ))
                        ) : (
                            <p className="p-6 text-center text-gray-500">Nenhuma encomenda retirada encontrada.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}