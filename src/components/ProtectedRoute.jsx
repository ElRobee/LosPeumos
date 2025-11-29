import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

/**
 * Componente para proteger rutas que requieren autenticación
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a renderizar si está autenticado
 * @param {string|string[]} props.allowedRoles - Rol(es) permitido(s) para acceder
 * @param {string} props.redirectTo - Ruta a la que redirigir si no tiene acceso
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = null, 
  redirectTo = '/login' 
}) => {
  const { user, userData, loading } = useAuth();

  // Mostrar loader mientras se carga el estado de autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasPermission = userData?.role && roles.includes(userData.role);

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
          <div className="max-w-md w-full card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Acceso Denegado
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              No tienes permisos para acceder a esta sección.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
              Tu rol actual: <span className="font-medium text-slate-700 dark:text-slate-300">{userData?.role || 'Sin rol'}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
  }

  // Si todo está bien, renderizar el componente hijo
  return children;
};

export default ProtectedRoute;
