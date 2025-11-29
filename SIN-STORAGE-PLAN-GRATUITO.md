# 🆓 Adaptación para Plan Spark Gratuito (Sin Firebase Storage)

## ⚠️ Problema Original

Firebase Storage **NO está disponible** en el plan Spark (gratuito). Para usarlo necesitarías actualizar al plan Blaze (de pago).

## ✅ Solución Implementada

Hemos modificado la aplicación para **NO usar Firebase Storage**. En su lugar, los archivos (PDFs, imágenes) se guardan como **strings base64** directamente en Firestore.

---

## 📝 Cambios Realizados

### 1. **src/services/firebase.js**
- ❌ Eliminada importación de `getStorage`
- ❌ Eliminada exportación de `storage`
- ✅ Solo usamos `auth` y `firestore`

### 2. **src/services/storageService.js**
- ❌ Eliminadas funciones que usan Firebase Storage
- ✅ Nueva función `blobToBase64()` - Convierte archivos a base64
- ✅ `uploadBillPDF()` ahora retorna string base64
- ✅ `uploadPaymentProof()` ahora retorna string base64
- ✅ `uploadCertificateTemplate()` ahora retorna string base64

### 3. **src/pages/Electricidad.jsx**
- Campo `pdfUrl` → `pdfData` (guarda base64)
- El PDF se genera y se convierte a base64
- Se guarda directamente en Firestore

### 4. **src/components/BillsList.jsx**
- `handleDownloadPDF()` ahora maneja PDFs en base64
- Convierte base64 → Blob → URL temporal
- Abre el PDF en nueva ventana

### 5. **src/components/UploadPaymentProof.jsx**
- Campo `proofUrl` → `proofData` (guarda base64)
- Los comprobantes se guardan como base64 en Firestore
- Campos adicionales: `fileName`, `fileType`

---

## 🗄️ Estructura de Datos en Firestore

### Collection `bills`:
```javascript
{
  // ... otros campos
  pdfData: "data:application/pdf;base64,JVBERi0xLjMKJc...", // PDF completo en base64
  // pdfUrl ya NO se usa
}
```

### Collection `payments`:
```javascript
{
  // ... otros campos
  proofData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...", // Imagen/PDF en base64
  fileName: "comprobante.jpg",
  fileType: "image/jpeg",
  // proofUrl ya NO se usa
}
```

---

## ⚖️ Ventajas y Limitaciones

### ✅ Ventajas:
- **100% Gratuito** - Plan Spark es suficiente
- **Sin configuración adicional** - No necesitas activar Storage
- **Funcionamiento simple** - Todo en Firestore
- **Misma experiencia de usuario** - Los PDFs se descargan igual

### ⚠️ Limitaciones:
- **Tamaño de documento**: Firestore tiene límite de 1MB por documento
  - Un PDF típico de boleta: ~50-100KB ✅
  - Una imagen de comprobante: ~200-500KB ✅
  - Si tienes archivos muy grandes (>1MB), fallarán
- **Costos de lectura**: Cada vez que lees un documento, descargas TODO el base64
  - En plan Spark: 50,000 lecturas/día gratuitas
  - Deberías estar bien para un condominio pequeño
- **Búsqueda**: No puedes buscar dentro de los PDFs (no es un problema usual)

---

## 🚀 Aplicar las Reglas de Firestore

Ya no necesitas reglas de Storage, pero **SÍ necesitas** aplicar las reglas de Firestore:

1. Ve a Firebase Console: https://console.firebase.google.com/
2. Selecciona tu proyecto: `lospeumos-e0261`
3. Ve a **Firestore Database** → **Reglas**
4. Copia y pega el contenido del archivo `firestore.rules`
5. Click en **Publicar**

---

## 🧪 Probar la Funcionalidad

### Etapa 4: Generar Boletas
1. Ingresar como técnico: `tecnico@lospeumos.cl / tecnico123`
2. Ir a "Electricidad"
3. Generar una boleta
4. ✅ El PDF se guarda como base64 en Firestore
5. ✅ El PDF se puede descargar y ver correctamente

### Etapa 5: Subir Comprobantes
1. Ingresar como residente: `residente@lospeumos.cl / residente123`
2. Ir a "Mi Cuenta" → Tab "Boletas"
3. Click en "Subir Comprobante"
4. Seleccionar imagen (JPG, PNG) o PDF
5. ✅ El archivo se guarda como base64 en Firestore
6. ✅ Se puede visualizar/descargar después

---

## 📊 Verificar en Firebase Console

### Firestore → `bills`:
```javascript
{
  houseId: "house1",
  month: 10,
  year: 2024,
  total: 24500,
  pdfData: "data:application/pdf;base64,JVBERi0xLjMKJ...", // ← String largo base64
  status: "pending",
  // ... otros campos
}
```

### Firestore → `payments`:
```javascript
{
  billId: "bill123",
  userId: "user456",
  amount: 24500,
  proofData: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // ← String largo base64
  fileName: "comprobante_pago.jpg",
  fileType: "image/jpeg",
  validated: false,
  // ... otros campos
}
```

---

## ⚠️ Si Necesitas Usar Storage en el Futuro

Si en el futuro decides actualizar al plan Blaze y quieres usar Storage:

1. **Actualizar plan** en Firebase Console
2. **Revertir cambios**:
   - Restaurar `storage` en `firebase.js`
   - Usar las funciones originales de `storageService.js`
   - Cambiar `pdfData` → `pdfUrl`
   - Cambiar `proofData` → `proofUrl`

Pero por ahora, con el plan gratuito, **esta solución funciona perfectamente** para un condominio pequeño/mediano. 🎉

---

## 📌 Resumen

| Antes (Con Storage) | Ahora (Sin Storage) |
|---------------------|---------------------|
| Necesita plan Blaze | Funciona con plan Spark ✅ |
| Archivos en Storage | Archivos en Firestore como base64 |
| `pdfUrl` | `pdfData` |
| `proofUrl` | `proofData` |
| Límite: 5GB | Límite: 1MB por documento |
| Costo: Variable | Costo: $0 (hasta límites gratuitos) |

**Todo funcionando con plan 100% gratuito!** 🆓🎉
