import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { AVAILABLE_SLOTS, GET_DOCTORS, LIST_RESOURCES, LIST_SERVICES, MY_PATIENT_PROFILE } from '../graphql/queries';
import { CREATE_APPOINTMENT, UPSERT_MY_PATIENT_PROFILE } from '../graphql/mutations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastProvider';
import { ArrowLeft, ArrowRight, Check, Clock, CalendarDays, ClipboardList, UserCheck, Activity, Ban, Lock, Utensils, Info, X } from 'lucide-react';

const steps = ['Миний мэдээлэл', 'Үйлчилгээ', 'Сонголт', 'Өдөр & Цаг', 'Баталгаажуулах'];

const emptyProfile = {
  registrationNumber: '',
  firstname: '',
  lastname: '',
  phone: '',
  email: '',
  gender: '',
  birthdate: '',
  bloodType: 'unknown',
  allergies: '',
  chronicConditions: '',
  regularMedications: '',
  medicalWarnings: '',
  address: '',
  notes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

const registrationNumberPattern = /^[А-ЯЁӨҮ]{2}[0-9]{8}$/;

type SelectionDetail = {
  title: string;
  eyebrow?: string;
  description?: string;
  details?: { label: string; value?: string | number | null }[];
};

function splitList(value: string) {
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toBookingDate(value: string) {
  return `${value}T12:00:00.000Z`;
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function isProfileComplete(profile: typeof emptyProfile) {
  return Boolean(
    registrationNumberPattern.test(profile.registrationNumber) &&
    profile.firstname &&
    profile.lastname &&
    profile.phone &&
    profile.gender &&
    profile.birthdate
  );
}

function normalizeRegistrationNumber(value: string) {
  return value.replace(/\s+/g, '').toUpperCase();
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-surface-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function getSlotReason(slot: any) {
  return slot.reason || (
    slot.status === 'booked' ? 'Захиалгатай' :
    slot.status === 'past' ? 'Өнгөрсөн цаг' :
    slot.status === 'blocked' ? 'Хаасан цаг' :
    'Сонгох боломжгүй'
  );
}

function isPastSlot(slot: any) {
  if (!slot.startsAt) return false;
  const startsAt = new Date(slot.startsAt);
  return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= Date.now();
}

function normalizeSlot(slot: any) {
  return slot.available && isPastSlot(slot)
    ? { ...slot, available: false, status: 'past', reason: 'Өнгөрсөн цаг' }
    : slot;
}

function SlotButton({ slot, selected, onSelect }: { slot: any; selected: boolean; onSelect: () => void }) {
  const isPast = isPastSlot(slot);
  const status = isPast ? 'past' : slot.status;
  const isFull = !slot.available || isPast;
  const reason = isPast ? 'Өнгөрсөн цаг' : getSlotReason(slot);
  const availabilityText = !isFull
    ? slot.capacity > 1 ? `${slot.remaining} сул` : 'Сул'
    : reason;
  const StatusIcon = status === 'booked' ? Lock : status === 'past' ? Clock : reason === 'Цайны цаг' ? Utensils : Ban;

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={onSelect}
      className={`group min-h-[76px] rounded-xl border p-3 text-left transition-all ${
        selected
          ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20'
          : isFull
            ? status === 'booked'
              ? 'border-amber-200 bg-amber-50 text-amber-800 cursor-not-allowed'
              : status === 'blocked'
                ? 'border-red-200 bg-red-50 text-red-800 cursor-not-allowed'
                : 'border-surface-200 bg-surface-50 text-surface-500 cursor-not-allowed'
            : 'border-surface-200 bg-white text-surface-800 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm'
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-base font-display">{slot.time}</span>
        {selected && <Check size={15} />}
      </span>
      <span
        className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
          selected
            ? 'bg-white/20 text-white'
            : isFull
              ? status === 'booked'
                ? 'bg-amber-100 text-amber-700'
                : status === 'blocked'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-surface-200 text-surface-500'
              : slot.capacity > 1
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-brand-50 text-brand-700'
        }`}
      >
        {isFull && <StatusIcon size={10} className="mr-1 inline" />}
        {availabilityText}
      </span>
      {isFull && reason !== availabilityText && (
        <span className="mt-1 block text-[10px] leading-snug opacity-90">{reason}</span>
      )}
      {slot.capacity > 1 && (
        <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${selected ? 'bg-white/20' : 'bg-surface-100'}`}>
          <div
            className={`h-full rounded-full ${selected ? 'bg-white' : 'bg-emerald-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, ((slot.capacity - slot.remaining) / slot.capacity) * 100))}%` }}
          />
        </div>
      )}
    </button>
  );
}

function SelectionDetailModal({ detail, onClose }: { detail: SelectionDetail | null; onClose: () => void }) {
  if (!detail) return null;

  const visibleDetails = (detail.details || []).filter((item) => item.value !== undefined && item.value !== null && item.value !== '');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="selection-detail-title">
      <button type="button" aria-label="Хаах" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-surface-100 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Info size={19} />
          </div>
          <div className="min-w-0 flex-1">
            {detail.eyebrow && <p className="text-xs font-medium text-brand-600">{detail.eyebrow}</p>}
            <h2 id="selection-detail-title" className="mt-0.5 text-base font-display text-surface-900">{detail.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-surface-400 transition hover:bg-surface-100 hover:text-surface-700" aria-label="Хаах">
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-700">
            {detail.description || 'Тайлбар оруулаагүй байна.'}
          </p>
          {visibleDetails.length > 0 && (
            <div className="mt-4 grid gap-2 rounded-2xl bg-surface-50 p-4 text-sm">
              {visibleDetails.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <span className="text-surface-500">{item.label}</span>
                  <span className="text-right font-medium text-surface-800">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-surface-100 bg-surface-50 px-5 py-4">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Хаах</button>
        </div>
      </div>
    </div>
  );
}

function InfoIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-surface-200 text-surface-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
      title={label}
      aria-label={label}
    >
      <Info size={16} />
    </button>
  );
}

export default function AppointmentBookPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = toDateInputValue(new Date());
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(emptyProfile);
  const [service, setService] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [resource, setResource] = useState<any>(null);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [complaint, setComplaint] = useState('');
  const [profileEditing, setProfileEditing] = useState(true);
  const [selectionDetail, setSelectionDetail] = useState<SelectionDetail | null>(null);

  const { data: patientData, loading: patientLoading, refetch: refetchProfile } = useQuery(MY_PATIENT_PROFILE);
  const { data: serviceData, loading: serviceLoading } = useQuery(LIST_SERVICES);
  const { data: doctorData, loading: doctorLoading } = useQuery(GET_DOCTORS, {
    skip: !service?.requiresDoctor,
  });
  const { data: resourceData, loading: resourceLoading } = useQuery(LIST_RESOURCES, {
    variables: { serviceId: service?._id },
    skip: !service || service.requiresDoctor,
  });
  const { data: slotData, loading: slotLoading } = useQuery(AVAILABLE_SLOTS, {
    variables: {
      doctorId: doctor?._id || undefined,
      serviceId: service?._id || undefined,
      resourceId: resource?._id || undefined,
      date: date ? toBookingDate(date) : '',
    },
    skip: !service || (!doctor && !resource) || !date,
    fetchPolicy: 'network-only',
  });

  const [upsertProfile, { loading: savingProfile }] = useMutation(UPSERT_MY_PATIENT_PROFILE);
  const [createAppointment, { loading: creating }] = useMutation(CREATE_APPOINTMENT);

  const patient = patientData?.getMyPatientProfile;
  const services = serviceData?.listServices || [];
  const doctorsFromQuery = doctorData?.getDoctors || [];
  const assignedDoctors = service?.requiresDoctor ? (service.assignedStaffs || []) : [];
  const doctors = assignedDoctors.length > 0 ? assignedDoctors : doctorsFromQuery;
  const resources = resourceData?.listResources || [];
  const slots = (slotData?.getAvailableSlots || []).map(normalizeSlot);
  const availableSlots = slots.filter((slot: any) => slot.available && !isPastSlot(slot));
  const unavailableReasonSummary = Object.entries(
    slots
      .filter((slot: any) => !slot.available)
      .reduce((summary: Record<string, number>, slot: any) => {
        const reason = getSlotReason(slot);
        summary[reason] = (summary[reason] || 0) + 1;
        return summary;
      }, {})
  )
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(' · ');

  useEffect(() => {
    if (!time) return;
    const selectedSlot = slots.find((slot: any) => slot.time === time);
    if (selectedSlot && (!selectedSlot.available || isPastSlot(selectedSlot))) {
      setTime('');
    }
  }, [slotData, time]);

  useEffect(() => {
    if (!patient) return;
    const isInitialProfile = !patient.profileCompletedAt;
    setProfile({
      registrationNumber: isInitialProfile ? '' : patient.registrationNumber || '',
      firstname: patient.firstname || '',
      lastname: patient.lastname || '',
      phone: isInitialProfile ? '' : patient.phone || '',
      email: patient.email || '',
      gender: isInitialProfile ? '' : patient.gender || '',
      birthdate: isInitialProfile ? '' : patient.birthdate ? toDateInputValue(new Date(patient.birthdate)) : '',
      bloodType: isInitialProfile ? 'unknown' : patient.bloodType || 'unknown',
      allergies: isInitialProfile ? '' : patient.allergies?.join(', ') || '',
      chronicConditions: isInitialProfile ? '' : patient.chronicConditions?.join(', ') || '',
      regularMedications: isInitialProfile ? '' : patient.regularMedications?.join(', ') || '',
      medicalWarnings: isInitialProfile ? '' : patient.medicalWarnings?.join(', ') || '',
      address: isInitialProfile ? '' : patient.address || '',
      notes: isInitialProfile ? '' : patient.notes || '',
      emergencyContactName: isInitialProfile ? '' : patient.emergencyContact?.name || '',
      emergencyContactPhone: isInitialProfile ? '' : patient.emergencyContact?.phone || '',
      emergencyContactRelationship: isInitialProfile ? '' : patient.emergencyContact?.relationship || '',
    });
    setProfileEditing(!isProfileComplete({
      ...emptyProfile,
      registrationNumber: isInitialProfile ? '' : patient.registrationNumber || '',
      firstname: patient.firstname || '',
      lastname: patient.lastname || '',
      phone: isInitialProfile ? '' : patient.phone || '',
      gender: isInitialProfile ? '' : patient.gender || '',
      birthdate: isInitialProfile ? '' : patient.birthdate ? toDateInputValue(new Date(patient.birthdate)) : '',
    }));
  }, [patient]);

  const profileComplete = isProfileComplete(profile);
  const selectionReady = service?.requiresDoctor ? Boolean(doctor) : Boolean(resource);

  const openServiceDetail = () => {
    setSelectionDetail({
      title: service?.name || 'Үйлчилгээ',
      eyebrow: 'Үйлчилгээний тайлбар',
      description: service?.description,
      details: [
        { label: 'Үргэлжлэх хугацаа', value: service?.defaultDurationMinutes ? `${service.defaultDurationMinutes} мин` : null },
        { label: 'Амраах хугацаа', value: service?.defaultBufferMinutes ? `${service.defaultBufferMinutes} мин` : null },
      ],
    });
  };

  const openDoctorDetail = (doc: any) => {
    setSelectionDetail({
      title: `${doc.userId?.lastname?.charAt(0) || ''}.${doc.userId?.firstname || 'Эмч'}`,
      eyebrow: 'Эмчийн сонголт',
      description: service?.description,
      details: [
        { label: 'Мэргэжил', value: doc.specialization || 'Эмч' },
        { label: 'Тасаг', value: doc.department?.name },
        { label: 'Үйлчилгээ', value: service?.name },
      ],
    });
  };

  const openResourceDetail = (item: any) => {
    setSelectionDetail({
      title: item.name,
      eyebrow: 'Төхөөрөмж / нөөцийн тайлбар',
      description: item.notes || service?.description,
      details: [
        { label: 'Өрөө', value: item.room },
        { label: 'Төрөл', value: item.type },
        { label: 'Багтаамж', value: item.capacity || 1 },
        { label: 'Үргэлжлэх хугацаа', value: (item.defaultDurationMinutes || service?.defaultDurationMinutes) ? `${item.defaultDurationMinutes || service?.defaultDurationMinutes} мин` : null },
        { label: 'Амраах хугацаа', value: (item.defaultBufferMinutes ?? service?.defaultBufferMinutes) ? `${item.defaultBufferMinutes ?? service?.defaultBufferMinutes} мин` : null },
      ],
    });
  };

  const goToPreviousStep = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const goToNextStep = () => {
    if (step === 1 && service) {
      setStep(2);
      return;
    }
    if (step === 2 && selectionReady) {
      setStep(3);
      return;
    }
    if (step === 3 && time) {
      setStep(4);
    }
  };

  const saveProfile = async () => {
    try {
      const registrationNumber = normalizeRegistrationNumber(profile.registrationNumber);
      if (!registrationNumberPattern.test(registrationNumber)) {
        toast('Регистрийн дугаар 2 кирилл үсэг + 8 цифртэй байна. Жишээ: УБ12345678', 'error');
        return;
      }

      await upsertProfile({
        variables: {
          input: {
            registrationNumber,
            firstname: profile.firstname,
            lastname: profile.lastname,
            phone: profile.phone,
            email: profile.email || undefined,
            gender: profile.gender,
            birthdate: toBookingDate(profile.birthdate),
            bloodType: profile.bloodType,
            allergies: splitList(profile.allergies),
            chronicConditions: splitList(profile.chronicConditions),
            regularMedications: splitList(profile.regularMedications),
            medicalWarnings: splitList(profile.medicalWarnings),
            emergencyContact: profile.emergencyContactName || profile.emergencyContactPhone ? {
              name: profile.emergencyContactName || undefined,
              phone: profile.emergencyContactPhone || undefined,
              relationship: profile.emergencyContactRelationship || undefined,
            } : undefined,
            address: profile.address || undefined,
            notes: profile.notes || undefined,
          },
        },
      });
      await refetchProfile();
      setProfileEditing(false);
      setStep(1);
    } catch (err: any) {
      toast(err.message || 'Мэдээлэл хадгалахад алдаа гарлаа', 'error');
    }
  };

  const submitAppointment = async () => {
    try {
      await createAppointment({
        variables: {
          input: {
            patientId: patientData?.getMyPatientProfile?._id,
            serviceId: service?._id,
            doctorId: doctor?._id || undefined,
            resourceId: resource?._id || undefined,
            scheduledDate: toBookingDate(date),
            scheduledTime: time,
            appointmentKind: service?.category,
            durationMinutes: resource?.defaultDurationMinutes || service?.defaultDurationMinutes || undefined,
            bufferMinutes: resource?.defaultBufferMinutes ?? service?.defaultBufferMinutes ?? undefined,
            chiefComplaint: complaint || undefined,
          },
        },
      });
      navigate('/appointments', { state: { success: true } });
    } catch (err: any) {
      toast(err.message || 'Цаг захиалахад алдаа гарлаа', 'error');
    }
  };

  if (patientLoading) return <LoadingSpinner text="Мэдээлэл ачааллаж байна..." />;

  return (
    <div className="max-w-3xl mx-auto">
      <SelectionDetailModal detail={selectionDetail} onClose={() => setSelectionDetail(null)} />
      <button onClick={goToPreviousStep} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft size={16} /> Буцах
      </button>
      <h1 className="text-2xl font-display text-surface-900 mb-6">Цаг захиалах</h1>

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-surface-200 bg-surface-50 px-4 pb-4 pt-3 sm:top-16">
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm shadow-surface-900/5 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-brand-600">Алхам {step + 1}/{steps.length}</p>
              <h2 className="mt-0.5 text-base font-display text-surface-900">{steps[step]}</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-700">
              {step + 1}
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-100">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="hidden rounded-2xl border border-surface-200 bg-white p-4 shadow-sm shadow-surface-900/5 sm:block">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-brand-600">Алхам {step + 1}/{steps.length}</p>
              <h2 className="mt-0.5 text-base font-display text-surface-900">{steps[step]}</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-700">
              {step + 1}
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i <= step ? 'bg-brand-500 text-white' : 'bg-surface-200 text-surface-500'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= step ? 'text-brand-700' : 'text-surface-400'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-brand-400' : 'bg-surface-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 0 && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-surface-900">Миний мэдээлэл</h2>
              <p className="mt-1 text-sm text-surface-500">Цаг захиалахад шаардлагатай үндсэн мэдээллээ баталгаажуулна.</p>
            </div>
            {profileComplete && !profileEditing && (
              <button type="button" onClick={() => setProfileEditing(true)} className="btn-secondary px-3 py-2 text-xs">
                Засах
              </button>
            )}
          </div>

          {profileComplete && !profileEditing ? (
            <div className="grid gap-2 rounded-2xl bg-surface-50 p-4 text-sm sm:grid-cols-2">
              <div><span className="text-surface-400">Нэр</span><p className="font-medium text-surface-800">{profile.lastname} {profile.firstname}</p></div>
              <div><span className="text-surface-400">Утас</span><p className="font-medium text-surface-800">{profile.phone}</p></div>
              <div><span className="text-surface-400">Регистр</span><p className="font-medium text-surface-800">{profile.registrationNumber}</p></div>
              <div><span className="text-surface-400">Төрсөн огноо</span><p className="font-medium text-surface-800">{profile.birthdate}</p></div>
              <div><span className="text-surface-400">Хүйс</span><p className="font-medium text-surface-800">{profile.gender === 'male' ? 'Эрэгтэй' : profile.gender === 'female' ? 'Эмэгтэй' : 'Бусад'}</p></div>
              <div><span className="text-surface-400">Цусны бүлэг</span><p className="font-medium text-surface-800">{profile.bloodType === 'unknown' ? 'Тодорхойгүй' : profile.bloodType}</p></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Регистрийн дугаар" required>
                <input
                  className="input-field uppercase"
                  placeholder="УБ12345678"
                  value={profile.registrationNumber}
                  onChange={e => setProfile({ ...profile, registrationNumber: normalizeRegistrationNumber(e.target.value) })}
                  maxLength={10}
                  pattern="[А-ЯЁӨҮа-яёөү]{2}[0-9]{8}"
                  title="Эхний 2 тэмдэгт кирилл үсэг, дараагийн 8 тэмдэгт цифр байна"
                />
                {profile.registrationNumber && !registrationNumberPattern.test(profile.registrationNumber) && (
                  <p className="mt-1 text-xs text-red-600">Жишээ: УБ12345678. Эхний 2 нь кирилл үсэг, үлдсэн 8 нь цифр байна.</p>
                )}
              </Field>
              <Field label="Утас" required>
                <input className="input-field" placeholder="99112233" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </Field>
              <Field label="Овог" required>
                <input className="input-field" placeholder="Овог" value={profile.lastname} onChange={e => setProfile({ ...profile, lastname: e.target.value })} />
              </Field>
              <Field label="Нэр" required>
                <input className="input-field" placeholder="Нэр" value={profile.firstname} onChange={e => setProfile({ ...profile, firstname: e.target.value })} />
              </Field>
              <Field label="Хүйс" required>
                <select className="input-field" value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                  <option value="" disabled>Сонгох</option>
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                  <option value="other">Бусад</option>
                </select>
              </Field>
              <Field label="Төрсөн огноо" required>
                <input type="date" className="input-field" value={profile.birthdate} onChange={e => setProfile({ ...profile, birthdate: e.target.value })} />
              </Field>
              <Field label="И-мэйл">
                <input className="input-field" placeholder="name@example.com" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
              </Field>
              <Field label="Цусны бүлэг">
                <select className="input-field" value={profile.bloodType} onChange={e => setProfile({ ...profile, bloodType: e.target.value })}>
                  <option value="unknown">Тодорхойгүй</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Харшил">
                  <input className="input-field" placeholder="Пенициллин, тоос гэх мэт" value={profile.allergies} onChange={e => setProfile({ ...profile, allergies: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Архаг өвчин">
                  <input className="input-field" placeholder="Чихрийн шижин, даралт гэх мэт" value={profile.chronicConditions} onChange={e => setProfile({ ...profile, chronicConditions: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Тогтмол хэрэглэдэг эм">
                  <input className="input-field" placeholder="Эмийн нэрсийг таслалаар бичнэ" value={profile.regularMedications} onChange={e => setProfile({ ...profile, regularMedications: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Хаяг">
                  <input className="input-field" placeholder="Оршин суугаа хаяг" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
                </Field>
              </div>
            </div>
          )}

          <div>
            <button onClick={profileEditing ? saveProfile : () => setStep(1)} disabled={savingProfile || !profileComplete} className="btn-primary w-full">
              {savingProfile ? 'Хадгалж байна...' : 'Үргэлжлүүлэх'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3 pb-24 sm:pb-0">
          {serviceLoading ? <LoadingSpinner /> : services.length === 0 ? (
            <EmptyState icon={<ClipboardList size={40} />} title="Үйлчилгээ тохируулаагүй байна" description="Админ scheduling seed эсвэл үйлчилгээний тохиргоог шалгана." />
          ) : (
            <>
              {services.map((item: any) => {
                const selected = service?._id === item._id;
                return (
                  <button
                    key={item._id}
                    onClick={() => { setService(item); setDoctor(null); setResource(null); setDate(today); setTime(''); }}
                    className={`card w-full text-left flex items-center gap-3 transition ${
                      selected ? '!border-brand-500 bg-brand-50/60 ring-2 ring-brand-100' : 'hover:border-brand-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}>
                      <ClipboardList size={18} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-surface-800 text-sm">{item.name}</span>
                      <p className="text-xs text-surface-400">{item.defaultDurationMinutes} мин {item.defaultBufferMinutes ? `+ ${item.defaultBufferMinutes} мин амраах` : ''}</p>
                    </div>
                    {selected && <Check size={17} className="text-brand-600" />}
                  </button>
                );
              })}
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(25,40,52,0.10)] backdrop-blur sm:static sm:rounded-2xl sm:border-0 sm:bg-white sm:p-3 sm:shadow-none sm:ring-1 sm:ring-surface-200">
                <button onClick={goToNextStep} disabled={!service} className="btn-primary w-full">
                  Үргэлжлүүлэх <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 pb-24 sm:pb-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-surface-500">{service?.name} хийх хүн/төхөөрөмж сонгоно уу</p>
            <InfoIconButton label="Үйлчилгээний тайлбар харах" onClick={openServiceDetail} />
          </div>
          {service?.requiresDoctor ? (
            doctorLoading ? <LoadingSpinner /> : doctors.length === 0 ? (
              <EmptyState icon={<UserCheck size={40} />} title="Сонгох эмч алга" description="Энэ үйлчилгээнд боломжтой эмч тохируулаагүй байна." />
            ) : doctors.map((doc: any) => {
              const selected = doctor?._id === doc._id;
              return (
                <div
                  key={doc._id}
                  className={`card w-full flex items-center gap-3 transition ${
                    selected ? '!border-brand-500 bg-brand-50/60 ring-2 ring-brand-100' : 'hover:border-brand-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => { setDoctor(doc); setDate(today); setTime(''); }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${selected ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-700'}`}>
                      <UserCheck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-surface-800 text-sm">{doc.userId?.lastname?.charAt(0)}.{doc.userId?.firstname}</span>
                      <p className="truncate text-xs text-surface-400">{doc.specialization || 'Эмч'}</p>
                    </div>
                  </button>
                  <InfoIconButton label={`${doc.userId?.firstname || 'Эмч'} тайлбар харах`} onClick={() => openDoctorDetail(doc)} />
                  {selected && <Check size={17} className="text-brand-600" />}
                </div>
              );
            })
          ) : resourceLoading ? <LoadingSpinner /> : resources.length === 0 ? (
            <EmptyState icon={<Activity size={40} />} title="Сонгох нөөц алга" description="Энэ үйлчилгээнд өрөө, төхөөрөмж эсвэл resource тохируулаагүй байна." />
          ) : resources.map((item: any) => {
            const selected = resource?._id === item._id;
            return (
              <div
                key={item._id}
                className={`card w-full flex items-center gap-3 transition ${
                  selected ? '!border-brand-500 bg-brand-50/60 ring-2 ring-brand-100' : 'hover:border-brand-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => { setResource(item); setDate(today); setTime(''); }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex flex-shrink-0 items-center justify-center ${selected ? 'bg-brand-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Activity size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-surface-800 text-sm">{item.name}</span>
                    <p className="truncate text-xs text-surface-400">Багтаамж {item.capacity || 1} {item.defaultBufferMinutes ? `· амраах ${item.defaultBufferMinutes} мин` : ''}</p>
                  </div>
                </button>
                <InfoIconButton label={`${item.name} тайлбар харах`} onClick={() => openResourceDetail(item)} />
                {selected && <Check size={17} className="text-brand-600" />}
              </div>
            );
          })}
          {(service?.requiresDoctor ? doctors.length > 0 : resources.length > 0) && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(25,40,52,0.10)] backdrop-blur sm:static sm:rounded-2xl sm:border-0 sm:bg-white sm:p-3 sm:shadow-none sm:ring-1 sm:ring-surface-200">
              <button onClick={goToNextStep} disabled={!selectionReady} className="btn-primary w-full">
                Үргэлжлүүлэх <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5"><CalendarDays size={14} className="inline mr-1" /> Өдөр сонгох</label>
            <input type="date" min={today} value={date} onChange={e => { setDate(e.target.value); setTime(''); }} className="input-field" />
          </div>
          {date && (
            <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-surface-800">
                  <Clock size={15} className="text-brand-600" /> Цаг сонгох
                </label>
                <span className="text-xs text-surface-500">
                  {service?.name} {resource?.capacity > 1 ? `· ${resource.capacity} суудал` : ''}
                </span>
              </div>
              {slotLoading ? <LoadingSpinner /> : (
                slots.length === 0 ? (
                  <p className="rounded-xl bg-surface-50 py-8 text-center text-sm text-surface-500">
                    Энэ өдөр цагийн хуваарь тохируулаагүй байна. Өөр өдөр эсвэл өөр сонголт шалгана уу.
                  </p>
                ) : (
                  <>
                    <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
                      availableSlots.length > 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}>
                      {availableSlots.length > 0
                        ? `${availableSlots.length} сул цаг байна. Саарал/улаан цагуудыг сонгох боломжгүй.`
                        : 'Сонгосон өдөр сул цаг алга. Өөр өдөр эсвэл өөр эмч/нөөц сонгоно уу.'}
                      {unavailableReasonSummary && (
                        <span className="mt-1 block text-surface-600">Боломжгүй цагийн шалтгаан: {unavailableReasonSummary}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {slots.map((slot: any) => (
                        <SlotButton
                          key={slot.time}
                          slot={slot}
                          selected={time === slot.time}
                          onSelect={() => setTime(slot.time)}
                        />
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          )}
          <textarea value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Зовиур / үзүүлэх шалтгаан (заавал биш)" rows={3} className="input-field resize-none" />
          <div className="sticky bottom-3 z-20 rounded-2xl bg-white/95 p-3 shadow-xl shadow-surface-900/10 ring-1 ring-surface-200 backdrop-blur">
            <button onClick={goToNextStep} disabled={!time} className="btn-primary w-full">Үргэлжлүүлэх <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div className="card space-y-3 text-sm">
            <h3 className="font-display text-surface-900">Захиалгын мэдээлэл</h3>
            <div className="grid gap-3">
              <div className="flex justify-between gap-4"><span className="text-surface-500">Үйлчилгээ</span><span className="text-right font-medium">{service?.name}</span></div>
              <div className="flex justify-between gap-4"><span className="text-surface-500">Сонголт</span><span className="text-right font-medium">{doctor ? `${doctor.userId?.lastname?.charAt(0)}.${doctor.userId?.firstname}` : resource?.name}</span></div>
              {doctor?.specialization && (
                <div className="flex justify-between gap-4"><span className="text-surface-500">Мэргэжил</span><span className="text-right font-medium">{doctor.specialization}</span></div>
              )}
              {resource?.room && (
                <div className="flex justify-between gap-4"><span className="text-surface-500">Өрөө</span><span className="text-right font-medium">{resource.room}</span></div>
              )}
              <div className="flex justify-between gap-4"><span className="text-surface-500">Өдөр</span><span className="text-right font-medium">{formatDate(date)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-surface-500">Цаг</span><span className="text-right font-medium">{time}</span></div>
              <div className="flex justify-between gap-4"><span className="text-surface-500">Үргэлжлэх хугацаа</span><span className="text-right font-medium">{resource?.defaultDurationMinutes || service?.defaultDurationMinutes || '-'} мин</span></div>
              {complaint && (
                <div className="rounded-xl bg-surface-50 p-3">
                  <span className="text-surface-500">Зовиур / үзүүлэх шалтгаан</span>
                  <p className="mt-1 whitespace-pre-wrap font-medium text-surface-800">{complaint}</p>
                </div>
              )}
            </div>
          </div>
          <div className="sticky bottom-3 z-20 rounded-2xl bg-white/95 p-3 shadow-xl shadow-surface-900/10 ring-1 ring-surface-200 backdrop-blur">
            <button onClick={submitAppointment} disabled={creating} className="btn-primary w-full">
              {creating ? 'Баталгаажуулж байна...' : <><Check size={16} /> Баталгаажуулах</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
