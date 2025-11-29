# INSTRUCCIONES PARA AGREGAR LOGO AL CERTIFICADO

---

## 📋 Resumen

El certificado ha sido actualizado para coincidir con el formato oficial de "Comunidad Los Peumos". Solo falta agregar el logo naranja que aparece en la parte superior.

---

## 🎨 Logo Actual

El logo de Los Peumos es de color **naranja** con forma de **árbol estilizado** y el texto "LOS PEUMOS" debajo.

---

## 🔧 Pasos para Agregar el Logo

### Opción 1: Convertir Imagen a Base64 (Recomendado)

1. **Tener el logo en formato PNG o JPG**
   - Tamaño recomendado: 200x200 píxeles
   - Fondo transparente (PNG)

2. **Convertir a Base64**:
   - Ir a: https://www.base64-image.de/
   - Subir la imagen del logo
   - Copiar el código base64 completo (debe empezar con `data:image/png;base64,`)

3. **Actualizar el archivo**:
   - Abrir: `src/services/certificateGenerator.js`
   - Buscar la línea 11:
     ```javascript
     const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KG...';
     ```
   - Reemplazar con el base64 del logo real

### Opción 2: Guardar Logo en Public Folder

1. **Guardar logo**:
   - Copiar el archivo del logo a: `public/logo-lospeumos.png`

2. **Actualizar el código**:
   ```javascript
   // En certificateGenerator.js, línea ~50
   const logoPath = '/logo-lospeumos.png';
   doc.addImage(logoPath, 'PNG', centerX - 20, 15, 40, 40);
   ```

---

## 📐 Configuración Actual del Logo

El logo está configurado para:
- **Posición**: Centrado horizontalmente
- **Ubicación vertical**: 15mm desde el borde superior
- **Tamaño**: 40mm x 40mm
- **Formato**: PNG con transparencia

```javascript
// Línea ~51 en certificateGenerator.js
doc.addImage(LOGO_BASE64, 'PNG', centerX - 20, 15, 40, 40);
```

---

## ✅ Formato del Certificado Actualizado

El certificado ahora incluye:

### Elementos en **ROJO** y **Negrita-Cursiva**:
1. ✅ RUT del presidente: `15.766.257-0`
2. ✅ Nombre de la comunidad: `"COMUNIDAD LOS PEUMOS"`
3. ✅ RUT de la comunidad: `65.104.927-K`
4. ✅ Nombre del residente (ej: `Eduardo Rodrigo Matute González`)
5. ✅ RUT del residente (ej: `15.765.421-7`)
6. ✅ Número de parcela (ej: `29`)

### Estructura:
```
┌─────────────────────────────────────┐
│        [LOGO NARANJA]               │
│                                     │
│   CERTIFICADO DE RESIDENCIA         │
│                                     │
│ Guillermo Salgado Jerez, CI N° ... │
│ en calidad de Presidente de...     │
│                                     │
│          CERTIFICA                  │
│                                     │
│ Que: [NOMBRE EN ROJO] ...          │
│ N° [RUT EN ROJO] registra su...    │
│ En AV. Los Peumos, Parcela #[NUM]  │
│                                     │
│ Se extiende el presente...         │
│                                     │
│ P.P. COMITÉ DE ADELANTO LOS PEUMOS │
│    GUILLERMO SALGADO JEREZ         │
│         PRESIDENTE                  │
└─────────────────────────────────────┘
```

---

## 🧪 Cómo Probar

1. Ir a la página **Certificados**
2. Click en **"Generar Certificado"**
3. Completar:
   - Casa: Seleccionar una parcela
   - Nombre: (ej: Eduardo Rodrigo Matute González)
   - RUT: (ej: 15765421-7)
   - Propósito: (opcional)
4. Click en **"Generar"**
5. Se descargará automáticamente el PDF

---

## 📝 Datos Fijos del Certificado

Estos datos están hardcodeados en el generador:

- **Presidente**: Guillermo Salgado Jerez
- **RUT Presidente**: 65.104.927-K
- **Comunidad**: "COMUNIDAD LOS PEUMOS"
- **RUT Comunidad**: 65.104.927-K
- **Ubicación**: sector Fuerte Aguayo, Concón, Región de Valparaíso
- **Dirección**: AV. Los Peumos

---

## 🎨 Ejemplo de Base64 del Logo

Si tienes el logo en formato de imagen, el base64 se verá así:

```javascript
const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADI...';
// (muy largo, puede tener miles de caracteres)
```

---

## 🔍 Ubicación del Archivo

**Archivo a modificar**: 
```
src/services/certificateGenerator.js
```

**Línea a cambiar**: 
```
Línea 11: const LOGO_BASE64 = '...';
```

---

## ⚠️ Importante

- El logo debe ser de **alta calidad** para verse bien en el PDF
- Formato recomendado: **PNG con fondo transparente**
- Tamaño recomendado: **200x200 a 500x500 píxeles**
- El base64 puede ser muy largo (10,000+ caracteres) - es normal

---

## 🆘 Si hay problemas

Si el logo no aparece:
1. Verificar que el base64 comience con `data:image/png;base64,`
2. Verificar que no haya espacios o saltos de línea en el string
3. Probar con un logo más pequeño (< 100KB)
4. Revisar la consola del navegador por errores

---

## 📞 Próximos Pasos

Una vez agregado el logo:
1. ✅ Certificado completo y funcional
2. ✅ Listo para aplicar reglas de Firestore (APLICAR-REGLAS-FIRESTORE-ETAPAS-10-11.md)
3. ✅ Probar generación de certificados
4. ➡️ Continuar con Etapa 12 (Testing & Deploy)
