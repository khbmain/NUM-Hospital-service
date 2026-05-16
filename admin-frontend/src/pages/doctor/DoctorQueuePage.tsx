import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../hooks/useAuth';
import { DOCTOR_QUEUE, LIST_APPOINTMENTS, LIST_STAFF, SEARCH_PATIENTS } from '../../graphql/queries';
import { CREATE_PATIENT, CREATE_VISIT, START_APPOINTMENT } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../components/common/ToastProvider';
import EmailDomainInput from '../../components/common/EmailDomainInput';
import { Stethoscope, Play, Clock, Search, UserPlus, CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Eye } from 'lucide-react';

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function formatDisplayDate(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function getMonthStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatMonthLabel(date: Date) {
  const months = [
    'Нэгдүгээр сар',
    'Хоёрдугаар сар',
    'Гуравдугаар сар',
    'Дөрөвдүгээр сар',
    'Тавдугаар сар',
    'Зургаадугаар сар',
    'Долдугаар сар',
    'Наймдугаар сар',
    'Есдүгээр сар',
    'Аравдугаар сар',
    'Арван нэгдүгээр сар',
    'Арван хоёрдугаар сар',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getCalendarDays(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function countTone(count: number) {
  if (count >= 6) return 'border-red-200 bg-red-50 text-red-700';
  if (count >= 3) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (count >= 1) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-surface-100 bg-white text-surface-500';
}

function countDot(count: number) {
  if (count >= 6) return 'bg-red-500';
  if (count >= 3) return 'bg-amber-500';
  if (count >= 1) return 'bg-emerald-500';
  return '';
}

const patientCategories = [
  { value: 'student', label: 'Оюутан' },
  { value: 'teacher', label: 'Багш' },
  { value: 'employee', label: 'Ажилтан' },
  { value: 'external', label: 'Гадны' },
];

const emptyWalkInPatient = {
  registrationNumber: '',
  lastname: '',
  firstname: '',
  phone: '',
  email: '',
  category: 'student',
  gender: 'male',
};

const registrationNumberPattern = /^[А-ЯЁӨҮ]{2}[0-9]{8}$/;

export default function DoctorQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staffId, setStaffId] = useState('');
  const [startingId, setStartingId] = useState('');
  const todayValue = useMemo(() => toDateInputValue(new Date()), []);
  const [queueDate, setQueueDate] = useState(todayValue);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStart(todayValue));
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const queueDateForQuery = useMemo(() => `${queueDate}T12:00:00.000Z`, [queueDate]);

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
    variables: { doctorId: staffId, date: queueDateForQuery },
    skip: !staffId,
    pollInterval: 15000,
  });

  const monthStart = useMemo(() => getMonthStart(toDateInputValue(calendarMonth)), [calendarMonth]);
  const monthEnd = useMemo(() => getMonthEnd(toDateInputValue(calendarMonth)), [calendarMonth]);
  const { data: monthAppointmentsData } = useQuery(LIST_APPOINTMENTS, {
    variables: {
      filter: {
        doctorId: staffId,
        dateFrom: `${toDateInputValue(monthStart)}T00:00:00.000Z`,
        dateTo: `${toDateInputValue(monthEnd)}T23:59:59.999Z`,
        limit: 500,
      },
    },
    skip: !staffId,
    pollInterval: 30000,
  });

  const [walkInQuery, setWalkInQuery] = useState('');
  const [walkInStartingId, setWalkInStartingId] = useState('');
  const [walkInCreateOpen, setWalkInCreateOpen] = useState(false);
  const [walkInPatientForm, setWalkInPatientForm] = useState(emptyWalkInPatient);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [startAppt] = useMutation(START_APPOINTMENT);
  const [createVisit] = useMutation(CREATE_VISIT);
  const [createPatient, { loading: creatingPatient }] = useMutation(CREATE_PATIENT);
  const [searchPatients, { data: searchData, loading: searchLoading }] = useLazyQuery(SEARCH_PATIENTS);

  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  useEffect(() => {
    if (!calendarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCalendarOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [calendarOpen]);

  const queue = data?.getDoctorQueue || [];
  const isTodaySelected = queueDate === todayValue;
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);
  const appointmentCountsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    (monthAppointmentsData?.listAppointments?.appointments || [])
      .filter((appointment: any) => appointment.status !== 'cancelled')
      .forEach((appointment: any) => {
        const key = toDateInputValue(new Date(appointment.scheduledDate));
        counts[key] = (counts[key] || 0) + 1;
      });
    return counts;
  }, [monthAppointmentsData?.listAppointments?.appointments]);
  const hasInitialStaffData = Boolean(staffData || staffError);
  const isInitialLoading = !hasInitialStaffData || (!!staffId && loading && !data);
  const pageError = staffError?.message || queueError?.message || '';

  const walkInResults = walkInQuery.trim().length >= 2 ? (searchData?.searchPatients?.patients || []) : [];

  const hasStaffRecord = useMemo(() => {
    if (!staffData?.listStaff || !user?._id) return false;
    return staffData.listStaff.some((staff: any) => staff.userId?._id === user._id);
  }, [staffData, user?._id]);

  const handleWalkInSearch = (value: string) => {
    setWalkInQuery(value);
    setWalkInCreateOpen(false);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        searchPatients({ variables: { query: trimmed, limit: 5 } });
      }, 300);
    }
  };

  const handleSelectDate = (dateValue: string) => {
    setQueueDate(dateValue);
    setCalendarMonth(getMonthStart(dateValue));
    setCalendarOpen(false);
  };

  const handleWalkInExam = async (patient: any) => {
    setWalkInStartingId(patient._id);
    try {
      const { data: visitData } = await createVisit({
        variables: {
          input: {
            patientId: patient._id,
            chiefComplaint: '',
          },
        },
      });
      setWalkInQuery('');
      navigate(`/doctor/examine/${visitData.createVisit._id}`);
    } catch (err: any) {
      toast(err.message || 'Шуурхай үзлэг эхлүүлэхэд алдаа гарлаа.', 'error');
    } finally {
      setWalkInStartingId('');
    }
  };

  const openWalkInCreate = () => {
    const trimmed = walkInQuery.trim();
    const digitsOnly = /^[0-9+\-\s]+$/.test(trimmed);
    const nameParts = digitsOnly ? [] : trimmed.split(/\s+/).filter(Boolean);

    setWalkInPatientForm({
      ...emptyWalkInPatient,
      phone: digitsOnly ? trimmed.replace(/\s+/g, '') : '',
      registrationNumber: !digitsOnly && /^[А-ЯЁӨҮа-яёөү]{2}[0-9]{8}$/.test(trimmed) ? trimmed.toUpperCase() : '',
      lastname: nameParts.length > 1 ? nameParts[0] : '',
      firstname: nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0] || '',
    });
    setWalkInCreateOpen(true);
  };

  const handleCreateWalkInPatient = async (event: React.FormEvent) => {
    event.preventDefault();
    const input = {
      registrationNumber: walkInPatientForm.registrationNumber.trim().toUpperCase() || undefined,
      lastname: walkInPatientForm.lastname.trim(),
      firstname: walkInPatientForm.firstname.trim(),
      phone: walkInPatientForm.phone.trim() || undefined,
      email: walkInPatientForm.email.trim() || undefined,
      category: walkInPatientForm.category,
      gender: walkInPatientForm.gender,
    };

    if (!input.lastname || !input.firstname) {
      toast('Овог, нэрийг заавал оруулна уу.', 'error');
      return;
    }
    if (input.registrationNumber && !registrationNumberPattern.test(input.registrationNumber)) {
      toast('Регистрийн дугаар 2 кирилл үсэг + 8 цифртэй байна. Жишээ: УБ12345678', 'error');
      return;
    }

    setWalkInStartingId('new');
    try {
      const { data: patientData } = await createPatient({ variables: { input } });
      const patient = patientData?.createPatient;
      if (!patient?._id) throw new Error('Өвчтөн бүртгэгдсэн боловч ID буцсангүй.');

      const { data: visitData } = await createVisit({
        variables: {
          input: {
            patientId: patient._id,
            chiefComplaint: '',
          },
        },
      });

      toast('Өвчтөн бүртгэгдэж, үзлэг эхэллээ.', 'success');
      setWalkInQuery('');
      setWalkInCreateOpen(false);
      setWalkInPatientForm(emptyWalkInPatient);
      navigate(`/doctor/examine/${visitData.createVisit._id}`);
    } catch (err: any) {
      toast(err.message || 'Өвчтөн бүртгэж үзлэг эхлүүлэхэд алдаа гарлаа.', 'error');
    } finally {
      setWalkInStartingId('');
    }
  };

  const handleStartExam = async (appointment: any) => {
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
      toast(err.message || 'Үзлэг эхлүүлэхэд алдаа гарлаа.', 'error');
    } finally {
      setStartingId('');
    }
  };

  const handleViewCompletedExam = async (appointment: any) => {
    setStartingId(appointment._id);
    try {
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
      toast(err.message || 'Дууссан үзлэг нээхэд алдаа гарлаа.', 'error');
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-display text-surface-900">Эмчийн дараалал</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {formatDisplayDate(queueDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex h-11 items-center rounded-lg border border-surface-200 bg-white p-1 shadow-sm shadow-surface-900/5">
            <button
              type="button"
              onClick={() => setQueueDate(addDays(queueDate, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-800"
              aria-label="Өмнөх өдөр"
            >
              <ChevronLeft size={15} />
            </button>
            <div ref={calendarRef}>
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(getMonthStart(queueDate));
                  setCalendarOpen((open) => !open);
                }}
                className="flex h-9 min-w-[176px] items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-surface-700 hover:bg-surface-50"
              >
                <CalendarDays size={14} className="text-surface-400" />
                {queueDate}
              </button>
              {calendarOpen && (
                <div className="absolute left-1/2 top-12 z-50 w-[304px] -translate-x-1/2 rounded-lg border border-surface-200 bg-white p-3 shadow-xl shadow-surface-900/10">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-800"
                      aria-label="Өмнөх сар"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <p className="text-sm font-display text-surface-900">{formatMonthLabel(calendarMonth)}</p>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-800"
                      aria-label="Дараагийн сар"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-surface-400">
                    {['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'].map((day) => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const dateValue = toDateInputValue(day);
                      const count = appointmentCountsByDay[dateValue] || 0;
                      const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                      const isSelected = dateValue === queueDate;
                      const isToday = dateValue === todayValue;
                      return (
                        <button
                          key={dateValue}
                          type="button"
                          onClick={() => handleSelectDate(dateValue)}
                          className={`flex h-11 flex-col items-center justify-center rounded-md border text-xs font-medium transition ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                              : `${countTone(count)} hover:border-brand-300 hover:bg-brand-50`
                          } ${isCurrentMonth ? '' : 'opacity-35'} ${isToday && !isSelected ? 'ring-1 ring-brand-300' : ''}`}
                          title={`${dateValue}: ${count} цаг`}
                        >
                          <span className="leading-none">{day.getDate()}</span>
                          {count > 0 && (
                            <span className={`mt-1 inline-flex h-3.5 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none ${
                              isSelected ? 'bg-white/20 text-white' : `${countDot(count)} text-white shadow-sm`
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-surface-50 px-2.5 py-2 text-[10px] text-surface-500">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />1-2 цаг</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />3-5</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />6+</span>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setQueueDate(addDays(queueDate, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-800"
              aria-label="Дараагийн өдөр"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          {!isTodaySelected && (
            <button type="button" onClick={() => setQueueDate(todayValue)} className="flex h-11 items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 text-xs font-medium text-surface-600 shadow-sm shadow-surface-900/5 hover:bg-surface-50">
              <RotateCcw size={13} /> Өнөөдөр
            </button>
          )}
          <div className="flex h-11 min-w-[88px] items-center justify-center gap-2 rounded-lg border border-surface-200 bg-white px-3 shadow-sm shadow-surface-900/5">
            <span className="text-lg font-display leading-none text-surface-900">{queue.length}</span>
            <span className="text-xs font-medium text-surface-400">Нийт</span>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {/* Walk-in section */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-brand-600" />
          <h2 className="text-sm font-display text-surface-900">Шуурхай үзлэг — цаг захиалаагүй өвчтөн</h2>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={walkInQuery}
            onChange={(e) => handleWalkInSearch(e.target.value)}
            placeholder="Нэр, регистр, утасны дугаараар хайх..."
            className="input-field pl-8"
          />
        </div>
        {walkInQuery.trim().length >= 2 && (
          <div className="space-y-2">
            {searchLoading ? (
              <p className="text-xs text-surface-400 text-center py-2">Хайж байна...</p>
            ) : walkInResults.length === 0 ? (
              <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-surface-500">Өвчтөн олдсонгүй. Шинээр бүртгээд шууд үзлэг эхлүүлж болно.</p>
                  <button type="button" onClick={openWalkInCreate} className="btn-secondary text-xs">
                    <UserPlus size={13} /> Шинээр бүртгэх
                  </button>
                </div>
              </div>
            ) : (
              walkInResults.map((patient: any) => (
                <div key={patient._id} className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">
                      {patient.lastname?.charAt(0)}.{patient.firstname}
                    </p>
                    <p className="text-xs text-surface-500">
                      {patient.registrationNumber}{patient.phone ? ` · ${patient.phone}` : ''}
                      {patient.gender ? ` · ${patient.gender === 'male' ? 'Эр' : 'Эм'}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleWalkInExam(patient)}
                    disabled={walkInStartingId === patient._id}
                    className="btn-primary text-xs flex-shrink-0"
                  >
                    <Stethoscope size={13} />
                    {walkInStartingId === patient._id ? 'Нээж байна...' : 'Үзлэг эхлэх'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        {walkInCreateOpen && (
          <form onSubmit={handleCreateWalkInPatient} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-display text-surface-900">Шинэ өвчтөн бүртгээд үзлэг эхлэх</h3>
              <button
                type="button"
                onClick={() => setWalkInCreateOpen(false)}
                className="rounded-md p-1 text-surface-400 hover:bg-white hover:text-surface-700"
                aria-label="Хаах"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-7">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Регистр</label>
                <input
                  value={walkInPatientForm.registrationNumber}
                  onChange={(event) => setWalkInPatientForm({ ...walkInPatientForm, registrationNumber: event.target.value.toUpperCase() })}
                  className="input-field uppercase"
                  placeholder="УБ12345678"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Овог *</label>
                <input
                  value={walkInPatientForm.lastname}
                  onChange={(event) => setWalkInPatientForm({ ...walkInPatientForm, lastname: event.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Нэр *</label>
                <input
                  value={walkInPatientForm.firstname}
                  onChange={(event) => setWalkInPatientForm({ ...walkInPatientForm, firstname: event.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Утас</label>
                <input
                  value={walkInPatientForm.phone}
                  onChange={(event) => setWalkInPatientForm({ ...walkInPatientForm, phone: event.target.value })}
                  className="input-field"
                />
              </div>
              <EmailDomainInput
                label="И-мэйл"
                value={walkInPatientForm.email}
                onChange={(email) => setWalkInPatientForm({ ...walkInPatientForm, email })}
                className="md:col-span-2 xl:col-span-2"
                labelClassName="mb-1 block text-[11px] font-medium text-surface-600"
              />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Ангилал</label>
                <select
                  value={walkInPatientForm.category}
                  onChange={(event) => setWalkInPatientForm({ ...walkInPatientForm, category: event.target.value })}
                  className="input-field"
                >
                  {patientCategories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-surface-600">Хүйс</label>
                <select
                  value={walkInPatientForm.gender}
                  onChange={(event) => setWalkInPatientForm({ ...walkInPatientForm, gender: event.target.value })}
                  className="input-field"
                >
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                  <option value="other">Бусад</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={creatingPatient || walkInStartingId === 'new'} className="btn-primary text-xs">
                <Stethoscope size={13} />
                {creatingPatient || walkInStartingId === 'new' ? 'Эхлүүлж байна...' : 'Бүртгээд үзлэг эхлэх'}
              </button>
            </div>
          </form>
        )}
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={<Clock size={40} />} title="Сонгосон өдөр цаг захиалга байхгүй" />
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
                {appointment.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleViewCompletedExam(appointment)}
                    disabled={startingId === appointment._id}
                    className="btn-secondary text-xs"
                  >
                    <Eye size={13} /> {startingId === appointment._id ? 'Нээж байна...' : 'Харах'}
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
