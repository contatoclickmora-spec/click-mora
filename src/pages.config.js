import AdminMaster from './pages/AdminMaster';
import AprovacaoMoradores from './pages/AprovacaoMoradores';
import Assinatura from './pages/Assinatura';
import AuditoriaAlteracoes from './pages/AuditoriaAlteracoes';
import AvisosMorador from './pages/AvisosMorador';
import ChamadosPortaria from './pages/ChamadosPortaria';
import ComoUsar from './pages/ComoUsar';
import ConfiguracoesSistema from './pages/ConfiguracoesSistema';
import ConfiguracoesWhatsApp from './pages/ConfiguracoesWhatsApp';
import ConfiguracoesWhatsAppAdmin from './pages/ConfiguracoesWhatsAppAdmin';
import Dashboard from './pages/Dashboard';
import DashboardMorador from './pages/DashboardMorador';
import DetalhesEnquete from './pages/DetalhesEnquete';
import DetalhesImovelVistoria from './pages/DetalhesImovelVistoria';
import DocumentoDetalhes from './pages/DocumentoDetalhes';
import Documentos from './pages/Documentos';
import EncomendasMorador from './pages/EncomendasMorador';
import Enquetes from './pages/Enquetes';
import Entregadores from './pages/Entregadores';
import EnviarAvisos from './pages/EnviarAvisos';
import Funcionarios from './pages/Funcionarios';
import GerenciamentoEncomendas from './pages/GerenciamentoEncomendas';
import GerenciamentoUsuarios from './pages/GerenciamentoUsuarios';
import GestaoCondominios from './pages/GestaoCondominios';
import GestaoUsuarios from './pages/GestaoUsuarios';
import LogsAuditoria from './pages/LogsAuditoria';
import Marketplace from './pages/Marketplace';
import MonitoramentoSistema from './pages/MonitoramentoSistema';
import Moradores from './pages/Moradores';
import NotificacoesWhatsApp from './pages/NotificacoesWhatsApp';
import NovaEnquete from './pages/NovaEnquete';
import NovaVistoria from './pages/NovaVistoria';
import NovoDocumento from './pages/NovoDocumento';
import Permissoes from './pages/Permissoes';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import PotenciaisCondominios from './pages/PotenciaisCondominios';
import RegistrarEncomenda from './pages/RegistrarEncomenda';
import Relatorios from './pages/Relatorios';
import RelatoriosFinanceiros from './pages/RelatoriosFinanceiros';
import RetirarEncomenda from './pages/RetirarEncomenda';
import SOS from './pages/SOS';
import Templates from './pages/Templates';
import TipoEmergencia from './pages/TipoEmergencia';
import VisitantesPortaria from './pages/VisitantesPortaria';
import VistoriaImoveis from './pages/VistoriaImoveis';
import inicio from './pages/inicio';
import pagina from './pages/pagina';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminMaster": AdminMaster,
    "AprovacaoMoradores": AprovacaoMoradores,
    "Assinatura": Assinatura,
    "AuditoriaAlteracoes": AuditoriaAlteracoes,
    "AvisosMorador": AvisosMorador,
    "ChamadosPortaria": ChamadosPortaria,
    "ComoUsar": ComoUsar,
    "ConfiguracoesSistema": ConfiguracoesSistema,
    "ConfiguracoesWhatsApp": ConfiguracoesWhatsApp,
    "ConfiguracoesWhatsAppAdmin": ConfiguracoesWhatsAppAdmin,
    "Dashboard": Dashboard,
    "DashboardMorador": DashboardMorador,
    "DetalhesEnquete": DetalhesEnquete,
    "DetalhesImovelVistoria": DetalhesImovelVistoria,
    "DocumentoDetalhes": DocumentoDetalhes,
    "Documentos": Documentos,
    "EncomendasMorador": EncomendasMorador,
    "Enquetes": Enquetes,
    "Entregadores": Entregadores,
    "EnviarAvisos": EnviarAvisos,
    "Funcionarios": Funcionarios,
    "GerenciamentoEncomendas": GerenciamentoEncomendas,
    "GerenciamentoUsuarios": GerenciamentoUsuarios,
    "GestaoCondominios": GestaoCondominios,
    "GestaoUsuarios": GestaoUsuarios,
    "LogsAuditoria": LogsAuditoria,
    "Marketplace": Marketplace,
    "MonitoramentoSistema": MonitoramentoSistema,
    "Moradores": Moradores,
    "NotificacoesWhatsApp": NotificacoesWhatsApp,
    "NovaEnquete": NovaEnquete,
    "NovaVistoria": NovaVistoria,
    "NovoDocumento": NovoDocumento,
    "Permissoes": Permissoes,
    "PoliticaPrivacidade": PoliticaPrivacidade,
    "PotenciaisCondominios": PotenciaisCondominios,
    "RegistrarEncomenda": RegistrarEncomenda,
    "Relatorios": Relatorios,
    "RelatoriosFinanceiros": RelatoriosFinanceiros,
    "RetirarEncomenda": RetirarEncomenda,
    "SOS": SOS,
    "Templates": Templates,
    "TipoEmergencia": TipoEmergencia,
    "VisitantesPortaria": VisitantesPortaria,
    "VistoriaImoveis": VistoriaImoveis,
    "inicio": inicio,
    "pagina": pagina,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};