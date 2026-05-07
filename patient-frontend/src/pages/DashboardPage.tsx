import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MY_APPOINTMENTS, MY_VISITS } from '../graphql/queries';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Calendar,
  Plus,
  Stethoscope,
  Pill,
  ArrowRight,
  Clock,
  User as UserIcon,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: apptData, loading: apptLoading } = useQuery(MY_APPOINTMENTS, {
    variables: { limit: 3 },
  });

  const { data: visitData, loading: visitLoading } = useQuery(MY_VISITS, {
    variables: { limit: 3 },
  });

  const appointments = apptData?.getMyAppointments?.appointments || [];
  const visits = visitData?.getMyVisitHistory || [];

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-surface-900">
          Сайн байна уу, {user?.firstname}
        </h1>
        <p className="text-surface-500 mt-1">NUM эмнэлгийн өвчтөний портал</p>
      </div>

      {/* Primary action */}
      <div className="card !p-4 md:!p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="text-base font-display text-surface-900">Цаг захиалга</h2>
              <p className="mt-0.5 text-sm text-surface-500">Эмнэлгийн үйлчилгээ, өдөр, цаг сонгоно.</p>
            </div>
          </div>
          <Link to="/appointments/book" className="btn-primary w-full text-sm md:w-auto">
            <Plus size={14} /> Цаг захиалах
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-surface-200 pt-4">
          {[
            { label: 'Миний цагууд', icon: Calendar, path: '/appointments' },
            { label: 'Үзлэгийн түүх', icon: Stethoscope, path: '/visits' },
            { label: 'Жор', icon: Pill, path: '/prescriptions' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-2 text-center text-xs font-medium text-surface-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display text-surface-900">Товлосон цагууд</h2>
          <Link to="/appointments" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            Бүгдийг харах <ArrowRight size={14} />
          </Link>
        </div>

        {apptLoading ? (
          <LoadingSpinner />
        ) : appointments.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 text-sm">Товлосон цаг байхгүй</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt: any) => (
              <Link key={appt._id} to={`/appointments/${appt._id}`} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-brand-700">
                    {new Date(appt.scheduledDate).toLocaleDateString('mn-MN', { month: 'short' })}
                  </span>
                  <span className="text-lg font-display text-brand-800 leading-none">
                    {new Date(appt.scheduledDate).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-surface-800 text-sm">
                      {appt.doctor?.userId?.lastname?.charAt(0)}.{appt.doctor?.userId?.firstname}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-xs text-surface-500 flex items-center gap-1">
                    <Clock size={12} />
                    {appt.scheduledTime} · {appt.doctor?.department?.name || appt.doctor?.specialization}
                  </p>
                  {appt.chiefComplaint && (
                    <p className="text-xs text-surface-400 mt-0.5 truncate">{appt.chiefComplaint}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Visits */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display text-surface-900">Сүүлийн үзлэгүүд</h2>
          <Link to="/visits" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            Бүгдийг харах <ArrowRight size={14} />
          </Link>
        </div>

        {visitLoading ? (
          <LoadingSpinner />
        ) : visits.length === 0 ? (
          <div className="card text-center py-10">
            <Stethoscope size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 text-sm">Үзлэгийн түүх байхгүй</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit: any) => (
              <Link key={visit._id} to={`/visits/${visit._id}`} className="card block hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-800">
                    {formatDate(visit.visitDate)}
                  </span>
                  <StatusBadge status={visit.status} />
                </div>
                <p className="text-xs text-surface-500">
                  {visit.doctor?.userId?.lastname?.charAt(0)}.{visit.doctor?.userId?.firstname} · {visit.doctor?.department?.name}
                </p>
                {visit.assessment && (
                  <p className="text-sm text-surface-700 mt-2 line-clamp-2">{visit.assessment}</p>
                )}
                {visit.diagnoses?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {visit.diagnoses.map((d: any) => (
                      <span key={d._id} className="badge bg-surface-100 text-surface-600">{d.name}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
