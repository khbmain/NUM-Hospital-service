import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_VISIT } from '../../graphql/queries';
import { UPDATE_VISIT, COMPLETE_VISIT, RECORD_VITALS, CREATE_DIAGNOSIS, CREATE_PRESCRIPTION } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeft, Save, CheckCircle, Heart, FileText, Pill, Stethoscope, Plus, X } from 'lucide-react';

type Tab = 'exam' | 'vitals' | 'diagnosis' | 'prescription';

export default function ExaminePage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('vitals');
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useQuery(GET_VISIT, { variables: { id: visitId } });
  const [updateVisit] = useMutation(UPDATE_VISIT);
  const [completeVisit] = useMutation(COMPLETE_VISIT);
  const [recordVitals] = useMutation(RECORD_VITALS);
  const [createDiagnosis] = useMutation(CREATE_DIAGNOSIS);
  const [createPrescription] = useMutation(CREATE_PRESCRIPTION);

  const visit = data?.getVisit;

  // Form states
  const [vitals, setVitals] = useState({ temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '' });
  const [exam, setExam] = useState({ chiefComplaint: '', historyOfPresentIllness: '', physicalExamination: '', assessment: '', plan: '', notes: '' });
  const [diag, setDiag] = useState({ name: '', icdCode: '', type: 'primary', severity: 'mild', notes: '' });
  const [rxItems, setRxItems] = useState([{ medicationName: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }]);
  const [rxNotes, setRxNotes] = useState('');

  // Initialize form from visit data
  useState(() => {
    if (visit) {
      setExam({
        chiefComplaint: visit.chiefComplaint || '',
        historyOfPresentIllness: visit.historyOfPresentIllness || '',
        physicalExamination: visit.physicalExamination || '',
        assessment: visit.assessment || '',
        plan: visit.plan || '',
        notes: visit.notes || '',
      });
      if (visit.vitalSigns) {
        const vs = visit.vitalSigns;
        setVitals({
          temperature: vs.temperature?.toString() || '',
          bloodPressureSystolic: vs.bloodPressureSystolic?.toString() || '',
          bloodPressureDiastolic: vs.bloodPressureDiastolic?.toString() || '',
          heartRate: vs.heartRate?.toString() || '',
          respiratoryRate: vs.respiratoryRate?.toString() || '',
          oxygenSaturation: vs.oxygenSaturation?.toString() || '',
          weight: vs.weight?.toString() || '',
          height: vs.height?.toString() || '',
        });
      }
    }
  });

  if (loading) return <LoadingSpinner text="Үзлэг ачааллаж байна..." />;
  if (!visit) return <p className="text-center py-20 text-surface-500">Үзлэг олдсонгүй</p>;

  const patient = visit.patient;

  const handleSaveVitals = async () => {
    setSaving(true);
    try {
      const input: any = {};
      if (vitals.temperature) input.temperature = parseFloat(vitals.temperature);
      if (vitals.bloodPressureSystolic) input.bloodPressureSystolic = parseInt(vitals.bloodPressureSystolic);
      if (vitals.bloodPressureDiastolic) input.bloodPressureDiastolic = parseInt(vitals.bloodPressureDiastolic);
      if (vitals.heartRate) input.heartRate = parseInt(vitals.heartRate);
      if (vitals.respiratoryRate) input.respiratoryRate = parseInt(vitals.respiratoryRate);
      if (vitals.oxygenSaturation) input.oxygenSaturation = parseFloat(vitals.oxygenSaturation);
      if (vitals.weight) input.weight = parseFloat(vitals.weight);
      if (vitals.height) input.height = parseFloat(vitals.height);
      await recordVitals({ variables: { visitId, input } });
      await refetch();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const handleSaveExam = async () => {
    setSaving(true);
    try {
      await updateVisit({ variables: { id: visitId, input: exam } });
      await refetch();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDiagnosis({ variables: { input: { visitId, ...diag } } });
      setDiag({ name: '', icdCode: '', type: 'primary', severity: 'mild', notes: '' });
      await refetch();
    } catch (err: any) { alert(err.message); }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = rxItems.filter(i => i.medicationName).map(i => ({
      ...i,
      quantity: i.quantity ? parseInt(i.quantity) : undefined,
    }));
    if (items.length === 0) return alert('Дор хаяж нэг эм оруулна уу');
    try {
      await createPrescription({ variables: { input: { visitId, items, notes: rxNotes || undefined } } });
      setRxItems([{ medicationName: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }]);
      setRxNotes('');
      await refetch();
    } catch (err: any) { alert(err.message); }
  };

  const handleComplete = async () => {
    if (!confirm('Үзлэгийг дуусгах уу?')) return;
    try {
      await completeVisit({ variables: { id: visitId } });
      navigate('/doctor/queue');
    } catch (err: any) { alert(err.message); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'vitals', label: 'Амин үзүүлэлт', icon: Heart },
    { key: 'exam', label: 'Үзлэг', icon: FileText },
    { key: 'diagnosis', label: 'Онош', icon: Stethoscope },
    { key: 'prescription', label: 'Жор', icon: Pill },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/doctor/queue')} className="btn-ghost"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-lg font-display text-surface-900">
            {patient?.lastname?.charAt(0)}.{patient?.firstname}
            <span className="text-sm font-body text-surface-400 ml-2">{patient?.registrationNumber}</span>
          </h1>
          <p className="text-xs text-surface-500">
            {patient?.gender === 'male' ? 'Эр' : 'Эм'}
            {patient?.birthdate && ` · ${new Date().getFullYear() - new Date(patient.birthdate).getFullYear()} нас`}
            {patient?.bloodType && patient.bloodType !== 'unknown' && ` · ${patient.bloodType}`}
          </p>
        </div>
        <StatusBadge status={visit.status} />
        {visit.status !== 'completed' && (
          <button onClick={handleComplete} className="btn-primary text-xs">
            <CheckCircle size={14} /> Дуусгах
          </button>
        )}
      </div>

      {/* Allergies warning */}
      {patient?.allergies?.length > 0 && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          ⚠️ Харшил: {patient.allergies.join(', ')}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}>
            <t.icon size={14} /> {t.label}
            {t.key === 'diagnosis' && visit.diagnoses?.length > 0 && (
              <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 rounded-full">{visit.diagnoses.length}</span>
            )}
            {t.key === 'prescription' && visit.prescriptions?.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 rounded-full">{visit.prescriptions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Vitals */}
      {activeTab === 'vitals' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'temperature', label: 'Температур (°C)', ph: '36.6' },
              { key: 'bloodPressureSystolic', label: 'Даралт (sys)', ph: '120' },
              { key: 'bloodPressureDiastolic', label: 'Даралт (dia)', ph: '80' },
              { key: 'heartRate', label: 'Зүрхний цохилт', ph: '72' },
              { key: 'respiratoryRate', label: 'Амьсгалын давтамж', ph: '16' },
              { key: 'oxygenSaturation', label: 'SpO₂ (%)', ph: '98' },
              { key: 'weight', label: 'Жин (кг)', ph: '70' },
              { key: 'height', label: 'Өндөр (см)', ph: '170' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-surface-600 mb-1">{f.label}</label>
                <input type="number" step="any" placeholder={f.ph}
                  value={(vitals as any)[f.key]}
                  onChange={e => setVitals({...vitals, [f.key]: e.target.value})}
                  className="input-field" />
              </div>
            ))}
          </div>
          <button onClick={handleSaveVitals} disabled={saving} className="btn-primary text-sm">
            <Save size={14} /> {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      )}

      {/* Tab: Examination */}
      {activeTab === 'exam' && (
        <div className="card space-y-4">
          {[
            { key: 'chiefComplaint', label: 'Гол гомдол', rows: 2 },
            { key: 'historyOfPresentIllness', label: 'Өвчний түүх', rows: 3 },
            { key: 'physicalExamination', label: 'Биеийн үзлэг', rows: 3 },
            { key: 'assessment', label: 'Дүгнэлт', rows: 2 },
            { key: 'plan', label: 'Төлөвлөгөө', rows: 2 },
            { key: 'notes', label: 'Нэмэлт тэмдэглэл', rows: 2 },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-surface-600 mb-1">{f.label}</label>
              <textarea rows={f.rows} value={(exam as any)[f.key]}
                onChange={e => setExam({...exam, [f.key]: e.target.value})}
                className="input-field resize-none" />
            </div>
          ))}
          <button onClick={handleSaveExam} disabled={saving} className="btn-primary text-sm">
            <Save size={14} /> {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      )}

      {/* Tab: Diagnosis */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-4">
          {/* Existing diagnoses */}
          {visit.diagnoses?.length > 0 && (
            <div className="card space-y-2">
              <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">Бүртгэгдсэн онош</h3>
              {visit.diagnoses.map((d: any) => (
                <div key={d._id} className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-surface-800">{d.name}</span>
                    {d.icdCode && <span className="text-xs text-surface-400 ml-2">({d.icdCode})</span>}
                  </div>
                  <StatusBadge status={d.severity || d.type} />
                </div>
              ))}
            </div>
          )}
          {/* Add form */}
          <form onSubmit={handleAddDiagnosis} className="card space-y-3">
            <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider">Шинэ онош нэмэх</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Оношийн нэр *</label>
                <input value={diag.name} onChange={e => setDiag({...diag, name: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">ICD код</label>
                <input value={diag.icdCode} onChange={e => setDiag({...diag, icdCode: e.target.value})} className="input-field" placeholder="J06.9" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Төрөл</label>
                <select value={diag.type} onChange={e => setDiag({...diag, type: e.target.value})} className="input-field">
                  <option value="primary">Үндсэн</option>
                  <option value="secondary">Хавсарсан</option>
                  <option value="differential">Ялгах</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Хүндийн зэрэг</label>
                <select value={diag.severity} onChange={e => setDiag({...diag, severity: e.target.value})} className="input-field">
                  <option value="mild">Хөнгөн</option>
                  <option value="moderate">Дунд</option>
                  <option value="severe">Хүнд</option>
                  <option value="critical">Маш хүнд</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary text-sm"><Plus size={14} /> Онош нэмэх</button>
          </form>
        </div>
      )}

      {/* Tab: Prescription */}
      {activeTab === 'prescription' && (
        <div className="space-y-4">
          {/* Existing prescriptions */}
          {visit.prescriptions?.length > 0 && (
            <div className="card space-y-2">
              <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">Бүртгэгдсэн жор</h3>
              {visit.prescriptions.map((rx: any) => (
                <div key={rx._id} className="p-3 bg-amber-50/50 rounded-lg">
                  <span className="text-xs font-medium text-brand-600">{rx.prescriptionNumber}</span>
                  <div className="mt-1 space-y-1">
                    {rx.items.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-surface-700">{item.medicationName} — {item.dosage} · {item.frequency}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Add form */}
          <form onSubmit={handleAddPrescription} className="card space-y-4">
            <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider">Шинэ жор бичих</h3>
            {rxItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-surface-50 rounded-lg relative">
                {idx > 0 && (
                  <button type="button" onClick={() => setRxItems(rxItems.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <X size={10} />
                  </button>
                )}
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Эмийн нэр *</label>
                  <input value={item.medicationName} onChange={e => { const n = [...rxItems]; n[idx].medicationName = e.target.value; setRxItems(n); }}
                    className="input-field text-sm" required />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Тун *</label>
                  <input value={item.dosage} onChange={e => { const n = [...rxItems]; n[idx].dosage = e.target.value; setRxItems(n); }}
                    className="input-field text-sm" placeholder="500mg" required />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Давтамж *</label>
                  <input value={item.frequency} onChange={e => { const n = [...rxItems]; n[idx].frequency = e.target.value; setRxItems(n); }}
                    className="input-field text-sm" placeholder="3 удаа/өдөр" required />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Хугацаа</label>
                  <input value={item.duration} onChange={e => { const n = [...rxItems]; n[idx].duration = e.target.value; setRxItems(n); }}
                    className="input-field text-sm" placeholder="5 хоног" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-0.5">Тоо</label>
                  <input type="number" value={item.quantity} onChange={e => { const n = [...rxItems]; n[idx].quantity = e.target.value; setRxItems(n); }}
                    className="input-field text-sm" placeholder="15" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setRxItems([...rxItems, { medicationName: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }])}
              className="btn-ghost text-xs"><Plus size={12} /> Эм нэмэх</button>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Тэмдэглэл</label>
              <textarea value={rxNotes} onChange={e => setRxNotes(e.target.value)} rows={2} className="input-field resize-none" />
            </div>
            <button type="submit" className="btn-primary text-sm"><Pill size={14} /> Жор бичих</button>
          </form>
        </div>
      )}
    </div>
  );
}
