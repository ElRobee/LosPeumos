# Sistema de Spinners y Loading States

## 🎨 Componentes Creados

### 1. `Spinner.jsx` - Spinner básico reutilizable

**Uso:**
```jsx
import Spinner from '../components/Spinner';

// Tamaños disponibles
<Spinner size="xs" />   // 12px
<Spinner size="sm" />   // 16px
<Spinner size="md" />   // 24px (default)
<Spinner size="lg" />   // 32px
<Spinner size="xl" />   // 48px
<Spinner size="2xl" />  // 64px

// Colores disponibles
<Spinner color="primary" />  // Azul (default)
<Spinner color="white" />    // Blanco
<Spinner color="gray" />     // Gris
<Spinner color="success" />  // Verde
<Spinner color="warning" />  // Amarillo
<Spinner color="danger" />   // Rojo

// Personalizado
<Spinner size="lg" color="success" className="mt-4" />
```

### 2. `LoadingOverlay.jsx` - Overlay de carga

**Uso:**
```jsx
import LoadingOverlay from '../components/LoadingOverlay';

// Overlay en sección
<LoadingOverlay message="Cargando datos..." />

// Overlay transparente
<LoadingOverlay message="Procesando..." transparent />

// Overlay pantalla completa
<LoadingOverlay 
  fullScreen 
  message="Generando datos de prueba..." 
/>
```

**Características:**
- ✅ Fondo con blur (backdrop-blur-sm)
- ✅ Spinner grande centrado
- ✅ Mensaje personalizable
- ✅ Modo pantalla completa con z-50

### 3. `PageLoader.jsx` - Loader profesional para páginas

**Uso:**
```jsx
import PageLoader from '../components/PageLoader';

// Loader con mensaje por defecto
<PageLoader />

// Loader con mensaje personalizado
<PageLoader message="Cargando vehículos del condominio..." />
```

**Características:**
- ✅ Spinner doble (anillo fijo + anillo rotando)
- ✅ Ícono animado (pulse)
- ✅ Puntos animados con delay escalonado
- ✅ Altura mínima de 400px
- ✅ Diseño profesional y elegante

## 📍 Implementación Actual

### Dashboard.jsx
```jsx
if (stats.loading) {
  return <PageLoader message="Cargando estadísticas del dashboard..." />;
}
```

### Vehiculos.jsx
```jsx
{loading && vehicles.length === 0 ? (
  <PageLoader message="Cargando vehículos del condominio..." />
) : (
  // Contenido normal
)}
```

### Configuracion.jsx
```jsx
// Loading Overlay Full Screen para operaciones pesadas
{operationInProgress && (
  <LoadingOverlay 
    fullScreen 
    message={operationMessage} 
  />
)}
```

## 🎯 Cuándo Usar Cada Componente

### Spinner
- Botones con estado de carga
- Pequeñas secciones
- Indicadores inline

**Ejemplo:**
```jsx
<button disabled={loading}>
  {loading ? (
    <>
      <Spinner size="sm" color="white" />
      Guardando...
    </>
  ) : (
    'Guardar'
  )}
</button>
```

### LoadingOverlay
- Secciones de la página
- Modales
- Formularios
- Operaciones pesadas (pantalla completa)

**Ejemplo:**
```jsx
{loading && (
  <LoadingOverlay message="Guardando cambios..." />
)}
```

### PageLoader
- **Carga inicial de páginas**
- Cuando toda la página depende de datos
- Reemplazo de contenido completo

**Ejemplo:**
```jsx
if (loading && !data) {
  return <PageLoader message="Cargando..." />;
}
```

## 🚀 Mejoras Aplicadas

### Antes ❌
```jsx
// Loading genérico sin diseño
{loading && <p>Cargando...</p>}

// Spinner de Lucide sin personalización
<Loader className="animate-spin" />
```

### Ahora ✅
```jsx
// Loading profesional
<PageLoader message="Cargando vehículos..." />

// Overlay para operaciones largas
<LoadingOverlay 
  fullScreen 
  message="Generando 30 casas, 60 boletas..." 
/>
```

## 🎨 Diseño

### Colores
- **Spinner**: `border-blue-600` con `border-t-transparent`
- **Overlay**: `bg-slate-900/80` con `backdrop-blur-sm`
- **PageLoader**: Anillo azul + puntos animados

### Animaciones
- **Rotate**: `animate-spin` (rotación continua)
- **Pulse**: `animate-pulse` (opacidad pulsante)
- **Bounce**: `animate-bounce` con delay escalonado

### Timing
```css
Delay punto 1: 0ms
Delay punto 2: 150ms
Delay punto 3: 300ms
```

## 📦 Próximas Páginas a Actualizar

Puedes agregar PageLoader a estas páginas:

- [ ] Electricidad.jsx
- [ ] MiCuenta.jsx
- [ ] Pagos.jsx
- [ ] Cuotas.jsx
- [ ] Reuniones.jsx
- [ ] Certificados.jsx

**Patrón a seguir:**
```jsx
import PageLoader from '../components/PageLoader';

// En el hook
const [loading, setLoading] = useState(true);

// Al inicio del return
if (loading && !data) {
  return <PageLoader message="Cargando [nombre módulo]..." />;
}
```

## 🔧 Personalización

### Crear un Spinner Custom

```jsx
// Mi propio spinner
const MySpinner = () => (
  <div className="relative w-16 h-16">
    <div className="absolute w-full h-full border-4 border-purple-200 rounded-full"></div>
    <div className="absolute w-full h-full border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
  </div>
);
```

### Modificar Colores del PageLoader

Edita `src/components/PageLoader.jsx`:
```jsx
// Cambiar color del anillo y puntos
border-blue-600  →  border-purple-600
bg-blue-600     →  bg-purple-600
```

## 🎯 Beneficios

### Experiencia de Usuario
- ✅ Feedback visual inmediato
- ✅ Indicación clara de progreso
- ✅ Diseño profesional y consistente
- ✅ Reduce ansiedad del usuario

### Desarrollo
- ✅ Componentes reutilizables
- ✅ Props configurables
- ✅ Fácil de integrar
- ✅ Código limpio y mantenible

### Performance
- ✅ No bloquea la UI
- ✅ Muestra estado real de carga
- ✅ Indicación de operaciones pesadas
- ✅ Mejor percepción de velocidad

## 📝 Notas

- **Localhost vs Producción**: Los spinners son especialmente útiles en localhost donde Firestore puede ser más lento
- **Operaciones Pesadas**: Usa `fullScreen` en LoadingOverlay para operaciones que tardan >5 segundos
- **Mensajes Descriptivos**: Siempre incluye un mensaje que explique qué se está cargando
- **Accesibilidad**: Los spinners incluyen `role="status"` y `aria-label="Loading"`

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 22, 2025
