import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Bell,
  Shield,
  Clock,
  CheckCircle,
  Star,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function Inicio() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    condominio: '',
    numeroMoradores: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Formulário enviado:", formData);
    setFormSubmitted(true);
    
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        condominio: '',
        numeroMoradores: ''
      });
    }, 3000);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const beneficios = [
    {
      icon: Package,
      titulo: "Organização Total",
      descricao: "Registre e rastreie todas as entregas em um só lugar. Sem mais encomendas perdidas ou esquecidas."
    },
    {
      icon: Bell,
      titulo: "Notificações Automáticas",
      descricao: "Moradores recebem WhatsApp instantâneo quando a encomenda chega. Retirada mais rápida e eficiente."
    },
    {
      icon: Shield,
      titulo: "Segurança Reforçada",
      descricao: "Controle de retirada com QR Code, assinatura digital e registro fotográfico de cada entrega."
    },
    {
      icon: Clock,
      titulo: "Economia de Tempo",
      descricao: "Automatize processos e reduza o tempo gasto com controle manual. Portaria mais ágil e produtiva."
    }
  ];

  const depoimentos = [
    {
      nome: "Carlos Silva",
      cargo: "Síndico - Residencial Jardim das Flores",
      foto: "https://i.pravatar.cc/150?img=12",
      texto: "Depois do PackageManager, nossa portaria virou outra! As encomendas são organizadas automaticamente e os moradores adoram receber notificação no WhatsApp. Valeu cada centavo.",
      rating: 5
    },
    {
      nome: "Marina Costa",
      cargo: "Administradora - Condomínio Vista Verde",
      foto: "https://i.pravatar.cc/150?img=45",
      texto: "Sistema intuitivo e fácil de usar. Em uma semana já estávamos operando perfeitamente. O suporte é excelente e sempre disponível. Recomendo muito!",
      rating: 5
    },
    {
      nome: "Roberto Mendes",
      cargo: "Síndico - Edifício Morada do Sol",
      foto: "https://i.pravatar.cc/150?img=33",
      texto: "O controle de entregas era um caos. Hoje tudo é rastreado, os moradores sabem exatamente quando chegou, e a portaria trabalha muito mais tranquila. Solução perfeita!",
      rating: 5
    }
  ];

  const faqs = [
    {
      pergunta: "Funciona para condomínios de quantos moradores?",
      resposta: "Nosso plano básico é ideal para condomínios de até 30 moradores. Para condomínios maiores, temos planos personalizados. Entre em contato!"
    },
    {
      pergunta: "Há taxa de instalação ou setup?",
      resposta: "Não! O valor de R$109/mês já inclui tudo: acesso completo ao sistema, suporte, atualizações e notificações WhatsApp ilimitadas."
    },
    {
      pergunta: "É difícil de usar?",
      resposta: "Não! O sistema foi desenhado para ser extremamente intuitivo. Em menos de 30 minutos você e sua equipe já estarão usando com confiança. Além disso, oferecemos treinamento online gratuito."
    },
    {
      pergunta: "E se eu quiser cancelar?",
      resposta: "Sem burocracia! Você pode cancelar a qualquer momento, sem multas ou taxas. Acreditamos em oferecer um serviço tão bom que você não vai querer sair."
    },
    {
      pergunta: "Como funcionam as notificações por WhatsApp?",
      resposta: "Quando uma encomenda é registrada, o sistema envia automaticamente uma mensagem no WhatsApp do morador com o código de retirada. Tudo integrado e automático!"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PackageManager</span>
            </div>

            {/* Menu Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('beneficios')} className="text-gray-600 hover:text-blue-600 transition-colors">
                Benefícios
              </button>
              <button onClick={() => scrollToSection('depoimentos')} className="text-gray-600 hover:text-blue-600 transition-colors">
                Depoimentos
              </button>
              <button onClick={() => scrollToSection('preco')} className="text-gray-600 hover:text-blue-600 transition-colors">
                Preço
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-blue-600 transition-colors">
                FAQ
              </button>
              <Button onClick={() => window.location.href = createPageUrl('Dashboard')} variant="outline">
                Entrar
              </Button>
              <Button onClick={() => scrollToSection('cadastro')} className="bg-blue-600 hover:bg-blue-700">
                Começar Agora
              </Button>
            </nav>

            {/* Menu Mobile */}
            <button 
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-white"
            >
              <div className="px-4 py-4 space-y-3">
                <button 
                  onClick={() => scrollToSection('beneficios')} 
                  className="block w-full text-left py-2 text-gray-600 hover:text-blue-600"
                >
                  Benefícios
                </button>
                <button 
                  onClick={() => scrollToSection('depoimentos')} 
                  className="block w-full text-left py-2 text-gray-600 hover:text-blue-600"
                >
                  Depoimentos
                </button>
                <button 
                  onClick={() => scrollToSection('preco')} 
                  className="block w-full text-left py-2 text-gray-600 hover:text-blue-600"
                >
                  Preço
                </button>
                <button 
                  onClick={() => scrollToSection('faq')} 
                  className="block w-full text-left py-2 text-gray-600 hover:text-blue-600"
                >
                  FAQ
                </button>
                <Button 
                  onClick={() => window.location.href = createPageUrl('Dashboard')} 
                  variant="outline" 
                  className="w-full"
                >
                  Entrar
                </Button>
                <Button 
                  onClick={() => scrollToSection('cadastro')} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Começar Agora
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
                ✨ Solução Completa para Condomínios
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Gestão de Encomendas{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Simples e Automática
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Organize as entregas do seu condomínio, notifique moradores automaticamente via WhatsApp e tenha controle total com QR Code e assinatura digital.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg"
                  onClick={() => scrollToSection('cadastro')}
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
                >
                  Comece Agora por R$109/mês
                  <ChevronDown className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('beneficios')}
                  className="text-lg px-8 py-6"
                >
                  Ver Benefícios
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Sem taxa de instalação
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Cancele quando quiser
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Suporte incluído
                </div>
              </div>
            </motion.div>

            {/* Imagem/Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 lg:p-12">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Nova Encomenda</h3>
                      <p className="text-sm text-gray-500">Registrada agora</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Morador:</span>
                      <span className="font-semibold">João Silva - Apto 103</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Código:</span>
                      <Badge className="bg-green-100 text-green-800 border-0">12345</Badge>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">
                        WhatsApp enviado automaticamente
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold">Notificação enviada!</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Por que escolher o PackageManager?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que seu condomínio precisa
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma solução completa que automatiza, organiza e traz segurança para a gestão de encomendas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <beneficio.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{beneficio.titulo}</h3>
                    <p className="text-gray-600 leading-relaxed">{beneficio.descricao}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Encomendas gerenciadas por dia</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Satisfação dos síndicos</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-5xl font-bold mb-2">2 min</div>
              <div className="text-blue-100">Tempo médio de registro</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Condomínios reais, resultados reais
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {depoimentos.map((depoimento, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-0 shadow-md">
                  <CardContent className="p-6">
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(depoimento.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Texto */}
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{depoimento.texto}"
                    </p>

                    {/* Autor */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <img 
                        src={depoimento.foto} 
                        alt={depoimento.nome}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{depoimento.nome}</div>
                        <div className="text-sm text-gray-600">{depoimento.cargo}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
            Plano Único e Transparente
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tudo incluído por apenas
          </h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card className="border-2 border-blue-600 shadow-2xl max-w-lg mx-auto">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-center">
                  <div className="text-6xl font-bold mb-2">R$ 109</div>
                  <div className="text-xl opacity-90">por mês</div>
                  <div className="text-sm opacity-75 mt-2">Até 30 moradores</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-8">
                  {[
                    "Registro ilimitado de encomendas",
                    "Notificações WhatsApp automáticas",
                    "QR Code e assinatura digital",
                    "Controle de visitantes",
                    "Gestão de chamados",
                    "Relatórios e métricas",
                    "Suporte prioritário",
                    "Sem taxa de instalação"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  size="lg"
                  onClick={() => scrollToSection('cadastro')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  Começar Agora
                </Button>

                <p className="text-sm text-gray-500 text-center mt-4">
                  Cancele quando quiser • Sem multas • Sem surpresas
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Perguntas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tire suas dúvidas
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-3">{faq.pergunta}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.resposta}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário de Cadastro */}
      <section id="cadastro" className="py-16 md:py-24 px-4 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar seu condomínio?
            </h2>
            <p className="text-xl text-blue-100">
              Preencha o formulário e nossa equipe entrará em contato em até 24h
            </p>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Cadastro Recebido!
                  </h3>
                  <p className="text-gray-600">
                    Em breve nossa equipe entrará em contato com você.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <Input
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Seu nome"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="seu@email.com"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone/WhatsApp *
                    </label>
                    <Input
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Condomínio *
                    </label>
                    <Input
                      required
                      value={formData.condominio}
                      onChange={(e) => setFormData({...formData, condominio: e.target.value})}
                      placeholder="Ex: Residencial Jardim das Flores"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Moradores (aproximado)
                    </label>
                    <Input
                      value={formData.numeroMoradores}
                      onChange={(e) => setFormData({...formData, numeroMoradores: e.target.value})}
                      placeholder="Ex: 30"
                      className="h-12"
                    />
                  </div>

                  <Button 
                    type="submit"
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                  >
                    Solicitar Demonstração Gratuita
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    Ao preencher o formulário, você concorda com nossa Política de Privacidade
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo e descrição */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">PackageManager</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                A solução completa para gestão de encomendas em condomínios. Automatize processos, aumente a segurança e melhore a experiência dos moradores.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-bold mb-4">Menu</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('beneficios')} className="hover:text-white transition-colors">Benefícios</button></li>
                <li><button onClick={() => scrollToSection('depoimentos')} className="hover:text-white transition-colors">Depoimentos</button></li>
                <li><button onClick={() => scrollToSection('preco')} className="hover:text-white transition-colors">Preço</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-bold mb-4">Contato</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>(11) 99999-9999</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contato@packagemanager.com.br</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>São Paulo - SP</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 PackageManager. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm text-gray-400">
              <button className="hover:text-white transition-colors">
                Termos de Uso
              </button>
              <button className="hover:text-white transition-colors">
                Política de Privacidade
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}