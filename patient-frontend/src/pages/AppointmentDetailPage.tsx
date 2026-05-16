import { useQuery } from '@apollo/client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, Stethoscope } from 'lucide-react';
import { GET_APPOINTMENT, MY_VISIT_BY_APPOINTMENT } from '../graphql/queries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getAppointmentOwner(appointment: any) {
  if (appointment.doctor?.userId) {
    return {
      name: `${appointment.doctor.userId.lastname?.charAt(0) || ''}.${appointment.doctor.userId.firstname || 'Эмч'}`,
      detail: appointment.doctor.department?.name || appointment.doctor.specialization || '',
    };
  }
  if (appointment.assignedStaff?.userId) {
    return {
      name: `${appointment.assignedStaff.userId.lastname?.charAt(0) || ''}.${appointment.assignedStaff.userId.firstname || 'Ажилтан'}`,
      detail: appointment.assignedStaff.department?.name || appointment.assignedStaff.specialization || '',
    };
  }
  if (appointment.resource?.name) {
    return {
      name: appointment.resource.name,
      detail: appointment.resource.room || (appointment.resource.type === 'device' ? 'Төхөөрөмж' : 'Нөөц'),
    };
  }
  return { name: appointment.service?.name || 'Цагийн дэлгэрэнгүй', detail: '' };
}

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    skip: !id,
  });
  const { data: visitData, loading: visitLoading } = useQuery(MY_VISIT_BY_APPOINTMENT, {
    variables: { appointmentId: id },
    skip: !id,
  });

  const appointment = data?.getAppointment;
  const visit = visitData?.getMyVisitByAppointment;

  if (loading) return <LoadingSpinner text="Цагийн мэдээлэл ачааллаж байна..." />;
  if (error) return <p className="py-20 text-center text-sm text-red-600">{error.message}</p>;
  if (!appointment) return <p className="py-20 text-center text-sm text-surface-500">Цагийн мэдээлэл олдсонгүй</p>;
  const owner = getAppointmentOwner(appointment);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft size={16} /> Буцах
      </button>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-display text-surface-900">{appointment.service?.name || 'Цагийн дэлгэрэнгүй'}</h1>
            <p className="mt-1 text-sm text-surface-500">
              {owner.name}{owner.detail && ` · ${owner.detail}`}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
            <p className="text-sm font-medium text-surface-800">{appointment.scheduledTime}</p>
          </div>
        </div>

        {appointment.queueNumber && (
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-xs uppercase tracking-wider text-brand-500">Дугаар</p>
            <p className="mt-1 text-2xl font-display text-brand-700">#{appointment.queueNumber}</p>
          </div>
        )}

        {appointment.chiefComplaint && (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Шалтгаан</p>
            <p className="text-sm text-surface-700">{appointment.chiefComplaint}</p>
          </div>
        )}

        {appointment.notes && (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Тэмдэглэл</p>
            <p className="text-sm text-surface-700">{appointment.notes}</p>
          </div>
        )}

        {appointment.cancelReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-red-500">Цуцлагдсан шалтгаан</p>
            <p className="text-sm text-red-700">{appointment.cancelReason}</p>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-display text-surface-900">Үзлэгийн мэдээлэл</h2>
          {visit?._id && (
            <Link to={`/visits/${visit._id}`} className="btn-secondary text-sm">
              <Stethoscope size={14} /> Дэлгэрэнгүй
            </Link>
          )}
        </div>

        {visitLoading ? (
          <LoadingSpinner text="Үзлэгийн мэдээлэл шалгаж байна..." />
        ) : !visit ? (
          <div className="rounded-xl bg-surface-50 p-4 text-sm text-surface-500">
            Энэ цагтай холбогдсон үзлэгийн бүртгэл одоогоор алга.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-surface-800">{formatDate(visit.visitDate)}</p>
                <p className="text-xs text-surface-500">
                  {visit.doctor?.userId?.lastname?.charAt(0)}.{visit.doctor?.userId?.firstname}
                  {visit.doctor?.department?.name && ` · ${visit.doctor.department.name}`}
                </p>
              </div>
              <StatusBadge status={visit.status} />
            </div>

            {visit.assessment && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Дүгнэлт</p>
                <p className="text-sm text-surface-700">{visit.assessment}</p>
              </div>
            )}

            {visit.plan && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-surface-400">Төлөвлөгөө</p>
                <p className="text-sm text-surface-700">{visit.plan}</p>
              </div>
            )}

            {visit.diagnoses?.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-surface-400">Онош</p>
                <div className="flex flex-wrap gap-2">
                  {visit.diagnoses.map((diagnosis: any) => (
                    <span key={diagnosis._id} className="badge bg-purple-50 text-purple-700">
                      {diagnosis.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {visit.prescriptions?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-surface-400">
                  <FileText size={12} /> Жор
                </p>
                <div className="space-y-2">
                  {visit.prescriptions.map((rx: any) => (
                    <div key={rx._id} className="rounded-xl bg-amber-50/60 p-3">
                      <p className="text-xs font-medium text-brand-600">{rx.prescriptionNumber}</p>
                      {rx.items?.slice(0, 3).map((item: any, index: number) => (
                        <p key={index} className="mt-1 text-sm text-surface-700">
                          {item.medicationName} · {item.dosage} · {item.frequency}
                          {item.unit && ` · ${item.unit}`}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
