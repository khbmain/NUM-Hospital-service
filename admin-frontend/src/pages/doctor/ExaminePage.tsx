import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_VISIT, PRESCRIPTIONS_BY_PATIENT, VISITS_BY_PATIENT } from '../../graphql/queries';
import { UPDATE_VISIT, COMPLETE_VISIT, RECORD_VITALS, CREATE_DIAGNOSIS, CREATE_PRESCRIPTION } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Icd11Picker from '../../components/icd/Icd11Picker';
import AppModal from '../../components/common/AppModal';
import { ArrowLeft, Save, CheckCircle, Heart, FileText, Pill, Stethoscope, Plus, X, History, ClipboardList } from 'lucide-react';

type Tab = 'vitals' | 'exam' | 'diagnosis' | 'prescription';

type VitalForm = {
  temperature: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
};

type ExamForm = {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExamination: string;
  assessment: string;
  plan: string;
  notes: string;
};

const emptyVitals: VitalForm = {
  temperature: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  heartRate: '',
  respiratoryRate: '',
  oxygenSaturation: '',
  weight: '',
  height: '',
};

const emptyExam: ExamForm = {
  chiefComplaint: '',
  historyOfPresentIllness: '',
  physicalExamination: '',
  assessment: '',
  plan: '',
  notes: '',
};

const emptyDiagnosis = {
  name: '',
  icdCode: '',
  icdTitle: '',
  icdVersion: '2026-01',
  icdLinearization: 'mms',
  icdLanguage: 'en',
  icdLinearizationUri: '',
  icdFoundationUri: '',
  icdParentUri: '',
  type: 'primary',
  severity: 'mild',
  notes: '',
};

const emptyRxItem = {
  medicationName: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '',
  unit: '',
  instructions: '',
};

function toOptionalFloat(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export default function ExaminePage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('vitals');
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_VISIT, { variables: { id: visitId }, skip: !visitId });
  const [updateVisit] = useMutation(UPDATE_VISIT);
  const [completeVisit] = useMutation(COMPLETE_VISIT);
  const [recordVitals] = useMutation(RECORD_VITALS);
  const [createDiagnosis] = useMutation(CREATE_DIAGNOSIS);
  const [createPrescription] = useMutation(CREATE_PRESCRIPTION);

  const visit = data?.getVisit;
  const patient = visit?.patient;
  const age = useMemo(() => getAge(patient?.birthdate), [patient?.birthdate]);
  const { data: historyData, loading: historyLoading } = useQuery(VISITS_BY_PATIENT, {
    variables: { patientId: patient?._id, page: 1, limit: 6 },
    skip: !patient?._id,
  });
  const { data: prescriptionsData, loading: prescriptionsLoading } = useQuery(PRESCRIPTIONS_BY_PATIENT, {
    variables: { patientId: patient?._id },
    skip: !patient?._id,
  });
  const previousVisits = useMemo(
    () => (historyData?.listVisitsByPatient || []).filter((item: any) => item._id !== visit?._id).slice(0, 4),
    [historyData?.listVisitsByPatient, visit?._id]
  );
  const previousPrescriptions = useMemo(
    () => (prescriptionsData?.getPrescriptionsByPatient || []).slice(0, 4),
    [prescriptionsData?.getPrescriptionsByPatient]
  );

  const [vitals, setVitals] = useState<VitalForm>(emptyVitals);
  const [exam, setExam] = useState<ExamForm>(emptyExam);
  const [diag, setDiag] = useState(emptyDiagnosis);
  const [rxItems, setRxItems] = useState([{ ...emptyRxItem }]);
  const [rxNotes, setRxNotes] = useState('');

  useEffect(() => {
    if (!visit) return;

    setExam({
      chiefComplaint: visit.chiefComplaint || '',
      historyOfPresentIllness: visit.historyOfPresentIllness || '',
      physicalExamination: visit.physicalExamination || '',
      assessment: visit.assessment || '',
      plan: visit.plan || '',
      notes: visit.notes || '',
    });

    const vs = visit.vitalSigns;
    setVitals({
      temperature: vs?.temperature?.toString() || '',
      bloodPressureSystolic: vs?.bloodPressureSystolic?.toString() || '',
      bloodPressureDiastolic: vs?.bloodPressureDiastolic?.toString() || '',
      heartRate: vs?.heartRate?.toString() || '',
      respiratoryRate: vs?.respiratoryRate?.toString() || '',
      oxygenSaturation: vs?.oxygenSaturation?.toString() || '',
      weight: vs?.weight?.toString() || '',
      height: vs?.height?.toString() || '',
    });
  }, [visit?._id]);

  const showSuccess = (message: string) => {
    setError('');
    setSuccess(message);
  };

  const handleSaveVitals = async () => {
    setSavingSection('vitals');
    try {
      const input: Record<string, number> = {};
      const numericValues = {
        temperature: toOptionalFloat(vitals.temperature),
        bloodPressureSystolic: toOptionalInt(vitals.bloodPressureSystolic),
        bloodPressureDiastolic: toOptionalInt(vitals.bloodPressureDiastolic),
        heartRate: toOptionalInt(vitals.heartRate),
        respiratoryRate: toOptionalInt(vitals.respiratoryRate),
        oxygenSaturation: toOptionalFloat(vitals.oxygenSaturation),
        weight: toOptionalFloat(vitals.weight),
        height: toOptionalFloat(vitals.height),
      };

      Object.entries(numericValues).forEach(([key, value]) => {
        if (value !== undefined) input[key] = value;
      });

      await recordVitals({ variables: { visitId, input } });
      await refetch();
      showSuccess('Амин үзүүлэлт хадгалагдлаа.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveExam = async () => {
    setSavingSection('exam');
    try {
      await updateVisit({ variables: { id: visitId, input: exam } });
      await refetch();
      showSuccess('Үзлэгийн тэмдэглэл хадгалагдлаа.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('diagnosis');
    try {
      await createDiagnosis({ variables: { input: { visitId, ...diag } } });
      setDiag(emptyDiagnosis);
      await refetch();
      showSuccess('Онош нэмэгдлээ.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = rxItems
      .filter((item) => item.medicationName.trim())
      .map((item) => ({
        medicationName: item.medicationName.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration.trim() || undefined,
        quantity: toOptionalInt(item.quantity),
        unit: item.unit.trim() || undefined,
        instructions: item.instructions.trim() || undefined,
      }));

    if (items.length === 0) {
      setError('Дор хаяж нэг эм оруулна уу.');
      return;
    }

    setSavingSection('prescription');
    try {
      await createPrescription({ variables: { input: { visitId, items, notes: rxNotes.trim() || undefined } } });
      setRxItems([{ ...emptyRxItem }]);
      setRxNotes('');
      await refetch();
      showSuccess('Жор бичигдлээ.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  const handleComplete = async () => {
    setSavingSection('complete');
    try {
      await completeVisit({ variables: { id: visitId } });
      navigate('/doctor/queue');
    } catch (err: any) {
      setError(err.message);
      setCompleteOpen(false);
      setSavingSection(null);
    }
  };

  if (loading) return <LoadingSpinner text="Үзлэг ачааллаж байна..." />;
  if (!visit) return <p className="text-center py-20 text-surface-500">Үзлэг олдсонгүй</p>;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'vitals', label: 'Амин үзүүлэлт', icon: Heart },
    { key: 'exam', label: 'Үзлэг', icon: FileText },
    { key: 'diagnosis', label: 'Онош', icon: Stethoscope },
    { key: 'prescription', label: 'Жор', icon: Pill },
  ];

  const vitalFields: { key: keyof VitalForm; label: string; placeholder: string }[] = [
    { key: 'temperature', label: 'Температур (C)', placeholder: '36.6' },
    { key: 'bloodPressureSystolic', label: 'Даралт sys', placeholder: '120' },
    { key: 'bloodPressureDiastolic', label: 'Даралт dia', placeholder: '80' },
    { key: 'heartRate', label: 'Зүрхний цохилт', placeholder: '72' },
    { key: 'respiratoryRate', label: 'Амьсгалын давтамж', placeholder: '16' },
    { key: 'oxygenSaturation', label: 'SpO2 (%)', placeholder: '98' },
    { key: 'weight', label: 'Жин (кг)', placeholder: '70' },
    { key: 'height', label: 'Өндөр (см)', placeholder: '170' },
  ];

  const examFields: { key: keyof ExamForm; label: string; rows: number }[] = [
    { key: 'chiefComplaint', label: 'Гол зовиур', rows: 2 },
    { key: 'historyOfPresentIllness', label: 'Өвчний түүх', rows: 3 },
    { key: 'physicalExamination', label: 'Биеийн үзлэг', rows: 3 },
    { key: 'assessment', label: 'Дүгнэлт', rows: 2 },
    { key: 'plan', label: 'Төлөвлөгөө', rows: 2 },
    { key: 'notes', label: 'Нэмэлт тэмдэглэл', rows: 2 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/doctor/queue')} className="btn-ghost" aria-label="Буцах">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display text-surface-900 truncate">
            {patient?.lastname?.charAt(0)}.{patient?.firstname}
            <span className="text-sm font-body text-surface-400 ml-2">{patient?.registrationNumber}</span>
          </h1>
          <p className="text-xs text-surface-500">
            {patient?.gender === 'male' ? 'Эр' : 'Эм'}
            {age !== null && ` · ${age} нас`}
            {patient?.bloodType && patient.bloodType !== 'unknown' && ` · ${patient.bloodType}`}
          </p>
        </div>
        <StatusBadge status={visit.status} />
        {visit.status !== 'completed' && (
          <button type="button" onClick={() => setCompleteOpen(true)} className="btn-primary text-xs">
            <CheckCircle size={14} /> Дуусгах
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700" aria-label="Алдаа хаах">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between gap-3">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700" aria-label="Мэдэгдэл хаах">
            <X size={14} />
          </button>
        </div>
      )}

      {patient?.allergies?.length > 0 && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          Харшил: {patient.allergies.join(', ')}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-brand-600" />
            <h3 className="text-sm font-display text-surface-900">Өмнөх үзлэгүүд</h3>
          </div>
          {historyLoading ? (
            <LoadingSpinner text="Өмнөх үзлэг шалгаж байна..." />
          ) : previousVisits.length === 0 ? (
            <div className="rounded-lg bg-surface-50 px-4 py-6 text-center text-sm text-surface-400">
              Өмнөх үзлэгийн түүх алга.
            </div>
          ) : (
            <div className="space-y-2">
              {previousVisits.map((item: any) => (
                <div key={item._id} className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.chiefComplaint || 'Зовиур тэмдэглээгүй'}</p>
                      <p className="mt-1 text-xs text-surface-500">
                        {formatDate(item.visitDate)} · {item.doctor?.userId?.lastname?.charAt(0)}.{item.doctor?.userId?.firstname}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.assessment && <p className="mt-2 text-sm text-surface-600">Дүгнэлт: {item.assessment}</p>}
                  {item.diagnoses?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.diagnoses.slice(0, 3).map((diagnosis: any) => (
                        <span key={diagnosis._id} className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700">
                          {diagnosis.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-brand-600" />
            <h3 className="text-sm font-display text-surface-900">Өмнөх жорууд</h3>
          </div>
          {prescriptionsLoading ? (
            <LoadingSpinner text="Өмнөх жор шалгаж байна..." />
          ) : previousPrescriptions.length === 0 ? (
            <div className="rounded-lg bg-surface-50 px-4 py-6 text-center text-sm text-surface-400">
              Өмнө бичигдсэн жор алга.
            </div>
          ) : (
            <div className="space-y-2">
              {previousPrescriptions.map((rx: any) => (
                <div key={rx._id} className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{rx.prescriptionNumber}</p>
                      <p className="mt-1 text-xs text-surface-500">
                        {formatDate(rx.createdAt)} · {rx.doctor?.userId?.lastname?.charAt(0)}.{rx.doctor?.userId?.firstname}
                      </p>
                    </div>
                    <StatusBadge status={rx.status} />
                  </div>
                  <div className="mt-2 space-y-1">
                    {rx.items?.slice(0, 3).map((item: any, index: number) => (
                      <p key={index} className="text-sm text-surface-600">
                        {item.medicationName} · {item.dosage} · {item.frequency}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
            {tab.key === 'diagnosis' && visit.diagnoses?.length > 0 && (
              <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 rounded-full">{visit.diagnoses.length}</span>
            )}
            {tab.key === 'prescription' && visit.prescriptions?.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 rounded-full">{visit.prescriptions.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'vitals' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {vitalFields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-surface-600 mb-1">{field.label}</label>
                <input
                  type="number"
                  step="any"
                  placeholder={field.placeholder}
                  value={vitals[field.key]}
                  onChange={(e) => setVitals({ ...vitals, [field.key]: e.target.value })}
                  className="input-field"
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={handleSaveVitals} disabled={savingSection === 'vitals'} className="btn-primary text-sm">
            <Save size={14} /> {savingSection === 'vitals' ? 'Хадгалж байна...' : 'Амин үзүүлэлт хадгалах'}
          </button>
        </div>
      )}

      {activeTab === 'exam' && (
        <div className="card space-y-4">
          {examFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-surface-600 mb-1">{field.label}</label>
              <textarea
                rows={field.rows}
                value={exam[field.key]}
                onChange={(e) => setExam({ ...exam, [field.key]: e.target.value })}
                className="input-field resize-none"
              />
            </div>
          ))}
          <button type="button" onClick={handleSaveExam} disabled={savingSection === 'exam'} className="btn-primary text-sm">
            <Save size={14} /> {savingSection === 'exam' ? 'Хадгалж байна...' : 'Тэмдэглэл хадгалах'}
          </button>
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="space-y-4">
          {visit.diagnoses?.length > 0 && (
            <div className="card space-y-2">
              <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">Бүртгэгдсэн онош</h3>
              {visit.diagnoses.map((item: any) => (
                <div key={item._id} className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-surface-800">{item.name}</span>
                    {item.icdCode && <span className="text-xs text-surface-400 ml-2">({item.icdCode})</span>}
                  </div>
                  <StatusBadge status={item.severity || item.type} />
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddDiagnosis} className="card space-y-3">
            <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider">Шинэ онош нэмэх</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Оношийн нэр *</label>
                <input value={diag.name} onChange={(e) => setDiag({ ...diag, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">ICD-11 код</label>
                <input value={diag.icdCode} onChange={(e) => setDiag({ ...diag, icdCode: e.target.value })} className="input-field" placeholder="01" />
              </div>
              <div className="md:col-span-2">
                <Icd11Picker
                  selectedCode={diag.icdCode}
                  onSelect={(entity, parent) => setDiag({
                    ...diag,
                    name: entity.title,
                    icdTitle: entity.title,
                    icdCode: entity.code || '',
                    icdLinearizationUri: entity.uri,
                    icdFoundationUri: entity.foundationUri || '',
                    icdParentUri: parent?.uri || '',
                  })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Төрөл</label>
                <select value={diag.type} onChange={(e) => setDiag({ ...diag, type: e.target.value })} className="input-field">
                  <option value="primary">Үндсэн</option>
                  <option value="secondary">Хавсарсан</option>
                  <option value="differential">Ялгах</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Хүндийн зэрэг</label>
                <select value={diag.severity} onChange={(e) => setDiag({ ...diag, severity: e.target.value })} className="input-field">
                  <option value="mild">Хөнгөн</option>
                  <option value="moderate">Дунд</option>
                  <option value="severe">Хүнд</option>
                  <option value="critical">Маш хүнд</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={savingSection === 'diagnosis'} className="btn-primary text-sm">
              <Plus size={14} /> {savingSection === 'diagnosis' ? 'Нэмж байна...' : 'Онош нэмэх'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'prescription' && (
        <div className="space-y-4">
          {visit.prescriptions?.length > 0 && (
            <div className="card space-y-2">
              <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">Бүртгэгдсэн жор</h3>
              {visit.prescriptions.map((rx: any) => (
                <div key={rx._id} className="p-3 bg-amber-50/50 rounded-lg">
                  <span className="text-xs font-medium text-brand-600">{rx.prescriptionNumber}</span>
                  <div className="mt-1 space-y-1">
                    {rx.items.map((item: any, index: number) => (
                      <p key={index} className="text-sm text-surface-700">
                        {item.medicationName} - {item.dosage} · {item.frequency}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddPrescription} className="card space-y-4">
            <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider">Шинэ жор бичих</h3>
            {rxItems.map((item, index) => (
              <div key={index} className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-surface-50 rounded-lg relative">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setRxItems(rxItems.filter((_, itemIndex) => itemIndex !== index))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center"
                    aria-label="Эм хасах"
                  >
                    <X size={10} />
                  </button>
                )}
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Эмийн нэр *</label>
                  <input
                    value={item.medicationName}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], medicationName: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Тун *</label>
                  <input
                    value={item.dosage}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], dosage: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    placeholder="500mg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Давтамж *</label>
                  <input
                    value={item.frequency}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], frequency: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    placeholder="3 удаа/өдөр"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Хугацаа</label>
                  <input
                    value={item.duration}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], duration: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    placeholder="5 хоног"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Тоо</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], quantity: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    placeholder="15"
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Заавар</label>
                  <input
                    value={item.instructions}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], instructions: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    placeholder="Хоолны дараа ууна"
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Нэгж</label>
                  <input
                    value={item.unit}
                    onChange={(e) => {
                      const next = [...rxItems];
                      next[index] = { ...next[index], unit: e.target.value };
                      setRxItems(next);
                    }}
                    className="input-field text-sm"
                    placeholder="шахмал"
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setRxItems([...rxItems, { ...emptyRxItem }])} className="btn-ghost text-xs">
              <Plus size={12} /> Эм нэмэх
            </button>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Жорын тэмдэглэл</label>
              <textarea value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} rows={2} className="input-field resize-none" />
            </div>
            <button type="submit" disabled={savingSection === 'prescription'} className="btn-primary text-sm">
              <Pill size={14} /> {savingSection === 'prescription' ? 'Бичиж байна...' : 'Жор бичих'}
            </button>
          </form>
        </div>
      )}

      <AppModal
        open={completeOpen}
        title="Үзлэг дуусгах"
        description="Энэ үзлэгийг дууссан төлөвт шилжүүлэх үү? Дууссан үзлэгийн тэмдэглэлийг дахин засах боломж хязгаарлагдана."
        confirmLabel="Дуусгах"
        cancelLabel="Болих"
        loading={savingSection === 'complete'}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleComplete}
      />
    </div>
  );
}
