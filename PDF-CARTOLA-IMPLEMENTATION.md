# Procesamiento de Cartola Bancaria - Sistema Mejorado

## Cambios Implementados

### 1. **Soporte para PDF Protegido**
El sistema ahora puede procesar archivos PDF directamente desde la descarga de Banco Estado sin necesidad de convertir a Excel previamente.

#### Características:
- ✅ Desprotege automáticamente el PDF con contraseña fija (`bancoestado`)
- ✅ Extrae el texto y datos de transacciones del PDF
- ✅ Convierte los datos a formato compatible con el sistema
- ✅ Mantiene el soporte para archivos Excel tradicionales

### 2. **Interfaz Mejorada**
El botón de carga ahora muestra dos opciones:

```
┌─────────────────────────┬─────────────────────────┐
│  📄 Archivo Excel       │  📄 Cartola PDF        │
│  (.xls, .xlsx)          │  (protegido)           │
│  Seleccionar Excel      │  Seleccionar PDF       │
└─────────────────────────┴─────────────────────────┘
```

### 3. **Flujo de Uso**

#### Opción A: Con PDF Protegido (Recomendado)
1. Descarga la cartola bancaria desde Banco Estado (PDF con clave)
2. En la app → Tab "Cartola Bancaria"
3. Click en "Seleccionar PDF"
4. Sube el archivo PDF
5. Click "Procesar Cartola"
6. El sistema:
   - Desprotege automáticamente el PDF
   - Extrae todas las transacciones
   - Las muestra para revisar y hacer matching

#### Opción B: Con Excel (Método Anterior)
1. Abre el PDF
2. Copia/exporta a Excel
3. Sube el archivo Excel como antes

### 4. **Contraseña Fija**
La contraseña está configurada como `bancoestado` en el código:
```javascript
password: 'bancoestado'
```

Si en el futuro la contraseña cambia, solo necesitas actualizar esta línea en `src/pages/Pagos.jsx`.

### 5. **Proceso Interno**

#### Flujo de Procesamiento PDF:
```
PDF Protegido
    ↓
pdfjs-dist (librería NPM)
    ↓
Desproteger con contraseña
    ↓
Extraer texto de todas las páginas
    ↓
Parsear transacciones (fecha, monto, descripción)
    ↓
Convertir a formato sistema
    ↓
Mostrar en preview para matching
```

#### Parseo de Datos:
El sistema busca patrones como:
- Fechas: `DD/MM`
- Montos: `$1.234.567,89` o `1234567.89`
- Descripción: Texto entre fecha y monto

Ejemplo de línea extraída:
```
01/11 TRANSFERENCIA VISTO BUENOS 1.234.567,89
```

Se convierte en:
```json
{
  "date": "01/11",
  "description": "TRANSFERENCIA VISTO BUENOS",
  "amount": 1234567.89,
  "type": "ingreso",
  "reference": ""
}
```

### 6. **Parseo de Montos**
El sistema maneja ambos formatos:

- **Formato Chileno**: `$1.234.567,89`
  - Puntos (.) = separador de miles
  - Coma (,) = decimal
  
- **Formato Internacional**: `1234567.89`
  - Puntos (.) = decimal

Convertidor inteligente que detecta automáticamente.

### 7. **Manejo de Errores**

Si hay problema procesando el PDF:
1. Verifica que el archivo sea un PDF válido
2. Comprueba que no esté corrupto
3. Si falla, convierte manualmente a Excel y usa ese método

Mensaje de error mostrará:
```
"No se pudo procesar el PDF automáticamente. 
Por favor, convierte el PDF a Excel y sube el archivo Excel."
```

### 8. **Transacciones Detectadas**

El sistema extrae automáticamente:
- ✅ Fecha de transacción
- ✅ Descripción/Concepto
- ✅ Monto
- ✅ Tipo (ingreso/egreso)
- ✅ Referencia (si aplica)

### 9. **Librería Utilizada**

**pdfjs-dist** (v4.0.379)
- Estándar de Mozilla para procesar PDFs en JavaScript
- Soporta PDFs protegidos con contraseña
- Extrae texto de manera confiable

### 10. **Próximas Mejoras Opcionales**

- [ ] Agregar OCR para PDFs escaneados
- [ ] Exportar transacciones extraídas a Excel
- [ ] Guardar histórico de cartolas procesadas
- [ ] Detección automática de cuenta bancaria
- [ ] Validación de duplicados entre cartolas

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/Pagos.jsx` | Agregada función `handleParsePDF()` y soporte dual Excel/PDF |
| `src/services/pdfParser.js` | Nuevo archivo con funciones de parseo PDF |
| `package.json` | Agregada dependencia `pdfjs-dist@4.0.379` |
| UI Cartola Bancaria | Interfaz mejorada con dos opciones de carga |

---

## Datos de Referencia

### Contraseña de Banco Estado
```
Contraseña Fija: bancoestado
Ubicación: src/pages/Pagos.jsx, línea ~165
```

### Formato de Salida
Después del procesamiento, las transacciones se formatean como:
```javascript
{
  id: "trans_1732814400000_0",
  date: "01/11",
  description: "NOMBRE DE LA TRANSACCION",
  amount: 1234567.89,
  type: "ingreso", // o "egreso"
  reference: "",
  raw: "$1.234.567,89",
  matched: false
}
```
