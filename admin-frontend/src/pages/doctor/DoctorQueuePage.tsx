import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../hooks/useAuth';
import { DOCTOR_QUEUE, LIST_STAFF } from '../../graphql/queries';
import { CREATE_VISIT, START_APPOINTMENT } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Play, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DoctorQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState('');

  const { data: staffData } = useQuery(LIST_STAFF, {
    variables: { staffType: 'doctor' },
  });

  useEffect(() => {
    if (staffData?.listStaff) {
      const myStaff = staffData.listStaff.find((s: any) => s.userId?._id === user?._id);
      if (myStaff) setStaffId(myStaff._id);
    }
  }, [staffData, user]);

  const today = new Date().toISOString();
  const { data, loading } = useQuery(DOCTOR_QUEUE, {
    variables: { doctorId: staffId, date: today },
    skip: !staffId,
    pollInterval: 15000,
  });

  const [startAppt] = useMutation(START_APPOINTMENT);
  const [createVisit] = useMutation(CREATE_VISIT);

  const queue = data?.getDoctorQueue || [];

  const handleStartExam = async (appointment: any) => {
    try {
      if (appointment.status === 'checked_in') {
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
      navigate(`/doctor/examine/${visitData.createVisit._id}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!staffId && !loading) {
    return <EmptyState icon={<Stethoscope size={40} />} title="Эмчийн бүртгэл олдсонгүй" description="Систем админтай холбогдоно уу" />;
  }

  if (loading) return <LoadingSpinner text="Дараалал ачааллаж байна..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display text-surface-900">Өнөөдрийн дараалал</h1>
          <p className="text-sm text-surface-500 mt-0.5">{new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="stat-card !p-3 text-center">
          <div className="stat-value text-lg">{queue.length}</div>
          <div className="stat-label">Нийт</div>
        </div>
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={<Clock size={40} />} title="Өнөөдөр хүлээж буй өвчтөн байхгүй" />
      ) : (
        <div className="space-y-3">
          {queue.map((appt: any) => (
            <div key={appt._id} className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-display text-brand-700">#{appt.queueNumber || '–'}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-surface-800 text-sm">
                    {appt.patient?.lastname?.charAt(0)}.{appt.patient?.firstname}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>
                <p className="text-xs text-surface-500">
                  {appt.patient?.registrationNumber} · {appt.scheduledTime}
                  {appt.patient?.gender && ` · ${appt.patient.gender === 'male' ? 'Эр' : 'Эм'}`}
                </p>
                {appt.chiefComplaint && (
                  <p className="text-xs text-surface-400 mt-0.5 truncate">{appt.chiefComplaint}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {appt.status === 'checked_in' && (
                  <button onClick={() => handleStartExam(appt)} className="btn-primary text-xs">
                    <Play size={13} /> Үзлэг эхлэх
                  </button>
                )}
                {appt.status === 'in_progress' && (
                  <button onClick={() => handleStartExam(appt)} className="btn-secondary text-xs">
                    <Stethoscope size={13} /> Үргэлжлүүлэх
                  </button>
                )}
                {appt.status === 'scheduled' && (
                  <span className="text-xs text-surface-400">Бүртгэл хүлээгдэж байна</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
