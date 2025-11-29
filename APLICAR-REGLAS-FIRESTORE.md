# 🔒 Aplicar Reglas de Firestore Actualizadas

## ⚠️ ERROR ACTUAL
```
FirebaseError: Missing or insufficient permissions.
```

Esto ocurre porque las nuevas colecciones (`quotas`, `meetings`, `certificates`) no tienen reglas de seguridad configuradas en Firebase.

## 📋 Pasos para Solucionar

### 1. Ir a Firebase Console
1. Abre tu navegador
2. Ve a: https://console.firebase.google.com/
3. Selecciona el proyecto: **lospeumos-e0261**

### 2. Abrir Firestore Database
1. En el menú lateral izquierdo, busca "Firestore Database"
2. Haz clic en "Firestore Database"

### 3. Ir a la Pestaña de Reglas
1. En la parte superior, verás varias pestañas: Datos, Reglas, Índices, Uso
2. Haz clic en **"Reglas"**

### 4. Copiar las Nuevas Reglas
1. Abre el archivo `firestore.rules` en VS Code (ya está actualizado)
2. Selecciona TODO el contenido (Ctrl+A)
3. Copia (Ctrl+C)

### 5. Pegar en Firebase Console
1. En Firebase Console, selecciona TODO el contenido actual de las reglas
2. Borra todo (Ctrl+A, Delete)
3. Pega las nuevas reglas (Ctrl+V)

### 6. Publicar las Reglas
1. Haz clic en el botón **"Publicar"** (arriba a la derecha)
2. Espera la confirmación: "Reglas publicadas correctamente"

### 7. Verificar en la Aplicación
1. Regresa a tu aplicación (localhost:5173)
2. Recarga la página (F5)
3. Navega a "Cuotas" nuevamente
4. El error debería desaparecer

## 📝 Reglas Agregadas

Las siguientes reglas fueron agregadas para las nuevas colecciones:

### ✅ quotas (Cuotas Extras)
- **Leer**: Todos los usuarios autenticados
- **Crear**: Admin y Presidente
- **Actualizar**: Admin y Presidente
- **Eliminar**: Solo Admin

### ✅ meetings (Reuniones)
- **Leer**: Todos los usuarios autenticados
- **Crear**: Admin, Presidente y Secretaria
- **Actualizar**: Admin, Presidente y Secretaria
- **Eliminar**: Solo Admin

### ✅ certificates (Certificados)
- **Leer**: Todos los usuarios autenticados
- **Crear**: Todos los usuarios autenticados
- **Actualizar**: Admin y Secretaria
- **Eliminar**: Solo Admin

## 🔍 Verificación Rápida

Después de aplicar las reglas, verifica en la consola del navegador (F12):
- ✅ No debería aparecer: "Missing or insufficient permissions"
- ✅ Deberían cargar las cuotas/reuniones/certificados sin errores

## ⚡ Alternativa: Copiar Reglas Completas

Si prefieres copiar las reglas directamente, aquí está el contenido completo actualizado:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // FUNCIONES AUXILIARES
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }
    
    function hasAnyRole(roles) {
      return isAuthenticated() && getUserData().role in roles;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // COLECCIÓN: users
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || hasRole('admin');
      allow delete: if hasRole('admin');
    }
    
    // COLECCIÓN: houses
    match /houses/{houseId} {
      allow read: if isAuthenticated();
      allow write: if hasAnyRole(['admin', 'presidente']);
    }
    
    // COLECCIÓN: bills
    match /bills/{billId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['admin', 'tecnico']);
      allow update: if hasAnyRole(['admin', 'tecnico', 'presidente']);
      allow delete: if hasRole('admin');
    }
    
    // COLECCIÓN: payments
    match /payments/{paymentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if hasAnyRole(['admin', 'presidente']);
      allow delete: if hasRole('admin');
    }
    
    // COLECCIÓN: meetings
    match /meetings/{meetingId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      allow update: if hasAnyRole(['admin', 'presidente', 'secretaria']);
      allow delete: if hasRole('admin');
    }
    
    // COLECCIÓN: quotas
    match /quotas/{quotaId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['admin', 'presidente']);
      allow update: if hasAnyRole(['admin', 'presidente']);
      allow delete: if hasRole('admin');
    }
    
    // COLECCIÓN: certificates
    match /certificates/{certificateId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if hasAnyRole(['admin', 'secretaria']);
      allow delete: if hasRole('admin');
    }
    
    // COLECCIÓN: vehicles
    match /vehicles/{vehicleId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if hasAnyRole(['admin']) || getUserData().houseId == resource.data.houseId;
    }
    
    // Denegar todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🚨 Importante

- Las reglas se aplican en tiempo real, no necesitas reiniciar la aplicación
- Si sigues viendo el error después de aplicar las reglas, espera 1-2 minutos
- Verifica que estés logueado con un usuario que tenga rol "admin" o "presidente"

## ✅ Checklist

- [ ] Abrí Firebase Console
- [ ] Fui a Firestore Database > Reglas
- [ ] Copié las nuevas reglas del archivo `firestore.rules`
- [ ] Pegué en Firebase Console
- [ ] Hice clic en "Publicar"
- [ ] Vi confirmación "Reglas publicadas correctamente"
- [ ] Recargué la aplicación (F5)
- [ ] El error desapareció

---

**Archivo actualizado**: `firestore.rules` (en tu proyecto)  
**Fecha**: Octubre 22, 2025
