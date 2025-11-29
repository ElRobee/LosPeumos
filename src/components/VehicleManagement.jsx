/**
 * Componente para gestionar vehículos del residente
 * Permite agregar, editar y eliminar vehículos
 */

import React, { useState } from 'react';
import { Car, Plus, Edit2, Trash2, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { firestore } from '../services/firebase';

const VehicleManagement = ({ vehicles, userId, houseId, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    color: '',
    type: 'car' // car, motorcycle, suv, truck
  });

  // Lista completa de marcas de vehículos disponibles en Chile
  const vehicleBrands = [
    'Alfa Romeo',
    'Audi',
    'Baic',
    'BMW',
    'BYD',
    'Changan',
    'Chery',
    'Chevrolet',
    'Citroën',
    'DFSK',
    'DFM',
    'Dongfeng',
    'Fiat',
    'Ford',
    'Foton',
    'GAC',
    'Geely',
    'Great Wall',
    'Honda',
    'Hyundai',
    'Iveco',
    'JAC',
    'Jeep',
    'Jetour',
    'JMC',
    'Kia',
    'Mahindra',
    'Maxus',
    'Mazda',
    'Mercedes-Benz',
    'MG',
    'Mitsubishi',
    'Nissan',
    'Opel',
    'Peugeot',
    'RAM',
    'Renault',
    'Seat',
    'Skoda',
    'Ssangyong',
    'Subaru',
    'Suzuki',
    'Toyota',
    'Volkswagen',
    'Volvo'
  ].sort(); // Ordenar alfabéticamente

  const vehicleTypes = [
    { value: 'car', label: 'Auto' },
    { value: 'suv', label: 'SUV' },
    { value: 'truck', label: 'Camioneta' },
    { value: 'heavy_truck', label: 'Camión' },
    { value: 'motorcycle', label: 'Moto' }
  ];

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        licensePlate: vehicle.licensePlate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        color: vehicle.color || '',
        type: vehicle.type || 'car'
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        licensePlate: '',
        brand: '',
        model: '',
        color: '',
        type: 'car'
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      licensePlate: '',
      brand: '',
      model: '',
      color: '',
      type: 'car'
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.licensePlate.trim()) {
      setError('La patente es obligatoria');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const vehicleData = {
        ...formData,
        licensePlate: formData.licensePlate.toUpperCase().trim(),
        userId,
        houseId,
        active: true,
        updatedAt: Timestamp.now()
      };

      if (editingVehicle) {
        // Actualizar vehículo existente
        const vehicleRef = doc(firestore, 'vehicles', editingVehicle.id);
        await updateDoc(vehicleRef, vehicleData);
      } else {
        // Crear nuevo vehículo
        vehicleData.createdAt = Timestamp.now();
        await addDoc(collection(firestore, 'vehicles'), vehicleData);
      }

      onRefresh();
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar vehículo:', err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      return;
    }

    try {
      setLoading(true);
      const vehicleRef = doc(firestore, 'vehicles', vehicleId);
      await deleteDoc(vehicleRef);
      onRefresh();
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Mis Vehículos
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Vehículo
        </button>
      </div>

      {/* Lista de vehículos */}
      {vehicles.length === 0 ? (
        <div className="card p-8 text-center">
          <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No tienes vehículos registrados
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar primer vehículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                      {vehicle.licensePlate}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {vehicleTypes.find(t => t.value === vehicle.type)?.label || 'Auto'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(vehicle)}
                    className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                {vehicle.brand && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Marca:</strong> {vehicle.brand}
                  </p>
                )}
                {vehicle.model && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Modelo:</strong> {vehicle.model}
                  </p>
                )}
                {vehicle.color && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Color:</strong> {vehicle.color}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para agregar/editar vehículo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Patente *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className="input-field uppercase"
                  placeholder="Ej: ABCD12"
                  required
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Vehículo
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  list="vehicle-brands"
                  className="input-field"
                  placeholder="Escribe o selecciona una marca"
                  autoComplete="off"
                />
                <datalist id="vehicle-brands">
                  {vehicleBrands.map(brand => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: Corolla"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: Blanco"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {editingVehicle ? 'Actualizar' : 'Agregar'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
