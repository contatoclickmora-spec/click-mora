import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { globalStyles } from '../utils/theme';

export default function StyledCard({ 
  title, 
  icon: Icon, 
  children, 
  headerActions,
  className = '',
  ...props 
}) {
  return (
    <Card className={`${globalStyles.card} ${className}`} {...props}>
      {(title || Icon || headerActions) && (
        <CardHeader className={globalStyles.cardHeader}>
          <div className="flex items-center justify-between">
            {(title || Icon) && (
              <CardTitle className="flex items-center gap-3">
                {Icon && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#7B61FF] to-[#A38BFF] rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="text-[#333333] font-semibold">{title}</span>
              </CardTitle>
            )}
            {headerActions}
          </div>
        </CardHeader>
      )}
      <CardContent className={globalStyles.cardBody}>
        {children}
      </CardContent>
    </Card>
  );
}