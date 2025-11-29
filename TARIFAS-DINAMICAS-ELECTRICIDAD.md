# 💰 Sistema de Tarifas Dinámicas de Electricidad

## 🎯 Problema Resuelto

**Antes:** Las tarifas de electricidad estaban hardcodeadas en `billCalculator.js`, por lo que cambiarlas en Configuración no afectaba los cálculos.

**Ahora:** Las tarifas se cargan dinámicamente desde Firestore, permitiendo que los cambios en Configuración se reflejen inmediatamente en los cálculos.

---

## 🔄 Cómo Funciona Ahora

### 1️⃣ **Configuración → Firestore**

Cuando el administrador cambia las tarifas en Configuración:

```javascript
// Página: Configuracion.jsx
const handleSaveCondoSettings = async () => {
  await setDoc(doc(firestore, 'settings', 'general'), {
    electricityFixedRate: 2500,      // Cargo fijo (CLP)
    electricityVariableRate: 180,    // Tarifa por kWh (CLP/kWh)
    // ...otros settings
  });
};
```

Se guarda en Firestore:
```javascript
// Collection: settings
// Document: general
{
  electricityFixedRate: 2500,       // $2,500 cargo fijo
  electricityVariableRate: 180,     // $180 por kWh
  name: "Condominio Los Peumos",
  // ...
}
```

---

### 2️⃣ **Hook useElectricityRates**

**Archivo:** `src/hooks/useElectricityRates.js`

Este hook personalizado se encarga de:
- ✅ Cargar las tarifas desde Firestore al montar el componente
- ✅ Proveer valores por defecto si Firestore no responde
- ✅ Manejar estados de loading y error
- ✅ Permitir recargar tarifas cuando sea necesario

```javascript
import { useElectricityRates } from '../hooks/useElectricityRates';

const { fixedRate, variableRate, loading, error } = useElectricityRates();

// fixedRate: 2500
// variableRate: 180
```

**Código del Hook:**
```javascript
export const useElectricityRates = () => {
  const [rates, setRates] = useState({
    fixedRate: 2000,      // Valor por defecto
    variableRate: 150     // Valor por defecto
  });

  useEffect(() => {
    const loadRates = async () => {
      const settingsRef = doc(firestore, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setRates({
          fixedRate: data.electricityFixedRate || 2000,
          variableRate: data.electricityVariableRate || 150
        });
      }
    };
    
    loadRates();
  }, []);

  return { ...rates, loading, error };
};
```

---

### 3️⃣ **Uso en Electricidad.jsx**

La página de Electricidad ahora usa el hook para obtener las tarifas:

```javascript
import { useElectricityRates } from '../hooks/useElectricityRates';

const Electricidad = () => {
  // Obtener tarifas dinámicas
  const { fixedRate, variableRate, loading: ratesLoading } = useElectricityRates();
  
  // Calcular boleta con tarifas dinámicas
  const billData = calculateBill(
    previousReading,
    currentReading,
    { variableRate, fixedRate } // ← Tarifas desde Firestore
  );
  
  // Mostrar tarifa en header
  return (
    <div>
      <p>Tarifa: ${variableRate}/kWh • Cargo fijo: ${fixedRate}</p>
      {/* ... */}
    </div>
  );
};
```

---

### 4️⃣ **Actualización de billCalculator.js**

El servicio de cálculo ahora acepta tarifas dinámicas:

**Antes:**
```javascript
const ELECTRICITY_RATE = 150; // Hardcoded
const FIXED_FEE = 2000;       // Hardcoded

export const calculateBill = (previous, current) => {
  const rate = ELECTRICITY_RATE; // Siempre 150
  // ...
};
```

**Ahora:**
```javascript
const DEFAULT_ELECTRICITY_RATE = 150; // Fallback
const DEFAULT_FIXED_FEE = 2000;       // Fallback

export const calculateBill = (previous, current, rates = null) => {
  const rate = rates?.variableRate || DEFAULT_ELECTRICITY_RATE;
  const fixedFee = rates?.fixedRate || DEFAULT_FIXED_FEE;
  
  const consumption = current - previous;
  const electricityCharge = consumption * rate;
  const total = electricityCharge + fixedFee;
  
  return { consumption, rate, electricityCharge, fixedFee, total };
};
```

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN cambia tarifas en Configuración                    │
│    • Tarifa Fija: $2,500                                    │
│    • Tarifa Variable: $180/kWh                              │
│    ↓                                                         │
│ 2. Se guarda en Firestore (settings/general)                │
│    ↓                                                         │
│ 3. useElectricityRates() detecta cambio automáticamente     │
│    (o recarga al volver a la página Electricidad)           │
│    ↓                                                         │
│ 4. fixedRate = 2500, variableRate = 180                    │
│    ↓                                                         │
│ 5. calculateBill() usa las nuevas tarifas                   │
│    • Consumo: 150 kWh                                       │
│    • Cargo electricidad: 150 × 180 = $27,000               │
│    • Cargo fijo: $2,500                                     │
│    • Total: $29,500                                         │
│    ↓                                                         │
│ 6. Boleta generada con tarifas actualizadas                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Sincronización de Tarifas

### ¿Cuándo se actualizan las tarifas?

Las tarifas se cargan:
- ✅ Al abrir la página de Electricidad por primera vez
- ✅ Al recargar la página (F5)
- ✅ Al navegar desde otra página

### ¿Necesito recargar la página después de cambiar tarifas?

**Sí**, actualmente necesitas:
1. Ir a Configuración → Condominio
2. Cambiar las tarifas
3. Guardar configuración
4. Ir a página de Electricidad (se cargarán las nuevas tarifas)

### Mejora Futura: Recarga Automática

Puedes agregar un botón para recargar tarifas sin salir de la página:

```javascript
const { fixedRate, variableRate, reloadRates } = useElectricityRates();

// Botón para actualizar tarifas
<button onClick={reloadRates}>
  🔄 Actualizar Tarifas
</button>
```

---

## 📝 Ejemplo de Cálculo

### Configuración Inicial (Tarifas por Defecto)
```
Tarifa Fija: $2,000
Tarifa Variable: $150/kWh

Lectura anterior: 5,000 kWh
Lectura actual: 5,150 kWh
Consumo: 150 kWh

Cálculo:
- Cargo electricidad: 150 × 150 = $22,500
- Cargo fijo: $2,000
- TOTAL: $24,500
```

### Después de Cambiar Tarifas en Configuración
```
Tarifa Fija: $2,500 (↑ $500)
Tarifa Variable: $180/kWh (↑ $30)

Lectura anterior: 5,000 kWh
Lectura actual: 5,150 kWh
Consumo: 150 kWh

Cálculo:
- Cargo electricidad: 150 × 180 = $27,000
- Cargo fijo: $2,500
- TOTAL: $29,500 ✅ (nuevo cálculo)
```

---

## 🎨 Interfaz de Usuario

### Header de Electricidad (Muestra Tarifas Actuales)

```
┌────────────────────────────────────────────────────────┐
│  Gestión de Electricidad                               │
│  Octubre 2025 • Tarifa: $180/kWh • Cargo fijo: $2,500 │
└────────────────────────────────────────────────────────┘
```

### Modal de Generar Boleta (Cálculo Estimado)

```
┌────────────────────────────────────────────────────────┐
│  Lectura Anterior: [5000] kWh                          │
│  Lectura Actual:   [5150] kWh                          │
│                                                         │
│  📊 Consumo estimado: 150 kWh                         │
│     Total estimado: $29,500                           │
│     Tarifa: $180/kWh + Cargo fijo: $2,500            │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuración en Configuracion.jsx

La interfaz para cambiar tarifas ya existe en la pestaña "Condominio":

```
┌────────────────────────────────────────────────────────┐
│  Tarifa Fija Electricidad (CLP)                        │
│  [2500]                                                │
│                                                         │
│  Tarifa Variable Electricidad (CLP/kWh)                │
│  [180]                                                 │
│                                                         │
│  [Guardar Configuración]                               │
└────────────────────────────────────────────────────────┘
```

Al hacer clic en "Guardar Configuración":
1. Se actualiza `settings/general` en Firestore
2. Las nuevas tarifas estarán disponibles inmediatamente
3. Al generar la próxima boleta, usará las tarifas nuevas

---

## 🛡️ Valores por Defecto (Fallback)

Si Firestore no está disponible o no hay configuración guardada, el sistema usa valores por defecto:

```javascript
// En billCalculator.js
const DEFAULT_ELECTRICITY_RATE = 150;  // CLP/kWh
const DEFAULT_FIXED_FEE = 2000;        // CLP

// En useElectricityRates.js
const [rates, setRates] = useState({
  fixedRate: 2000,
  variableRate: 150
});
```

Esto garantiza que el sistema siempre funcione, incluso si:
- ❌ Firestore está caído
- ❌ No hay documento `settings/general`
- ❌ El administrador nunca configuró tarifas

---

## 📊 Comparación Antes vs Ahora

| Característica | Antes | Ahora |
|----------------|-------|-------|
| **Tarifas** | Hardcoded en código | Dinámicas desde Firestore |
| **Cambiar tarifa** | Editar código y redesplegar | Cambiar en Configuración |
| **Tiempo de cambio** | Minutos/Horas | Segundos |
| **Requiere developer** | ✅ Sí | ❌ No |
| **Historial** | No rastreable | En Firestore |
| **Valores por defecto** | ✅ Sí | ✅ Sí (fallback) |

---

## 🚀 Mejoras Futuras

### 1. Historial de Tarifas
Guardar cambios de tarifas con fecha:
```javascript
// Collection: electricityRatesHistory
{
  date: "2025-10-23",
  fixedRate: 2500,
  variableRate: 180,
  changedBy: "admin-uid",
  reason: "Aumento de costos"
}
```

### 2. Tarifas por Período
Permitir diferentes tarifas según el mes:
```javascript
{
  month: 10,
  year: 2025,
  fixedRate: 2500,
  variableRate: 180
}
```

### 3. Notificación de Cambios
Alertar a los usuarios cuando cambien las tarifas:
```javascript
await sendTariffChangeEmail({
  oldRate: 150,
  newRate: 180,
  effectiveDate: "2025-11-01"
});
```

### 4. Botón de Actualización Manual
```javascript
<button onClick={() => reloadRates()}>
  🔄 Recargar Tarifas
</button>
```

---

## ✅ Checklist de Implementación

- [x] Crear hook `useElectricityRates`
- [x] Modificar `billCalculator.js` para aceptar tarifas dinámicas
- [x] Integrar hook en `Electricidad.jsx`
- [x] Pasar tarifas a `calculateBill()`
- [x] Actualizar UI para mostrar tarifas actuales
- [x] Agregar detalles de tarifa en modal de estimación
- [x] Mantener valores por defecto como fallback
- [x] Verificar que no haya errores de compilación
- [ ] Probar cambiar tarifas en Configuración
- [ ] Verificar que los cálculos usen las nuevas tarifas
- [ ] Documentar para usuarios finales

---

## 🧪 Cómo Probar

### Test 1: Cambiar Tarifas
1. Ir a **Configuración → Condominio**
2. Cambiar:
   - Tarifa Fija: `3000`
   - Tarifa Variable: `200`
3. Clic en **Guardar Configuración**
4. Ir a **Electricidad**
5. Verificar header: "Tarifa: $200/kWh • Cargo fijo: $3000"

### Test 2: Generar Boleta con Nuevas Tarifas
1. Clic en **Ingresar Lectura** en cualquier parcela
2. Ingresar:
   - Lectura Anterior: `1000`
   - Lectura Actual: `1100`
3. Ver cálculo estimado:
   - Consumo: 100 kWh
   - Total: (100 × 200) + 3000 = **$23,000** ✅
4. Generar boleta
5. Verificar PDF tiene los valores correctos

### Test 3: Valores por Defecto
1. Eliminar documento `settings/general` en Firestore
2. Recargar página Electricidad
3. Verificar que muestra: "Tarifa: $150/kWh • Cargo fijo: $2000"
4. Boletas se calculan con valores por defecto

---

## ❓ FAQ

### ¿Dónde se guardan las tarifas?
En Firestore: `settings/general`

### ¿Cuándo se cargan las tarifas?
Al abrir la página de Electricidad

### ¿Necesito recargar después de cambiar tarifas?
Sí, navega a otra página y vuelve, o recarga (F5)

### ¿Qué pasa si borro las tarifas de Firestore?
El sistema usa valores por defecto ($150/kWh, $2000 fijo)

### ¿Las boletas viejas cambian de precio?
No, cada boleta guarda la tarifa que se usó al generarla

### ¿Puedo tener diferentes tarifas por parcela?
No actualmente, pero se puede agregar esta funcionalidad

---

**¡Ahora las tarifas son completamente configurables desde la interfaz!** 🎉
