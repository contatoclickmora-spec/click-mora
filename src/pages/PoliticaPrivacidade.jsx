import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Click Mora</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Política de Privacidade
            </h1>
            <p className="text-lg text-gray-600">Click Mora</p>
            <p className="text-sm text-gray-500 mt-2">
              Última atualização: 11/11/2025
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-10 pb-8 border-b border-gray-200">
            <p className="text-gray-700 leading-relaxed text-lg">
              O <strong>Click Mora</strong> é um aplicativo destinado à gestão de encomendas em condomínios. 
              Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações 
              durante o uso do app.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">1.</span> Informações que coletamos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Coletamos apenas as informações necessárias para o funcionamento do aplicativo:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Nome do usuário</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Unidade ou identificação no condomínio</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Número de telefone</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Dados de login</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Fotos de encomendas registradas</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Informações fornecidas voluntariamente pelo usuário</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 font-medium">
              O aplicativo não coleta dados desnecessários, e nenhuma informação é vendida ou 
              compartilhada com terceiros.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">2.</span> Uso das informações
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Os dados coletados são usados para:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Registrar e gerenciar encomendas</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Notificar moradores sobre entregas</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Registrar retiradas com segurança</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Manter o histórico de movimentação de encomendas</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Melhorar a experiência do usuário</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 font-medium">
              O Click Mora nunca utiliza seus dados para fins comerciais externos.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">3.</span> Armazenamento e Segurança
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Seus dados são armazenados com criptografia e protegidos com protocolos de segurança.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Utilizamos:</strong>
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Conexões seguras (HTTPS)</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Controle de acesso por nível de permissão</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Armazenamento seguro de senhas (hash + criptografia)</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              O acesso é permitido apenas a usuários autorizados (porteiros, administradores e moradores).
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">4.</span> Compartilhamento de informações
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Não compartilhamos seus dados com:</strong>
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Empresas terceiras</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Plataformas externas</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Propagandas</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Serviços de marketing</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 font-medium">
              Compartilhamos dados somente quando obrigatório por lei.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">5.</span> Direitos do usuário
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Você pode solicitar:</strong>
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Acesso aos seus dados</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Correção de informações pessoais</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Exclusão de informações</span>
              </li>
              <li className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Transferência dos seus dados</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Basta entrar em contato conosco.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">6.</span> Exclusão de dados
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              O usuário pode solicitar a exclusão total dos seus dados enviando uma mensagem para:
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <a 
                href="mailto:contato@clickmora.com.br" 
                className="text-blue-700 font-semibold hover:text-blue-900 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                contato@clickmora.com.br
              </a>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              Em até <strong>30 dias úteis</strong>, todos os dados serão removidos do sistema.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">7.</span> Cookies e tecnologias de rastreamento
            </h2>
            <p className="text-gray-700 leading-relaxed font-medium">
              O Click Mora não utiliza cookies, trackers, publicidade, GPS ou monitoramento externo.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">8.</span> Alterações nesta Política
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Podemos atualizar esta política conforme necessário.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Quando isso ocorrer, a data de atualização será modificada no início da página.
            </p>
          </section>

          {/* Section 9 - Contact */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">9.</span> Contato
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Em caso de dúvidas, entre em contato com nosso suporte:
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Email:</p>
              <a 
                href="mailto:contato@clickmora.com.br" 
                className="text-blue-700 text-lg font-semibold hover:text-blue-900 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                contato@clickmora.com.br
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2025 Click Mora. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}