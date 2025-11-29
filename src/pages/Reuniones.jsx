import { useState, useEffect } from 'react';
import { Plus, Calendar, Users, FileText, CheckCircle2, Clock, Edit, Trash2, Download } from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { firestore } from '../services/firebase';

export default function Reuniones() {
  const [meetings, setMeetings] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    agenda: ''
  });

  // Attendance state
  const [attendance, setAttendance] = useState({});

  // Minutes state
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar casas
      const housesSnapshot = await getDocs(collection(firestore, 'houses'));
      const housesData = housesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtrar house0 (Portón) - solo para electricidad
      .filter(house => house.id !== 'house0');
      setHouses(housesData);

      // Cargar reuniones
      const meetingsQuery = query(
        collection(firestore, 'meetings'),
        orderBy('date', 'desc')
      );
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeetings(meetingsData);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.title || !formData.date || !formData.time) {
        setError('Completa todos los campos obligatorios');
        return;
      }

      // Inicializar attendance
      const initialAttendance = {};
      houses.forEach(house => {
        initialAttendance[house.id] = false;
      });

      const meetingData = {
        title: formData.title,
        description: formData.description,
        date: new Date(`${formData.date}T${formData.time}`),
        location: formData.location,
        agenda: formData.agenda,
        attendance: initialAttendance,
        minutes: '',
        status: 'scheduled', // scheduled, completed, cancelled
        createdAt: new Date(),
        createdBy: 'admin' // TODO: usar auth.currentUser
      };

      if (editingMeeting) {
        await updateDoc(doc(firestore, 'meetings', editingMeeting.id), meetingData);
      } else {
        await addDoc(collection(firestore, 'meetings'), meetingData);
      }

      await loadData();
      handleCloseModal();

    } catch (err) {
      console.error('Error al guardar reunión:', err);
      setError('Error al guardar la reunión');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    const meetingDate = meeting.date.toDate();
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      date: meetingDate.toISOString().split('T')[0],
      time: meetingDate.toTimeString().slice(0, 5),
      location: meeting.location || '',
      agenda: meeting.agenda || ''
    });
    setShowModal(true);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('¿Estás seguro de eliminar esta reunión?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(firestore, 'meetings', meetingId));
      await loadData();
    } catch (err) {
      console.error('Error al eliminar reunión:', err);
      setError('Error al eliminar la reunión');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAttendance = (meeting) => {
    setSelectedMeeting(meeting);
    setAttendance(meeting.attendance || {});
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);

      await updateDoc(doc(firestore, 'meetings', selectedMeeting.id), {
        attendance,
        status: 'completed'
      });

      await loadData();
      setShowAttendanceModal(false);
      setSelectedMeeting(null);

    } catch (err) {
      console.error('Error al guardar asistencia:', err);
      setError('Error al guardar asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMinutes = (meeting) => {
    setSelectedMeeting(meeting);
    setMinutes(meeting.minutes || '');
    setShowMinutesModal(true);
  };

  const handleSaveMinutes = async () => {
    try {
      setLoading(true);

      await updateDoc(doc(firestore, 'meetings', selectedMeeting.id), {
        minutes
      });

      await loadData();
      setShowMinutesModal(false);
      setSelectedMeeting(null);

    } catch (err) {
      console.error('Error al guardar acta:', err);
      setError('Error al guardar el acta');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeeting(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      agenda: ''
    });
    setError('');
  };

  const calculateAttendanceStats = (meeting) => {
    if (!meeting.attendance) return { present: 0, total: 0, percentage: 0 };

    const attendanceArray = Object.values(meeting.attendance);
    const present = attendanceArray.filter(a => a === true).length;
    const total = attendanceArray.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : 0;

    return { present, total, percentage };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400 bg-blue-900/30';
      case 'completed': return 'text-green-400 bg-green-900/30';
      case 'cancelled': return 'text-red-400 bg-red-900/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-gray-900/30';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reuniones</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestión de reuniones, asistencia y actas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Reunión
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {loading && meetings.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">Cargando reuniones...</div>
        ) : meetings.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No hay reuniones programadas</p>
            <p className="text-slate-600 dark:text-slate-400">Crea la primera reunión haciendo clic en "Nueva Reunión"</p>
          </div>
        ) : (
          meetings.map(meeting => {
            const stats = calculateAttendanceStats(meeting);
            return (
              <div key={meeting.id} className="card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{meeting.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {getStatusLabel(meeting.status)}
                      </span>
                    </div>
                    {meeting.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{meeting.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {meeting.date.toDate().toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {meeting.date.toDate().toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {meeting.location && (
                        <span>{meeting.location}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMeeting(meeting)}
                      className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Agenda */}
                {meeting.agenda && (
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Agenda</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.agenda}</p>
                  </div>
                )}

                {/* Attendance Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Asistencia</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {stats.present} de {stats.total} casas
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenAttendance(meeting)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Registrar Asistencia
                  </button>
                </div>

                {/* Minutes */}
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {meeting.minutes ? 'Acta Registrada' : 'Sin Acta'}
                      </p>
                      {meeting.minutes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {meeting.minutes.length} caracteres
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenMinutes(meeting)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    {meeting.minutes ? 'Editar Acta' : 'Redactar Acta'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingMeeting ? 'Editar Reunión' : 'Nueva Reunión'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Ej: Reunión Ordinaria Octubre 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Descripción breve..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Lugar
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="Ej: Salón de reuniones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Agenda (Temas a tratar)
                </label>
                <textarea
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  className="input"
                  rows={5}
                  placeholder="1. Revisión de cuentas&#10;2. Reparaciones pendientes&#10;3. Varios"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Guardando...' : editingMeeting ? 'Actualizar' : 'Crear Reunión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registrar Asistencia</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedMeeting.title}</p>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                {houses
                  .sort((a, b) => {
                    // Ordenar numéricamente extrayendo el número de houseX
                    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                    return numA - numB;
                  })
                  .map(house => {
                    // Formatear houseId para mostrar como "Parcela X" o "Portón"
                    const formatHouseId = (houseId) => {
                      // Caso especial: house0 = Portón
                      if (houseId === 'house0' || houseId === '0') {
                        return 'Portón';
                      }
                      const match = houseId.match(/house(\d+)/i);
                      if (match) {
                        return `Parcela ${parseInt(match[1])}`;
                      }
                      if (/^\d+$/.test(houseId)) {
                        return `Parcela ${houseId}`;
                      }
                      return houseId;
                    };

                    return (
                      <label
                        key={house.id}
                        className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={attendance[house.id] || false}
                          onChange={(e) => setAttendance({
                            ...attendance,
                            [house.id]: e.target.checked
                          })}
                          className="w-5 h-5"
                        />
                        <span className="text-slate-900 dark:text-white font-medium">{formatHouseId(house.id)}</span>
                        {house.owner && (
                          <span className="text-sm text-slate-600 dark:text-slate-400">- {house.owner}</span>
                        )}
                      </label>
                    );
                  })
                }
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAttendanceModal(false);
                  setSelectedMeeting(null);
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Guardando...' : 'Guardar Asistencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minutes Modal */}
      {showMinutesModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acta de Reunión</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedMeeting.title}</p>
            </div>

            <div className="p-6">
              <textarea
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="input"
                rows={15}
                placeholder="Redacta el acta de la reunión aquí...&#10;&#10;Ejemplo:&#10;&#10;ACTA DE REUNIÓN - [Fecha]&#10;&#10;Asistentes: [Lista]&#10;&#10;Temas tratados:&#10;1. ...&#10;2. ...&#10;&#10;Acuerdos:&#10;- ...&#10;- ..."
              />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {minutes.length} caracteres
              </p>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowMinutesModal(false);
                  setSelectedMeeting(null);
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMinutes}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Guardando...' : 'Guardar Acta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}












