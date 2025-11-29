/**
 * Componente PageLoader - Loading state para páginas completas
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = ({ message = 'Cargando datos...' }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        {/* Spinner animado */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute w-20 h-20 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute w-20 h-20 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>

        {/* Mensaje */}
        <p className="text-slate-700 dark:text-slate-300 font-medium text-lg mb-2">
          {message}
        </p>
        
        {/* Puntos animados */}
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
