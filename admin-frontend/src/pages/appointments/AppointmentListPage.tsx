import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { LIST_APPOINTMENTS } from '../../graphql/queries';
import { CANCEL_APPOINTMENT } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AppModal from '../../components/common/AppModal';
import { Eye, X } from 'lucide-react';

export default function AppointmentListPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

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

  const [cancel, { loading: cancelling }] = useMutation(CANCEL_APPOINTMENT);

  const appointments = data?.listAppointments?.appointments || [];
  const total = data?.listAppointments?.total || 0;

  const openCancelModal = (appointment: any) => {
    setCancelTarget(appointment);
    setCancelReason('');
    setCancelError('');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Цуцлах шалтгаан заавал оруулна');
      return;
    }
    await cancel({ variables: { id: cancelTarget._id, reason: cancelReason.trim() } });
    setCancelTarget(null);
    refetch();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-display text-surface-900">Цаг захиалга</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field w-auto" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">Бүх төлөв</option>
          <option value="scheduled">Товлосон</option>
          <option value="checked_in">Бүртгэгдсэн</option>
          <option value="in_progress">Үзлэгт</option>
          <option value="completed">Дууссан</option>
          <option value="cancelled">Цуцлагдсан</option>
        </select>
        <span className="text-xs text-surface-500">{total} үр дүн</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center text-sm text-surface-400">Цаг захиалга олдсонгүй</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Өвчтөн</th>
                <th>Цаг</th>
                <th>Үйлчилгээ</th>
                <th>Нөөц</th>
                <th>Эмч</th>
                <th>Тасаг</th>
                <th>Төлөв</th>
                <th>Шалтгаан</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a: any) => (
                <tr key={a._id}>
                  <td className="font-medium text-surface-400">{a.queueNumber || '-'}</td>
                  <td>
                    <div className="font-medium text-surface-800">{a.patient?.lastname?.charAt(0)}.{a.patient?.firstname}</div>
                    <div className="text-[10px] text-surface-400">{a.patient?.registrationNumber}</div>
                  </td>
                  <td className="font-medium">{a.scheduledTime}</td>
                  <td className="text-surface-600">{a.service?.name || a.appointmentKind || '-'}</td>
                  <td className="text-xs text-surface-500">{a.resource?.name || '-'}</td>
                  <td className="text-surface-600">{a.doctor?.userId?.firstname || a.assignedStaff?.userId?.firstname || '-'}</td>
                  <td className="text-xs text-surface-500">{a.doctor?.department?.name || '-'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="max-w-[220px]">
                    {a.cancelReason ? (
                      <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-surface-400">Цуцлах шалтгаан</p>
                        <p className="mt-1 text-xs leading-snug text-surface-600">{a.cancelReason}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-surface-300">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/appointments/${a._id}`} className="btn-ghost text-xs" title="Дэлгэрэнгүй">
                        <Eye size={13} />
                      </Link>
                      {['scheduled', 'checked_in'].includes(a.status) && (
                        <button onClick={() => openCancelModal(a)} className="btn-ghost text-xs text-red-500 hover:bg-red-50" title="Цуцлах">
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

      <AppModal
        open={Boolean(cancelTarget)}
        title="Цаг цуцлах"
        description={cancelTarget ? `${cancelTarget.patient?.lastname?.charAt(0)}.${cancelTarget.patient?.firstname} - ${cancelTarget.scheduledTime} цагийн захиалгыг цуцлах гэж байна.` : undefined}
        confirmLabel="Цуцлах"
        tone="danger"
        loading={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-surface-700">Цуцлах шалтгаан</span>
          <textarea
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              setCancelError('');
            }}
            rows={3}
            className="input-field resize-none"
            placeholder="Жишээ: өвчтөн өөрөө цуцалсан, эмчийн цаг өөрчлөгдсөн..."
          />
        </label>
        {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
      </AppModal>
    </div>
  );
}
