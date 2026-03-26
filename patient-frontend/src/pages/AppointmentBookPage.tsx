import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { LIST_DEPARTMENTS, GET_DOCTORS, AVAILABLE_SLOTS, MY_PATIENT_PROFILE } from '../graphql/queries';
import { CREATE_APPOINTMENT } from '../graphql/mutations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, ArrowRight, Check, Building2, UserCheck, Clock, CalendarDays } from 'lucide-react';

const steps = ['Тасаг', 'Эмч', 'Өдөр & Цаг', 'Баталгаажуулах'];

export default function AppointmentBookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [complaint, setComplaint] = useState('');
  const [error, setError] = useState('');

  const { data: deptData, loading: deptLoading } = useQuery(LIST_DEPARTMENTS);
  const { data: doctorData, loading: doctorLoading } = useQuery(GET_DOCTORS, {
    variables: { departmentId: departmentId || undefined },
    skip: step < 1,
  });
  const { data: patientData } = useQuery(MY_PATIENT_PROFILE);
  const { data: slotData, loading: slotLoading, error: slotError } = useQuery(AVAILABLE_SLOTS, {
    variables: { doctorId, date: date ? new Date(date).toISOString() : '' },
    skip: !doctorId || !date,
  });

  const [createAppointment, { loading: creating }] = useMutation(CREATE_APPOINTMENT);

  const departments = deptData?.listDepartments || [];
  const doctors = doctorData?.getDoctors || [];
  const slots = slotData?.getAvailableSlots || [];
  const patient = patientData?.getMyPatientProfile;

  const handleSubmit = async () => {
    if (!patient) {
      setError('Өвчтөний бүртгэл олдсонгүй. Бүртгэлийн ажилтантай холбогдоно уу.');
      return;
    }
    try {
      await createAppointment({
        variables: {
          input: {
            patientId: patient._id,
            doctorId,
            departmentId: departmentId || undefined,
            scheduledDate: new Date(date).toISOString(),
            scheduledTime: time,
            chiefComplaint: complaint || undefined,
          },
        },
      });
      navigate('/appointments', { state: { success: true } });
    } catch (err: any) {
      setError(err.message || 'Цаг захиалахад алдаа гарлаа');
    }
  };

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft size={16} /> Буцах
      </button>
      <h1 className="text-2xl font-display text-surface-900 mb-6">Цаг захиалах</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              i <= step ? 'bg-brand-500 text-white' : 'bg-surface-200 text-surface-500'
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-brand-700' : 'text-surface-400'}`}>
              {s}
            </span>
            {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-brand-400' : 'bg-surface-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Step 0: Department */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-surface-500 mb-4">Тасаг сонгоно уу (заавал биш)</p>
          <button
            onClick={() => { setDepartmentId(''); setStep(1); }}
            className="card w-full text-left hover:border-brand-300 hover:shadow-sm transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
              <Building2 size={18} className="text-surface-500" />
            </div>
            <div>
              <span className="font-medium text-surface-800 text-sm">Бүх тасаг</span>
              <p className="text-xs text-surface-400">Бүх эмчээс сонгох</p>
            </div>
          </button>
          {deptLoading ? <LoadingSpinner /> : departments.map((dept: any) => (
            <button
              key={dept._id}
              onClick={() => { setDepartmentId(dept._id); setSelectedDept(dept); setStep(1); }}
              className="card w-full text-left hover:border-brand-300 hover:shadow-sm transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <Building2 size={18} className="text-brand-600" />
              </div>
              <div>
                <span className="font-medium text-surface-800 text-sm">{dept.name}</span>
                {dept.description && <p className="text-xs text-surface-400">{dept.description}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Doctor */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-surface-500 mb-4">
            Эмч сонгоно уу {selectedDept ? `(${selectedDept.name})` : ''}
          </p>
          {doctorLoading ? <LoadingSpinner /> : doctors.length === 0 ? (
            <p className="text-surface-400 text-sm text-center py-8">Эмч олдсонгүй</p>
          ) : doctors.map((doc: any) => (
            <button
              key={doc._id}
              onClick={() => { setDoctorId(doc._id); setSelectedDoctor(doc); setStep(2); }}
              className="card w-full text-left hover:border-brand-300 hover:shadow-sm transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium text-sm">
                {doc.userId?.firstname?.charAt(0)}
              </div>
              <div>
                <span className="font-medium text-surface-800 text-sm">
                  {doc.userId?.lastname?.charAt(0)}.{doc.userId?.firstname}
                </span>
                <p className="text-xs text-surface-400">
                  {doc.specialization} {doc.department ? `· ${doc.department.name}` : ''}
                </p>
              </div>
              <UserCheck size={16} className="text-surface-300 ml-auto" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              <CalendarDays size={14} className="inline mr-1" /> Өдөр сонгох
            </label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setTime(''); }}
              className="input-field"
            />
          </div>

          {date && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                <Clock size={14} className="inline mr-1" /> Цаг сонгох
              </label>
              {slotLoading ? <LoadingSpinner /> : slotError ? (
                <p className="text-red-500 text-sm py-4 text-center">{slotError.message}</p>
              ) : slots.length === 0 ? (
                <p className="text-surface-400 text-sm py-4 text-center">Сул цаг байхгүй. Өөр өдөр сонгоно уу.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map((slot: string) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        time === slot
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-surface-700 border-surface-200 hover:border-brand-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Шалтгаан / Гомдол (заавал биш)
            </label>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Жишээ нь: Толгой өвдөлт, ханиад..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <button
            onClick={() => time && setStep(3)}
            disabled={!time}
            className="btn-primary w-full"
          >
            Үргэлжлүүлэх <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="card space-y-4">
            <h3 className="font-display text-surface-900">Захиалгын мэдээлэл</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Эмч</span>
                <span className="font-medium text-surface-800">
                  {selectedDoctor?.userId?.lastname?.charAt(0)}.{selectedDoctor?.userId?.firstname}
                </span>
              </div>
              {selectedDept && (
                <div className="flex justify-between">
                  <span className="text-surface-500">Тасаг</span>
                  <span className="font-medium text-surface-800">{selectedDept.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-surface-500">Өдөр</span>
                <span className="font-medium text-surface-800">
                  {new Date(date).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Цаг</span>
                <span className="font-medium text-surface-800">{time}</span>
              </div>
              {complaint && (
                <div className="flex justify-between">
                  <span className="text-surface-500">Шалтгаан</span>
                  <span className="font-medium text-surface-800 text-right max-w-[200px]">{complaint}</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={creating} className="btn-primary w-full">
            {creating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} /> Баталгаажуулах
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
