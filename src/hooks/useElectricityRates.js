import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';

/**
 * Hook personalizado para obtener las tarifas de electricidad desde Firestore
 * @returns {Object} { fixedRate, variableRate, loading, error }
 */
export const useElectricityRates = () => {
  const [rates, setRates] = useState({
    fixedRate: 2000,      // Valor por defecto
    variableRate: 150     // Valor por defecto
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(firestore, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);
      
      console.log('📊 Cargando tarifas desde Firestore...');
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        console.log('📊 Datos completos de settings:', data);
        console.log('📊 electricityFixedRate:', data.electricityFixedRate);
        console.log('📊 electricityVariableRate:', data.electricityVariableRate);
        
        setRates({
          fixedRate: data.electricityFixedRate || 2000,
          variableRate: data.electricityVariableRate || 150
        });
        
        console.log('✅ Tarifas cargadas: Fija=' + (data.electricityFixedRate || 2000) + ', Variable=' + (data.electricityVariableRate || 150));
      } else {
        console.warn('⚠️ No existe documento settings/general, usando valores por defecto');
      }
    } catch (err) {
      console.error('❌ Error al cargar tarifas:', err);
      setError(err.message);
      // Mantener valores por defecto en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar tarifas (útil después de actualizar en configuración)
  const reloadRates = async () => {
    await loadRates();
  };

  return { ...rates, loading, error, reloadRates };
};

export default useElectricityRates;
