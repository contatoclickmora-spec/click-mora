import React from 'react';
import { Button } from '@/components/ui/button';
import { globalStyles } from '../utils/theme';
import { Loader2 } from 'lucide-react';

export default function StyledButton({ 
  children, 
  variant = 'primary', 
  icon: Icon,
  loading = false,
  className = '',
  ...props 
}) {
  const variantClasses = {
    primary: globalStyles.btnPrimary,
    secondary: globalStyles.btnSecondary,
    outline: globalStyles.btnOutline,
    danger: globalStyles.btnDanger,
  };

  return (
    <Button 
      className={`${variantClasses[variant]} ${className}`} 
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {children}
        </>
      )}
    </Button>
  );
}