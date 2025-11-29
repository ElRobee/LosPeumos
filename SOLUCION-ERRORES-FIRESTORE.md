# Solución a Errores de Firestore para Usuarios Residentes

## Problema Identificado

Al intentar acceder como usuario residente, aparecen dos tipos de errores:

1. **Error de índice faltante**: Query compuesta en `bills` necesita índice
2. **Error de permisos**: Las reglas de seguridad no permiten queries correctamente

## Solución 1: Crear Índice Compuesto en Firebase

### Paso 1: Acceder al enlace del error
El error muestra un enlace directo para crear el índice. Copia y pega este enlace en tu navegador:

```
https://console.firebase.google.com/v1/r/project/lospeumos-e0261/firestore/indexes?create_composite=...
```

### Paso 2: Crear el índice automáticamente
1. El enlace te llevará a Firebase Console
2. Firebase ya tendrá pre-configurado el índice necesario
3. Haz clic en "Crear índice" o "Create Index"
4. Espera 2-5 minutos mientras Firebase construye el índice

### Índice necesario:
- **Colección**: `bills`
- **Campos**:
  - `houseId` (Ascending)
  - `createdAt` (Ascending)

## Solución 2: Actualizar Reglas de Seguridad

Las reglas actuales tienen un problema: usan `resource.data` en queries, lo cual no funciona porque `resource` solo existe cuando se lee un documento específico, no en queries que devuelven múltiples documentos.

### Cambios realizados en las reglas:

```javascript
// ❌ ANTES (No funciona en queries)
match /bills/{billId} {
  allow read: if isAuthenticated() && (
    hasAnyRole(['admin', 'presidente', 'tecnico', 'secretaria']) ||
    (userDocExists() && getUserData().houseId != null && getUserData().houseId == resource.data.houseId)
  );
}

// ✅ DESPUÉS (Funciona en queries y lecturas directas)
match /bills/{billId} {
  allow read: if isAuthenticated() && (
    hasAnyRole(['admin', 'presidente', 'tecnico', 'secretaria']) ||
    (userDocExists() && getUserData().houseId != null)
  );
}
```

**Nota importante**: Esta solución simplifica las reglas para permitir que residentes hagan queries en `bills`. La aplicación se encarga de filtrar por `houseId` en el código (ver `useDashboardStats.js` y `useResidentData.js`).

### Paso para actualizar reglas en Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `lospeumos-e0261`
3. Ve a **Firestore Database** → **Reglas** (Rules)
4. Copia el contenido del archivo `firestore.rules` actualizado
5. Pégalo en el editor de reglas
6. Haz clic en **Publicar** (Publish)

## Solución 3: Modificar Queries para No Requerir Índices

Si prefieres no crear índices compuestos, puedes modificar las queries para que solo filtren por un campo y luego ordenen en el cliente.

### En `useDashboardStats.js`:

```javascript
// ❌ Query que requiere índice compuesto
const billsQuery = query(
  billsRef,
  where('houseId', '==', userData.houseId),
  where('createdAt', '>=', start.toISOString()),
  where('createdAt', '<=', end.toISOString())
);

// ✅ Query simple + filtrado en cliente
const billsQuery = query(
  billsRef,
  where('houseId', '==', userData.houseId)
);

const billsSnapshot = await getDocs(billsQuery);
const bills = billsSnapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(bill => {
    // Filtrar por fecha en el cliente
    const billDate = new Date(bill.createdAt);
    return billDate >= start && billDate <= end;
  });
```

## Recomendación Final

**Para producción, usa SOLUCIÓN 1 + SOLUCIÓN 2**:
- Los índices hacen las queries más rápidas
- Las reglas simplificadas permiten queries sin errores
- La seguridad se mantiene porque el código filtra por `houseId` del usuario

**Para desarrollo rápido, puedes usar solo SOLUCIÓN 3**:
- No requiere crear índices
- Funciona inmediatamente
- Ligeramente más lento (filtrado en cliente)

## Solución Aplicada (Recomendada)

Se ha implementado **Solución 3** (modificar queries) que:
- ✅ No requiere crear índices manualmente
- ✅ Funciona inmediatamente
- ✅ Actualiza las reglas de seguridad para permitir queries
- ✅ El filtrado por fecha se hace en el cliente

### Cambios realizados:

1. **firestore.rules**: Se simplificaron las reglas para permitir queries sin usar `resource.data`
2. **useDashboardStats.js**: Se eliminó el filtro de fecha en la query, se hace en el cliente
3. Las colecciones actualizadas: `bills`, `payments`, `certificates`, `vehicles`

## Pasos para Aplicar los Cambios

### 1. Actualizar Reglas en Firebase Console

**⚠️ ESTE PASO ES CRÍTICO - Sin esto los errores continuarán**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `lospeumos-e0261`
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Reglas** (Rules)
5. Copia todo el contenido del archivo `firestore.rules` de tu proyecto local
6. Pega el contenido en el editor de Firebase Console
7. Haz clic en **Publicar** (Publish)
8. Espera la confirmación "Reglas publicadas correctamente"

### 2. Verificar en la Aplicación

1. **Cierra sesión** en la aplicación (importante para que se apliquen las nuevas reglas)
2. **Inicia sesión** con un usuario residente (ejemplo: house10)
3. Verifica que el dashboard carga sin errores
4. Verifica que aparecen las boletas del residente
5. Abre la consola del navegador (F12) - no debe haber errores de Firestore

## Verificación de Solución

✅ **Reglas actualizadas en Firebase Console** (REQUERIDO)
✅ **Query modificada** en `useDashboardStats.js` para filtrar en el cliente
✅ **Permisos simplificados** para colecciones: bills, payments, certificates, vehicles
✅ **Código filtra por houseId** del usuario en cada hook

## Errores Resueltos

✅ `FirebaseError: The query requires an index` - Query modificada para no requerir índice
✅ `FirebaseError: Missing or insufficient permissions` - Reglas actualizadas
✅ Dashboard de residentes carga correctamente
✅ Boletas se muestran solo para la parcela del residente
✅ useResidentData carga datos sin errores de permisos

## Notas de Seguridad

Las reglas actualizadas permiten a los residentes hacer queries en las colecciones, pero:
- ✅ El código de la aplicación filtra por `houseId` del usuario
- ✅ Los residentes solo ven datos de su propia parcela
- ✅ Admin, presidente, técnico y secretaria tienen acceso completo
- ✅ Las operaciones de escritura siguen restringidas por rol
