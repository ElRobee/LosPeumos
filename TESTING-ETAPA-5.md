# Etapa 5: Panel del Residente (Mi Cuenta) - Instrucciones de Prueba

## ✅ Componentes Implementados

### Hook Personalizado
- ✅ `src/hooks/useResidentData.js` - Hook para cargar datos del residente:
  - Información de la parcela
  - Lista de boletas (con ordenamiento por fecha)
  - Lista de pagos realizados
  - Lista de vehículos registrados
  - Estadísticas calculadas (total boletas, pendientes, pagadas, vencidas, montos)

### Componentes de UI
- ✅ `src/components/BillsList.jsx` - Lista de boletas con:
  - Filtros: Todas, Pendientes, Vencidas, Pagadas
  - Tarjetas de boleta con información detallada
  - Botón "Descargar PDF" (si existe pdfUrl)
  - Botón "Subir Comprobante" (solo para pendientes/vencidas)
  - Estado visual con colores y iconos

- ✅ `src/components/UploadPaymentProof.jsx` - Modal para subir comprobante:
  - Selector de archivo (JPG, PNG, PDF, máx 5MB)
  - Vista previa de imágenes
  - Validación de tipo y tamaño de archivo
  - Información de datos bancarios para transferencia
  - Subida automática a Firebase Storage
  - Creación de registro en Firestore (collection `payments`)
  - Mensajes de éxito/error

- ✅ `src/components/VehicleManagement.jsx` - Gestión de vehículos:
  - Lista de vehículos registrados en grid
  - Modal para agregar nuevo vehículo
  - Modal para editar vehículo existente
  - Botón eliminar con confirmación
  - Campos: Patente (requerida), Tipo, Marca, Modelo, Color
  - Tipos: Auto, SUV, Camioneta, Moto

### Página Principal
- ✅ `src/pages/MiCuenta.jsx` - Panel del residente con 3 tabs:
  - **Tab Resumen**: Estadísticas, alertas de boletas pendientes, vehículos recientes
  - **Tab Boletas**: Lista completa con filtros y acciones
  - **Tab Vehículos**: Gestión completa de vehículos

### Rutas y Menú
- ✅ Ruta `/mi-cuenta` agregada en App.jsx
- ✅ Accesible para **todos los roles** (admin, presidente, tecnico, secretaria, residente)
- ✅ Opción "Mi Cuenta" visible en el menú lateral para todos los usuarios

---

## 🧪 Cómo Probar la Etapa 5

### Pre-requisitos
1. Tener el servidor corriendo: `npm run dev`
2. Tener usuarios seed creados (Etapa 2)
3. Tener datos demo creados (Etapa 3)
4. (Opcional) Haber generado algunas boletas en Etapa 4

---

## 📋 PRUEBA 1: Vista Resumen (Tab Overview)

### Paso 1: Ingresar como Residente
```
Email: residente@lospeumos.cl
Password: residente123
```

### Paso 2: Ir a Mi Cuenta
1. En el menú lateral, hacer clic en "Mi Cuenta" (ícono de usuario)
2. Deberías ver la página principal con 3 tabs: Resumen, Boletas, Vehículos
3. Por defecto se muestra el tab "Resumen"

### Paso 3: Verificar Información de Parcela
En la parte superior deberías ver:
- ✅ **Número de parcela** (ej: Parcela 1)
- ✅ **Nombre del propietario**
- ✅ **Email** del residente
- ✅ **Teléfono** (si está registrado)

### Paso 4: Verificar Estadísticas
Deberías ver 4 tarjetas con:
- ✅ **Total Boletas**: Cantidad total de boletas
- ✅ **Boletas Pendientes**: Cantidad y monto total pendiente
- ✅ **Boletas Vencidas**: Cantidad de boletas con fecha vencida
- ✅ **Boletas Pagadas**: Cantidad y monto total pagado

### Paso 5: Verificar Alertas (si hay boletas pendientes)
Si tienes boletas pendientes:
- ✅ Aparece un cuadro amarillo con alerta
- ✅ Muestra cantidad de boletas pendientes y monto total
- ✅ Botón "Ver Boletas Pendientes" que te lleva al tab Boletas

### Paso 6: Verificar Sección Vehículos
- ✅ Muestra hasta 3 vehículos registrados
- ✅ Si no hay vehículos, muestra mensaje con link para agregar
- ✅ Botón "Ver todos" para ir al tab Vehículos

---

## 📄 PRUEBA 2: Lista de Boletas (Tab Boletas)

### Paso 1: Ir al Tab Boletas
1. Hacer clic en la pestaña "Boletas"
2. Deberías ver:
   - ✅ Filtros en la parte superior (Todas, Pendientes, Vencidas, Pagadas)
   - ✅ Cantidad de boletas en cada filtro entre paréntesis

### Paso 2: Probar Filtros
1. **Filtro "Todas"**: Muestra todas las boletas del residente
2. **Filtro "Pendientes"**: Solo boletas con status "pending" y no vencidas
3. **Filtro "Vencidas"**: Solo boletas pendientes con fecha de vencimiento pasada
4. **Filtro "Pagadas"**: Solo boletas con status "paid"

### Paso 3: Verificar Información de Boleta
Cada tarjeta de boleta muestra:
- ✅ **Período**: Mes y año (ej: "Octubre 2024")
- ✅ **Número de boleta**: Formato YYYY-MM-houseId
- ✅ **Estado**: Badge con color (Verde=Pagada, Amarillo=Pendiente, Rojo=Vencida)
- ✅ **Consumo**: kWh consumidos
- ✅ **Total**: Monto a pagar en CLP
- ✅ **Fecha de emisión**
- ✅ **Fecha de vencimiento**

### Paso 4: Descargar PDF
1. Buscar una boleta que tenga PDF generado
2. Hacer clic en "Descargar PDF"
3. ✅ Debería abrir el PDF en una nueva pestaña o descargarlo

### Paso 5: Subir Comprobante de Pago
1. Seleccionar una boleta **Pendiente** o **Vencida**
2. Hacer clic en "Subir Comprobante"
3. Se abre un modal con:
   - ✅ Información de la boleta (período y monto)
   - ✅ **Datos bancarios** para realizar la transferencia
   - ✅ Área para seleccionar archivo

---

## 💳 PRUEBA 3: Subir Comprobante de Pago

### Paso 1: Abrir Modal de Subida
1. Desde la lista de boletas, hacer clic en "Subir Comprobante" en una boleta pendiente
2. Verifica que el modal muestre:
   - ✅ Título "Subir Comprobante"
   - ✅ Período y monto de la boleta
   - ✅ Recuadro azul con datos bancarios:
     - Banco: Banco Estado
     - Tipo de cuenta: Cuenta Corriente
     - Número de cuenta: 12345678
     - RUT: 76.XXX.XXX-X
     - Referencia: BILL-YYYY-MM-houseId

### Paso 2: Seleccionar Archivo
1. Hacer clic en el área de "Haz clic para seleccionar archivo"
2. Seleccionar una imagen (JPG, PNG) o PDF de tu computadora
3. ✅ Si el archivo es válido, deberías ver:
   - Vista previa de la imagen (si es JPG/PNG)
   - Ícono de archivo (si es PDF)
   - Nombre del archivo y tamaño en MB
   - Botón X para remover el archivo

### Paso 3: Probar Validaciones
**Archivo muy grande:**
1. Intentar subir un archivo mayor a 5MB
2. ✅ Debería mostrar error: "El archivo es muy grande. Máximo: 5.00 MB"

**Tipo de archivo no permitido:**
1. Intentar subir un .doc, .txt, etc.
2. ✅ Debería mostrar error con tipos permitidos

### Paso 4: Subir Comprobante Válido
1. Seleccionar archivo válido (JPG, PNG o PDF menor a 5MB)
2. Hacer clic en "Subir Comprobante"
3. ✅ Deberías ver:
   - Botón cambia a "Subiendo..." con spinner
   - Mensaje verde de éxito: "¡Comprobante subido exitosamente! Se notificará al administrador..."
   - Modal se cierra automáticamente después de 2 segundos

### Paso 5: Verificar en Firebase
1. **Firebase Storage**: Ir a Firebase Console → Storage → `payments/[userId]/`
   - ✅ Debería aparecer el archivo subido: `payment-[billId]-[timestamp].[ext]`

2. **Firestore**: Ir a Firebase Console → Firestore → `payments`
   - ✅ Debería aparecer un nuevo documento con:
     - billId, houseId, userId
     - amount (monto de la boleta)
     - method: "transfer"
     - proofUrl (URL del archivo en Storage)
     - validated: false
     - validatedBy: null
     - createdAt
     - notes

---

## 🚗 PRUEBA 4: Gestión de Vehículos

### Paso 1: Ir al Tab Vehículos
1. Hacer clic en la pestaña "Vehículos"
2. Si no tienes vehículos:
   - ✅ Aparece mensaje: "No tienes vehículos registrados"
   - ✅ Botón "Agregar primer vehículo"

### Paso 2: Agregar Nuevo Vehículo
1. Hacer clic en "Agregar Vehículo" (botón superior derecho)
2. Se abre modal con formulario:
   - ✅ **Patente** (campo requerido, máx 6 caracteres)
   - ✅ **Tipo de Vehículo** (dropdown: Auto, SUV, Camioneta, Moto)
   - ✅ **Marca** (opcional)
   - ✅ **Modelo** (opcional)
   - ✅ **Color** (opcional)

3. Llenar el formulario:
   ```
   Patente: ABCD12
   Tipo: Auto
   Marca: Toyota
   Modelo: Corolla
   Color: Blanco
   ```

4. Hacer clic en "Agregar"
5. ✅ Deberías ver:
   - Modal se cierra
   - Vehículo aparece en el grid
   - Tarjeta con ícono de auto y datos ingresados

### Paso 3: Editar Vehículo
1. En la tarjeta del vehículo, hacer clic en el ícono de lápiz (Editar)
2. Se abre modal con datos actuales prellenados
3. Modificar algún campo (ej: cambiar color a "Rojo")
4. Hacer clic en "Actualizar"
5. ✅ Los cambios deberían reflejarse en la tarjeta

### Paso 4: Eliminar Vehículo
1. En la tarjeta del vehículo, hacer clic en el ícono de basura (Eliminar)
2. Aparece confirmación: "¿Estás seguro de eliminar este vehículo?"
3. Hacer clic en "Aceptar"
4. ✅ El vehículo desaparece de la lista

### Paso 5: Verificar en Firestore
1. Ir a Firebase Console → Firestore → `vehicles`
2. ✅ Deberías ver documentos con:
   - userId, houseId
   - licensePlate (en mayúsculas)
   - brand, model, color, type
   - active: true
   - createdAt, updatedAt

---

## 👥 PRUEBA 5: Acceso desde Otros Roles

### Admin / Presidente / Técnico / Secretaria
1. Cerrar sesión
2. Ingresar con otro rol (ej: admin@lospeumos.cl / admin123)
3. Ir a "Mi Cuenta" desde el menú
4. ✅ Deberías ver la misma página de Mi Cuenta
5. ✅ La información de parcela corresponde al houseId del usuario
6. **Nota**: Si el usuario no tiene `houseId` asignado, algunos datos pueden estar vacíos

---

## 🎯 Checklist de Validación

### Página Mi Cuenta
- [ ] La ruta /mi-cuenta carga correctamente
- [ ] Todos los roles pueden acceder (no solo residentes)
- [ ] Se muestra información de la parcela correctamente
- [ ] Las estadísticas se calculan correctamente
- [ ] Los 3 tabs funcionan (Resumen, Boletas, Vehículos)

### Lista de Boletas
- [ ] Se muestran todas las boletas de la parcela del usuario
- [ ] Los filtros funcionan correctamente (Todas, Pendientes, Vencidas, Pagadas)
- [ ] Las tarjetas muestran toda la información necesaria
- [ ] El estado de la boleta se muestra con el color correcto
- [ ] El botón "Descargar PDF" funciona (si pdfUrl existe)
- [ ] El botón "Subir Comprobante" solo aparece en boletas pendientes/vencidas

### Subir Comprobante
- [ ] El modal se abre correctamente
- [ ] Se muestran los datos bancarios
- [ ] La selección de archivo funciona
- [ ] La vista previa de imágenes se muestra
- [ ] Las validaciones de tipo y tamaño funcionan
- [ ] El archivo se sube correctamente a Storage
- [ ] Se crea el documento en Firestore con validated: false
- [ ] Mensaje de éxito se muestra y el modal se cierra

### Gestión de Vehículos
- [ ] El botón "Agregar Vehículo" funciona
- [ ] El formulario valida que la patente sea obligatoria
- [ ] El vehículo se guarda en Firestore
- [ ] El vehículo aparece en el grid después de agregarlo
- [ ] El botón "Editar" abre el modal con datos prellenados
- [ ] Los cambios se guardan correctamente
- [ ] El botón "Eliminar" pide confirmación
- [ ] El vehículo se elimina de Firestore y desaparece de la lista

---

## 🔧 Configuración de Firebase Storage

Si al subir comprobantes obtienes errores de permisos, necesitas actualizar las reglas de Storage:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Boletas - Solo lectura para autenticados
    match /bills/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (request.auth.token.role == 'admin' || 
                    request.auth.token.role == 'tecnico');
    }
    
    // Comprobantes de pago - Usuario puede subir sus propios comprobantes
    match /payments/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Próximos Pasos

Una vez validada la Etapa 5, podemos continuar con:

**Etapa 6**: Conciliación de Pagos (Admin/Presidente)
- Subir archivo Excel con pagos bancarios
- Matching automático de pagos con boletas pendientes
- Validación manual de comprobantes subidos por residentes
- Actualización de status de boletas a "paid"
- Notificaciones por email de validación

---

## 📝 Notas Importantes

### Datos Bancarios de Ejemplo
Los datos mostrados en el modal de comprobantes son de ejemplo:
- Banco: Banco Estado
- Número de cuenta: 12345678
- RUT: 76.XXX.XXX-X

**Deberás actualizarlos en `src/components/UploadPaymentProof.jsx`** con los datos reales del condominio.

### HouseId Requerido
Para que la funcionalidad de Mi Cuenta funcione correctamente, el usuario debe tener un `houseId` asignado en su documento de Firestore (collection `users`).

Los usuarios seed ya tienen este campo:
- Admin: house1
- Presidente: house2
- Técnico: house3
- Secretaria: house4
- Residente: house1

### Validación de Pagos
Los comprobantes subidos por residentes se crean con `validated: false`. En la Etapa 6 implementaremos el módulo de administrador para validar estos comprobantes y actualizar el status de las boletas.

---

## ❓ Solución de Problemas

### Error "No se encontraron parcelas"
- Verificar que el usuario tenga `houseId` en su documento de Firestore
- Verificar que exista un documento en la collection `houses` con ese ID

### Error al subir comprobante
- Verificar reglas de Storage (ver sección de configuración arriba)
- Verificar que el archivo cumpla con los requisitos (tipo y tamaño)
- Revisar la consola del navegador para más detalles

### No aparecen boletas
- Verificar que existan documentos en `bills` con el `houseId` del usuario
- Si usaste el seed de la Etapa 3, deberías tener boletas generadas
- Si generaste boletas en la Etapa 4, asegúrate de que el técnico las generó para la parcela correcta

### Los vehículos no se guardan
- Verificar reglas de Firestore para la collection `vehicles`
- Verificar en la consola del navegador si hay errores
- Asegurarse de que el userId esté definido
