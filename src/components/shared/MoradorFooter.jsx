import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, QrCode, MessageSquare, Siren } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { useChamados } from '../utils/chamadosContext';

export default function MoradorFooter() {
  const location = useLocation();
  const { chamadosPendentes, loading } = useChamados();

  const footerItems = [
    {
      icon: Home,
      label: 'Início',
      path: createPageUrl('DashboardMorador'),
      key: 'inicio'
    },
    {
      icon: QrCode,
      label: 'Registrar',
      path: createPageUrl('RegistrarEncomenda'),
      key: 'registrar'
    },
    {
      icon: MessageSquare,
      label: 'Chamados',
      path: createPageUrl('DashboardMorador'),
      key: 'chamados',
      badge: chamadosPendentes
    },
    {
      icon: Siren,
      label: 'SOS',
      path: createPageUrl('SOS'),
      key: 'sos',
      iconColor: '#000000'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 shadow-lg"
      style={{ 
        backgroundColor: '#ffffff',
        borderTop: '1px solid #dfe3ee'
      }}
    >
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="flex items-center justify-around h-20">
          {footerItems.map((item) => {
            const active = isActive(item.path);
            const hasBadge = item.badge !== undefined && item.badge !== null && item.badge > 0;

            return (
              <Link
                key={item.key}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative"
                style={{
                  minWidth: '48px',
                  minHeight: '48px'
                }}
              >
                <div className="relative">
                  <item.icon 
                    className="w-6 h-6"
                    style={{ color: item.iconColor || (active ? '#3b5998' : '#8b9dc3') }}
                  />
                  {hasBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                      style={{ backgroundColor: '#e74c3c' }}
                    >
                      <span className="text-white text-[10px] font-bold">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    </motion.div>
                  )}
                </div>
                <span 
                  className="text-[10px] font-medium leading-tight"
                  style={{ color: active ? '#3b5998' : '#8b9dc3' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}