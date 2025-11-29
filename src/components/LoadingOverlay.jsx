/**
 * Componente LoadingOverlay - Pantalla de carga completa
 */

import React from 'react';
import Spinner from './Spinner';

const LoadingOverlay = ({ 
  message = 'Cargando...', 
  fullScreen = false,
  transparent = false 
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="text-center">
          <Spinner size="2xl" color="white" className="mx-auto mb-4" />
          <p className="text-white text-lg font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      flex items-center justify-center py-12
      ${transparent ? 'bg-transparent' : 'bg-slate-800/30 rounded-lg'}
    `}>
      <div className="text-center">
        <Spinner size="xl" color="primary" className="mx-auto mb-3" />
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
