import { useQuery } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { LIST_APPOINTMENTS } from '../graphql/queries';
import StatusBadge from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { Users, Calendar, Stethoscope, Clock, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const dateFrom = new Date(`${today}T00:00:00.000Z`).toISOString();
  const dateTo = new Date(`${today}T23:59:59.999Z`).toISOString();

  const { data: apptData } = useQuery(LIST_APPOINTMENTS, {
    variables: { filter: { dateFrom, dateTo, limit: 10 } },
  });

  const appointments = apptData?.listAppointments?.appointments || [];
  const totalAppt = apptData?.listAppointments?.total || 0;
  const checkedIn = appointments.filter((a: any) => a.status === 'checked_in').length;
  const inProgress = appointments.filter((a: any) => a.status === 'in_progress').length;
  const completed = appointments.filter((a: any) => a.status === 'completed').length;

  const ROLE_GREETINGS: Record<string, string> = {
    superadmin: 'Системийн удирдлага',
    doctor: 'Эмчийн самбар',
    nurse: 'Сувилагчийн самбар',
    data_operator: 'Бүртгэлийн самбар',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-surface-900">
          Сайн байна уу, {user?.firstname}
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">{ROLE_GREETINGS[user?.role || '']}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-blue-500" />
          </div>
          <div className="stat-value">{totalAppt}</div>
          <div className="stat-label">Өнөөдрийн цаг</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="stat-value">{checkedIn}</div>
          <div className="stat-label">Бүртгэгдсэн</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope size={16} className="text-purple-500" />
          </div>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">Үзлэгт</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-emerald-500" />
          </div>
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Дууссан</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {hasRole('data_operator', 'superadmin') && (
          <Link to="/patients?action=new" className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Users size={18} className="text-teal-600" /></div>
            <div className="flex-1"><p className="text-sm font-medium text-surface-800">Өвчтөн бүртгэх</p><p className="text-xs text-surface-400">Шинэ өвчтөн нэмэх</p></div>
            <ArrowRight size={14} className="text-surface-300" />
          </Link>
        )}
        {hasRole('data_operator', 'superadmin') && (
          <Link to="/appointments" className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Calendar size={18} className="text-blue-600" /></div>
            <div className="flex-1"><p className="text-sm font-medium text-surface-800">Цаг удирдах</p><p className="text-xs text-surface-400">Бүртгэл, захиалга</p></div>
            <ArrowRight size={14} className="text-surface-300" />
          </Link>
        )}
        {hasRole('doctor') && (
          <Link to="/doctor/queue" className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Stethoscope size={18} className="text-purple-600" /></div>
            <div className="flex-1"><p className="text-sm font-medium text-surface-800">Өвчтөн хүлээн авах</p><p className="text-xs text-surface-400">Өнөөдрийн дараалал</p></div>
            <ArrowRight size={14} className="text-surface-300" />
          </Link>
        )}
      </div>

      {appointments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-surface-500 uppercase tracking-wider">Өнөөдрийн цагууд</h2>
            <Link to="/appointments" className="text-xs text-brand-600 hover:text-brand-700 font-medium">Бүгдийг харах</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Өвчтөн</th>
                  <th>Цаг</th>
                  <th>Эмч</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 8).map((a: any) => (
                  <tr key={a._id}>
                    <td className="font-medium text-surface-500">{a.queueNumber || '–'}</td>
                    <td>
                      <span className="font-medium text-surface-800">{a.patient?.lastname?.charAt(0)}.{a.patient?.firstname}</span>
                      <span className="text-xs text-surface-400 ml-1">{a.patient?.registrationNumber}</span>
                    </td>
                    <td>{a.scheduledTime}</td>
                    <td className="text-surface-500">{a.doctor?.userId?.firstname}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
