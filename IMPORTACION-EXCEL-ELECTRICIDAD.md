# 📥 Importación de Lecturas desde Excel

## Funcionalidad Implementada

Sistema completo para importar lecturas masivas de electricidad desde archivos Excel, extrayendo automáticamente:
- Datos de la boleta global (N°, consumo, total, fechas, tarifas)
- Lecturas individuales por parcela (anterior, actual, consumo)

## 🎯 Características

### Detección Automática de Formato
El parser es flexible y detecta automáticamente:
- **Boleta Global**: Busca en las primeras 15 filas datos como "N° Boleta", "Consumo General", "Total Chilquinta", etc.
- **Encabezados**: Identifica columnas por palabras clave (parcela, casa, anterior, actual, consumo)
- **Datos de Parcelas**: Extrae número de parcela y lecturas de forma inteligente

### Validaciones Incluidas
- ✅ Verifica que las parcelas existan en el sistema
- ✅ Valida que lectura actual > lectura anterior
- ✅ Detecta consumos negativos
- ✅ Identifica lecturas faltantes
- ✅ Reporta errores por parcela

### Pre-llenado de Boleta Global
Si el Excel contiene datos de la boleta global, el formulario se llena automáticamente con:
- N° Boleta
- Consumo General KW
- Total a Pagar Chilquinta
- Fecha Vencimiento
- Valor KW Real
- Valor KW Aplicado

## 📋 Formato del Excel

### Estructura Recomendada

```
Fila 1-10: BOLETA GLOBAL (opcional)
--------------------------------
N° Boleta              | 117781738
Consumo General KW     | 9905
Total a Pagar Chilquinta | $2.608.666
Fecha Vencimiento      | 22-sept
Valor KW Real          | $263,4
Valor KW              | $291

Fila 15+: LECTURAS POR PARCELA
--------------------------------
Parcela | Lectura Anterior | Lectura Actual | Consumo
--------|------------------|----------------|--------
1       | 15234           | 15458          | 224
2       | 28945           | 29176          | 231
6A      | 12500           | 12680          | 180
...
```

### Columnas Detectadas Automáticamente

El sistema busca estas palabras clave (case-insensitive):

**Para Parcela:**
- "parcela", "casa", "house", "número"

**Para Lectura Anterior:**
- "anterior", "previa", "inicial"

**Para Lectura Actual:**
- "actual", "final", "nueva"

**Para Consumo:**
- "consumo", "diferencia", "kwh"

## 🚀 Cómo Usar

### Paso 1: Preparar Excel
1. Abre tu archivo de lecturas del mes
2. Asegúrate que tenga una fila de encabezados clara
3. Verifica que los números de parcela coincidan con el sistema

### Paso 2: Importar
1. Ve a **Electricidad**
2. Click en **"Importar Excel"** (botón superior derecho)
3. Selecciona tu archivo `.xlsx` o `.xls`
4. Espera el análisis automático

### Paso 3: Revisar
El sistema mostrará:
- ✅ **Lecturas encontradas**: Cantidad de parcelas detectadas
- 📊 **Consumo total**: Suma de todos los consumos
- ⚠️ **Errores**: Lista de advertencias o problemas
- 📄 **Boleta global**: Datos extraídos (si están)
- 📋 **Tabla de lecturas**: Previsualización de todas las lecturas

### Paso 4: Confirmar
1. Revisa la tabla de lecturas
2. Verifica que los datos sean correctos
3. Click en **"Generar X Boletas"**
4. El sistema:
   - Calcula cada boleta individualmente
   - Guarda en Firestore
   - Actualiza medidores
   - Reporta éxito/errores

## 📊 Ejemplo Real

### Tu Archivo: `boletas Octubre 11.xlsx`

El parser extraerá automáticamente:

**Boleta Global:**
```javascript
{
  billNumber: "117781738",
  totalConsumption: 9905,
  totalAmount: 2608666,
  dueDate: "2024-09-22",
  realKwRate: 263.4,
  appliedKwRate: 291
}
```

**Lecturas por Parcela:**
```javascript
[
  { houseNumber: 1, previousReading: 15234, currentReading: 15458, consumption: 224 },
  { houseNumber: 2, previousReading: 28945, currentReading: 29176, consumption: 231 },
  { houseNumber: 6, previousReading: 12500, currentReading: 12680, consumption: 180 },
  // ... hasta 126 parcelas
]
```

## ⚠️ Manejo de Errores

### Errores Comunes

1. **"Parcela X no encontrada"**
   - La parcela no existe en el sistema
   - Verifica el número en el Excel
   - Genera la parcela primero si falta

2. **"Consumo negativo"**
   - Lectura actual < lectura anterior
   - Verifica los datos en el Excel
   - Puede ser error de digitación

3. **"No se encontró fila de encabezados"**
   - Excel sin encabezados claros
   - Agrega una fila con: Parcela | Anterior | Actual

4. **"No tiene lecturas válidas"**
   - Ambas lecturas están vacías
   - Completa los datos en el Excel

### El Sistema Continúa
- Las parcelas con errores se saltan
- Las válidas se procesan normalmente
- Al final muestra: `X boletas generadas, Y errores`

## 🎨 UI/UX

### Modal de Importación
- **Drag & drop** (click para seleccionar)
- **Instrucciones** claras del formato esperado
- **Preview** de datos antes de confirmar
- **Resumen** visual con estadísticas
- **Tabla scrolleable** para revisar todas las lecturas
- **Colores** para indicar éxito/advertencias

### Feedback Visual
- 🟢 Verde: Lecturas encontradas exitosamente
- 🔵 Azul: Información (consumo total)
- 🔴 Rojo: Errores o advertencias
- ⏳ Loading: Durante procesamiento

## 🔧 Técnico

### Parser Inteligente
```javascript
parseElectricityExcel(file) → {
  readings: Array,           // Lecturas por parcela
  errors: Array,             // Advertencias
  globalBillData: Object,    // Boleta global (opcional)
  summary: {
    totalReadings: number,
    totalErrors: number,
    totalConsumption: number
  }
}
```

### Funciones de Parsing
- `extractHouseNumber()`: Detecta número de parcela (incluso "6A" → 6)
- `parseNumber()`: Maneja separadores de miles y decimales
- `parseAmount()`: Formato chileno ($2.608.666)
- `parseDate()`: Múltiples formatos (DD-MM-YYYY, "22-sept", etc.)

### Validación en Cascade
1. Parser extrae datos
2. UI muestra preview
3. Usuario confirma
4. Validación por parcela:
   - Existe en sistema
   - Lecturas válidas
   - Cálculo correcto
5. Guardado individual con try/catch
6. Reporte final de éxito/errores

## 📈 Beneficios

1. **Velocidad**: Importar 126 parcelas en segundos vs horas manual
2. **Precisión**: Sin errores de digitación
3. **Trazabilidad**: Logs de lo que se importó
4. **Flexibilidad**: Acepta diferentes formatos de Excel
5. **Seguridad**: Validaciones múltiples antes de guardar
6. **UX**: Preview completo antes de confirmar
7. **Recuperación**: Si falla una parcela, las demás continúan

## 🔮 Próximas Mejoras

- [ ] Exportar template de Excel vacío
- [ ] Importar desde CSV
- [ ] Edición inline de lecturas en preview
- [ ] Comparación con mes anterior
- [ ] Detección de anomalías (consumo muy alto/bajo)
- [ ] Guardado de múltiples meses a la vez

## 📞 Prueba

1. Sube tu archivo `boletas Octubre 11.xlsx`
2. Click en "Importar Excel"
3. Revisa los datos extraídos
4. Si hay errores, repórtalos para ajustar el parser
5. Una vez correcto, confirma la importación
6. ¡126 boletas generadas automáticamente! 🎉
