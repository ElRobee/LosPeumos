import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente para acciones rápidas
 * @param {Object} props
 * @param {Array} props.actions - Array de acciones disponibles
 */
const QuickActions = ({ actions = [] }) => {
  const navigate = useNavigate();

  if (!actions.length) {
    return null;
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Acciones Rápidas
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => action.path ? navigate(action.path) : action.onClick?.()}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 text-left group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color || 'bg-primary-100 dark:bg-primary-900/20'} group-hover:scale-110 transition-transform`}>
              <action.icon className={`w-5 h-5 ${action.iconColor || 'text-primary-600 dark:text-primary-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                {action.label}
              </p>
              {action.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  {action.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
