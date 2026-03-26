import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LIST_APPOINTMENTS } from '../../graphql/queries';
import { CHECK_IN_APPOINTMENT, CANCEL_APPOINTMENT } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CheckSquare, X } from 'lucide-react';

export default function AppointmentListPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [statusFilter, setStatusFilter] = useState('');

  const dateFrom = dateFilter ? new Date(`${dateFilter}T00:00:00.000Z`).toISOString() : undefined;
  const dateTo = dateFilter ? new Date(`${dateFilter}T23:59:59.999Z`).toISOString() : undefined;

  const { data, loading, refetch } = useQuery(LIST_APPOINTMENTS, {
    variables: {
      filter: {
        dateFrom,
        dateTo,
        status: statusFilter || undefined,
        limit: 50,
      },
    },
  });

  const [checkIn] = useMutation(CHECK_IN_APPOINTMENT);
  const [cancel] = useMutation(CANCEL_APPOINTMENT);

  const appointments = data?.listAppointments?.appointments || [];
  const total = data?.listAppointments?.total || 0;

  const handleCheckIn = async (id: string) => {
    await checkIn({ variables: { id } });
    refetch();
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Цуцлах шалтгаанаа оруулна уу');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Цуцлах шалтгаан заавал оруулна');
      return;
    }
    await cancel({ variables: { id, reason: reason.trim() } });
    refetch();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-display text-surface-900">Цаг захиалга</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input-field w-auto" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">Бүх төлөв</option>
          <option value="scheduled">Товлосон</option>
          <option value="checked_in">Бүртгэгдсэн</option>
          <option value="in_progress">Үзлэгт</option>
          <option value="completed">Дууссан</option>
          <option value="cancelled">Цуцлагдсан</option>
        </select>
        <span className="text-xs text-surface-500">{total} үр дүн</span>
      </div>

      {loading ? <LoadingSpinner /> : appointments.length === 0 ? (
        <div className="text-center py-16 text-surface-400 text-sm">Цаг захиалга олдсонгүй</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Өвчтөн</th>
                <th>Цаг</th>
                <th>Эмч</th>
                <th>Тасаг</th>
                <th>Төлөв</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a: any) => (
                <tr key={a._id}>
                  <td className="text-surface-400 font-medium">{a.queueNumber || '–'}</td>
                  <td>
                    <div className="font-medium text-surface-800">{a.patient?.lastname?.charAt(0)}.{a.patient?.firstname}</div>
                    <div className="text-[10px] text-surface-400">{a.patient?.registrationNumber}</div>
                  </td>
                  <td className="font-medium">{a.scheduledTime}</td>
                  <td className="text-surface-600">{a.doctor?.userId?.firstname}</td>
                  <td className="text-surface-500 text-xs">{a.doctor?.department?.name || '–'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {a.status === 'scheduled' && (
                        <button onClick={() => handleCheckIn(a._id)} className="btn-ghost text-xs text-emerald-600 hover:bg-emerald-50">
                          <CheckSquare size={13} /> Бүртгэх
                        </button>
                      )}
                      {['scheduled', 'checked_in'].includes(a.status) && (
                        <button onClick={() => handleCancel(a._id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
