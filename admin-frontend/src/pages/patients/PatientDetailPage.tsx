import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { GET_PATIENT, PRESCRIPTIONS_BY_PATIENT, VISITS_BY_PATIENT } from '../../graphql/queries';
import { UPDATE_PATIENT } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/common/ToastProvider';

type PatientForm = {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  category: string;
  gender: string;
  birthdate: string;
  bloodType: string;
  address: string;
  notes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

const emptyForm: PatientForm = {
  firstname: '',
  lastname: '',
  phone: '',
  email: '',
  category: 'student',
  gender: 'male',
  birthdate: '',
  bloodType: 'unknown',
  address: '',
  notes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function getAge(birthdate?: string) {
  if (!birthdate) return null;
  const born = new Date(birthdate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age;
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const { toast } = useToast();

  const { data, loading, refetch } = useQuery(GET_PATIENT, {
    variables: { id },
    skip: !id,
  });
  const { data: visitsData, loading: visitsLoading } = useQuery(VISITS_BY_PATIENT, {
    variables: { patientId: id, page: 1, limit: 10 },
    skip: !id,
  });
  const { data: prescriptionsData, loading: prescriptionsLoading } = useQuery(PRESCRIPTIONS_BY_PATIENT, {
    variables: { patientId: id },
    skip: !id,
  });
  const [updatePatient, { loading: saving }] = useMutation(UPDATE_PATIENT);

  const patient = data?.getPatient;
  const visits = visitsData?.listVisitsByPatient || [];
  const prescriptions = prescriptionsData?.getPrescriptionsByPatient || [];
  const age = useMemo(() => getAge(patient?.birthdate), [patient?.birthdate]);

  useEffect(() => {
    if (!patient) return;
    setForm({
      firstname: patient.firstname || '',
      lastname: patient.lastname || '',
      phone: patient.phone || '',
      email: patient.email || '',
      category: patient.category || 'student',
      gender: patient.gender || 'male',
      birthdate: patient.birthdate ? new Date(patient.birthdate).toISOString().split('T')[0] : '',
      bloodType: patient.bloodType || 'unknown',
      address: patient.address || '',
      notes: patient.notes || '',
      emergencyContactName: patient.emergencyContact?.name || '',
      emergencyContactPhone: patient.emergencyContact?.phone || '',
      emergencyContactRelationship: patient.emergencyContact?.relationship || '',
    });
  }, [patient?._id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await updatePatient({
        variables: {
          id,
          input: {
            firstname: form.firstname,
            lastname: form.lastname,
            phone: form.phone || undefined,
            email: form.email || undefined,
            category: form.category || undefined,
            gender: form.gender || undefined,
            birthdate: form.birthdate || undefined,
            bloodType: form.bloodType || undefined,
            address: form.address || undefined,
            notes: form.notes || undefined,
            emergencyContact: {
              name: form.emergencyContactName || undefined,
              phone: form.emergencyContactPhone || undefined,
              relationship: form.emergencyContactRelationship || undefined,
            },
          },
        },
      });
      await refetch();
      toast('Өвчтөний мэдээлэл хадгалагдлаа.', 'success');
    } catch (err: any) {
      toast(err.message || 'Өвчтөний мэдээлэл хадгалахад алдаа гарлаа', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Өвчтөний мэдээлэл ачааллаж байна..." />;
  if (!patient) return <p className="py-20 text-center text-sm text-surface-500">Өвчтөн олдсонгүй</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={() => navigate('/patients')} className="btn-ghost" aria-label="Буцах">
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-display text-surface-900">
            {patient.lastname?.charAt(0)}.{patient.firstname}
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            {patient.registrationNumber}
            {age !== null ? ` · ${age} нас` : ''}
            {patient.gender === 'male' ? ' · Эр' : patient.gender === 'female' ? ' · Эм' : ''}
          </p>
        </div>
        <StatusBadge status={patient.status || 'active'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <form onSubmit={handleSave} className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-display text-surface-900">Ерөнхий мэдээлэл</h2>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              <Save size={14} /> {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Овог</label>
              <input value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Нэр</label>
              <input value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Утас</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Имэйл</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Хүйс</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="male">Эрэгтэй</option>
                <option value="female">Эмэгтэй</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Төрсөн өдөр</label>
              <input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Ангилал</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                <option value="student">Оюутан</option>
                <option value="teacher">Багш</option>
                <option value="employee">Ажилтан</option>
                <option value="external">Гаднын</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Цусны бүлэг</label>
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="input-field">
                <option value="unknown">Тодорхойгүй</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-surface-600">Хаяг</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-surface-600">Тэмдэглэл</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="input-field resize-none" />
            </div>
          </div>

          <div className="border-t border-surface-200 pt-4">
            <h3 className="mb-3 text-sm font-display text-surface-900">Яаралтай үед холбоо барих хүн</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Нэр</label>
                <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Утас</label>
                <input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600">Харилцаа</label>
                <input value={form.emergencyContactRelationship} onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>
        </form>

        <div className="space-y-5">
          <div className="card space-y-3">
            <h2 className="text-sm font-display text-surface-900">Товч мэдээлэл</h2>
            <div className="space-y-2 text-sm text-surface-600">
              <div className="flex items-center justify-between gap-3">
                <span>Бүртгэлийн дугаар</span>
                <span className="font-medium text-surface-900">{patient.registrationNumber}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Бүртгэсэн огноо</span>
                <span className="font-medium text-surface-900">{formatDate(patient.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Харшил</span>
                <span className="text-right font-medium text-surface-900">
                  {patient.allergies?.length ? patient.allergies.join(', ') : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-display text-surface-900">Үзлэгийн түүх</h2>
              <span className="text-xs text-surface-400">{visits.length}</span>
            </div>
            {visitsLoading ? (
              <LoadingSpinner />
            ) : visits.length > 0 ? (
              <div className="space-y-2">
                {visits.map((visit: any) => (
                  <div key={visit._id} className="rounded-lg border border-surface-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-800">{visit.chiefComplaint || 'Шалтгаан оруулаагүй'}</p>
                        <p className="mt-1 text-xs text-surface-500">
                          {formatDate(visit.visitDate)}
                          {visit.doctor?.userId?.firstname ? ` · Dr. ${visit.doctor.userId.firstname}` : ''}
                          {visit.doctor?.specialization ? ` · ${visit.doctor.specialization}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={visit.status} />
                    </div>
                    {visit.assessment && <p className="mt-2 text-sm text-surface-600">{visit.assessment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400">Үзлэгийн бүртгэл алга</p>
            )}
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-display text-surface-900">Жор</h2>
              <span className="text-xs text-surface-400">{prescriptions.length}</span>
            </div>
            {prescriptionsLoading ? (
              <LoadingSpinner />
            ) : prescriptions.length > 0 ? (
              <div className="space-y-2">
                {prescriptions.slice(0, 5).map((rx: any) => (
                  <div key={rx._id} className="rounded-lg border border-surface-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-brand-600">{rx.prescriptionNumber}</span>
                      <StatusBadge status={rx.status} />
                    </div>
                    <div className="mt-2 space-y-1">
                      {rx.items.map((item: any, index: number) => (
                        <p key={index} className="text-sm text-surface-700">
                          {item.medicationName} · {item.dosage} · {item.frequency}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400">Жорын бүртгэл алга</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
