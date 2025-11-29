import React from 'react';
import { formatDistanceToNow } from '../utils/dateUtils';

/**
 * Componente para mostrar actividad reciente
 * @param {Object} props
 * @param {Array} props.activities - Array de actividades
 * @param {number} props.limit - Número máximo de items a mostrar
 */
const RecentActivity = ({ activities = [], limit = 5 }) => {
  const displayedActivities = activities.slice(0, limit);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'payment':
        return '💰';
      case 'bill':
        return '⚡';
      case 'meeting':
        return '👥';
      case 'certificate':
        return '📄';
      case 'vehicle':
        return '🚗';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'payment':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'bill':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      case 'meeting':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'certificate':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'vehicle':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  if (!displayedActivities.length) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Actividad Reciente
        </h3>
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">
            No hay actividad reciente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Actividad Reciente
      </h3>
      <div className="space-y-4">
        {displayedActivities.map((activity, index) => (
          <div 
            key={activity.id || index} 
            className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
              <span className="text-lg">{getActivityIcon(activity.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {formatDistanceToNow(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
