/**
 * Componente Spinner - Loading indicator reutilizable
 */

import React from 'react';

const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
    '2xl': 'w-16 h-16 border-4'
  };

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
    success: 'border-green-500 border-t-transparent',
    warning: 'border-yellow-500 border-t-transparent',
    danger: 'border-red-500 border-t-transparent'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        rounded-full 
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
