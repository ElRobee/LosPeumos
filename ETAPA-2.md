# ETAPA 2 - Autenticación y Gestión de Roles

## ✅ Completada

Esta etapa implementa el sistema completo de autenticación con Firebase Authentication y gestión de roles almacenados en Firestore.

## 📁 Archivos creados

### Contextos
- `src/contexts/AuthContext.jsx` - Context de autenticación con hooks y helpers

### Páginas
- `src/pages/Login.jsx` - Página de inicio de sesión
- `src/pages/Signup.jsx` - Página de registro (solo admin)
- `src/pages/SeedUsers.jsx` - Página para crear usuarios de prueba

### Componentes
- `src/components/ProtectedRoute.jsx` - HOC para proteger rutas según roles

### Utilidades
- `src/seed/sampleUsers.js` - Script para crear usuarios de prueba

### Documentación
- `firestore.rules.md` - Reglas de seguridad de Firestore y Storage

## 🎯 Características implementadas

### Sistema de Autenticación
- ✅ Login con email y contraseña
- ✅ Registro de nuevos usuarios (solo admin)
- ✅ Logout
- ✅ Recuperación de contraseña (preparado)
- ✅ Persistencia de sesión
- ✅ Carga de datos de usuario desde Firestore

### Gestión de Roles
- ✅ 5 roles: Admin, Presidente, Técnico, Secretaria, Residente
- ✅ Almacenamiento de rol en Firestore (`users` collection)
- ✅ Helpers para verificar roles (`isAdmin`, `hasRole`, etc.)
- ✅ Protección de rutas según roles
- ✅ Vista de "Acceso Denegado" personalizada

### UI/UX
- ✅ Formularios en español
- ✅ Mensajes de error traducidos
- ✅ Loading states
- ✅ Menú de usuario con dropdown
- ✅ Indicador visual de rol (color y badge)
- ✅ Información del usuario en topbar
- ✅ Botón de cerrar sesión

## 🔒 Estructura de datos en Firestore

### Collection: `users`
```javascript
{
  email: "admin@lospeumos.cl",
  name: "Roberto Administrador",
  role: "admin", // "admin" | "presidente" | "tecnico" | "secretaria" | "residente"
  houseId: null, // string (número de parcela) o null
  phone: "+56912345678",
  active: true,
  createdAt: "2025-10-22T..."
}
```

## 🧪 Cómo probar esta etapa

### 1. Configurar reglas de Firestore

**IMPORTANTE**: Antes de crear usuarios, debes configurar las reglas de seguridad.

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `lospeumos-e0261`
3. Ve a **Firestore Database** > **Reglas**
4. Copia las reglas del archivo `firestore.rules.md`
5. Click en **Publicar**

### 2. Crear usuarios de prueba

Tienes 3 opciones:

#### Opción A: Usar la página de Seed (Recomendado)

1. Abre el navegador en `http://localhost:5173/seed-users`
2. Revisa las credenciales que se crearán
3. Click en "Crear Usuarios de Prueba"
4. Espera a que termine (5-10 segundos)
5. ¡Listo! Ya puedes hacer login

#### Opción B: Desde la consola del navegador

1. Abre `http://localhost:5173`
2. Abre DevTools (F12) > Console
3. Copia y pega:
```javascript
import('./seed/sampleUsers.js').then(module => module.seedSampleUsers());
```
4. Espera a ver los mensajes de éxito

#### Opción C: Manual desde Firebase Console

1. Ve a Firebase Console > Authentication
2. Crea usuarios manualmente
3. Ve a Firestore > users collection
4. Crea documentos con la estructura mostrada arriba

### 3. Probar login y roles

#### Credenciales de prueba:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Admin** | admin@lospeumos.cl | admin123 |
| **Presidente** | presidente@lospeumos.cl | presidente123 |
| **Técnico** | tecnico@lospeumos.cl | tecnico123 |
| **Secretaria** | secretaria@lospeumos.cl | secretaria123 |
| **Residente** | residente@lospeumos.cl | residente123 |

#### Pruebas a realizar:

1. **Login exitoso**:
   - Ve a `http://localhost:5173/login`
   - Ingresa credenciales de admin
   - Deberías ser redirigido a `/dashboard`
   - Verifica que se muestre tu nombre y rol en el topbar

2. **Información de usuario**:
   - Click en tu avatar en el topbar
   - Verifica que se muestre:
     - Nombre completo
     - Email
     - Badge con el rol
     - Opciones del menú

3. **Cerrar sesión**:
   - Click en el menú de usuario
   - Click en "Cerrar Sesión"
   - Deberías ser redirigido a `/login`

4. **Protección de rutas**:
   - Sin estar logueado, intenta acceder a `http://localhost:5173/dashboard`
   - Deberías ser redirigido a `/login`

5. **Protección por roles**:
   - Logueate como residente
   - Intenta acceder a `http://localhost:5173/signup`
   - Deberías ver la página de "Acceso Denegado"

6. **Persistencia de sesión**:
   - Logueate
   - Recarga la página (F5)
   - Deberías seguir logueado

7. **Dark mode persiste**:
   - Cambia el tema
   - Cierra sesión
   - Vuelve a iniciar sesión
   - El tema debería mantenerse

## 🎨 Indicadores visuales por rol

Cada rol tiene un color distintivo en el avatar:

- 🔴 **Admin**: Rojo (`bg-red-600`)
- 🟣 **Presidente**: Morado (`bg-purple-600`)
- 🔵 **Técnico**: Azul (`bg-blue-600`)
- 🟢 **Secretaria**: Verde (`bg-green-600`)
- 🔷 **Residente**: Celeste (`bg-primary-600`)

## 🔐 useAuth Hook

El hook `useAuth()` proporciona:

```javascript
const {
  user,          // Firebase Auth user
  userData,      // Datos desde Firestore
  loading,       // Estado de carga
  error,         // Último error
  signup,        // Función para registrar
  login,         // Función para login
  logout,        // Función para logout
  resetPassword, // Función para recuperar contraseña
  isAdmin,       // Boolean
  isPresidente,  // Boolean
  isTecnico,     // Boolean
  isSecretaria,  // Boolean
  isResidente,   // Boolean
  hasRole        // Función para verificar rol(es)
} = useAuth();
```

### Ejemplos de uso:

```javascript
// Verificar si es admin
if (isAdmin) {
  // Mostrar botón de configuración
}

// Verificar múltiples roles
if (hasRole(['admin', 'presidente'])) {
  // Permitir editar gastos
}

// Obtener datos del usuario
const { name, email, role, houseId } = userData;
```

## 🛡️ ProtectedRoute Component

Protege rutas según autenticación y roles:

```javascript
// Solo usuarios autenticados
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Solo un rol específico
<ProtectedRoute allowedRoles="admin">
  <AdminPanel />
</ProtectedRoute>

// Múltiples roles permitidos
<ProtectedRoute allowedRoles={['admin', 'presidente']}>
  <FinancialReports />
</ProtectedRoute>

// Redirigir a ruta personalizada si no tiene acceso
<ProtectedRoute allowedRoles="admin" redirectTo="/dashboard">
  <Settings />
</ProtectedRoute>
```

## 📝 Manejo de errores

Los mensajes de error están traducidos al español:

```javascript
// Firebase Auth errors → Español
auth/invalid-credential → "Correo o contraseña incorrectos"
auth/user-not-found → "No existe una cuenta con este correo"
auth/too-many-requests → "Demasiados intentos fallidos"
auth/email-already-in-use → "Ya existe una cuenta con este correo"
```

## ⚠️ Notas importantes

### Para desarrollo:
- La ruta `/seed-users` está expuesta para facilitar el testing
- Las reglas de Firestore permiten creación de usuarios desde el cliente

### Para producción:
1. **ELIMINAR** la ruta `/seed-users`
2. **ELIMINAR** el archivo `src/pages/SeedUsers.jsx`
3. **ACTUALIZAR** las reglas de Firestore para no permitir creación desde cliente
4. **IMPLEMENTAR** creación de usuarios solo desde panel de admin con validación adicional
5. **CONSIDERAR** usar Cloud Functions para operaciones sensibles

## 🐛 Troubleshooting

### "No se encontró el documento del usuario"
- Verifica que el usuario tenga un documento en Firestore `users/{uid}`
- El seed debería crearlo automáticamente

### "Acceso denegado" al intentar acceder a una ruta
- Verifica tu rol en Firestore
- Verifica que la ruta permita tu rol en `allowedRoles`

### No se guardan los datos en Firestore al registrar
- Verifica las reglas de Firestore en Firebase Console
- Revisa la consola del navegador para ver errores

### El tema no persiste
- Verifica que localStorage esté habilitado en tu navegador
- Abre DevTools > Application > Local Storage y busca la key `darkMode`

## 🚀 Próxima etapa

En la **Etapa 3** implementaremos:
- Dashboard completo con estadísticas reales
- Cards con datos de Firestore
- Gráficos con Recharts
- Vista específica según rol del usuario

---

**Estado**: ✅ Completada y probada  
**Fecha**: Octubre 22, 2025
