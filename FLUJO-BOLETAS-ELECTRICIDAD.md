# 📊 Sistema de Boletas de Electricidad - Flujo Completo

## 🎯 Visión General

El sistema de boletas de electricidad permite a los técnicos y administradores generar boletas para cada parcela, y a los residentes visualizar y pagar sus boletas.

---

## 🔄 Flujo Completo de Carga de Información

### 1️⃣ **Carga Inicial de Parcelas (Houses)**

**Archivo:** `src/pages/Electricidad.jsx`

```javascript
const loadHouses = async () => {
  try {
    setLoading(true);
    
    // 1. Obtener referencia a la colección 'houses' en Firestore
    const housesRef = collection(firestore, 'houses');
    
    // 2. Ejecutar query para obtener TODAS las parcelas
    const housesSnapshot = await getDocs(housesRef);
    
    // 3. Mapear documentos a objetos JavaScript
    const housesData = housesSnapshot.docs.map(doc => ({
      id: doc.id,              // ID del documento
      ...doc.data()            // Todos los campos de la casa
    }));
    
    // 4. Ordenar por número de parcela
    housesData.sort((a, b) => 
      parseInt(a.houseNumber) - parseInt(b.houseNumber)
    );
    
    // 5. Guardar en estado local
    setHouses(housesData);
    
  } catch (error) {
    console.error('Error al cargar parcelas:', error);
    setError('Error al cargar las parcelas');
  } finally {
    setLoading(false);
  }
};
```

**¿Qué se obtiene?**
```javascript
// Estructura de cada casa (house)
{
  id: "house1",                    // ID Firestore
  houseId: "house1",              // ID de la casa
  houseNumber: "1",               // Número visible
  ownerName: "Juan Pérez",        // Propietario
  ownerEmail: "juan@example.com", // Email (opcional)
  ownerUid: "abc123",             // UID del usuario (opcional)
  phone: "+56912345678",
  address: "Parcela 1",
  meters: {
    previousReading: 5000,        // Lectura anterior
    currentReading: 5150,         // Lectura actual
    lastReadingDate: "2025-10-15"
  },
  active: true,
  createdAt: "2025-01-15T..."
}
```

---

### 2️⃣ **Generación de Boleta (Admin/Técnico)**

#### A) **Abrir Modal de Generación**

```javascript
const handleOpenModal = (house) => {
  setSelectedHouse(house);
  
  // Pre-llenar con lectura anterior
  setFormData({
    previousReading: house.meters?.currentReading || 
                     house.meters?.previousReading || '',
    currentReading: ''
  });
  
  setShowModal(true);
};
```

#### B) **Calcular Boleta**

**Archivo:** `src/services/billCalculator.js`

```javascript
export const calculateBill = (previousReading, currentReading) => {
  // 1. Calcular consumo
  const consumption = currentReading - previousReading;
  
  // 2. Obtener tarifa actual (CLP por kWh)
  const rate = getCurrentRate(); // Ej: 150 CLP/kWh
  
  // 3. Calcular cargo por consumo
  const electricityCharge = consumption * rate;
  
  // 4. Agregar cargo fijo
  const fixedFee = getFixedFee(); // Ej: 2000 CLP
  
  // 5. Calcular total
  const total = electricityCharge + fixedFee;
  
  return {
    consumption,           // 150 kWh
    rate,                 // 150 CLP/kWh
    electricityCharge,    // 22,500 CLP
    fixedFee,            // 2,000 CLP
    total                // 24,500 CLP
  };
};
```

#### C) **Crear Documento en Firestore**

```javascript
const handleGenerateBill = async () => {
  // 1. Validar lecturas
  const validation = validateReadings(previousReading, currentReading);
  
  // 2. Calcular boleta
  const billData = calculateBill(previousReading, currentReading);
  
  // 3. Generar PDF
  const pdfDoc = await generateBillPDF(house, billData);
  const pdfBlob = await pdfToBlob(pdfDoc);
  const pdfBase64 = await blobToBase64(pdfBlob);
  
  // 4. Crear documento en Firestore
  const { month, year } = getCurrentMonthYear();
  const billRef = await addDoc(collection(firestore, 'bills'), {
    houseId: house.id,
    month,
    year,
    previousReading,
    currentReading,
    consumption: billData.consumption,
    rate: billData.rate,
    electricityCharge: billData.electricityCharge,
    fixedFee: billData.fixedFee,
    total: billData.total,
    status: 'pending',
    pdfData: pdfBase64,        // PDF en base64
    createdAt: new Date().toISOString(),
    dueDate: generateDueDate(), // 20 días después
    createdBy: userData.uid
  });
  
  // 5. Actualizar lecturas de la casa
  await updateDoc(doc(firestore, 'houses', house.id), {
    'meters.previousReading': previousReading,
    'meters.currentReading': currentReading,
    'meters.lastReadingDate': new Date().toISOString()
  });
  
  // 6. Enviar email (opcional)
  if (house.ownerEmail) {
    await sendNewBillEmail(house.ownerEmail, billData);
  }
};
```

**Resultado en Firestore:**
```javascript
// Collection: bills
// Document ID: auto-generado
{
  houseId: "house1",
  month: 10,
  year: 2025,
  previousReading: 5000,
  currentReading: 5150,
  consumption: 150,              // kWh
  rate: 150,                     // CLP/kWh
  electricityCharge: 22500,      // CLP
  fixedFee: 2000,               // CLP
  total: 24500,                 // CLP
  status: "pending",
  pdfData: "data:application/pdf;base64,JVBERi0...", // PDF completo
  createdAt: "2025-10-22T20:00:00.000Z",
  dueDate: "2025-11-11T23:59:59.999Z",
  createdBy: "admin-uid-123",
  paidAt: null                   // Se llena cuando se paga
}
```

---

### 3️⃣ **Visualización de Boletas (Residente)**

#### A) **En Mi Cuenta - Hook useResidentData**

**Archivo:** `src/hooks/useResidentData.js`

```javascript
const loadData = async () => {
  if (!userId || !houseId) return;
  
  try {
    // 1. Cargar boletas de la parcela del residente
    const billsRef = collection(firestore, 'bills');
    const billsQuery = query(
      billsRef,
      where('houseId', '==', houseId)  // Solo sus boletas
    );
    
    // 2. Ejecutar query
    const billsSnap = await getDocs(billsQuery);
    
    // 3. Mapear y ordenar en el cliente
    const billsData = billsSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        // Ordenar por fecha descendente
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    
    // 4. Calcular estadísticas
    const stats = {
      totalBills: billsData.length,
      pendingBills: billsData.filter(b => b.status === 'pending').length,
      paidBills: billsData.filter(b => b.status === 'paid').length,
      overdueBills: billsData.filter(b => {
        if (b.status !== 'pending') return false;
        const dueDate = new Date(b.dueDate);
        return dueDate < new Date();
      }).length,
      totalPending: billsData
        .filter(b => b.status === 'pending')
        .reduce((sum, b) => sum + b.total, 0),
      totalPaid: billsData
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.total, 0)
    };
    
    // 5. Guardar en estado
    setData({
      bills: billsData,
      stats
    });
  } catch (err) {
    console.error('Error al cargar boletas:', err);
  }
};
```

#### B) **Componente BillsList**

**Archivo:** `src/components/BillsList.jsx`

```javascript
const BillsList = ({ bills, onUploadProof }) => {
  // 1. Estado de filtros
  const [filter, setFilter] = useState('all');
  
  // 2. Determinar estado de cada boleta
  const getBillStatus = (bill) => {
    if (bill.status === 'paid') return 'paid';
    
    if (bill.status === 'pending') {
      const dueDate = new Date(bill.dueDate);
      const now = new Date();
      
      if (dueDate < now) return 'overdue'; // Vencida
      return 'pending';                    // Pendiente
    }
    
    return 'pending';
  };
  
  // 3. Filtrar boletas según estado seleccionado
  const filteredBills = bills.filter(bill => {
    const status = getBillStatus(bill);
    if (filter === 'all') return true;
    return status === filter;
  });
  
  // 4. Renderizar lista
  return (
    <div>
      {/* Filtros: All, Pending, Paid, Overdue */}
      <div className="filters">
        <button onClick={() => setFilter('all')}>Todas</button>
        <button onClick={() => setFilter('pending')}>Pendientes</button>
        <button onClick={() => setFilter('paid')}>Pagadas</button>
        <button onClick={() => setFilter('overdue')}>Vencidas</button>
      </div>
      
      {/* Lista de boletas */}
      {filteredBills.map(bill => (
        <BillCard 
          key={bill.id}
          bill={bill}
          status={getBillStatus(bill)}
          onDownload={() => handleDownloadPDF(bill)}
          onUploadProof={() => onUploadProof(bill)}
        />
      ))}
    </div>
  );
};
```

---

### 4️⃣ **Descarga de PDF**

```javascript
const handleDownloadPDF = (bill) => {
  // El PDF está guardado como base64 en bill.pdfData
  
  // 1. Decodificar base64
  const base64Data = bill.pdfData.split(',')[1];
  const byteCharacters = atob(base64Data);
  
  // 2. Convertir a Uint8Array
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  // 3. Crear Blob
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  
  // 4. Crear URL temporal
  const url = URL.createObjectURL(blob);
  
  // 5. Abrir en nueva pestaña
  window.open(url, '_blank');
};
```

---

## 📊 Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FIRESTORE DATABASE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Collection: houses                                          │
│  ├─ house1                                                   │
│  │  ├─ houseNumber: "1"                                     │
│  │  ├─ ownerName: "Juan Pérez"                             │
│  │  └─ meters: { previousReading, currentReading }         │
│  └─ house2...                                               │
│                                                               │
│  Collection: bills                                           │
│  ├─ bill-abc123                                             │
│  │  ├─ houseId: "house1"     ← RELACIÓN                    │
│  │  ├─ month: 10                                            │
│  │  ├─ year: 2025                                           │
│  │  ├─ consumption: 150                                     │
│  │  ├─ total: 24500                                         │
│  │  ├─ status: "pending"                                    │
│  │  └─ pdfData: "base64..."                                │
│  └─ bill-xyz789...                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. ADMIN/TÉCNICO → Electricidad.jsx                        │
│     ├─ loadHouses()                                         │
│     │  └─ getDocs(houses) → Lista de parcelas              │
│     └─ handleGenerateBill()                                 │
│        ├─ calculateBill()                                   │
│        ├─ generateBillPDF()                                 │
│        └─ addDoc(bills) → Crear boleta                     │
│                                                               │
│  2. RESIDENTE → MiCuenta.jsx + useResidentData              │
│     ├─ query(bills, where houseId == user.houseId)         │
│     └─ BillsList component                                  │
│        ├─ Filtrar por estado                               │
│        ├─ Descargar PDF                                     │
│        └─ Subir comprobante                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Queries Firestore Utilizadas

### Query 1: Obtener todas las casas (Admin)
```javascript
const housesRef = collection(firestore, 'houses');
const housesSnapshot = await getDocs(housesRef);
```

### Query 2: Obtener boletas de una casa (Residente)
```javascript
const billsQuery = query(
  collection(firestore, 'bills'),
  where('houseId', '==', 'house1')
);
const billsSnapshot = await getDocs(billsQuery);
```

### Query 3: Crear nueva boleta (Admin)
```javascript
await addDoc(collection(firestore, 'bills'), {
  houseId: 'house1',
  month: 10,
  year: 2025,
  total: 24500,
  status: 'pending',
  pdfData: 'base64...',
  // ...más campos
});
```

---

## 📱 Interfaces de Usuario

### Para Admin/Técnico (Electricidad.jsx)
```
┌──────────────────────────────────────┐
│  Generar Boletas de Electricidad     │
├──────────────────────────────────────┤
│  🏠 Parcela 1 - Juan Pérez           │
│     [Generar Boleta]                 │
│                                       │
│  🏠 Parcela 2 - María López          │
│     [Generar Boleta]                 │
│                                       │
│  🏠 Parcela 3 - Pedro González       │
│     [Generar Boleta]                 │
└──────────────────────────────────────┘

Modal al hacer clic:
┌──────────────────────────────────────┐
│  Generar Boleta - Parcela 1          │
├──────────────────────────────────────┤
│  Lectura Anterior: [5000] kWh        │
│  Lectura Actual:   [5150] kWh        │
│                                       │
│  Consumo: 150 kWh                    │
│  Tarifa: $150/kWh                    │
│  Cargo Electricidad: $22,500         │
│  Cargo Fijo: $2,000                  │
│  ────────────────────                │
│  TOTAL: $24,500                      │
│                                       │
│  [Cancelar]  [Generar Boleta]        │
└──────────────────────────────────────┘
```

### Para Residente (MiCuenta.jsx)
```
┌──────────────────────────────────────┐
│  Mis Boletas de Electricidad         │
├──────────────────────────────────────┤
│  [Todas] [Pendientes] [Pagadas]      │
│                                       │
│  📄 Octubre 2025                     │
│      Consumo: 150 kWh                │
│      Total: $24,500                  │
│      Estado: 🟡 Pendiente            │
│      [📥 Descargar] [📤 Pagar]       │
│                                       │
│  📄 Septiembre 2025                  │
│      Total: $23,000                  │
│      Estado: ✅ Pagada               │
│      [📥 Descargar]                  │
└──────────────────────────────────────┘
```

---

## ⚡ Optimizaciones Aplicadas

### 1. Ordenamiento en Cliente
```javascript
// ❌ Antes (requiere índice Firestore)
const query = query(billsRef, 
  where('houseId', '==', houseId),
  orderBy('createdAt', 'desc')  // ← Necesita índice
);

// ✅ Ahora (sin índices)
const billsData = billsSnap.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
```

### 2. PDF como Base64
```javascript
// PDF guardado en Firestore como base64
{
  pdfData: "data:application/pdf;base64,JVBERi0xLjQK..."
}

// No necesita Firebase Storage
// Acceso instantáneo
// Sin costos adicionales
```

### 3. Cálculos en Cliente
```javascript
// Stats calculados en el frontend
const stats = {
  totalPending: bills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.total, 0)
};

// No necesita query adicional
// Más rápido
```

---

## 🎯 Resumen

| Paso | Acción | Responsable | Query Firestore |
|------|--------|-------------|-----------------|
| 1 | Cargar parcelas | Admin/Técnico | `getDocs(houses)` |
| 2 | Generar boleta | Admin/Técnico | `addDoc(bills)` |
| 3 | Ver mis boletas | Residente | `query(bills, where houseId)` |
| 4 | Descargar PDF | Residente | Desde `bill.pdfData` |
| 5 | Subir comprobante | Residente | `addDoc(payments)` |
| 6 | Validar pago | Admin | `updateDoc(bill)` |

---

**¿Tienes alguna pregunta específica sobre alguna parte del flujo?** 🚀
