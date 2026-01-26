import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Zap, 
  Shield, 
  HeadphonesIcon,
  Package,
  Clock,
  Award,
  Sparkles
} from "lucide-react";

export default function AssinaturaPage() {
  const handleAssinar = () => {
    window.location.href = "https://pay.cakto.com.br/4gdr24x_589797";
  };

  const beneficios = [
    { icon: Package, text: "Acesso completo à plataforma" },
    { icon: HeadphonesIcon, text: "Suporte prioritário" },
    { icon: Zap, text: "Atualizações automáticas" },
    { icon: Shield, text: "Segurança e privacidade garantidas" },
    { icon: Clock, text: "Disponibilidade 24/7" },
    { icon: Award, text: "Sem limites de uso" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-600 text-white px-4 py-2 text-sm">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            Oferta Especial
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal para Você
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Potencialize a gestão do seu condomínio com tecnologia de ponta
          </p>
        </div>

        {/* Card do Plano */}
        <Card className="shadow-2xl border-2 border-blue-200 relative overflow-hidden">
          {/* Badge de destaque */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-semibold transform rotate-12 translate-x-8 -translate-y-2">
            <Star className="w-4 h-4 inline mr-1" />
            Mais Popular
          </div>

          <CardHeader className="text-center pb-8 pt-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
              Plano Profissional
            </CardTitle>
            
            <CardDescription className="text-lg text-gray-600 mb-6">
              Acesso completo à plataforma + suporte prioritário
            </CardDescription>

            {/* Preço */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl md:text-6xl font-bold text-gray-900">
                  R$ 120
                </span>
                <div className="text-left">
                  <span className="text-2xl font-semibold text-gray-600">,00</span>
                  <p className="text-sm text-gray-500">/mês</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Cobrança mensal recorrente
              </p>
            </div>

            {/* Botão Principal */}
            <Button 
              onClick={handleAssinar}
              size="lg"
              className="w-full md:w-auto px-12 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Zap className="w-5 h-5 mr-2" />
              Assinar Agora
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              🔒 Pagamento seguro • Cancele quando quiser
            </p>
          </CardHeader>

          <CardContent className="pb-12">
            {/* Benefícios */}
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                O que está incluído:
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {beneficios.map((beneficio, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <beneficio.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{beneficio.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Garantia */}
            <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl text-center max-w-2xl mx-auto">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">Garantia de Satisfação</h4>
              <p className="text-sm text-gray-600">
                Experimente sem riscos. Se não gostar, cancele a qualquer momento sem burocracia.
              </p>
            </div>

            {/* FAQ Rápido */}
            <div className="mt-12 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Perguntas Frequentes
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Como funciona a cobrança?</h5>
                  <p className="text-sm text-gray-600">
                    A cobrança é mensal e recorrente. Você será cobrado automaticamente todo mês até o cancelamento.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Posso cancelar quando quiser?</h5>
                  <p className="text-sm text-gray-600">
                    Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas adicionais.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">O pagamento é seguro?</h5>
                  <p className="text-sm text-gray-600">
                    Totalmente seguro. Utilizamos a plataforma Cakto, com criptografia de ponta e certificação PCI DSS.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Dúvidas? Entre em contato com nosso suporte</p>
        </div>
      </div>
    </div>
  );
}