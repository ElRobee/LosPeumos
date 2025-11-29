# APLICAR REGLAS FIRESTORE - ETAPAS 10 & 11
## Actualización para Vehículos y Configuración

---

## ⚠️ IMPORTANTE

Después de implementar las **Etapas 10 y 11**, es necesario aplicar las nuevas reglas de Firestore para la colección `settings`.

---

## 🔥 PASO 1: Acceder a Firebase Console

1. Ir a: **https://console.firebase.google.com**
2. Seleccionar el proyecto: **`lospeumos-e0261`**
3. En el menú lateral izquierdo, click en **"Firestore Database"**
4. Click en la pestaña **"Reglas"** (Rules)

---

## 📋 PASO 2: Copiar las Reglas Actualizadas

Reemplaza **TODAS** las reglas existentes con el siguiente código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    
    // Verificar si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Obtener datos del usuario actual
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Verificar si el usuario tiene un rol específico
    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }
    
    // Verificar si el usuario tiene uno de los roles permitidos
    function hasAnyRole(roles) {
      return isAuthenticated() && getUserData().role in roles;
    }
    
    // Verificar si el usuario es el propietario del documento
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // COLECCIÓN: users
    // ============================================
    match /users/{userId} {
      // Leer: solo el propio usuario puede ver sus datos
      allow read: if isOwner(userId);
      
      // Crear: solo durante el signup (Firebase Auth maneja esto)
      // En producción, esto debería ser más restrictivo
      allow create: if isAuthenticated();
      
      // Actualizar: solo el propio usuario o un admin
      allow update: if isOwner(userId) || hasRole('admin');
      
      // Eliminar: solo admins
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: settings (configuración del sistema)
    // ============================================
    match /settings/{settingId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Escribir: solo admin
      allow write: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: houses (parcelas)
    // ============================================
    match /houses/{houseId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Escribir: solo admin y presidente
      allow write: if hasAnyRole(['admin', 'presidente']);
    }
    
    // ============================================
    // COLECCIÓN: bills (boletas de electricidad)
    // ============================================
    match /bills/{billId} {
      // Leer: 
      // - El residente de la casa puede ver sus boletas
      // - Admin, presidente, técnico y secretaria pueden ver todas
      allow read: if isAuthenticated() && (
        hasAnyRole(['admin', 'presidente', 'tecnico', 'secretaria']) ||
        getUserData().houseId == resource.data.houseId
      );
      
      // Crear: solo técnico y admin
      allow create: if hasAnyRole(['admin', 'tecnico']);
      
      // Actualizar: admin, presidente (para marcar como pagado)
      allow update: if hasAnyRole(['admin', 'presidente']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: payments (comprobantes de pago)
    // ============================================
    match /payments/{paymentId} {
      // Leer: el residente que lo subió, admin, presidente
      allow read: if isAuthenticated() && (
        hasAnyRole(['admin', 'presidente']) ||
        isOwner(resource.data.userId)
      );
      
      // Crear: cualquier residente autenticado
      allow create: if isAuthenticated();
      
      // Actualizar: solo admin y presidente (para validar pagos)
      allow update: if hasAnyRole(['admin', 'presidente']);
      
      // Eliminar: admin o el residente que lo subió
      allow delete: if hasRole('admin') || isOwner(resource.data.userId);
    }
    
    // ============================================
    // COLECCIÓN: quotas (cuotas extras)
    // ============================================
    match /quotas/{quotaId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Crear: admin y presidente
      allow create: if hasAnyRole(['admin', 'presidente']);
      
      // Actualizar: admin y presidente (para marcar pagos)
      allow update: if hasAnyRole(['admin', 'presidente']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: meetings (reuniones)
    // ============================================
    match /meetings/{meetingId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Crear: admin, presidente, secretaria
      allow create: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      
      // Actualizar: admin, presidente, secretaria (para asistencia y actas)
      allow update: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: certificates (certificados)
    // ============================================
    match /certificates/{certificateId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Crear: cualquier usuario autenticado (para solicitar certificado)
      allow create: if isAuthenticated();
      
      // Actualizar: secretaria y admin (para generar el PDF)
      allow update: if hasAnyRole(['admin', 'secretaria']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: vehicles (vehículos)
    // ============================================
    match /vehicles/{vehicleId} {
      // Leer: todos los usuarios autenticados (para búsqueda)
      allow read: if isAuthenticated();
      
      // Crear: el residente de la casa puede crear vehículos
      allow create: if isAuthenticated() && (
        hasAnyRole(['admin', 'presidente']) ||
        getUserData().houseId == request.resource.data.houseId
      );
      
      // Actualizar: el residente de la casa, admin, presidente
      allow update: if isAuthenticated() && (
        hasAnyRole(['admin', 'presidente']) ||
        getUserData().houseId == resource.data.houseId
      );
      
      // Eliminar: el residente de la casa, admin
      allow delete: if hasAnyRole(['admin']) ||
        getUserData().houseId == resource.data.houseId;
    }
    
    // ============================================
    // COLECCIÓN: transactions (cruce de pagos)
    // ============================================
    match /transactions/{transactionId} {
      // Leer: admin y presidente
      allow read: if hasAnyRole(['admin', 'presidente']);
      
      // Crear: admin (al subir cartola bancaria)
      allow create: if hasRole('admin');
      
      // Actualizar: admin y presidente (para confirmar matches)
      allow update: if hasAnyRole(['admin', 'presidente']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: expenses (gastos comunes)
    // ============================================
    match /expenses/{expenseId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Crear: admin y presidente
      allow create: if hasAnyRole(['admin', 'presidente']);
      
      // Actualizar: admin y presidente
      allow update: if hasAnyRole(['admin', 'presidente']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
  }
}
```

---

## ✅ PASO 3: Publicar las Reglas

1. Después de pegar el código completo, click en el botón **"Publicar"** (Publish)
2. Confirmar la publicación
3. Esperar mensaje de confirmación: **"Reglas publicadas correctamente"**

---

## 🧪 PASO 4: Verificar que Funciona

1. Recargar la página de la aplicación (F5)
2. Navegar a **"Configuración"** con usuario admin
3. Intentar guardar configuración del condominio
4. Si funciona correctamente: **¡Reglas aplicadas con éxito!** ✅

---

## 🔍 Cambios Aplicados en Esta Actualización

### Nueva Colección: `settings`

**Permisos**:
- ✅ **Leer**: Todos los usuarios autenticados
- ✅ **Escribir**: Solo Admin

**Uso**:
- Almacena configuración global del condominio
- Nombre, dirección, contacto
- Tarifas de electricidad
- Configuración de emails

---

## ❌ Problemas Comunes

### Error: "Missing or insufficient permissions"

**Causa**: Las reglas no se aplicaron correctamente en Firebase Console

**Solución**:
1. Verificar que publicaste las reglas (paso 3)
2. Esperar 10 segundos para que se propaguen
3. Recargar la página (F5)
4. Limpiar caché del navegador (Ctrl + Shift + Del)

---

### Error: "Function getUserData() not found"

**Causa**: Solo se copiaron las reglas de `settings`, no todo el archivo

**Solución**:
1. Copiar **TODO** el código desde `rules_version = '2';` hasta el final
2. Reemplazar completamente las reglas existentes
3. Publicar nuevamente

---

## 📊 Resumen de Colecciones con Reglas

| Colección | Leer | Crear | Actualizar | Eliminar |
|-----------|------|-------|------------|----------|
| users | Owner | Auth | Owner/Admin | Admin |
| **settings** | **Auth** | **Admin** | **Admin** | **Admin** |
| houses | Auth | Admin/Pres | Admin/Pres | Admin/Pres |
| bills | Auth/Owner | Admin/Téc | Admin/Pres | Admin |
| payments | Auth/Owner | Auth | Admin/Pres | Admin/Owner |
| quotas | Auth | Admin/Pres | Admin/Pres | Admin |
| meetings | Auth | Admin/Pres/Sec | Admin/Pres/Sec | Admin |
| certificates | Auth | Auth | Admin/Sec | Admin |
| vehicles | Auth | Auth/Owner | Admin/Pres/Owner | Admin/Owner |
| transactions | Admin/Pres | Admin | Admin/Pres | Admin |
| expenses | Auth | Admin/Pres | Admin/Pres | Admin |

---

## 🎯 Próximos Pasos

Después de aplicar estas reglas:

1. ✅ Etapa 10 (Vehículos) funcionará correctamente
2. ✅ Etapa 11 (Configuración) podrá guardar datos
3. ✅ Todos los permisos estarán correctamente configurados
4. ➡️ Continuar con testing de las nuevas funcionalidades

---

## 📞 Soporte

Si encuentras problemas al aplicar las reglas:
1. Revisar la consola del navegador (F12) para errores específicos
2. Verificar que el código se copió completo
3. Asegurarte de estar usando el proyecto correcto en Firebase Console

---

**Fecha de actualización**: Etapas 10 & 11 - Vehículos y Configuración
