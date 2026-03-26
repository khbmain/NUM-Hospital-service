import { useQuery } from '@apollo/client';
import { Link, useLocation } from 'react-router-dom';
import { MY_APPOINTMENTS } from '../graphql/queries';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Calendar, Plus, Clock, CheckCircle } from 'lucide-react';

export default function AppointmentListPage() {
  const location = useLocation();
  const showSuccess = location.state?.success;

  const { data, loading } = useQuery(MY_APPOINTMENTS, {
    variables: { limit: 50 },
  });

  const appointments = data?.getMyAppointments?.appointments || [];

  const upcoming = appointments.filter((a: any) =>
    ['scheduled', 'checked_in', 'in_progress'].includes(a.status)
  );
  const past = appointments.filter((a: any) =>
    ['completed', 'cancelled', 'no_show'].includes(a.status)
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <LoadingSpinner text="Ачааллаж байна..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-surface-900">Цаг захиалга</h1>
        <Link to="/appointments/book" className="btn-primary text-sm">
          <Plus size={14} /> Цаг захиалах
        </Link>
      </div>

      {showSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> Цаг амжилттай захиалагдлаа!
        </div>
      )}

      <section>
        <h2 className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-3">
          Товлосон ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title="Товлосон цаг байхгүй"
            action={
              <Link to="/appointments/book" className="btn-primary text-sm">
                <Plus size={14} /> Цаг захиалах
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt: any) => (
              <div key={appt._id} className="card flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium text-brand-600 uppercase">
                    {new Date(appt.scheduledDate).toLocaleDateString('mn-MN', { month: 'short' })}
                  </span>
                  <span className="text-xl font-display text-brand-800 leading-none">
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
                    <Clock size={12} /> {appt.scheduledTime}
                    {appt.doctor?.department?.name && ` · ${appt.doctor.department.name}`}
                  </p>
                  {appt.chiefComplaint && (
                    <p className="text-xs text-surface-400 mt-0.5 truncate">{appt.chiefComplaint}</p>
                  )}
                </div>
                {appt.queueNumber && (
                  <div className="text-center flex-shrink-0">
                    <span className="text-[10px] text-surface-400 block">Дугаар</span>
                    <span className="text-lg font-display text-brand-600">#{appt.queueNumber}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-3">
            Өмнөх ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map((appt: any) => (
              <div key={appt._id} className="card !p-4 flex items-center gap-3 opacity-75">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-surface-600">{formatDate(appt.scheduledDate)}</span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {appt.doctor?.userId?.firstname} · {appt.scheduledTime}
                  </p>
                  {appt.status === 'cancelled' && appt.cancelReason && (
                    <p className="text-xs text-red-500 mt-1">
                      Цуцалсан шалтгаан: {appt.cancelReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
