# Instrucciones para Desplegar las Reglas de Firestore

## Problema Resuelto
Se corrigió el error "Missing or insufficient permissions" que ocurría cuando nuevos usuarios intentaban acceder a sus datos.

## Cambios Realizados en `firestore.rules`
1. Se agregó la función `userDocExists()` para verificar si el documento del usuario existe
2. Se actualizó `getUserData()` para manejar casos donde el documento no existe aún
3. Se agregaron verificaciones de existencia en las funciones `hasRole()` y `hasAnyRole()`
4. Se actualizaron las reglas de `bills` y `vehicles` para manejar casos donde `houseId` es `null`

## Cómo Desplegar las Reglas (Opción 1: Firebase Console)

1. **Ir a Firebase Console**
   - Abre https://console.firebase.google.com/
   - Selecciona tu proyecto: **lospeumos-e0261**

2. **Navegar a Firestore Rules**
   - En el menú lateral, haz clic en "Firestore Database"
   - Haz clic en la pestaña "Reglas" (Rules)

3. **Copiar las Reglas Actualizadas**
   - Abre el archivo `firestore.rules` en tu proyecto
   - Selecciona TODO el contenido del archivo (Ctrl+A)
   - Copia el contenido (Ctrl+C)

4. **Pegar y Publicar**
   - En Firebase Console, selecciona todo el texto existente
   - Pega las nuevas reglas (Ctrl+V)
   - Haz clic en el botón **"Publicar"** (Publish)
   - Espera la confirmación de que las reglas se desplegaron correctamente

## Cómo Desplegar las Reglas (Opción 2: Firebase CLI)

Si tienes Firebase CLI instalado:

```powershell
# Instalar Firebase CLI (si no está instalado)
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar el proyecto (solo la primera vez)
firebase init firestore

# Desplegar las reglas
firebase deploy --only firestore:rules
```

## Verificar que Funcionó

1. **Cierra sesión** del usuario que tenía problemas
2. **Vuelve a iniciar sesión** con ese usuario
3. El error de permisos debería desaparecer
4. El usuario debería poder ver sus datos correctamente

## Problemas Conocidos

Si el error persiste después de desplegar las reglas:

### Problema 1: Usuario sin `houseId`
Si el usuario es residente pero no tiene `houseId` asignado:
- Ve a Firebase Console → Firestore Database → Colección `users`
- Busca el documento del usuario (por email)
- Verifica que tenga el campo `houseId` con un valor válido (ej: "house1", "house2")

### Problema 2: Casa no existe
Si el `houseId` apunta a una casa que no existe:
- Ve a Firestore Database → Colección `houses`
- Verifica que exista un documento con el ID correcto (ej: "house1")
- Si no existe, créalo con la estructura:
  ```json
  {
    "id": "house1",
    "number": 1,
    "owner": "Nombre del Propietario",
    "address": "Dirección",
    "residents": 1,
    "area": 500,
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
  ```

### Problema 3: Usuario sin rol
Si el usuario no tiene el campo `role`:
- Ve a Firestore Database → Colección `users`
- Edita el documento del usuario
- Agrega el campo `role` con valor: "residente", "admin", "presidente", "tecnico" o "secretaria"

## Notas Técnicas

Las nuevas reglas son **más seguras** porque:
- No fallan cuando el documento del usuario no existe aún
- Manejan correctamente usuarios sin `houseId` (admin, presidente, técnico, secretaria)
- Evitan errores de "document not found" durante la creación de usuarios
- Mantienen todas las restricciones de seguridad originales

## Contacto
Si sigues teniendo problemas después de seguir estos pasos, revisa la consola del navegador (F12) para ver el error específico.
