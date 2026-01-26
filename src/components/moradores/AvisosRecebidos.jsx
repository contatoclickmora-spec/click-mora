import React, { useState, useEffect } from 'react';
import { Aviso } from "@/entities/Aviso";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, Search, AlertCircle, Calendar, User } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import MoradorHeader from '../shared/MoradorHeader';
import MoradorFooter from '../shared/MoradorFooter';

export default function AvisosRecebidos({ moradorLogado }) {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAvisos();
  }, [moradorLogado]);

  const loadAvisos = async () => {
    try {
      setLoading(true);
      const todosAvisos = await Aviso.list('-data_envio');
      
      const avisosFiltrados = todosAvisos.filter(aviso => {
        if (aviso.condominio_id !== moradorLogado?.condominio_id) return false;
        
        if (aviso.tipo_destinatario === 'todos') return true;
        if (aviso.tipo_destinatario === 'individuais' && aviso.moradores_destinatarios?.includes(moradorLogado?.id)) return true;
        
        // Filtros por bloco/apartamento se implementados
        return false;
      });
      
      setAvisos(avisosFiltrados);
    } catch (err) {
      console.error("Erro ao carregar avisos:", err);
      setError("Erro ao carregar avisos");
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const avisosFiltrados = avisos.filter(aviso => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return aviso.titulo?.toLowerCase().includes(term) ||
           aviso.mensagem?.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
        <MoradorHeader title="Avisos" />
        <div className="flex items-center justify-center pt-24 pb-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b5998' }} />
        </div>
        <MoradorFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <MoradorHeader title="Avisos" />
      
      <div className="pt-16 pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
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

          {/* Lista de Avisos */}
          {avisosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: '#8b9dc3' }}>Nenhum aviso encontrado</p>
            </div>
          ) : (
            avisosFiltrados.map((aviso) => (
              <Card 
                key={aviso.id} 
                className="border-0 shadow-sm"
                style={{ backgroundColor: '#ffffff' }}
              >
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#2c2c2c' }}>
                    {aviso.titulo}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm mb-3" style={{ color: '#8b9dc3' }}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(parseISO(aviso.data_envio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm mb-3" style={{ color: '#8b9dc3' }}>
                    <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{aviso.enviado_por}</span>
                  </div>

                  <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#2c2c2c' }}>
                    {aviso.mensagem}
                  </p>

                  {aviso.imagem_url && (
                    <div className="mt-4">
                      <img
                        src={aviso.imagem_url}
                        alt="Imagem do aviso"
                        className="w-full rounded-lg"
                        style={{ maxHeight: '300px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
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