import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { Calendar, Clock, MapPin, Users, AlertCircle } from 'lucide-react';

const UpcomingMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const meetingsRef = collection(firestore, 'meetings');
        
        // Cargar reuniones futuras
        const meetingsQuery = query(meetingsRef);
        const snapshot = await getDocs(meetingsQuery);
        
        const meetingsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(meeting => {
            // Filtrar solo reuniones futuras
            const meetingDate = meeting.date?.toDate?.() || new Date(meeting.date);
            return meetingDate >= now;
          })
          .sort((a, b) => {
            // Ordenar por fecha ascendente (más próxima primero)
            const dateA = a.date?.toDate?.() || new Date(a.date);
            const dateB = b.date?.toDate?.() || new Date(b.date);
            return dateA - dateB;
          })
          .slice(0, 3); // Mostrar solo las 3 próximas

        setMeetings(meetingsData);
      } catch (err) {
        console.error('Error loading meetings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const meetingDate = date?.toDate?.() || new Date(date);
    return meetingDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const meetingDate = date?.toDate?.() || new Date(date);
    return meetingDate.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const meetingDate = date?.toDate?.() || new Date(date);
    const now = new Date();
    const diffTime = meetingDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Próximas Reuniones
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Próximas Reuniones
          </h2>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            No hay reuniones programadas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Próximas Reuniones
        </h2>
      </div>

      <div className="space-y-3">
        {meetings.map((meeting) => {
          const daysUntil = getDaysUntil(meeting.date);
          const isUrgent = daysUntil !== null && daysUntil <= 3;

          return (
            <div
              key={meeting.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                isUrgent
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white flex-1">
                  {meeting.title || 'Reunión de Comunidad'}
                </h3>
                {isUrgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <AlertCircle className="w-3 h-3" />
                    Próximamente
                  </span>
                )}
              </div>

              {meeting.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {meeting.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span>{formatDate(meeting.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span>{formatTime(meeting.date)}</span>
                </div>

                {meeting.location && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 md:col-span-2">
                    <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span>{meeting.location}</span>
                  </div>
                )}

                {meeting.type && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="capitalize">{meeting.type}</span>
                  </div>
                )}
              </div>

              {daysUntil !== null && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {daysUntil === 0
                      ? '¡Hoy!'
                      : daysUntil === 1
                      ? 'Mañana'
                      : `En ${daysUntil} días`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingMeetings;
