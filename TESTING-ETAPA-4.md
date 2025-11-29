# Etapa 4: Módulo de Electricidad - Instrucciones de Prueba

## ✅ Componentes Implementados

### Servicios Creados
- ✅ `src/services/billCalculator.js` - Cálculo de consumo y totales
- ✅ `src/services/pdfGenerator.js` - Generación de PDFs con jsPDF
- ✅ `src/services/storageService.js` - Subida de archivos a Firebase Storage
- ✅ `src/services/emailService.js` - Envío de emails con EmailJS

### Página Principal
- ✅ `src/pages/Electricidad.jsx` - UI completa con:
  - Grid de parcelas con lecturas actuales
  - Modal para ingresar lecturas
  - Generación de boletas individuales
  - Cálculo automático de consumo y total
  - Descarga automática de PDF
  - Subida a Firebase Storage
  - Envío opcional de email

### Rutas
- ✅ Ruta `/electricidad` agregada en App.jsx
- ✅ Protegida solo para roles: `admin`, `tecnico`

---

## 🧪 Cómo Probar la Etapa 4

### Pre-requisitos
1. Tener el servidor corriendo: `npm run dev`
2. Tener usuarios seed creados (ya deberías tenerlos de Etapa 2)
3. Tener datos demo creados (ya deberías tenerlos de Etapa 3)

### Paso 1: Ingresar como Técnico
```
Email: tecnico@lospeumos.cl
Password: tecnico123
```

### Paso 2: Navegar al Módulo de Electricidad
1. En el menú lateral, hacer clic en "Electricidad"
2. Deberías ver un grid con todas las parcelas (30 parcelas)
3. Cada tarjeta muestra:
   - Número de parcela
   - Nombre del propietario
   - Última lectura registrada
   - Botón "Ingresar Lectura"

### Paso 3: Generar una Boleta
1. Hacer clic en "Ingresar Lectura" en cualquier parcela
2. Se abre un modal con dos campos:
   - **Lectura Anterior**: Debería autocompletarse con la última lectura
   - **Lectura Actual**: Ingresar un valor mayor (ej: si anterior es 5000, poner 5150)
3. Observa el consumo estimado y total en el recuadro azul
4. Hacer clic en "Generar Boleta"

### Paso 4: Verificar Resultados
1. ✅ **PDF Descargado**: Automáticamente se descarga un PDF con:
   - Header con logo y nombre del condominio
   - Información de la parcela y propietario
   - Detalles de consumo (anterior, actual, consumo)
   - Desglose de cargos (electricidad, cargo fijo, total)
   - Instrucciones de pago y datos bancarios

2. ✅ **Documento en Firestore**: Ir a Firebase Console → Firestore → `bills`
   - Debería aparecer un nuevo documento con:
     - houseId, month, year
     - previousReading, currentReading, consumption
     - rate, electricityCharge, fixedFee, total
     - status: "pending"
     - pdfUrl (URL de Firebase Storage)

3. ✅ **PDF en Storage**: Ir a Firebase Console → Storage → `bills/2025/[mes]/`
   - Debería aparecer el archivo PDF con nombre: `bill-2025-XX-houseId-billId.pdf`

### Paso 5: Probar Validaciones
1. **Lectura menor**: Ingresar lectura actual menor que anterior
   - ❌ Debería mostrar error: "La lectura actual no puede ser menor a la anterior"

2. **Consumo alto**: Ingresar consumo mayor a 500 kWh
   - ⚠️ Debería mostrar advertencia con opción de continuar

3. **Consumo cero**: Ingresar misma lectura anterior y actual
   - ⚠️ Debería mostrar advertencia con opción de continuar

### Paso 6: Verificar Acceso Restringido
1. Cerrar sesión
2. Ingresar como Residente:
   ```
   Email: residente@lospeumos.cl
   Password: residente123
   ```
3. Intentar navegar a `/electricidad`
4. ✅ Debería mostrar mensaje: "Acceso Denegado - Solo administradores y técnicos pueden acceder"

---

## 📧 Configuración de EmailJS (Opcional)

Si deseas probar el envío de emails, necesitas configurar EmailJS:

### 1. Crear Cuenta en EmailJS
1. Ir a https://www.emailjs.com/
2. Crear cuenta gratuita
3. Crear un servicio (Gmail, Outlook, etc.)
4. Crear un template con las siguientes variables:
   - `{{to_email}}` - Email del destinatario
   - `{{to_name}}` - Nombre del destinatario
   - `{{house_number}}` - Número de parcela
   - `{{month}}` - Mes
   - `{{year}}` - Año
   - `{{total}}` - Total formateado
   - `{{pdf_url}}` - URL del PDF
   - `{{due_date}}` - Fecha de vencimiento
   - `{{message}}` - Mensaje completo

### 2. Configurar Variables de Entorno
1. Crear archivo `.env` en la raíz del proyecto (copiar de `.env.example`)
2. Agregar tus credenciales:
   ```env
   VITE_EMAILJS_USER_ID=tu_user_id_real
   VITE_EMAILJS_SERVICE_ID=tu_service_id_real
   VITE_EMAILJS_TEMPLATE_ID=tu_template_id_real
   VITE_ELECTRICITY_RATE=150
   ```
3. **Reiniciar el servidor** para que las variables se carguen: `Ctrl+C` y `npm run dev`

### 3. Probar Envío de Email
1. Repetir los pasos de generar boleta
2. Si EmailJS está configurado, debería aparecer mensaje:
   - "Boleta generada exitosamente... Email enviado."
3. Verificar bandeja de entrada del propietario (email configurado en las parcelas)

---

## 🎯 Checklist de Validación

- [ ] La página /electricidad carga correctamente
- [ ] Solo admin y técnico pueden acceder
- [ ] Se muestran todas las parcelas en el grid
- [ ] El modal se abre al hacer clic en "Ingresar Lectura"
- [ ] Las lecturas se validan correctamente
- [ ] El consumo y total se calculan correctamente
- [ ] El PDF se genera y descarga automáticamente
- [ ] El PDF tiene el formato correcto con todos los datos
- [ ] El documento se crea en Firestore con todos los campos
- [ ] El PDF se sube a Firebase Storage
- [ ] La URL del PDF se guarda en el documento de Firestore
- [ ] (Opcional) El email se envía correctamente si EmailJS está configurado

---

## 🚀 Próximos Pasos

Una vez validada la Etapa 4, podemos continuar con:

**Etapa 5**: Panel del Residente
- Página /mi-cuenta con información personal
- Ver boletas y estado de pagos
- Subir comprobantes de pago
- Gestión de vehículos

---

## 📝 Notas Importantes

### Tarifas Configurables
- **Tarifa eléctrica**: $150/kWh (configurable en .env)
- **Cargo fijo**: $2.000 CLP (configurable en billCalculator.js)
- La fecha de vencimiento se establece automáticamente al día 20 del mes siguiente

### Datos de Pago en el PDF
Los datos bancarios mostrados en el PDF son de ejemplo:
- Banco: Banco Estado
- Tipo de cuenta: Cuenta Corriente
- Número de cuenta: 12345678
- RUT: 76.XXX.XXX-X

**Deberás actualizarlos en `src/services/pdfGenerator.js`** con los datos reales del condominio.

### Emails de Prueba
Las parcelas creadas con el seed demo tienen emails de prueba:
- parcela1@lospeumos.cl, parcela2@lospeumos.cl, etc.

Si quieres probar el envío real de emails, deberás:
1. Configurar EmailJS
2. Actualizar los emails de las parcelas en Firestore con emails reales

---

## ❓ Solución de Problemas

### El PDF no se descarga
- Verificar que no haya bloqueadores de popups
- Revisar la consola del navegador para errores

### Error al subir a Storage
- Verificar que las reglas de Storage permitan escritura
- Reglas recomendadas para desarrollo:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /bills/{allPaths=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

### Error al crear documento en Firestore
- Verificar que las reglas de Firestore permitan escritura en la colección `bills`
- Consultar el archivo `firestore.rules.md` en la raíz del proyecto

### EmailJS no funciona
- Verificar que las variables de entorno estén correctamente configuradas
- Reiniciar el servidor después de editar .env
- Verificar en la consola del navegador si hay errores de EmailJS
- Confirmar que el template en EmailJS tenga todas las variables necesarias
