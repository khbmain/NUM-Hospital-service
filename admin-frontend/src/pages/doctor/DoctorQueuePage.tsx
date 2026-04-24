import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../hooks/useAuth';
import { DOCTOR_QUEUE, LIST_STAFF } from '../../graphql/queries';
import { CREATE_VISIT, START_APPOINTMENT } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Stethoscope, Play, Clock, X } from 'lucide-react';

export default function DoctorQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState('');
  const [startingId, setStartingId] = useState('');
  const [error, setError] = useState('');
  const [queueDate] = useState(() => new Date().toISOString());

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
  } = useQuery(LIST_STAFF, {
    variables: { staffType: 'doctor' },
  });

  useEffect(() => {
    if (!staffData?.listStaff || !user?._id) return;
    const myStaff = staffData.listStaff.find((staff: any) => staff.userId?._id === user._id);
    setStaffId(myStaff?._id || '');
  }, [staffData, user?._id]);

  const {
    data,
    loading,
    error: queueError,
    refetch,
  } = useQuery(DOCTOR_QUEUE, {
    variables: { doctorId: staffId, date: queueDate },
    skip: !staffId,
    pollInterval: 15000,
  });

  const [startAppt] = useMutation(START_APPOINTMENT);
  const [createVisit] = useMutation(CREATE_VISIT);

  const queue = data?.getDoctorQueue || [];
  const hasInitialStaffData = Boolean(staffData || staffError);
  const isInitialLoading = !hasInitialStaffData || (!!staffId && loading && !data);
  const pageError = error || staffError?.message || queueError?.message || '';

  const hasStaffRecord = useMemo(() => {
    if (!staffData?.listStaff || !user?._id) return false;
    return staffData.listStaff.some((staff: any) => staff.userId?._id === user._id);
  }, [staffData, user?._id]);

  const handleStartExam = async (appointment: any) => {
    setError('');
    setStartingId(appointment._id);
    try {
      if (appointment.status === 'scheduled' || appointment.status === 'checked_in') {
        await startAppt({ variables: { id: appointment._id } });
      }

      const { data: visitData } = await createVisit({
        variables: {
          input: {
            appointmentId: appointment._id,
            patientId: appointment.patient._id,
            chiefComplaint: appointment.chiefComplaint,
          },
        },
      });

      await refetch();
      navigate(`/doctor/examine/${visitData.createVisit._id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStartingId('');
    }
  };

  if (isInitialLoading) {
    return <LoadingSpinner text="Дараалал ачааллаж байна..." />;
  }

  if (!hasStaffRecord && !staffLoading) {
    return (
      <EmptyState
        icon={<Stethoscope size={40} />}
        title="Эмчийн бүртгэл олдсонгүй"
        description="Энэ хэрэглэгч staff бүртгэлтэй холбогдоогүй байна."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display text-surface-900">Өнөөдрийн дараалал</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="stat-card !p-3 text-center min-w-16">
          <div className="stat-value text-lg">{queue.length}</div>
          <div className="stat-label">Нийт</div>
        </div>
      </div>

      {pageError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{pageError}</span>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700" aria-label="Алдаа хаах">
            <X size={14} />
          </button>
        </div>
      )}

      {queue.length === 0 ? (
        <EmptyState icon={<Clock size={40} />} title="Өнөөдөр хүлээж буй өвчтөн байхгүй" />
      ) : (
        <div className="space-y-3">
          {queue.map((appointment: any) => (
            <div key={appointment._id} className="card flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <span className="text-lg font-display text-brand-700">#{appointment.queueNumber || '-'}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-800">
                    {appointment.patient?.lastname?.charAt(0)}.{appointment.patient?.firstname}
                  </span>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="text-xs text-surface-500">
                  {appointment.patient?.registrationNumber} · {appointment.scheduledTime}
                  {appointment.patient?.gender && ` · ${appointment.patient.gender === 'male' ? 'Эр' : 'Эм'}`}
                </p>
                {appointment.chiefComplaint && (
                  <p className="mt-0.5 truncate text-xs text-surface-400">{appointment.chiefComplaint}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {(appointment.status === 'scheduled' || appointment.status === 'checked_in') && (
                  <button
                    type="button"
                    onClick={() => handleStartExam(appointment)}
                    disabled={startingId === appointment._id}
                    className="btn-primary text-xs"
                  >
                    <Play size={13} /> {startingId === appointment._id ? 'Эхлүүлж байна...' : 'Үзлэг эхлэх'}
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => handleStartExam(appointment)}
                    disabled={startingId === appointment._id}
                    className="btn-secondary text-xs"
                  >
                    <Stethoscope size={13} /> {startingId === appointment._id ? 'Нээж байна...' : 'Үргэлжлүүлэх'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
