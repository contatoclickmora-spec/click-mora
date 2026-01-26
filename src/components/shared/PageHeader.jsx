import React from 'react';
import { globalStyles } from '../utils/theme';

export default function PageHeader({ title, icon: Icon, actions, subtitle }) {
  return (
    <div className={globalStyles.pageHeader}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={globalStyles.pageTitle}>
              {Icon && (
                <div className="w-10 h-10 bg-gradient-to-br from-[#7B61FF] to-[#A38BFF] rounded-xl flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )}
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#666666] mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}