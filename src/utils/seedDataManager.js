/**
 * Utilidades para gestionar datos de prueba (seed data)
 * Solo para uso de administradores en desarrollo/testing
 */

import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs,
  getDoc,
  deleteDoc,
  writeBatch,
  query,
  where 
} from 'firebase/firestore';
import { firestore } from '../services/firebase';

/**
 * Generar datos de prueba completos
 * Crea: houses (30 parcelas), bills (~60), payments (~48)
 */
export const generateSeedData = async () => {
  console.log('🌱 Iniciando generación de datos de prueba...');
  
  const results = {
    houses: 0,
    bills: 0,
    payments: 0,
    vehicles: 0,
    errors: []
  };

  try {
    // 1. Crear parcelas (30)
    console.log('📍 Creando parcelas...');
    const houses = generateHouses(30);
    
    for (const house of houses) {
      try {
        const houseRef = doc(firestore, 'houses', house.houseId);
        await setDoc(houseRef, house);
        results.houses++;
      } catch (error) {
        results.errors.push(`Error creando casa ${house.houseId}: ${error.message}`);
      }
    }

    // 2. Crear boletas (últimos 3 meses para 20 parcelas)
    console.log('⚡ Creando boletas...');
    const bills = generateBills(20, 3);
    const createdBills = [];
    
    for (const bill of bills) {
      try {
        const billRef = await addDoc(collection(firestore, 'bills'), bill);
        createdBills.push({ id: billRef.id, ...bill });
        results.bills++;
      } catch (error) {
        results.errors.push(`Error creando boleta: ${error.message}`);
      }
    }

    // 3. Crear pagos (para boletas pagadas)
    console.log('💰 Creando pagos...');
    const payments = generatePayments(createdBills);
    
    for (const payment of payments) {
      try {
        await addDoc(collection(firestore, 'payments'), payment);
        results.payments++;
      } catch (error) {
        results.errors.push(`Error creando pago: ${error.message}`);
      }
    }

    // 4. Crear vehículos (2 por parcela para las primeras 20)
    console.log('🚗 Creando vehículos...');
    const vehicles = generateVehicles(20);
    
    for (const vehicle of vehicles) {
      try {
        await addDoc(collection(firestore, 'vehicles'), vehicle);
        results.vehicles++;
      } catch (error) {
        results.errors.push(`Error creando vehículo: ${error.message}`);
      }
    }

    console.log('✅ Datos de prueba generados exitosamente');
    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('❌ Error general al generar datos:', error);
    throw error;
  }
};

/**
 * Limpiar todos los datos de prueba
 * Elimina: houses (de parcela 1 a 30), todas las bills y payments asociadas
 */
export const cleanSeedData = async () => {
  console.log('🧹 Iniciando limpieza de datos de prueba...');
  
  const results = {
    houses: 0,
    bills: 0,
    payments: 0,
    vehicles: 0,
    errors: []
  };

  try {
    const batch = writeBatch(firestore);
    let operationCount = 0;
    const MAX_BATCH = 500; // Firestore límite por batch

    // 1. Eliminar parcelas (house0 y house1 a house30)
    console.log('🏠 Eliminando parcelas...');
    // Eliminar house0 (Portón)
    const house0Ref = doc(firestore, 'houses', 'house0');
    batch.delete(house0Ref);
    operationCount++;
    results.houses++;
    
    // Eliminar house1 a house30
    for (let i = 1; i <= 30; i++) {
      const houseId = `house${i}`;
      const houseRef = doc(firestore, 'houses', houseId);
      batch.delete(houseRef);
      operationCount++;
      results.houses++;

      // Commit batch si llegamos al límite
      if (operationCount >= MAX_BATCH) {
        await batch.commit();
        operationCount = 0;
      }
    }

    // Commit batch pendiente
    if (operationCount > 0) {
      await batch.commit();
    }

    // 2. Eliminar boletas asociadas a las parcelas de prueba
    console.log('⚡ Eliminando boletas...');
    const billsQuery = query(
      collection(firestore, 'bills'),
      where('houseId', 'in', Array.from({ length: 30 }, (_, i) => `house${i + 1}`).slice(0, 10))
    );
    
    // Firestore 'in' solo permite 10 valores, hacer múltiples queries
    for (let i = 0; i < 3; i++) {
      const houseIds = Array.from({ length: 10 }, (_, j) => `house${i * 10 + j + 1}`);
      const query1 = query(
        collection(firestore, 'bills'),
        where('houseId', 'in', houseIds)
      );
      
      const billsSnap = await getDocs(query1);
      const deleteBatch = writeBatch(firestore);
      let batchCount = 0;

      billsSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        batchCount++;
        results.bills++;

        if (batchCount >= MAX_BATCH) {
          deleteBatch.commit();
          batchCount = 0;
        }
      });

      if (batchCount > 0) {
        await deleteBatch.commit();
      }
    }

    // 3. Eliminar pagos asociados (buscar por houseId)
    console.log('💰 Eliminando pagos...');
    for (let i = 0; i < 3; i++) {
      const houseIds = Array.from({ length: 10 }, (_, j) => `house${i * 10 + j + 1}`);
      const paymentsQuery = query(
        collection(firestore, 'payments'),
        where('houseId', 'in', houseIds)
      );
      
      const paymentsSnap = await getDocs(paymentsQuery);
      const deleteBatch = writeBatch(firestore);
      let batchCount = 0;

      paymentsSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        batchCount++;
        results.payments++;

        if (batchCount >= MAX_BATCH) {
          deleteBatch.commit();
          batchCount = 0;
        }
      });

      if (batchCount > 0) {
        await deleteBatch.commit();
      }
    }

    // 4. Eliminar vehículos asociados
    console.log('🚗 Eliminando vehículos de prueba...');
    for (let i = 0; i < 3; i++) {
      const houseIds = Array.from({ length: 10 }, (_, j) => `house${i * 10 + j + 1}`);
      const vehiclesQuery = query(
        collection(firestore, 'vehicles'),
        where('houseId', 'in', houseIds)
      );
      
      const vehiclesSnap = await getDocs(vehiclesQuery);
      const deleteBatch = writeBatch(firestore);
      let batchCount = 0;

      vehiclesSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        batchCount++;
        results.vehicles++;

        if (batchCount >= MAX_BATCH) {
          deleteBatch.commit();
          batchCount = 0;
        }
      });

      if (batchCount > 0) {
        await deleteBatch.commit();
      }
    }

    console.log('✅ Datos de prueba eliminados exitosamente');
    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    results.errors.push(error.message);
    throw error;
  }
};

/**
 * Generar parcelas de prueba
 */
const generateHouses = (count = 30) => {
  const houses = [];
  
  // Agregar house0 (Portón) primero
  houses.push({
    houseId: 'house0',
    houseNumber: '0',
    ownerName: 'Portón Comunidad',
    ownerEmail: null,
    ownerUid: null,
    phone: null,
    address: 'Portón de Acceso',
    meters: {
      previousReading: Math.floor(Math.random() * 1000) + 5000,
      currentReading: null,
      lastReadingDate: null,
    },
    active: true,
    createdAt: new Date().toISOString()
  });
  
  // Agregar parcelas del 1 al 30
  for (let i = 1; i <= count; i++) {
    houses.push({
      houseId: `house${i}`,
      houseNumber: String(i),
      ownerName: `Propietario ${i}`,
      ownerEmail: i <= 5 ? `residente${i}@lospeumos.cl` : null,
      ownerUid: null,
      phone: `+56912345${String(i).padStart(3, '0')}`,
      address: `Parcela ${i}`,
      meters: {
        previousReading: Math.floor(Math.random() * 1000) + 5000,
        currentReading: null,
        lastReadingDate: null,
      },
      active: true,
      createdAt: new Date().toISOString()
    });
  }
  
  return houses;
};

/**
 * Generar parcelas reales de Los Peumos (house0 - house115)
 * Incluye subdivisiones: 6A/B, 18A/B, 20A/B, 26A/B, 28A/B, 35A/B, 36A/B, 41A/B, 48A/B, 51A/B
 */
const generateRealHouses = () => {
  const houses = [];
  
  // Subdivisiones (parcelas con A y B)
  const subdivisions = [6, 18, 20, 26, 28, 35, 36, 41, 48, 51];
  
  // Agregar house0 (Portón) primero
  houses.push({
    houseId: 'house0',
    houseNumber: '0',
    ownerName: 'Portón Comunidad',
    ownerEmail: null,
    ownerUid: null,
    phone: null,
    address: 'Portón de Acceso',
    meters: {
      previousReading: Math.floor(Math.random() * 1000) + 5000,
      currentReading: null,
      lastReadingDate: null,
    },
    active: true,
    createdAt: new Date().toISOString()
  });
  
  // Agregar parcelas del 1 al 115
  for (let i = 1; i <= 115; i++) {
    // Si es una subdivisión, crear A y B
    if (subdivisions.includes(i)) {
      // Parcela A
      houses.push({
        houseId: `house${i}A`,
        houseNumber: `${i}A`,
        ownerName: `Propietario ${i}A`,
        ownerEmail: null,
        ownerUid: null,
        phone: null,
        address: `Parcela ${i}A`,
        meters: {
          previousReading: Math.floor(Math.random() * 1000) + 5000,
          currentReading: null,
          lastReadingDate: null,
        },
        active: true,
        createdAt: new Date().toISOString()
      });
      
      // Parcela B
      houses.push({
        houseId: `house${i}B`,
        houseNumber: `${i}B`,
        ownerName: `Propietario ${i}B`,
        ownerEmail: null,
        ownerUid: null,
        phone: null,
        address: `Parcela ${i}B`,
        meters: {
          previousReading: Math.floor(Math.random() * 1000) + 5000,
          currentReading: null,
          lastReadingDate: null,
        },
        active: true,
        createdAt: new Date().toISOString()
      });
    } else {
      // Parcela normal sin subdivisión
      houses.push({
        houseId: `house${i}`,
        houseNumber: String(i),
        ownerName: `Propietario ${i}`,
        ownerEmail: null,
        ownerUid: null,
        phone: null,
        address: `Parcela ${i}`,
        meters: {
          previousReading: Math.floor(Math.random() * 1000) + 5000,
          currentReading: null,
          lastReadingDate: null,
        },
        active: true,
        createdAt: new Date().toISOString()
      });
    }
  }
  
  return houses;
};

/**
 * Generar boletas de prueba
 */
const generateBills = (housesCount = 20, monthsBack = 3) => {
  const bills = [];
  const currentDate = new Date();
  
  for (let monthOffset = 0; monthOffset < monthsBack; monthOffset++) {
    const billDate = new Date(currentDate);
    billDate.setMonth(billDate.getMonth() - monthOffset);
    
    const month = billDate.getMonth() + 1;
    const year = billDate.getFullYear();
    
    for (let i = 1; i <= housesCount; i++) {
      const consumption = Math.floor(Math.random() * 200) + 50;
      const rate = 150;
      const electricityCharge = consumption * rate;
      const fixedFee = 2000;
      const total = electricityCharge + fixedFee;
      
      let status = 'pending';
      if (monthOffset === 0) {
        status = 'pending';
      } else {
        status = Math.random() > 0.2 ? 'paid' : 'overdue';
      }
      
      bills.push({
        houseId: `house${i}`,
        month,
        year,
        previousReading: 5000 + (monthOffset * 150) + Math.floor(Math.random() * 100),
        currentReading: 5150 + (monthOffset * 150) + Math.floor(Math.random() * 100),
        consumption,
        rate,
        electricityCharge,
        fixedFee,
        total,
        status,
        pdfUrl: null,
        createdAt: new Date(year, month - 1, 5).toISOString(),
        dueDate: new Date(year, month - 1, 20).toISOString(),
        paidAt: status === 'paid' ? new Date(year, month - 1, 15).toISOString() : null,
      });
    }
  }
  
  return bills;
};

/**
 * Generar pagos de prueba
 */
const generatePayments = (bills) => {
  const payments = [];
  
  bills.filter(b => b.status === 'paid').forEach(bill => {
    payments.push({
      billId: bill.id,
      houseId: bill.houseId,
      amount: bill.total,
      method: Math.random() > 0.5 ? 'transfer' : 'deposit',
      reference: `BILL-${bill.year}-${String(bill.month).padStart(2, '0')}-${bill.houseId}`,
      validated: true,
      validatedBy: 'admin',
      validatedAt: bill.paidAt,
      fileUrl: null,
      userId: null,
      createdAt: new Date(bill.paidAt).toISOString(),
    });
  });
  
  return payments;
};

/**
 * Generar vehículos de prueba
 * 2 vehículos por parcela, de diferentes tipos y marcas
 */
const generateVehicles = (housesCount = 20) => {
  const vehicles = [];
  
  // Marcas y modelos populares en Chile
  const vehicleData = [
    { brand: 'Toyota', models: ['Corolla', 'RAV4', 'Hilux', 'Yaris', 'Land Cruiser'], type: 'car' },
    { brand: 'Chevrolet', models: ['Sail', 'Onix', 'Tracker', 'Captiva'], type: 'car' },
    { brand: 'Nissan', models: ['Versa', 'Kicks', 'X-Trail', 'Qashqai'], type: 'suv' },
    { brand: 'Mazda', models: ['3', 'CX-5', 'CX-30', '2'], type: 'car' },
    { brand: 'Hyundai', models: ['Accent', 'Tucson', 'Creta', 'Santa Fe'], type: 'suv' },
    { brand: 'Kia', models: ['Rio', 'Sportage', 'Seltos', 'Sorento'], type: 'suv' },
    { brand: 'Ford', models: ['Ranger', 'Territory', 'Escape'], type: 'truck' },
    { brand: 'Volkswagen', models: ['Gol', 'Virtus', 'T-Cross', 'Amarok'], type: 'car' },
    { brand: 'Suzuki', models: ['Swift', 'Vitara', 'Baleno', 'Jimny'], type: 'car' },
    { brand: 'Honda', models: ['City', 'HR-V', 'CR-V', 'Civic'], type: 'car' },
    { brand: 'Great Wall', models: ['Poer', 'Wingle', 'Haval H6'], type: 'truck' },
    { brand: 'Chery', models: ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Arrizo'], type: 'suv' },
    { brand: 'JAC', models: ['S2', 'S3', 'S4', 'T8'], type: 'suv' },
    { brand: 'MG', models: ['5', 'ZS', 'HS'], type: 'suv' },
    { brand: 'Peugeot', models: ['208', '2008', '3008'], type: 'car' },
    { brand: 'Renault', models: ['Kwid', 'Stepway', 'Duster', 'Koleos'], type: 'car' },
    { brand: 'Mitsubishi', models: ['L200', 'ASX', 'Outlander'], type: 'truck' },
    { brand: 'Subaru', models: ['Impreza', 'XV', 'Forester'], type: 'suv' },
    { brand: 'Jeep', models: ['Renegade', 'Compass', 'Wrangler'], type: 'suv' },
    { brand: 'Fiat', models: ['Cronos', 'Argo', 'Toro'], type: 'car' }
  ];

  const colors = ['Blanco', 'Negro', 'Gris', 'Plateado', 'Rojo', 'Azul', 'Verde'];
  
  // Generar patentes aleatorias
  const generateLicensePlate = (index) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    return `${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${nums[Math.floor(Math.random() * 10)]}${nums[Math.floor(Math.random() * 10)]}`;
  };

  for (let i = 1; i <= housesCount; i++) {
    const houseId = `house${i}`;
    
    // Vehículo 1: Auto/SUV principal
    const vehicle1Data = vehicleData[Math.floor(Math.random() * vehicleData.length)];
    vehicles.push({
      houseId,
      userId: null,
      licensePlate: generateLicensePlate(i * 2),
      brand: vehicle1Data.brand,
      model: vehicle1Data.models[Math.floor(Math.random() * vehicle1Data.models.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      type: ['car', 'suv'][Math.floor(Math.random() * 2)],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Vehículo 2: Diferente tipo (puede ser camioneta, moto, etc)
    const vehicle2Data = vehicleData[Math.floor(Math.random() * vehicleData.length)];
    const types = ['car', 'suv', 'truck', 'motorcycle', 'heavy_truck'];
    vehicles.push({
      houseId,
      userId: null,
      licensePlate: generateLicensePlate(i * 2 + 1),
      brand: vehicle2Data.brand,
      model: vehicle2Data.models[Math.floor(Math.random() * vehicle2Data.models.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      type: types[Math.floor(Math.random() * types.length)],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return vehicles;
};

/**
 * Verificar si existen datos de prueba
 */
export const checkSeedDataExists = async () => {
  try {
    const house1Ref = doc(firestore, 'houses', 'house1');
    const house1Snap = await getDoc(house1Ref);
    
    return house1Snap.exists();
  } catch (error) {
    console.error('Error verificando datos de prueba:', error);
    return false;
  }
};

/**
 * Generar datos REALES de Los Peumos (115 parcelas)
 * Crea: house0 (Portón) + house1-105 con subdivisiones A/B
 */
export const generateRealData = async () => {
  console.log('🏘️ Iniciando generación de datos REALES de Los Peumos...');
  
  const results = {
    houses: 0,
    errors: []
  };

  try {
    // Crear parcelas reales (115 total)
    console.log('📍 Creando 115 parcelas reales...');
    const houses = generateRealHouses();
    
    console.log(`📊 Total de parcelas a crear: ${houses.length}`);
    
    for (const house of houses) {
      try {
        const houseRef = doc(firestore, 'houses', house.houseId);
        await setDoc(houseRef, house);
        results.houses++;
      } catch (error) {
        results.errors.push(`Error creando casa ${house.houseId}: ${error.message}`);
      }
    }

    console.log(`✅ ${results.houses} parcelas reales creadas exitosamente`);
    
    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('❌ Error al generar datos reales:', error);
    results.errors.push(error.message);
    throw error;
  }
};

/**
 * Eliminar SOLO las parcelas duplicadas legacy (sin letra)
 * Útil para limpiar house6, house18, house20, etc. que quedaron de versiones antiguas
 * Mantiene house6A, house6B, etc.
 */
export const cleanLegacySubdivisions = async () => {
  console.log('🧹 Eliminando parcelas legacy duplicadas (sin letra)...');
  
  const results = {
    houses: 0,
    bills: 0,
    errors: []
  };

  try {
    const subdivisions = [6, 18, 20, 26, 28, 35, 36, 41, 48, 51];
    const batch = writeBatch(firestore);
    
    // Eliminar solo las versiones SIN letra de las subdivisiones
    for (const num of subdivisions) {
      const houseRef = doc(firestore, 'houses', `house${num}`);
      batch.delete(houseRef);
      results.houses++;
      
      // También eliminar sus boletas
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', `house${num}`)
      );
      const billsSnap = await getDocs(billsQuery);
      billsSnap.docs.forEach(billDoc => {
        batch.delete(billDoc.ref);
        results.bills++;
      });
    }
    
    await batch.commit();
    
    console.log(`✅ Eliminadas ${results.houses} parcelas legacy y ${results.bills} boletas asociadas`);
    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('❌ Error al eliminar parcelas legacy:', error);
    results.errors.push(error.message);
    return {
      success: false,
      results
    };
  }
};

/**
 * Limpiar TODAS las parcelas reales (house0 - house115 con subdivisiones)
 * ⚠️ PRECAUCIÓN: Elimina las parcelas reales y TODOS sus datos asociados
 */
export const cleanRealData = async () => {
  console.log('🧹 Iniciando limpieza de TODAS las parcelas reales...');
  
  const results = {
    houses: 0,
    bills: 0,
    payments: 0,
    vehicles: 0,
    errors: []
  };

  try {
    const subdivisions = [6, 18, 20, 26, 28, 35, 36, 41, 48, 51];
    const MAX_BATCH = 500;
    
    // 1. Eliminar parcelas
    console.log('🏠 Eliminando parcelas...');
    let batch = writeBatch(firestore);
    let operationCount = 0;
    
    // Eliminar house0
    const house0Ref = doc(firestore, 'houses', 'house0');
    batch.delete(house0Ref);
    operationCount++;
    results.houses++;
    
    // Eliminar house1 a house115 (con subdivisiones A/B donde aplique)
    for (let i = 1; i <= 115; i++) {
      if (subdivisions.includes(i)) {
        // IMPORTANTE: Eliminar las 3 versiones (sin letra, A y B)
        // Esto limpia parcelas antiguas que puedan haber quedado duplicadas
        const houseRef = doc(firestore, 'houses', `house${i}`);  // Sin letra (legacy)
        const houseARef = doc(firestore, 'houses', `house${i}A`);
        const houseBRef = doc(firestore, 'houses', `house${i}B`);
        batch.delete(houseRef);
        batch.delete(houseARef);
        batch.delete(houseBRef);
        operationCount += 3;
        results.houses += 3;
      } else {
        // Eliminar parcela normal
        const houseRef = doc(firestore, 'houses', `house${i}`);
        batch.delete(houseRef);
        operationCount++;
        results.houses++;
      }
      
      if (operationCount >= MAX_BATCH) {
        await batch.commit();
        batch = writeBatch(firestore);
        operationCount = 0;
      }
    }
    
    if (operationCount > 0) {
      await batch.commit();
    }

    // 2. Eliminar boletas, pagos y vehículos asociados
    // Nota: Por limitación de Firestore 'in' (máx 10), hacer queries por grupos
    console.log('⚡ Eliminando boletas, pagos y vehículos...');
    
    const allHouseIds = ['house0'];
    for (let i = 1; i <= 115; i++) {
      if (subdivisions.includes(i)) {
        // Incluir las 3 versiones para limpiar datos antiguos
        allHouseIds.push(`house${i}`, `house${i}A`, `house${i}B`);
      } else {
        allHouseIds.push(`house${i}`);
      }
    }
    
    // Dividir en grupos de 10 para queries
    for (let i = 0; i < allHouseIds.length; i += 10) {
      const houseIdsChunk = allHouseIds.slice(i, i + 10);
      
      // Eliminar boletas
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('houseId', 'in', houseIdsChunk)
      );
      const billsSnap = await getDocs(billsQuery);
      let deleteBatch = writeBatch(firestore);
      let batchCount = 0;
      
      billsSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        batchCount++;
        results.bills++;
        
        if (batchCount >= MAX_BATCH) {
          deleteBatch.commit();
          deleteBatch = writeBatch(firestore);
          batchCount = 0;
        }
      });
      
      if (batchCount > 0) {
        await deleteBatch.commit();
      }
      
      // Eliminar pagos
      const paymentsQuery = query(
        collection(firestore, 'payments'),
        where('houseId', 'in', houseIdsChunk)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      deleteBatch = writeBatch(firestore);
      batchCount = 0;
      
      paymentsSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        batchCount++;
        results.payments++;
        
        if (batchCount >= MAX_BATCH) {
          deleteBatch.commit();
          deleteBatch = writeBatch(firestore);
          batchCount = 0;
        }
      });
      
      if (batchCount > 0) {
        await deleteBatch.commit();
      }
      
      // Eliminar vehículos
      const vehiclesQuery = query(
        collection(firestore, 'vehicles'),
        where('houseId', 'in', houseIdsChunk)
      );
      const vehiclesSnap = await getDocs(vehiclesQuery);
      deleteBatch = writeBatch(firestore);
      batchCount = 0;
      
      vehiclesSnap.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        batchCount++;
        results.vehicles++;
        
        if (batchCount >= MAX_BATCH) {
          deleteBatch.commit();
          deleteBatch = writeBatch(firestore);
          batchCount = 0;
        }
      });
      
      if (batchCount > 0) {
        await deleteBatch.commit();
      }
    }

    console.log('✅ Todas las parcelas reales eliminadas exitosamente');
    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('❌ Error al limpiar datos reales:', error);
    results.errors.push(error.message);
    throw error;
  }
};
