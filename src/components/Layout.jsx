import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Home, Zap, DollarSign, CreditCard, Users, FileText, Car, Settings, User, LogOut, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Cerrado por defecto en móvil
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Cargar preferencia del localStorage o default a dark
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Detectar si es desktop y abrir sidebar automáticamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Llamar al inicio
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar en móvil al cambiar de ruta
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Aplicar clase dark al HTML cuando cambie el modo
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Obtener color según rol
  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-600',
      presidente: 'bg-purple-600',
      tecnico: 'bg-blue-600',
      secretaria: 'bg-green-600',
      residente: 'bg-primary-600'
    };
    return colors[role] || 'bg-slate-600';
  };

  // Traducir rol a español
  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      presidente: 'Presidente',
      tecnico: 'Técnico',
      secretaria: 'Secretaria',
      residente: 'Residente'
    };
    return labels[role] || role;
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', roles: ['admin', 'presidente', 'tecnico', 'secretaria', 'residente'] },
    { name: 'Electricidad', icon: Zap, path: '/electricidad', roles: ['admin', 'tecnico'] },
    { name: 'Pagos', icon: CreditCard, path: '/pagos', roles: ['admin', 'presidente', 'tecnico'] },
    { name: 'Cuotas', icon: DollarSign, path: '/cuotas', roles: ['admin', 'presidente', 'secretaria'] },
    { name: 'Reuniones', icon: Users, path: '/reuniones', roles: ['admin', 'presidente', 'secretaria'] },
    { name: 'Certificados', icon: FileText, path: '/certificados', roles: ['admin', 'secretaria'] },
    { name: 'Vehículos', icon: Car, path: '/vehiculos', roles: ['admin', 'presidente', 'tecnico', 'secretaria', 'residente'] },
    { name: 'Portón', icon: Key, path: '/porton', roles: ['admin'] },
    { name: 'Mi Cuenta', icon: User, path: '/mi-cuenta', roles: ['admin', 'presidente', 'tecnico', 'secretaria', 'residente'] },
    { name: 'Configuración', icon: Settings, path: '/configuracion', roles: ['admin', 'tecnico'] },
  ];

  // Filtrar menú según rol del usuario
  const visibleMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(userData?.role)
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white dark:bg-slate-800 
          border-r border-slate-200 dark:border-slate-700 
          transition-transform duration-300 
          overflow-hidden
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-lospeumos.png" 
                alt="Los Peumos Logo" 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Si el logo no carga, ocultar la imagen
                  e.target.style.display = 'none';
                }}
              />
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                LosPeumos
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {visibleMenuItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="flex items-center px-6 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              v1.0.0 - LosPeumos © 2025
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6">
          {/* Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-2 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {userData?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getRoleLabel(userData?.role)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full ${getRoleColor(userData?.role)} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">
                    {getInitials(userData?.name)}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 card py-2 shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {userData?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {userData?.email}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                      {getRoleLabel(userData?.role)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/mi-cuenta');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Mi Cuenta
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/configuracion');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configuración
                  </button>
                  
                  <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {visibleMenuItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center justify-center flex-1 h-full
                  transition-colors duration-200
                  ${isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
