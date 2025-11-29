# Correcciones Modo Claro/Oscuro - Pendientes

## 📋 Resumen de Problemas

Todas las páginas listadas tienen colores fijos de modo oscuro que no cambian en modo claro:
- `bg-gray-700`, `bg-gray-800`, `bg-gray-900` → Deben ser `bg-white dark:bg-slate-800`
- `text-white` → Debe ser `text-slate-900 dark:text-white`
- `text-gray-300`, `text-gray-400` → Deben ser `text-slate-600 dark:text-slate-400`
- `border-gray-600`, `border-gray-700` → Deben ser `border-slate-200 dark:border-slate-700`

## ✅ Páginas Corregidas

### 1. Vehiculos.jsx - COMPLETO
- ✅ Header y subtítulos responsive
- ✅ Cards de estadísticas con colores adaptativos
- ✅ Filtros y search con clases .input
- ✅ Cards de vehículos con fondo claro/oscuro
- ✅ Función getTypeColor() actualizada
- ✅ Botones con estados hover adaptativos

### 2. Configuracion.jsx - PARCIAL
- ✅ Header y mensajes de éxito/error
- ✅ Tabs de navegación responsive
- ✅ Función getRoleColor() actualizada
- ⏳ Pendiente: Contenido de cada tab (tablas, formularios)

## 🔴 Páginas Pendientes de Corrección Completa

### 3. Cuotas.jsx
**Líneas problemáticas:**
- L589: `'text-gray-400 bg-gray-900/30'` → `'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30'`
- L618: `text-gray-400` → `text-slate-600 dark:text-slate-400`
- L627: `bg-gray-700 hover:bg-gray-600 text-white` → `bg-slate-700 hover:bg-slate-600 dark:bg-slate-700 text-white`
- L656-680: Cards de stats → usar `.card` class
- Filtros y tabla: Similar a Vehiculos.jsx

**Cambios necesarios:**
```jsx
// Header
<h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">

// Stats cards
<div className="card">
  <p className="text-sm text-slate-600 dark:text-slate-400">Total Cuotas</p>
  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalQuotas}</p>
</div>

// Status colors function
const getStatusColor = (status) => {
  const colors = {
    active: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    completed: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    cancelled: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  };
  return colors[status] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30';
};
```

### 4. Pagos.jsx
**Problemas similares:**
- Headers con `text-white` fijo
- Cards con `bg-gray-800`
- Tablas con `bg-gray-700`
- Botones de acción con `hover:bg-gray-600`

**Solución:**
- Usar clase `.card` para containers
- Usar clase `.input` para fields
- Cambiar todos los `text-white` por `text-slate-900 dark:text-white`
- Cambiar `bg-gray-X00` por equivalentes con dark:

### 5. Certificados.jsx
**Problemas típicos:**
- Cards de lista oscuros en modo claro
- Textos blancos fijos
- Badges de estado con colores oscuros

**Correcciones:**
```jsx
// Lista de certificados
<div className="card space-y-3 hover:shadow-md transition-shadow">
  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
  <p className="text-sm text-slate-600 dark:text-slate-400">
</div>

// Status badge
const getStatusColor = (status) => {
  return {
    pending: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    approved: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    rejected: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  }[status];
};
```

### 6. Reuniones.jsx
**Elementos a corregir:**
- Cards de reuniones
- Badges de estado (confirmado, pendiente)
- Lista de asistentes
- Formularios de creación

**Pattern:**
```jsx
<div className="card">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
      <p className="text-sm text-slate-600 dark:text-slate-400">
    </div>
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
  </div>
  
  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
    ...
  </div>
</div>
```

## 🎨 Patrones de Corrección Estándar

### Containers/Cards
```jsx
// ❌ Incorrecto
<div className="bg-gray-800 rounded-lg p-6">

// ✅ Correcto
<div className="card">
```

### Títulos
```jsx
// ❌ Incorrecto
<h1 className="text-3xl font-bold text-white">

// ✅ Correcto
<h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
```

### Texto Secundario
```jsx
// ❌ Incorrecto
<p className="text-gray-400">

// ✅ Correcto
<p className="text-slate-600 dark:text-slate-400">
```

### Inputs
```jsx
// ❌ Incorrecto
<input className="w-full bg-gray-700 border border-gray-600 text-white" />

// ✅ Correcto
<input className="input" />
```

### Selects
```jsx
// ❌ Incorrecto
<select className="bg-gray-700 border border-gray-600 text-white">

// ✅ Correcto
<select className="input">
```

### Botones Primarios
```jsx
// ❌ Incorrecto
<button className="bg-primary-600 hover:bg-primary-700 text-white">

// ✅ Correcto (ya está bien, pero agregar responsive)
<button className="btn-primary">
```

### Botones Secundarios
```jsx
// ❌ Incorrecto
<button className="bg-gray-700 hover:bg-gray-600 text-white">

// ✅ Correcto
<button className="btn-secondary">
```

### Stats Cards
```jsx
// ❌ Incorrecto
<div className="bg-gray-800 rounded-lg p-6">
  <p className="text-sm text-gray-400">Total</p>
  <p className="text-2xl font-bold text-white">100</p>
</div>

// ✅ Correcto
<div className="card">
  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Total</p>
  <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">100</p>
</div>
```

### Colored Badges/Tags
```jsx
// ❌ Incorrecto
const getStatusColor = (status) => {
  return {
    active: 'text-green-400 bg-green-900/30',
    inactive: 'text-red-400 bg-red-900/30'
  }[status];
};

// ✅ Correcto
const getStatusColor = (status) => {
  return {
    active: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    inactive: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  }[status];
};
```

### Tablas
```jsx
// ❌ Incorrecto
<thead className="bg-gray-700 border-b border-gray-600">
  <th className="text-gray-400">

// ✅ Correcto
<thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
  <th className="text-slate-500 dark:text-slate-400">

// Body
<tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
```

## 🚀 Próximos Pasos

1. ✅ Vehiculos.jsx - Completado
2. ⏳ Configuracion.jsx - Completar tabs restantes
3. 🔴 Cuotas.jsx - Por hacer
4. 🔴 Pagos.jsx - Por hacer
5. 🔴 Certificados.jsx - Por hacer
6. 🔴 Reuniones.jsx - Por hacer

## 📝 Notas

- Todos los cambios siguen el mismo patrón
- Usar clases `.card`, `.input`, `.btn-primary`, `.btn-secondary` cuando sea posible
- Para colores personalizados, siempre incluir variante `dark:`
- Preferir `slate` sobre `gray` para mejor contraste
- Agregar breakpoints responsive (`md:`, `lg:`) en títulos y padding

