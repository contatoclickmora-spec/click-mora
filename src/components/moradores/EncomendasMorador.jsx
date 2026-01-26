import React, { useState, useEffect } from 'react';
import { Encomenda } from "@/entities/Encomenda";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  Search, 
  Calendar, 
  User, 
  CheckCircle,
  Loader2,
  AlertCircle,
  QrCode as QrCodeIcon
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import MoradorHeader from '../shared/MoradorHeader';
import MoradorFooter from '../shared/MoradorFooter';
import DetalhesEncomenda from './DetalhesEncomenda';

export default function EncomendasMorador({ moradorLogado }) {
  const [encomendas, setEncomendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('aguardando');
  const [encomendaSelecionada, setEncomendaSelecionada] = useState(null);

  useEffect(() => {
    loadEncomendas();
  }, [moradorLogado]);

  const loadEncomendas = async () => {
    try {
      setLoading(true);
      const todasEncomendas = await Encomenda.list('-data_entrada');
      const minhasEncomendas = todasEncomendas.filter(e => e.morador_id === moradorLogado?.id);
      setEncomendas(minhasEncomendas);
    } catch (err) {
      console.error("Erro ao carregar encomendas:", err);
      setError("Erro ao carregar encomendas");
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filterEncomendas = () => {
    let filtradas = encomendas;

    if (filtroStatus !== 'todas') {
      filtradas = filtradas.filter(e => e.status === filtroStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtradas = filtradas.filter(e =>
        e.codigo?.toLowerCase().includes(term) ||
        e.remetente?.toLowerCase().includes(term)
      );
    }

    return filtradas;
  };

  const encomendasFiltradas = filterEncomendas();
  const pendentes = encomendas.filter(e => e.status === 'aguardando').length;
  const retiradas = encomendas.filter(e => e.status === 'retirada').length;

  if (encomendaSelecionada) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
        <MoradorHeader title="Detalhes da Encomenda" onBack={() => setEncomendaSelecionada(null)} />
        <div className="pt-16 pb-24">
          <DetalhesEncomenda
            encomenda={encomendaSelecionada}
            onClose={() => setEncomendaSelecionada(null)}
          />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
        <MoradorHeader title="Minhas Encomendas" />
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b5998' }} />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <MoradorHeader title="Minhas Encomendas" />
      
      <div className="pt-16 pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Barra de Busca */}
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <CardContent className="p-3">
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: '#8b9dc3' }}
                />
                <Input
                  placeholder="Encontrar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-0"
                  style={{ backgroundColor: '#dfe3ee' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="border-0 shadow-sm cursor-pointer"
              style={{ backgroundColor: filtroStatus === 'aguardando' ? '#3b5998' : '#ffffff' }}
              onClick={() => setFiltroStatus('aguardando')}
            >
              <CardContent className="p-4 text-center">
                <Package 
                  className="w-6 h-6 mx-auto mb-2" 
                  style={{ color: filtroStatus === 'aguardando' ? '#ffffff' : '#3b5998' }}
                />
                <p 
                  className="text-2xl font-bold"
                  style={{ color: filtroStatus === 'aguardando' ? '#ffffff' : '#2c2c2c' }}
                >
                  {pendentes}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: filtroStatus === 'aguardando' ? '#ffffff' : '#8b9dc3' }}
                >
                  Aguardando
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-0 shadow-sm cursor-pointer"
              style={{ backgroundColor: filtroStatus === 'retirada' ? '#3b5998' : '#ffffff' }}
              onClick={() => setFiltroStatus('retirada')}
            >
              <CardContent className="p-4 text-center">
                <CheckCircle 
                  className="w-6 h-6 mx-auto mb-2" 
                  style={{ color: filtroStatus === 'retirada' ? '#ffffff' : '#27ae60' }}
                />
                <p 
                  className="text-2xl font-bold"
                  style={{ color: filtroStatus === 'retirada' ? '#ffffff' : '#2c2c2c' }}
                >
                  {retiradas}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: filtroStatus === 'retirada' ? '#ffffff' : '#8b9dc3' }}
                >
                  Retiradas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista */}
          {encomendasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4" style={{ color: '#dfe3ee' }} />
              <p style={{ color: '#8b9dc3' }}>Nenhuma encomenda encontrada</p>
            </div>
          ) : (
            encomendasFiltradas.map((encomenda) => (
              <Card 
                key={encomenda.id}
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                style={{ backgroundColor: '#ffffff' }}
                onClick={() => setEncomendaSelecionada(encomenda)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {encomenda.foto_encomenda ? (
                      <img
                        src={encomenda.foto_encomenda}
                        alt="Encomenda"
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#dfe3ee' }}
                      >
                        <Package className="w-10 h-10" style={{ color: '#8b9dc3' }} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-base" style={{ color: '#2c2c2c' }}>
                          {encomenda.remetente || "Remetente não informado"}
                        </h3>
                        <Badge 
                          className="flex-shrink-0"
                          style={{ 
                            backgroundColor: encomenda.status === 'aguardando' ? '#3b5998' : '#27ae60',
                            color: '#ffffff'
                          }}
                        >
                          {encomenda.status === 'aguardando' ? 'Aguardando' : 'Retirada'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm mb-1" style={{ color: '#8b9dc3' }}>
                        <QrCodeIcon className="w-4 h-4" />
                        <span className="font-mono font-semibold">{encomenda.codigo}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs" style={{ color: '#8b9dc3' }}>
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(parseISO(encomenda.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {encomenda.porteiro_entrada && (
                        <div className="flex items-center gap-2 text-xs mt-1" style={{ color: '#8b9dc3' }}>
                          <User className="w-4 h-4" />
                          <span>Recebido por: {encomenda.porteiro_entrada}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <MoradorFooter />
    </div>
  );
}