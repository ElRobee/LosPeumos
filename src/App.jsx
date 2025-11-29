import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Electricidad from './pages/Electricidad';
import MiCuenta from './pages/MiCuenta';
import Pagos from './pages/Pagos';
import Cuotas from './pages/Cuotas';
import Reuniones from './pages/Reuniones';
import Certificados from './pages/Certificados';
import Vehiculos from './pages/Vehiculos';
import Porton from './pages/Porton';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas (sin Layout) */}
          <Route path="/login" element={<Login />} />
          
          <Route path="/signup" element={
            <ProtectedRoute allowedRoles="admin">
              <Signup />
            </ProtectedRoute>
          } />
          
          {/* Rutas protegidas (con Layout) */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Etapa 4: Electricidad (solo Admin y Técnico) */}
                    <Route 
                      path="/electricidad" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                          <Electricidad />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Etapa 5: Mi Cuenta (todos los usuarios autenticados) */}
                    <Route path="/mi-cuenta" element={<MiCuenta />} />
                    
                    {/* Etapa 6: Pagos (Admin, Presidente y Técnico) */}
                    <Route 
                      path="/pagos" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'presidente', 'tecnico']}>
                          <Pagos />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Etapa 7: Cuotas (Admin, Presidente y Secretaria) */}
                    <Route 
                      path="/cuotas" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'presidente', 'secretaria']}>
                          <Cuotas />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Etapa 8: Reuniones (Admin, Presidente, Secretaria) */}
                    <Route 
                      path="/reuniones" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'presidente', 'secretaria']}>
                          <Reuniones />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Etapa 9: Certificados (Admin, Secretaria) */}
                    <Route 
                      path="/certificados" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'secretaria']}>
                          <Certificados />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Etapa 10: Vehículos (Admin, Presidente, Técnico, Secretaria, Residente) */}
                    <Route 
                      path="/vehiculos" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'presidente', 'tecnico', 'secretaria', 'residente']}>
                          <Vehiculos />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Portón de Acceso (Admin) */}
                    <Route 
                      path="/porton" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <Porton />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Etapa 11: Configuración (Admin y Técnico) */}
                    <Route 
                      path="/configuracion" 
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                          <Configuracion />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Más rutas se agregarán en las siguientes etapas */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
