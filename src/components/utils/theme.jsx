
// Configuração de Tema Global do Sistema
// Centraliza cores, espaçamentos e estilos para garantir consistência visual

export const theme = {
  colors: {
    // Cores Primárias
    primary: '#7B61FF',
    primaryLight: '#A38BFF',
    primaryLighter: '#EDE9FF',
    
    // Cores Secundárias
    secondary: '#6366F1',
    secondaryLight: '#818CF8',
    
    // Backgrounds
    background: '#F9F9FC',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#F3F4F6',
    
    // Texto
    textPrimary: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textLight: '#FFFFFF',
    
    // Feedback
    success: '#4CAF50',
    successLight: '#81C784',
    error: '#F44336',
    errorLight: '#E57373',
    warning: '#FFB74D',
    warningLight: '#FFD54F',
    info: '#2196F3',
    infoLight: '#64B5F6',
    
    // Neutros
    border: '#E5E7EB',
    borderDark: '#D1D5DB',
    shadow: 'rgba(123, 97, 255, 0.1)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 3px rgba(123, 97, 255, 0.08)',
    md: '0 4px 6px rgba(123, 97, 255, 0.1)',
    lg: '0 10px 15px rgba(123, 97, 255, 0.12)',
    xl: '0 20px 25px rgba(123, 97, 255, 0.15)',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
};

// Classes CSS utilizáveis via Tailwind
export const globalStyles = {
  // Cards
  card: 'bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300',
  cardHeader: 'p-4 border-b border-gray-100',
  cardBody: 'p-4',
  
  // Botões
  btnPrimary: 'bg-[#7B61FF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6B51EF] active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg',
  btnSecondary: 'border-2 border-[#7B61FF] text-[#7B61FF] px-6 py-3 rounded-lg font-medium hover:bg-[#EDE9FF] active:scale-95 transition-all duration-200',
  btnOutline: 'border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 active:scale-95 transition-all duration-200',
  btnDanger: 'bg-[#F44336] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E33326] active:scale-95 transition-all duration-200 shadow-md',
  
  // Inputs
  input: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B61FF] focus:border-transparent transition-all duration-200',
  textarea: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B61FF] focus:border-transparent transition-all duration-200 resize-none',
  
  // Badges
  badgeSuccess: 'bg-[#E8F5E9] text-[#4CAF50] px-3 py-1 rounded-full text-sm font-medium',
  badgeError: 'bg-[#FFEBEE] text-[#F44336] px-3 py-1 rounded-full text-sm font-medium',
  badgeWarning: 'bg-[#FFF3E0] text-[#FFB74D] px-3 py-1 rounded-full text-sm font-medium',
  badgeInfo: 'bg-[#E3F2FD] text-[#2196F3] px-3 py-1 rounded-full text-sm font-medium',
  badgePrimary: 'bg-[#EDE9FF] text-[#7B61FF] px-3 py-1 rounded-full text-sm font-medium',
  
  // Headers
  pageHeader: 'bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40 shadow-sm',
  pageTitle: 'text-2xl font-bold text-[#333333] flex items-center gap-3',
  
  // Containers
  container: 'max-w-7xl mx-auto px-4 py-6',
  section: 'mb-6',
  
  // Listas
  listItem: 'bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 mb-3 border border-gray-100',
  
  // Alerts
  alertSuccess: 'bg-[#E8F5E9] border border-[#4CAF50] text-[#2E7D32] p-4 rounded-lg mb-4',
  alertError: 'bg-[#FFEBEE] border border-[#F44336] text-[#C62828] p-4 rounded-lg mb-4',
  alertWarning: 'bg-[#FFF3E0] border border-[#FFB74D] text-[#E65100] p-4 rounded-lg mb-4',
  alertInfo: 'bg-[#E3F2FD] border border-[#2196F3] text-[#1565C0] p-4 rounded-lg mb-4',
};

export default theme;
