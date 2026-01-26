import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChamados } from '../utils/chamadosContext';

export default function FixedFooter({ items }) {
  const location = useLocation();
  const { chamadosPendentes, loading } = useChamados();

  const isActive = (path) => {
    if (typeof path === 'string') {
      return location.pathname === path;
    }
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#dfe3ee] shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-20">
          {items.map((item) => {
            const active = isActive(item.path);
            const hasBadge = item.badge !== undefined && item.badge !== null && item.badge > 0;
            
            // Não renderizar links externos (apenas internos permitidos)
            if (item.external) {
              return null;
            }

            // Link interno
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors hover:bg-[#f7f7f7] relative"
              >
                <div className="relative">
                  <item.icon 
                    className="w-6 h-6"
                    style={{ color: active ? '#3b5998' : '#8b9dc3' }}
                  />
                  {hasBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1"
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