# Sistema de Gestión de Datos de Prueba

## 📍 Ubicación

Los datos de prueba ahora se gestionan desde:
- **Configuración → Pestaña "Datos de Prueba"**
- Solo accesible para usuarios con rol **Admin**

## 🆕 ¿Qué cambió?

### Antes ❌
- Páginas separadas: `/seed-users`, `/seed-data`, `/create-house10`
- Código disperso en múltiples archivos
- Sin forma de limpiar los datos

### Ahora ✅
- Todo centralizado en **Configuración**
- Utilidades reutilizables en `src/utils/seedDataManager.js`
- Botones para **generar** y **limpiar** datos
- Código más limpio y organizado

## 📂 Archivos Creados

### `src/utils/seedDataManager.js`
Contiene las funciones principales:

- **`generateSeedData()`**: Genera datos de prueba
  - 30 parcelas (house1 a house30)
  - ~60 boletas (3 meses × 20 casas)
  - ~48 pagos (80% de boletas pagadas)

- **`cleanSeedData()`**: Limpia todos los datos de prueba
  - Elimina casas house1-house30
  - Elimina boletas asociadas
  - Elimina pagos asociados
  - Elimina vehículos asociados

- **`checkSeedDataExists()`**: Verifica si existen datos de prueba

### `src/pages/Configuracion.jsx` (Actualizado)
Nueva pestaña **"Datos de Prueba"** con:
- Botón verde: **Generar Datos de Prueba**
- Botón rojo: **Limpiar Datos de Prueba**
- Estadísticas de qué se creará/eliminará
- Advertencias y confirmaciones de seguridad

## 🚀 Cómo Usar

### 1. Generar Datos de Prueba

1. Inicia sesión como **Admin**
2. Ve a **Configuración**
3. Haz clic en la pestaña **"Datos de Prueba"**
4. Haz clic en **"Generar Datos de Prueba"**
5. Confirma la acción
6. Espera a que termine (puede tardar 10-20 segundos)

**Resultado:**
```
✅ Datos generados: 30 casas, 60 boletas, 48 pagos
```

### 2. Limpiar Datos de Prueba

1. Ve a **Configuración → Datos de Prueba**
2. Haz clic en **"Limpiar Datos de Prueba"**
3. Confirma **DOS VECES** (seguridad)
4. Espera a que termine

**Resultado:**
```
🧹 Datos eliminados: 30 casas, 60 boletas, 48 pagos, 5 vehículos
```

## ⚠️ Advertencias Importantes

### 🔴 NO usar en producción
Una vez que tengas datos reales en el sistema:
- **NO generes datos de prueba** (se mezclarán con los reales)
- **NO limpies datos** (podrías perder información importante)

### 🟡 Datos afectados
La limpieza **SOLO elimina**:
- Casas con ID: `house1`, `house2`, ..., `house30`
- Boletas y pagos asociados a esas casas
- Vehículos registrados en esas casas

**No afecta:**
- Otras casas con numeración diferente
- Usuarios
- Configuración del sistema
- Datos de reuniones, cuotas o certificados

### 🟢 Seguro para desarrollo
Puedes generar y limpiar datos cuantas veces quieras durante el desarrollo.

## 🛠️ Flujo de Trabajo Recomendado

### Fase 1: Desarrollo
```bash
1. Generar datos de prueba
2. Desarrollar funcionalidades
3. Probar con datos ficticios
4. Limpiar datos
5. Repetir según necesites
```

### Fase 2: Testing
```bash
1. Generar datos de prueba
2. Ejecutar todos los tests
3. Verificar reportes y exportaciones
4. Validar flujos de usuario
```

### Fase 3: Pre-Producción
```bash
1. Limpiar TODOS los datos de prueba
2. Verificar que Firestore esté limpio
3. Crear 1-2 casas reales de prueba
4. Validar flujo completo con datos reales
```

### Fase 4: Producción
```bash
1. NO usar herramientas de datos de prueba
2. Crear casas reales según el condominio
3. Registrar usuarios reales
4. Usar el sistema normalmente
```

## 📊 Estructura de Datos Generados

### Casas (houses)
```javascript
{
  houseId: "house1",
  houseNumber: "1",
  ownerName: "Propietario 1",
  ownerEmail: "residente1@lospeumos.cl", // Solo primeras 5
  phone: "+56912345000",
  address: "Parcela 1",
  meters: {
    previousReading: 5000-6000,
    currentReading: null,
    lastReadingDate: null
  },
  active: true,
  createdAt: "2025-10-22T..."
}
```

### Boletas (bills)
```javascript
{
  houseId: "house1",
  month: 10,
  year: 2025,
  previousReading: 5000,
  currentReading: 5150,
  consumption: 50-250, // kWh aleatorio
  rate: 150,
  electricityCharge: consumption * 150,
  fixedFee: 2000,
  total: electricityCharge + fixedFee,
  status: "pending" | "paid" | "overdue",
  createdAt: "2025-10-05T...",
  dueDate: "2025-10-20T...",
  paidAt: "2025-10-15T..." // Si está pagada
}
```

### Pagos (payments)
```javascript
{
  billId: "abc123...",
  houseId: "house1",
  amount: 25000,
  method: "transfer" | "deposit",
  reference: "BILL-2025-10-house1",
  validated: true,
  validatedBy: "admin",
  validatedAt: "2025-10-15T...",
  userId: null,
  createdAt: "2025-10-15T..."
}
```

## 🔧 Personalización

Si necesitas modificar los datos generados, edita:
```javascript
// src/utils/seedDataManager.js

// Cambiar número de casas
const generateHouses = (count = 30) => { ... }

// Cambiar meses de boletas
const generateBills = (housesCount = 20, monthsBack = 3) => { ... }

// Cambiar tarifa eléctrica
const rate = 150; // CLP por kWh
const fixedFee = 2000; // Cargo fijo
```

## 🗑️ Limpiar Páginas Antiguas (Opcional)

Puedes eliminar estas páginas si ya no las necesitas:
- `src/pages/SeedUsers.jsx`
- `src/pages/SeedDemoData.jsx`
- `src/pages/CreateHouse10.jsx`
- `src/seed/demoData.js` (reemplazado por utils)
- `src/seed/createHouse10.js`

Y sus rutas en `src/App.jsx`:
```jsx
<Route path="/seed-users" element={<SeedUsers />} />
<Route path="/seed-data" element={<SeedDemoData />} />
<Route path="/create-house10" element={<CreateHouse10 />} />
```

## 📝 Notas Técnicas

### Límites de Firestore
- Batch máximo: 500 operaciones
- Query 'in': máximo 10 valores
- La limpieza hace múltiples queries para manejar 30 casas

### Rendimiento
- Generar datos: ~10-20 segundos
- Limpiar datos: ~15-30 segundos (depende de cuántos datos haya)

### Errores Comunes
1. **"Missing permissions"**: Despliega las reglas de Firestore actualizadas
2. **Timeout**: La operación puede tardar, espera a que termine
3. **Casa ya existe**: Limpia primero si quieres regenerar

## 🎯 Checklist Pre-Producción

Antes de poner el sistema en producción:

- [ ] Limpiar TODOS los datos de prueba
- [ ] Verificar en Firebase Console que no queden casas house1-house30
- [ ] Eliminar usuarios de prueba (residente1@lospeumos.cl, etc.)
- [ ] Desplegar reglas de Firestore actualizadas
- [ ] Crear casas reales según el condominio
- [ ] Registrar usuarios reales
- [ ] Probar flujo completo con datos reales
- [ ] Hacer backup de Firestore (desde Configuración)

## 🆘 Soporte

Si algo sale mal:
1. Revisa la consola del navegador (F12)
2. Verifica permisos de Firebase
3. Confirma que eres Admin
4. Verifica que las reglas de Firestore estén actualizadas

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 22, 2025
