import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { firestore } from "../services/firebase";
import { Key, Phone, Loader, AlertCircle, Edit2, Save, X } from "lucide-react";

const GateNumbersList = ({ houseId }) => {
  const [gateNumbers, setGateNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (houseId) {
      loadGateNumbers();
    }
  }, [houseId]);

  const loadGateNumbers = async () => {
    try {
      setLoading(true);
      setError(null);

      const gateRef = collection(firestore, "gateNumbers");
      const q = query(gateRef, where("houseId", "==", houseId));
      const snapshot = await getDocs(q);

      const numbers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const numA = parseInt(a.number) || 0;
        const numB = parseInt(b.number) || 0;
        return numA - numB;
      });

      setGateNumbers(numbers);
    } catch (err) {
      console.error("Error al cargar números de portón:", err);
      setError("Error al cargar los números de acceso");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (number) => {
    setEditingId(number.id);
    setEditNotes(number.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNotes("");
  };

  const saveEdit = async (id) => {
    try {
      const gateDocRef = doc(firestore, "gateNumbers", id);
      await updateDoc(gateDocRef, {
        notes: editNotes.trim(),
        updatedAt: new Date().toISOString()
      });

      setGateNumbers(gateNumbers.map(num => 
        num.id === id ? { ...num, notes: editNotes.trim() } : num
      ));
      
      cancelEdit();
      alert("✅ Notas actualizadas correctamente");
    } catch (err) {
      console.error("Error al actualizar notas:", err);
      alert("❌ Error al actualizar las notas");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <Key className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Números de Acceso al Portón
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
              Estos son los números asignados a su parcela para acceder al portón de la comunidad.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {gateNumbers.length} {gateNumbers.length === 1 ? "número asignado" : "números asignados"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {gateNumbers.length === 0 ? (
        <div className="card p-8 text-center">
          <Key className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No hay números asignados
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Su parcela aún no tiene números de acceso al portón asignados.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Contacte al administrador para solicitar la asignación de números.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateNumbers.map((number) => (
            <div
              key={number.id}
              className="card p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Número de Acceso</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {number.number}
                  </p>
                </div>
              </div>

              {number.phoneNumber && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {number.phoneNumber}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Notas:</p>
                  {editingId !== number.id && (
                    <button
                      onClick={() => startEdit(number)}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                      title="Editar notas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editingId === number.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Ej: Juan Pérez"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(number.id)}
                        className="btn-primary text-xs px-3 py-1 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {number.notes || "Sin notas"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-6 bg-slate-50 dark:bg-slate-800">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
          Información Importante
        </h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 dark:text-primary-400 font-bold"></span>
            <span>El número del Porton es exclusivo de la Comunidad y no deben ser compartidos con terceros.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 dark:text-primary-400 font-bold"></span>
            <span>Para reportar pérdida o problemas con los números de acceso, contacte al Presidente.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 dark:text-primary-400 font-bold"></span>
            <span>Si necesita números adicionales, puede solicitarlos a través de la administración. (Debe cancelar una Cuota Especial)</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GateNumbersList;
