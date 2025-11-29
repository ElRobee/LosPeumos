# 📊 Boleta Global de Electricidad

## 🎯 Funcionalidad Actualizada

Sistema completo para registrar la boleta global mensual de Chilquinta y calcular automáticamente el saldo a favor de la comunidad.

## 🆕 Nueva Implementación

### Campos del Formulario
1. **N° Boleta** *: Número de la boleta de Chilquinta (ej: 117781738)
2. **Consumo General KW** *: Consumo total en kW del mes (ej: 9905)
3. **Total a Pagar Chilquinta** *: Monto total de la boleta (ej: $2.608.666)
4. **Fecha Vencimiento** *: Fecha límite de pago
5. **Valor KW Real** *: Valor real por kW cobrado por Chilquinta (ej: $263,4)
6. **Valor KW Aplicado** *: Valor por kW que se cobra a los residentes (ej: $291)
7. **Saldo a Favor**: Se calcula automáticamente

### Cálculo Automático del Saldo
```
Saldo a Favor = Total Recaudado (boletas individuales) - Total Chilquinta
```

**Ejemplo Real:**
- Total recaudado de parcelas: $2.724.741
- Total boleta Chilquinta: $2.608.666
- **Saldo a Favor: $116.075** ✅

### Historial de Boletas Globales
Visualización en formato cards mostrando:
- Período (mes y año)
- N° de Boleta
- Consumo total en kW
- Total pagado a Chilquinta
- Valores KW (Real y Aplicado)
- **Saldo a Favor destacado** (verde positivo / rojo negativo)
- Fecha de vencimiento

---

## 📋 Versión Anterior (Referencia)

### Campos del Formulario Original

### 1. **Monto Total de la Boleta Global ($)**
- Campo numérico para ingresar el monto total en pesos
- Ejemplo: `500000` (500 mil pesos)

### 2. **kWh Totales de la Boleta Global**
- Campo numérico para ingresar los kilovatios-hora totales
- Ejemplo: `3500` kWh

### 3. **Valor del kWh ($)** *(Calculado automáticamente)*
- Se calcula como: `Monto Total ÷ kWh Totales`
- Campo de solo lectura (color gris)
- Ejemplo: `500000 ÷ 3500 = $142.86` por kWh

---

## 📊 Panel de Resumen (3 Tarjetas)

Una vez ingresados los datos, se muestra un panel con 3 indicadores:

### 🔵 Tarjeta 1: Total kWh Casas
```
┌────────────────────────┐
│ Total kWh Casas        │
│ 3200.00 kWh           │
└────────────────────────┘
```
- **Color**: Azul
- **Descripción**: Suma de los consumos de todas las parcelas individuales
- **Cálculo**: Σ (Lectura Actual - Lectura Anterior) de cada casa

### 🟡 Tarjeta 2: Diferencia (Global - Casas)
```
┌────────────────────────┐
│ Diferencia             │
│ +300.00 kWh           │
│ Áreas comunes         │
└────────────────────────┘
```
- **Color**: Amarillo si es positivo, Rojo si es negativo
- **Descripción**: Diferencia entre kWh global y suma de casas
- **Cálculo**: `kWh Global - Σ kWh Casas`
- **Interpretación**:
  - **Positivo (+)**: Consumo de áreas comunes, pérdidas en el sistema, o medidores no registrados
  - **Negativo (-)**: ⚠️ Error en las lecturas (la suma de casas excede el total)

### 🟢 Tarjeta 3: Tarifa por kWh
```
┌────────────────────────┐
│ Tarifa por kWh         │
│ $142.86               │
│ Total: $500,000       │
└────────────────────────┘
```
- **Color**: Verde
- **Descripción**: Valor calculado por kWh
- **Muestra**: Tarifa y monto total formateado

---

## 🎨 Interfaz de Usuario

### Estado Colapsado
```
┌───────────────────────────────────────────────────────┐
│ 📄 Boleta Global de Electricidad              ▶      │
│    Configura los datos de la boleta global           │
└───────────────────────────────────────────────────────┘
```

### Estado Expandido
```
┌───────────────────────────────────────────────────────┐
│ 📄 Boleta Global de Electricidad              ▼      │
│    Configura los datos de la boleta global           │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Monto Total  │ │ kWh Totales  │ │ Valor kWh    │ │
│  │ $ 500000     │ │ 3500         │ │ $ 142.86     │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │🔵 Total kWh  │ │🟡 Diferencia │ │🟢 Tarifa     │ │
│  │   Casas      │ │ +300.00 kWh  │ │   por kWh    │ │
│  │ 3200.00 kWh  │ │ Áreas comunes│ │  $142.86     │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## 💡 Casos de Uso

### Caso 1: Distribución Normal
```javascript
Boleta Global:
- Monto Total: $500,000
- kWh Totales: 3,500 kWh
- Tarifa Calculada: $142.86/kWh

Casas Individuales:
- Suma de consumos: 3,200 kWh

Diferencia: +300 kWh
Interpretación: ✅ Consumo de áreas comunes (iluminación, bombas, etc.)
```

### Caso 2: Error en Lecturas
```javascript
Boleta Global:
- Monto Total: $500,000
- kWh Totales: 3,500 kWh
- Tarifa Calculada: $142.86/kWh

Casas Individuales:
- Suma de consumos: 3,800 kWh

Diferencia: -300 kWh
Interpretación: ⚠️ Error - Las lecturas de casas exceden el total global
Acción: Revisar las lecturas individuales
```

### Caso 3: Áreas Comunes Significativas
```javascript
Boleta Global:
- Monto Total: $800,000
- kWh Totales: 5,000 kWh
- Tarifa Calculada: $160.00/kWh

Casas Individuales:
- Suma de consumos: 4,000 kWh

Diferencia: +1,000 kWh (20%)
Interpretación: ⚡ Alto consumo en áreas comunes
Acción: Revisar consumo de áreas comunes, verificar bombas o sistemas 24/7
```

---

## 🔧 Funciones Implementadas

### `handleGlobalBillChange(e)`
```javascript
// Maneja cambios en el formulario de boleta global
// Calcula automáticamente el valor del kWh cuando se ingresan ambos campos

const handleGlobalBillChange = (e) => {
  const { name, value } = e.target;
  const updatedData = {
    ...globalBillData,
    [name]: value
  };
  
  // Cálculo automático
  if (name === 'totalAmount' || name === 'totalKwh') {
    if (updatedData.totalAmount && updatedData.totalKwh) {
      updatedData.kwRate = (
        parseFloat(updatedData.totalAmount) / 
        parseFloat(updatedData.totalKwh)
      ).toFixed(2);
    }
  }
  
  setGlobalBillData(updatedData);
};
```

### `calculateTotalHousesKwh()`
```javascript
// Calcula la suma de consumos de todas las casas
// Basado en: (Lectura Actual - Lectura Anterior)

const calculateTotalHousesKwh = () => {
  return houses.reduce((total, house) => {
    const previousReading = house.meters?.previousReading || 0;
    const currentReading = house.meters?.currentReading || 0;
    const consumption = currentReading - previousReading;
    return total + (consumption > 0 ? consumption : 0);
  }, 0);
};
```

### `getKwhDifference()`
```javascript
// Calcula la diferencia entre kWh global y suma de casas
// Positivo = Áreas comunes / Negativo = Error

const getKwhDifference = () => {
  if (!globalBillData.totalKwh) return 0;
  const housesTotal = calculateTotalHousesKwh();
  return parseFloat(globalBillData.totalKwh) - housesTotal;
};
```

---

## 📊 Estructura de Estado

```javascript
const [globalBillData, setGlobalBillData] = useState({
  totalAmount: '',      // Monto total de la boleta global
  totalKwh: '',         // kWh totales de la boleta global
  kwRate: ''            // Valor por kWh (calculado)
});

const [showGlobalBillForm, setShowGlobalBillForm] = useState(true);
```

---

## 🎯 Beneficios

### Para Administradores
✅ **Visibilidad Total**: Ver el desglose completo de la boleta global  
✅ **Validación Automática**: Detectar errores en lecturas individuales  
✅ **Cálculo Preciso**: Tarifa exacta basada en la boleta real  
✅ **Control de Áreas Comunes**: Identificar consumo no asignado a casas  

### Para el Condominio
✅ **Transparencia**: Residentes ven cómo se calcula la tarifa  
✅ **Precisión**: Distribución basada en costos reales  
✅ **Auditoría**: Fácil verificación de cálculos  
✅ **Trazabilidad**: Registro claro del origen de la tarifa  

---

## 🚀 Próximas Mejoras (Opcional)

### Mejora 1: Guardar Boleta Global en Firestore
```javascript
// Nueva colección: globalBills
{
  month: 10,
  year: 2025,
  totalAmount: 500000,
  totalKwh: 3500,
  kwRate: 142.86,
  housesTotalKwh: 3200,
  difference: 300,
  createdAt: "2025-10-22T...",
  createdBy: "admin-uid"
}
```

### Mejora 2: Historial de Boletas Globales
- Ver boletas globales de meses anteriores
- Comparar tarifas entre meses
- Gráficos de evolución de consumo

### Mejora 3: Distribución Proporcional
- Distribuir la diferencia proporcionalmente entre casas
- Agregar cargo por áreas comunes
- Opciones de prorrateo personalizado

### Mejora 4: Alertas Automáticas
- Alerta si diferencia > 15%
- Notificación si diferencia es negativa
- Sugerencias de revisión

---

## 📝 Notas Técnicas

### Cálculos
```javascript
// Tarifa por kWh
kwRate = totalAmount ÷ totalKwh

// Suma de casas
housesTotal = Σ (currentReading - previousReading)

// Diferencia
difference = totalKwh - housesTotal

// Porcentaje de diferencia
differencePercent = (difference ÷ totalKwh) × 100
```

### Validaciones
- ✅ Campos numéricos solamente
- ✅ Cálculo automático de tarifa
- ✅ Campo de tarifa de solo lectura
- ✅ Indicador visual de diferencia (color)
- ✅ Mensaje descriptivo según el signo

### Accesibilidad
- ✅ Formulario colapsable para ahorrar espacio
- ✅ Colores distintos para cada tipo de información
- ✅ Etiquetas descriptivas
- ✅ Formato de moneda claro

---

## 🎨 Paleta de Colores

| Elemento | Color | Significado |
|----------|-------|-------------|
| Total kWh Casas | Azul (`blue-50`) | Información neutra |
| Diferencia Positiva | Amarillo (`amber-50`) | Advertencia leve |
| Diferencia Negativa | Rojo (`red-50`) | Error/Alerta |
| Tarifa por kWh | Verde (`green-50`) | Información clave |

---

## ✅ Checklist de Implementación

- [x] Estado para boleta global (`globalBillData`)
- [x] Estado para mostrar/ocultar formulario (`showGlobalBillForm`)
- [x] Función `handleGlobalBillChange()` con cálculo automático
- [x] Función `calculateTotalHousesKwh()` para suma de casas
- [x] Función `getKwhDifference()` para diferencia
- [x] UI del formulario con 3 campos
- [x] Panel de resumen con 3 tarjetas
- [x] Colores dinámicos según diferencia
- [x] Formato de moneda en resumen
- [x] Formulario colapsable
- [x] Responsive design (grid adaptativo)
- [x] Dark mode support

---

**¿Necesitas agregar alguna funcionalidad adicional a la boleta global?** 🚀
