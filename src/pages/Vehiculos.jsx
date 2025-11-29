import { useState, useEffect, useRef } from 'react';
import { Car, Search, Download, Upload, Filter, Home, Edit, Trash2, Plus, X } from 'lucide-react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/PageLoader';
import * as XLSX from 'xlsx';

export default function Vehiculos() {
  const { userData } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, car, suv, truck, motorcycle
  const [filterHouse, setFilterHouse] = useState('all');
  const fileInputRef = useRef(null);

  // Verificar si el usuario puede editar/eliminar (solo admin y presidente)
  // Técnico y Secretaria solo pueden ver
  const canEdit = ['admin', 'presidente'].includes(userData?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar vehículos
      const vehiclesSnapshot = await getDocs(collection(firestore, 'vehicles'));
      const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehicles(vehiclesData);

      // Cargar casas
      const housesSnapshot = await getDocs(collection(firestore, 'houses'));
      const housesData = housesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtrar house0 (Portón) - solo para electricidad
      .filter(house => house.id !== 'house0');
      setHouses(housesData);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(firestore, 'vehicles', vehicleId));
      await loadData();
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
      setError('Error al eliminar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    // Preparar datos para Excel
    const excelData = filteredVehicles.map(vehicle => {
      // Manejar fecha (puede ser Timestamp o string ISO)
      let fechaRegistro = '-';
      if (vehicle.createdAt) {
        if (typeof vehicle.createdAt === 'string') {
          fechaRegistro = new Date(vehicle.createdAt).toLocaleDateString('es-CL');
        } else if (vehicle.createdAt.toDate) {
          fechaRegistro = vehicle.createdAt.toDate().toLocaleDateString('es-CL');
        }
      }

      return {
        'Casa': vehicle.houseId,
        'Patente': vehicle.licensePlate,
        'Tipo': getTypeLabel(vehicle.type),
        'Marca': vehicle.brand || '-',
        'Modelo': vehicle.model || '-',
        'Color': vehicle.color || '-',
        'Registrado': fechaRegistro
      };
    });

    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehículos');

    // Descargar
    const fileName = `Vehiculos_LosPeumos_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleImportFromExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      // Leer el archivo Excel
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          let importedCount = 0;
          let errorCount = 0;

          // Mapeo de tipos en español a inglés
          const typeMapping = {
            'Auto': 'car',
            'SUV': 'suv',
            'Camioneta': 'truck',
            'Camión': 'heavy_truck',
            'Moto': 'motorcycle'
          };

          // Procesar cada fila
          for (const row of jsonData) {
            try {
              // Validar campos requeridos
              if (!row['Casa'] || !row['Patente'] || !row['Tipo']) {
                errorCount++;
                continue;
              }

              // Convertir tipo de español a inglés
              const vehicleType = typeMapping[row['Tipo']] || 'car';

              // Crear documento de vehículo
              const vehicleData = {
                houseId: row['Casa'],
                licensePlate: row['Patente'].toString().toUpperCase(),
                type: vehicleType,
                brand: row['Marca'] && row['Marca'] !== '-' ? row['Marca'] : '',
                model: row['Modelo'] && row['Modelo'] !== '-' ? row['Modelo'] : '',
                color: row['Color'] && row['Color'] !== '-' ? row['Color'] : '',
                createdAt: new Date().toISOString()
              };

              // Usar la patente como ID único
              const vehicleId = `vehicle_${vehicleData.licensePlate.replace(/[^a-zA-Z0-9]/g, '_')}`;
              
              // Guardar en Firestore
              await setDoc(doc(firestore, 'vehicles', vehicleId), vehicleData);
              importedCount++;
            } catch (err) {
              console.error('Error al importar vehículo:', err);
              errorCount++;
            }
          }

          // Recargar datos
          await loadData();

          // Mostrar resultado
          if (errorCount > 0) {
            setError(`Se importaron ${importedCount} vehículos. ${errorCount} filas con errores fueron omitidas.`);
          } else {
            setError(`✅ Se importaron ${importedCount} vehículos exitosamente.`);
          }
          
          setTimeout(() => setError(''), 5000);
        } catch (err) {
          console.error('Error al procesar Excel:', err);
          setError('Error al procesar el archivo Excel. Verifica el formato.');
          setTimeout(() => setError(''), 5000);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error al importar:', err);
      setError('Error al importar el archivo');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      car: 'Auto',
      suv: 'SUV',
      truck: 'Camioneta',
      heavy_truck: 'Camión',
      motorcycle: 'Moto'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      car: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      suv: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      truck: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      heavy_truck: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
      motorcycle: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
    };
    return colors[type] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30';
  };

  // Formatear houseId para mostrar como "Parcela X" o "Portón"
  const formatHouseId = (houseId) => {
    if (!houseId) return 'N/A';
    
    // Caso especial: house0 = Portón
    if (houseId === 'house0' || houseId === '0') {
      return 'Portón';
    }
    
    // Si el houseId tiene formato "house10" -> "Parcela 10"
    const match = houseId.match(/house(\d+)/i);
    if (match) {
      return `Parcela ${match[1]}`;
    }
    // Si ya es un número -> "Parcela X"
    if (/^\d+$/.test(houseId)) {
      return `Parcela ${houseId}`;
    }
    // Si tiene otro formato, devolverlo tal cual
    return houseId;
  };

  // Filtrar vehículos
  const filteredVehicles = vehicles.filter(vehicle => {
    // Filtro de búsqueda
    const matchesSearch = 
      String(vehicle.licensePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(vehicle.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(vehicle.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(vehicle.houseId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(vehicle.color || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de tipo
    const matchesType = filterType === 'all' || vehicle.type === filterType;

    // Filtro de casa
    const matchesHouse = filterHouse === 'all' || vehicle.houseId === filterHouse;

    return matchesSearch && matchesType && matchesHouse;
  });

  // Estadísticas
  const stats = {
    total: vehicles.length,
    byType: {
      car: vehicles.filter(v => v.type === 'car').length,
      suv: vehicles.filter(v => v.type === 'suv').length,
      truck: vehicles.filter(v => v.type === 'truck').length,
      heavy_truck: vehicles.filter(v => v.type === 'heavy_truck').length,
      motorcycle: vehicles.filter(v => v.type === 'motorcycle').length
    },
    uniqueHouses: new Set(vehicles.map(v => v.houseId)).size
  };

  return (
    <div className="space-y-6">
      {loading && vehicles.length === 0 ? (
        <PageLoader message="Cargando vehículos de la comunidad..." />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Vehículos de la Comunidad</h1>
              <p className="text-slate-600 dark:text-slate-400">Listado completo de vehículos registrados</p>
            </div>
            
            {/* Botones de Exportar/Importar (solo para admin, presidente, técnico) */}
            {canEdit && (
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFromExcel}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  title="Importar desde Excel"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden md:inline">Importar</span>
                </button>
                <button
                  onClick={handleExportToExcel}
                  disabled={filteredVehicles.length === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  title="Exportar a Excel"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden md:inline">Exportar</span>
                </button>
              </div>
            )}
          </div>

      {/* Info sobre importación (solo visible para admins) */}
      {canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
                📋 Formato para Importación de Vehículos
              </p>
              <p className="text-blue-700 dark:text-blue-300 mb-2">
                El archivo Excel debe tener las siguientes columnas:
              </p>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                <li><strong>Casa</strong> (requerido): house1, house2, etc.</li>
                <li><strong>Patente</strong> (requerido): AB1234, ABCD12, etc.</li>
                <li><strong>Tipo</strong> (requerido): Auto, SUV, Camioneta, Camión, o Moto</li>
                <li><strong>Marca</strong> (opcional): Toyota, Ford, etc.</li>
                <li><strong>Modelo</strong> (opcional): Corolla, Focus, etc.</li>
                <li><strong>Color</strong> (opcional): Rojo, Azul, etc.</li>
              </ul>
              <p className="text-blue-700 dark:text-blue-300 mt-2">
                💡 <strong>Tip:</strong> Exporta los vehículos actuales para ver el formato correcto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Alert */}
      {error && (
        <div className={`${
          error.includes('✅') 
            ? 'bg-green-900/30 border-green-500 text-green-400' 
            : 'bg-red-900/30 border-red-500 text-red-400'
        } border px-4 py-3 rounded-lg`}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <Car className="w-6 h-6 md:w-8 md:h-8 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">Autos</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.byType.car}</p>
            </div>
            <Car className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-green-600 dark:text-green-400">SUVs</p>
              <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">{stats.byType.suv}</p>
            </div>
            <Car className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400">Camionetas</p>
              <p className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.byType.truck}</p>
            </div>
            <Car className="w-6 h-6 md:w-8 md:h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-yellow-600 dark:text-yellow-400">Camiones</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.byType.heavy_truck}</p>
            </div>
            <Car className="w-6 h-6 md:w-8 md:h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">Motos</p>
              <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.byType.motorcycle}</p>
            </div>
            <Car className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por patente, marca, modelo, parcela o color..."
            className="input pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Tipo de Vehículo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
            >
              <option value="all">Todos los tipos</option>
              <option value="car">Autos</option>
              <option value="suv">SUVs</option>
              <option value="truck">Camionetas</option>
              <option value="heavy_truck">Camiones</option>
              <option value="motorcycle">Motos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Home className="inline w-4 h-4 mr-1" />
              Parcela
            </label>
            <select
              value={filterHouse}
              onChange={(e) => setFilterHouse(e.target.value)}
              className="input"
            >
              <option value="all">Todas las parcelas</option>
              {houses.map(house => (
                <option key={house.id} value={house.id}>
                  {formatHouseId(house.id)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Mostrando {filteredVehicles.length} de {vehicles.length} vehículos
          </p>
          {(searchTerm || filterType !== 'all' || filterHouse !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterHouse('all');
              }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && vehicles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-600 dark:text-slate-400">
            Cargando vehículos...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <Car className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' || filterHouse !== 'all'
                ? 'No se encontraron vehículos'
                : 'No hay vehículos registrados'
              }
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm || filterType !== 'all' || filterHouse !== 'all'
                ? 'Intenta con otros filtros'
                : 'Los residentes pueden registrar vehículos desde "Mi Cuenta"'
              }
            </p>
          </div>
        ) : (
          filteredVehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="card space-y-3 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${getTypeColor(vehicle.type)}`}>
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {vehicle.licensePlate}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(vehicle.type)}`}>
                      {getTypeLabel(vehicle.type)}
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">Parcela:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{formatHouseId(vehicle.houseId)}</span>
                </div>

                {vehicle.brand && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Marca:</span>
                    <span className="text-slate-900 dark:text-white">{vehicle.brand}</span>
                  </div>
                )}

                {vehicle.model && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Modelo:</span>
                    <span className="text-slate-900 dark:text-white">{vehicle.model}</span>
                  </div>
                )}

                {vehicle.color && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Color:</span>
                    <span className="text-slate-900 dark:text-white">{vehicle.color}</span>
                  </div>
                )}

                {vehicle.createdAt && (
                  <div className="text-xs text-slate-500 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                    Registrado: {
                      typeof vehicle.createdAt === 'string' 
                        ? new Date(vehicle.createdAt).toLocaleDateString('es-CL')
                        : vehicle.createdAt.toDate().toLocaleDateString('es-CL')
                    }
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
}
