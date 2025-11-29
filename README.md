# LosPeumos - Sistema de Gestión de Comunidad

Sistema de gestión integral para la comunidad Los Peumos, desarrollado con React + Vite + Tailwind CSS + Firebase.

## 🌟 Características

- **Dashboard**: Vista general del estado de la comunidad
- **Electricidad**: Gestión de lecturas y generación de boletas
- **Cuotas y Pagos**: Sistema automatizado de cruce de pagos
- **Reuniones**: Gestión de asistencia y actas
- **Certificados**: Generación automática de certificados de residencia
- **Vehículos**: Registro y búsqueda de vehículos
- **Control de Acceso**: Gestión de números del portón

## 📋 Requisitos previos

- Node.js 18.x o superior
- npm o yarn
- Cuenta de Firebase (Spark plan)
- Cuenta de EmailJS (para notificaciones)

## 🛠️ Instalación

### 1. Clonar el repositorio e instalar dependencias

```bash
cd LosPeumos
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
copy .env.example .env
```

Edita el archivo `.env` con tus credenciales de EmailJS (las agregaremos en la Etapa 11).

### 3. Configurar Firebase

La configuración de Firebase ya está incluida en `src/services/firebase.js`. 

**Importante**: Debes configurar las reglas de seguridad en Firebase Console (se proporcionarán en la Etapa 2).

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación se abrirá automáticamente en `http://localhost:5173`

### 5. Compilar para producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 📁 Estructura del proyecto

```
LosPeumos/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   └── Layout.jsx     # Layout principal con sidebar y topbar
│   ├── contexts/          # Contextos de React (Auth, etc.)
│   ├── pages/             # Páginas de la aplicación
│   ├── services/          # Servicios (Firebase, EmailJS, etc.)
│   │   └── firebase.js    # Configuración de Firebase
│   ├── utils/             # Utilidades y helpers
│   ├── App.jsx            # Componente principal
│   ├── main.jsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── public/                # Archivos estáticos
├── index.html             # HTML base
├── package.json           # Dependencias del proyecto
├── vite.config.js         # Configuración de Vite
├── tailwind.config.cjs    # Configuración de Tailwind
└── postcss.config.cjs     # Configuración de PostCSS
```

## 🎨 Temas

La aplicación soporta modo claro y oscuro. El tema por defecto es oscuro y la preferencia se guarda en localStorage.

## 📝 Estado del desarrollo

### ✅ Etapa 1 - Completada
- [x] Inicialización del proyecto con Vite
- [x] Configuración de Tailwind CSS
- [x] Configuración de Firebase
- [x] Layout con Sidebar y Topbar
- [x] Sistema de Dark Mode con persistencia

### ✅ Etapa 2 - Completada
- [x] Sistema de autenticación con Firebase Auth
- [x] Gestión de roles (Admin, Presidente, Técnico, Secretaria, Residente)
- [x] Context de autenticación y hook `useAuth()`
- [x] Páginas de Login y Signup
- [x] Componente ProtectedRoute para rutas protegidas
- [x] Script de seed para usuarios de prueba
- [x] Reglas de seguridad de Firestore documentadas
- [x] Menú de usuario con información y logout

### 🔄 Próximas etapas
- [ ] Etapa 3: Dashboard con estadísticas
- [ ] Etapa 4: Módulo de Electricidad
- [ ] Etapa 5: Panel de residente
- [ ] Etapa 6: Cruce automático de pagos
- [ ] Etapa 7: Certificados de residencia
- [ ] Etapa 8: Gestión de reuniones
- [ ] Etapa 9: Reportes y balances
- [ ] Etapa 10: Control de acceso
- [ ] Etapa 11: Notificaciones
- [ ] Etapa 12: Seguridad final

## 🤝 Roles de usuario

- **Admin**: Acceso completo al sistema
- **Presidente**: Gestión de cuotas, pagos y reuniones
- **Técnico**: Gestión de electricidad y lecturas
- **Secretaria**: Gestión de reuniones y certificados
- **Residente**: Vista de sus boletas y pagos

## 📄 Licencia

Proyecto privado - Los Peumos © 2025

## 🆘 Soporte

Para reportar problemas o solicitar funcionalidades, contactar al administrador de la comunidad.
