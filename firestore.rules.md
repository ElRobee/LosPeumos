# Reglas de Seguridad de Firestore para LosPeumos

Este archivo contiene las reglas de seguridad de Firestore que deben ser configuradas en Firebase Console.

## 📋 Cómo aplicar estas reglas

1. Ve a Firebase Console: https://console.firebase.google.com/
2. Selecciona el proyecto "lospeumos-e0261"
3. Ve a "Firestore Database" en el menú lateral
4. Click en la pestaña "Reglas"
5. Copia y pega las reglas de abajo
6. Click en "Publicar"

## 🔒 Reglas de Seguridad (Versión Etapa 2)

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
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: meetings (reuniones)
    // ============================================
    match /meetings/{meetingId} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Crear: secretaria, presidente, admin
      allow create: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      
      // Actualizar: secretaria, presidente, admin
      allow update: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      
      // Eliminar: solo admin
      allow delete: if hasRole('admin');
    }
    
    // ============================================
    // COLECCIÓN: certificates (certificados)
    // ============================================
    match /certificates/{certificateId} {
      // Leer: el residente que lo solicitó, secretaria, admin
      allow read: if isAuthenticated() && (
        hasAnyRole(['admin', 'secretaria']) ||
        isOwner(resource.data.userId)
      );
      
      // Crear: cualquier usuario autenticado puede solicitarlo
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
      // Leer: admin, presidente, secretaria
      allow read: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      
      // Escribir: admin y presidente
      allow write: if hasAnyRole(['admin', 'presidente']);
    }
    
    // ============================================
    // Denegar acceso a cualquier otra colección
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🔐 Reglas de Storage

También debes configurar las reglas de Firebase Storage:

1. Ve a "Storage" en Firebase Console
2. Click en la pestaña "Reglas"
3. Copia y pega las reglas de abajo:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Función para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función para obtener rol del usuario
    function getUserRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // ============================================
    // PDFs de boletas de electricidad
    // ============================================
    match /bills/{billId}/{filename} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Escribir: solo técnico y admin
      allow write: if isAuthenticated() && getUserRole() in ['admin', 'tecnico'];
    }
    
    // ============================================
    // Comprobantes de pago subidos por residentes
    // ============================================
    match /payments/{userId}/{filename} {
      // Leer: el usuario que lo subió, admin y presidente
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || 
        getUserRole() in ['admin', 'presidente']
      );
      
      // Escribir: solo el usuario autenticado en su carpeta
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // Templates de certificados (DOCX)
    // ============================================
    match /templates/{filename} {
      // Leer: secretaria y admin
      allow read: if isAuthenticated() && getUserRole() in ['admin', 'secretaria'];
      
      // Escribir: solo admin
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }
    
    // ============================================
    // PDFs de certificados generados
    // ============================================
    match /certificates/{certificateId}/{filename} {
      // Leer: todos los usuarios autenticados
      allow read: if isAuthenticated();
      
      // Escribir: secretaria y admin
      allow write: if isAuthenticated() && getUserRole() in ['admin', 'secretaria'];
    }
    
    // ============================================
    // Cartolas bancarias (Excel)
    // ============================================
    match /bank-statements/{filename} {
      // Leer: admin y presidente
      allow read: if isAuthenticated() && getUserRole() in ['admin', 'presidente'];
      
      // Escribir: solo admin
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }
    
    // Denegar todo lo demás
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 📝 Notas importantes

1. **Estas reglas son para desarrollo**. En producción, deberías:
   - Agregar validación de tamaño de archivo
   - Agregar validación de tipo MIME
   - Agregar rate limiting
   - Considerar usar Cloud Functions para operaciones sensibles

2. **Indexación**: Firestore puede requerir índices compuestos. Firebase te mostrará un enlace en la consola cuando sea necesario.

3. **Testing**: Usa el simulador de reglas en Firebase Console para probar diferentes escenarios.

4. **Auditoría**: Revisa regularmente los logs de seguridad en Firebase Console.

## 🧪 Cómo probar las reglas

1. Ve a Firebase Console > Firestore > Reglas
2. Click en "Playground de reglas"
3. Prueba diferentes operaciones con diferentes roles:
   - Read `/users/{userId}` como el usuario propietario ✅
   - Read `/users/{otherUserId}` como usuario diferente ❌
   - Read `/bills/{billId}` como admin ✅
   - Write `/bills/{billId}` como residente ❌

## ⚠️ Importante para el seed de usuarios

Las reglas actuales permiten la creación de usuarios desde el cliente (necesario para el seed). En producción, deberías:

1. Deshabilitar la creación de usuarios desde el cliente
2. Usar Cloud Functions o Admin SDK para crear usuarios
3. O implementar un proceso de aprobación de registro

Para mayor seguridad en producción, cambia la regla de creación de users:

```javascript
match /users/{userId} {
  // Solo permitir crear si es el propio UID (durante signup)
  allow create: if isAuthenticated() && request.auth.uid == userId;
}
```
