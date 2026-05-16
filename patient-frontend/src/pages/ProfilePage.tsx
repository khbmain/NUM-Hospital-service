import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { ME_QUERY, MY_PATIENT_PROFILE } from '../graphql/queries';
import { UPDATE_PROFILE, UPSERT_MY_PATIENT_PROFILE } from '../graphql/mutations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/ToastProvider';
import { Edit3, Save, User } from 'lucide-react';

const registrationNumberPattern = /^[А-ЯЁӨҮ]{2}[0-9]{8}$/;

const emptyForm = {
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

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toDateInputValue(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toApiDate(value: string) {
  return `${value}T12:00:00.000Z`;
}

function normalizeRegistrationNumber(value: string) {
  return value.replace(/\s+/g, '').toUpperCase();
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-surface-500">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, loading } = useQuery(MY_PATIENT_PROFILE);
  const patient = data?.getMyPatientProfile;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [updateUser, { loading: savingUser }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: ME_QUERY }],
  });
  const [upsertPatient, { loading: savingPatient }] = useMutation(UPSERT_MY_PATIENT_PROFILE, {
    refetchQueries: [{ query: MY_PATIENT_PROFILE }],
  });

  useEffect(() => {
    setForm({
      registrationNumber: patient?.registrationNumber || '',
      firstname: patient?.firstname || user?.firstname || '',
      lastname: patient?.lastname || user?.lastname || '',
      phone: patient?.phone || user?.phone || '',
      email: patient?.email || user?.email || '',
      gender: patient?.gender || user?.gender || '',
      birthdate: toDateInputValue(patient?.birthdate),
      bloodType: patient?.bloodType || 'unknown',
      allergies: patient?.allergies?.join(', ') || '',
      chronicConditions: patient?.chronicConditions?.join(', ') || '',
      regularMedications: patient?.regularMedications?.join(', ') || '',
      medicalWarnings: patient?.medicalWarnings?.join(', ') || '',
      address: patient?.address || '',
      notes: patient?.notes || '',
      emergencyContactName: patient?.emergencyContact?.name || '',
      emergencyContactPhone: patient?.emergencyContact?.phone || '',
      emergencyContactRelationship: patient?.emergencyContact?.relationship || '',
    });
  }, [patient, user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const registrationNumber = normalizeRegistrationNumber(form.registrationNumber);
    if (!registrationNumberPattern.test(registrationNumber)) {
      toast('Регистрийн дугаар 2 кирилл үсэг + 8 цифртэй байна. Жишээ: УБ12345678', 'error');
      return;
    }

    try {
      await updateUser({
        variables: {
          input: {
            firstname: form.firstname,
            lastname: form.lastname,
            email: form.email || undefined,
            phone: form.phone || undefined,
            gender: form.gender || undefined,
          },
        },
      });
      await upsertPatient({
        variables: {
          input: {
            registrationNumber,
            firstname: form.firstname,
            lastname: form.lastname,
            phone: form.phone,
            email: form.email || undefined,
            gender: form.gender,
            birthdate: toApiDate(form.birthdate),
            bloodType: form.bloodType,
            allergies: splitList(form.allergies),
            chronicConditions: splitList(form.chronicConditions),
            regularMedications: splitList(form.regularMedications),
            medicalWarnings: splitList(form.medicalWarnings),
            emergencyContact: form.emergencyContactName || form.emergencyContactPhone ? {
              name: form.emergencyContactName || undefined,
              phone: form.emergencyContactPhone || undefined,
              relationship: form.emergencyContactRelationship || undefined,
            } : undefined,
            address: form.address || undefined,
            notes: form.notes || undefined,
          },
        },
      });
      setEditing(false);
      toast('Профайл шинэчлэгдлээ', 'success');
    } catch (err: any) {
      toast(err.message || 'Профайл хадгалахад алдаа гарлаа', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  const saving = savingUser || savingPatient;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-surface-900">Миний профайл</h1>
          <p className="mt-1 text-sm text-surface-500">Холбоо барих болон эмнэлгийн үндсэн мэдээллээ засварлана.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
            <Edit3 size={14} /> Засах
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-4">
          <div className="card">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
                <span className="text-xl font-display text-brand-700">
                  {form.firstname?.charAt(0)}{form.lastname?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-display text-surface-900">{form.lastname} {form.firstname}</h2>
                <p className="text-sm text-surface-500">{form.registrationNumber || 'Регистр оруулаагүй'}</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><span className="text-surface-400">Утас</span><p className="font-medium text-surface-800">{form.phone || '-'}</p></div>
              <div><span className="text-surface-400">Имэйл</span><p className="font-medium text-surface-800">{form.email || '-'}</p></div>
              <div><span className="text-surface-400">Хүйс</span><p className="font-medium text-surface-800">{form.gender === 'male' ? 'Эрэгтэй' : form.gender === 'female' ? 'Эмэгтэй' : form.gender || '-'}</p></div>
              <div><span className="text-surface-400">Төрсөн огноо</span><p className="font-medium text-surface-800">{form.birthdate || '-'}</p></div>
              <div><span className="text-surface-400">Цусны бүлэг</span><p className="font-medium text-surface-800">{form.bloodType === 'unknown' ? 'Тодорхойгүй' : form.bloodType}</p></div>
              <div><span className="text-surface-400">Хаяг</span><p className="font-medium text-surface-800">{form.address || '-'}</p></div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={saveProfile} className="card space-y-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-brand-600" />
            <h2 className="font-display text-surface-900">Профайл засах</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Регистрийн дугаар" required>
              <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: normalizeRegistrationNumber(e.target.value) })} className="input-field uppercase" maxLength={10} required />
            </Field>
            <Field label="Утас" required>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" required />
            </Field>
            <Field label="Овог" required>
              <input value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} className="input-field" required />
            </Field>
            <Field label="Нэр" required>
              <input value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} className="input-field" required />
            </Field>
            <Field label="Имэйл">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            </Field>
            <Field label="Хүйс" required>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field" required>
                <option value="">Сонгох</option>
                <option value="male">Эрэгтэй</option>
                <option value="female">Эмэгтэй</option>
                <option value="other">Бусад</option>
              </select>
            </Field>
            <Field label="Төрсөн огноо" required>
              <input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} className="input-field" required />
            </Field>
            <Field label="Цусны бүлэг">
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="input-field">
                <option value="unknown">Тодорхойгүй</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label="Хаяг"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></Field></div>
            <div className="sm:col-span-2"><Field label="Харшил"><input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="input-field" placeholder="Таслалаар тусгаарлана" /></Field></div>
            <div className="sm:col-span-2"><Field label="Архаг өвчин"><input value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} className="input-field" placeholder="Таслалаар тусгаарлана" /></Field></div>
            <div className="sm:col-span-2"><Field label="Тогтмол хэрэглэдэг эм"><input value={form.regularMedications} onChange={(e) => setForm({ ...form, regularMedications: e.target.value })} className="input-field" placeholder="Таслалаар тусгаарлана" /></Field></div>
            <Field label="Яаралтай холбоо барих нэр"><input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="input-field" /></Field>
            <Field label="Яаралтай холбоо барих утас"><input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} className="input-field" /></Field>
            <div className="sm:col-span-2"><Field label="Тэмдэглэл"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field min-h-24 resize-none" /></Field></div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              <Save size={14} /> {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="btn-secondary text-sm">Болих</button>
          </div>
        </form>
      )}
    </div>
  );
}
