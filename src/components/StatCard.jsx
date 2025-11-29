import React from 'react';

/**
 * Card de estadística reutilizable
 * @param {Object} props
 * @param {string} props.title - Título de la estadística
 * @param {string|number} props.value - Valor principal
 * @param {Component} props.icon - Ícono de lucide-react
 * @param {string} props.trend - Tendencia (ej: "+12%", "-5%")
 * @param {string} props.trendLabel - Descripción de la tendencia
 * @param {string} props.color - Color del ícono (primary, green, red, blue, yellow, purple)
 * @param {string} props.subtitle - Subtítulo opcional
 */
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  color = 'primary',
  subtitle 
}) => {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  };

  const trendColor = trend?.startsWith('+') ? 'text-green-600 dark:text-green-400' : 
                     trend?.startsWith('-') ? 'text-red-600 dark:text-red-400' : 
                     'text-slate-600 dark:text-slate-400';

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs md:text-sm font-medium ${trendColor}`}>
                {trend}
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
