import { useQuery } from '@apollo/client';
import { ArrowLeft, Calendar, Clock, FileText, MapPin, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { GET_APPOINTMENT } from '../../graphql/queries';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    skip: !id,
  });

  const appointment = data?.getAppointment;
  const staffName =
    appointment?.doctor?.userId
      ? `${appointment.doctor.userId.lastname?.charAt(0) || ''}.${appointment.doctor.userId.firstname || ''}`
      : appointment?.assignedStaff?.userId
        ? `${appointment.assignedStaff.userId.lastname?.charAt(0) || ''}.${appointment.assignedStaff.userId.firstname || ''}`
        : '-';

  if (loading) return <LoadingSpinner text="Цаг захиалгын дэлгэрэнгүй ачааллаж байна..." />;
  if (error) return <p className="py-20 text-center text-sm text-red-600">{error.message}</p>;
  if (!appointment) return <p className="py-20 text-center text-sm text-surface-500">Цаг захиалгын мэдээлэл олдсонгүй</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft size={16} /> Буцах
      </button>

      <div className="card space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-display text-surface-900">{appointment.service?.name || 'Цаг захиалга'}</h1>
            <p className="mt-1 text-sm text-surface-500">
              {appointment.patient?.lastname?.charAt(0)}.{appointment.patient?.firstname} · {appointment.patient?.registrationNumber || '-'}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-surface-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-surface-400">
              <Calendar size={12} /> Огноо
            </p>
            <p className="text-sm font-medium text-surface-800">{formatDate(appointment.scheduledDate)}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-surface-400">
              <Clock size={12} /> Цаг
            </p>
            <p className="text-sm font-medium text-surface-800">{appointment.scheduledTime || '-'}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-surface-400">
              <UserRound size={12} /> Хариуцсан ажилтан
            </p>
            <p className="text-sm font-medium text-surface-800">{staffName}</p>
            <p className="mt-1 text-xs text-surface-500">{appointment.doctor?.specialization || appointment.assignedStaff?.specialization || '-'}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-surface-400">
              <MapPin size={12} /> Нөөц
            </p>
            <p className="text-sm font-medium text-surface-800">{appointment.resource?.name || '-'}</p>
            <p className="mt-1 text-xs text-surface-500">{appointment.resource?.room ? `Өрөө ${appointment.resource.room}` : appointment.resource?.type || '-'}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Өвчтөн</p>
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700">
                <p className="font-medium text-surface-800">{appointment.patient?.lastname} {appointment.patient?.firstname}</p>
                <p className="mt-1">Утас: {appointment.patient?.phone || '-'}</p>
                <p className="mt-1">Регистр / код: {appointment.patient?.registrationNumber || '-'}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Үйлчилгээ</p>
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700">
                <p className="font-medium text-surface-800">{appointment.service?.name || '-'}</p>
                <p className="mt-1">Ангилал: {appointment.service?.category || appointment.appointmentKind || '-'}</p>
                {appointment.queueNumber ? <p className="mt-1">Дугаар: #{appointment.queueNumber}</p> : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Цагийн мэдээлэл</p>
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700">
                <p>Эхлэх: {formatDateTime(appointment.scheduledStart)}</p>
                <p className="mt-1">Дуусах: {formatDateTime(appointment.scheduledEnd)}</p>
                <p className="mt-1">Үүсгэсэн: {formatDateTime(appointment.createdAt)}</p>
              </div>
            </div>

            {appointment.chiefComplaint && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Шалтгаан</p>
                <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700">
                  {appointment.chiefComplaint}
                </div>
              </div>
            )}

            {appointment.notes && (
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-surface-400">
                  <FileText size={12} /> Тэмдэглэл
                </p>
                <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700">
                  {appointment.notes}
                </div>
              </div>
            )}

            {appointment.cancelReason && (
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Цуцалсан шалтгаан</p>
                <p className="text-sm text-surface-700">{appointment.cancelReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
