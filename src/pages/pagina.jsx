import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MessageSquare, 
  Users, 
  Megaphone, 
  ClipboardList,
  ShoppingBag,
  Home,
  ThumbsUp,
  QrCode,
  PackageCheck,
  UserCheck,
  BarChart3,
  MessageCircle,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Star
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function pagina() {
  const beneficiosMoradores = [
    {
      icon: Package,
      titulo: "Gestão de Encomendas",
      descricao: "Receba notificações instantâneas quando suas encomendas chegarem e retire com segurança usando QR Code ou senha.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: MessageSquare,
      titulo: "Chamados Simplificados",
      descricao: "Abra chamados diretamente pelo app para síndico ou portaria e acompanhe o status em tempo real.",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: ClipboardList,
      titulo: "Controle de Visitantes",
      descricao: "Autorize visitantes com antecedência, evite filas na portaria e garanta mais segurança para sua família.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Megaphone,
      titulo: "Avisos em Tempo Real",
      descricao: "Receba todos os comunicados importantes do condomínio diretamente no seu celular.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: ThumbsUp,
      titulo: "Enquetes e Decisões",
      descricao: "Participe das decisões do condomínio votando em enquetes de forma simples e transparente.",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: ShoppingBag,
      titulo: "Marketplace do Condomínio",
      descricao: "Compre e venda produtos entre vizinhos com segurança e praticidade.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Home,
      titulo: "Vistoria de Imóveis",
      descricao: "Gerencie vistorias completas de entrada e saída de inquilinos com fotos e assinaturas digitais.",
      color: "from-cyan-500 to-cyan-600"
    }
  ];

  const beneficiosEquipe = [
    {
      icon: QrCode,
      titulo: "Registro Rápido de Encomendas",
      descricao: "Registre encomendas em segundos usando QR Code, OCR automático e fotos.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: PackageCheck,
      titulo: "Retirada Segura",
      descricao: "Valide a identidade do morador com QR Code, senha ou busca manual com assinatura digital.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Users,
      titulo: "Gestão de Visitantes",
      descricao: "Controle acesso de visitantes com base nas autorizações dos moradores, registrando entrada e saída.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: MessageSquare,
      titulo: "Resposta a Chamados",
      descricao: "Visualize e responda chamados dos moradores de forma organizada e eficiente.",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Clock,
      titulo: "Interface Otimizada",
      descricao: "Dashboard intuitivo com acesso rápido às funcionalidades mais usadas no dia a dia.",
      color: "from-blue-500 to-blue-600"
    }
  ];

  const beneficiosSindicos = [
    {
      icon: UserCheck,
      titulo: "Aprovação de Moradores",
      descricao: "Revise e aprove novos cadastros de moradores com facilidade e segurança.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Megaphone,
      titulo: "Comunicação em Massa",
      descricao: "Envie avisos para todos os moradores ou grupos específicos (por bloco, apartamento ou individual).",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: MessageCircle,
      titulo: "Integração WhatsApp",
      descricao: "Configure notificações automáticas via WhatsApp para avisos e encomendas.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: BarChart3,
      titulo: "Relatórios Completos",
      descricao: "Acesse métricas detalhadas sobre encomendas, chamados, visitantes e atividades do condomínio.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      titulo: "Gestão de Usuários",
      descricao: "Gerencie moradores, porteiros e funcionários com controle total de permissões e acessos.",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Shield,
      titulo: "Logs de Auditoria",
      descricao: "Monitore todas as ações realizadas no sistema para garantir transparência e segurança.",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: ThumbsUp,
      titulo: "Enquetes para Decisões",
      descricao: "Crie enquetes para consultar os moradores sobre decisões importantes do condomínio.",
      color: "from-cyan-500 to-cyan-600"
    }
  ];

  const diferenciais = [
    {
      icon: Zap,
      titulo: "Rápido e Intuitivo",
      descricao: "Interface moderna e fácil de usar, sem necessidade de treinamento complexo."
    },
    {
      icon: Shield,
      titulo: "Seguro e Confiável",
      descricao: "Seus dados protegidos com tecnologia de ponta e backups automáticos."
    },
    {
      icon: MessageCircle,
      titulo: "Suporte Especializado",
      descricao: "Equipe pronta para ajudar você a tirar o máximo proveito do sistema."
    },
    {
      icon: Star,
      titulo: "Sempre Atualizado",
      descricao: "Novas funcionalidades adicionadas regularmente sem custo adicional."
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-8">
            <Badge className="bg-white/20 text-white border-white/30 px-6 py-2 text-sm">
              Sistema Completo de Gestão de Condomínios
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Transforme a Gestão do<br />
              <span className="text-blue-200">Seu Condomínio</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Simplifique o controle de encomendas, visitantes, chamados e muito mais com uma plataforma completa e fácil de usar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6"
                onClick={() => scrollToSection('beneficios')}
              >
                Conhecer Benefícios
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => scrollToSection('contato')}
              >
                Solicitar Demonstração
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 md:mt-24">
            {[
              { numero: "100%", texto: "Digital" },
              { numero: "24/7", texto: "Disponível" },
              { numero: "99%", texto: "Satisfação" },
              { numero: "Suporte", texto: "Dedicado" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.numero}</div>
                <div className="text-blue-200 mt-1">{stat.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios para Moradores */}
      <section id="beneficios" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 mb-4">Para Moradores</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mais Comodidade no Seu Dia a Dia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa na palma da sua mão
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiosMoradores.map((beneficio, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${beneficio.color} flex items-center justify-center mb-4`}>
                    <beneficio.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{beneficio.titulo}</h3>
                  <p className="text-gray-600">{beneficio.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios para Equipe */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4">Para Porteiros e Funcionários</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trabalho Mais Eficiente e Organizado
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Otimize processos e economize tempo no dia a dia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiosEquipe.map((beneficio, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${beneficio.color} flex items-center justify-center mb-4`}>
                    <beneficio.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{beneficio.titulo}</h3>
                  <p className="text-gray-600">{beneficio.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios para Síndicos */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 mb-4">Para Síndicos e Administradores</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Controle Total e Relatórios Completos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Gerencie seu condomínio com transparência e eficiência
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiosSindicos.map((beneficio, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${beneficio.color} flex items-center justify-center mb-4`}>
                    <beneficio.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{beneficio.titulo}</h3>
                  <p className="text-gray-600">{beneficio.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por Que Escolher Nosso Sistema?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {diferenciais.map((item, idx) => (
              <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.titulo}</h3>
                  <p className="text-gray-600 text-sm">{item.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contato" className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto Para Transformar Seu Condomínio?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Entre em contato e solicite uma demonstração gratuita do sistema
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6"
            >
              <MessageCircle className="mr-2 w-5 h-5" />
              Falar com Especialista
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-blue-200 mb-4">Já tem uma conta?</p>
            <a 
              href={createPageUrl('inicio')}
              className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors font-semibold"
            >
              Acessar Sistema
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2025 Click Mora - Sistema de Gestão de Condomínios. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}