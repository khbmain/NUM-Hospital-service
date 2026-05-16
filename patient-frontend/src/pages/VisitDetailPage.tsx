import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { GET_VISIT } from '../graphql/queries';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, Heart, Thermometer, Activity, Pill, FileText } from 'lucide-react';

export default function VisitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useQuery(GET_VISIT, { variables: { id } });
  const visit = data?.getVisit;

  if (loading) return <LoadingSpinner />;
  if (!visit) return <p className="text-center text-surface-500 py-20">Үзлэг олдсонгүй</p>;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });

  const vs = visit.vitalSigns;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft size={16} /> Буцах
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display text-surface-900">{formatDate(visit.visitDate)}</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {visit.doctor?.userId?.lastname?.charAt(0)}.{visit.doctor?.userId?.firstname}
            {visit.doctor?.department?.name && ` · ${visit.doctor.department.name}`}
          </p>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      {/* Chief Complaint */}
      {visit.chiefComplaint && (
        <div className="card">
          <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Гол зовиур</h3>
          <p className="text-sm text-surface-800">{visit.chiefComplaint}</p>
        </div>
      )}

      {/* Vital Signs */}
      {vs && (
        <div className="card">
          <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
            <Heart size={12} className="inline mr-1" /> Амин үзүүлэлтүүд
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {vs.temperature && (
              <div className="bg-surface-50 rounded-xl p-3 text-center">
                <Thermometer size={16} className="text-red-400 mx-auto mb-1" />
                <span className="text-lg font-display text-surface-900">{vs.temperature}°</span>
                <p className="text-[10px] text-surface-400">Температур</p>
              </div>
            )}
            {vs.bloodPressureSystolic && (
              <div className="bg-surface-50 rounded-xl p-3 text-center">
                <Activity size={16} className="text-blue-400 mx-auto mb-1" />
                <span className="text-lg font-display text-surface-900">
                  {vs.bloodPressureSystolic}/{vs.bloodPressureDiastolic}
                </span>
                <p className="text-[10px] text-surface-400">Даралт</p>
              </div>
            )}
            {vs.heartRate && (
              <div className="bg-surface-50 rounded-xl p-3 text-center">
                <Heart size={16} className="text-red-400 mx-auto mb-1" />
                <span className="text-lg font-display text-surface-900">{vs.heartRate}</span>
                <p className="text-[10px] text-surface-400">Зүрхний цохилт</p>
              </div>
            )}
            {vs.oxygenSaturation && (
              <div className="bg-surface-50 rounded-xl p-3 text-center">
                <Activity size={16} className="text-emerald-400 mx-auto mb-1" />
                <span className="text-lg font-display text-surface-900">{vs.oxygenSaturation}%</span>
                <p className="text-[10px] text-surface-400">SpO₂</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Examination Notes */}
      {(visit.historyOfPresentIllness || visit.physicalExamination) && (
        <div className="card space-y-4">
          <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider">
            <FileText size={12} className="inline mr-1" /> Үзлэгийн тэмдэглэл
          </h3>
          {visit.historyOfPresentIllness && (
            <div>
              <span className="text-xs font-medium text-surface-500">Өвчний түүх</span>
              <p className="text-sm text-surface-700 mt-1">{visit.historyOfPresentIllness}</p>
            </div>
          )}
          {visit.physicalExamination && (
            <div>
              <span className="text-xs font-medium text-surface-500">Биеийн үзлэг</span>
              <p className="text-sm text-surface-700 mt-1">{visit.physicalExamination}</p>
            </div>
          )}
        </div>
      )}

      {/* Assessment & Plan */}
      {(visit.assessment || visit.plan) && (
        <div className="card space-y-4">
          {visit.assessment && (
            <div>
              <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Дүгнэлт</h3>
              <p className="text-sm text-surface-800">{visit.assessment}</p>
            </div>
          )}
          {visit.plan && (
            <div>
              <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Төлөвлөгөө</h3>
              <p className="text-sm text-surface-800">{visit.plan}</p>
            </div>
          )}
        </div>
      )}

      {/* Diagnoses */}
      {visit.diagnoses?.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">Онош</h3>
          <div className="space-y-2">
            {visit.diagnoses.map((d: any) => (
              <div key={d._id} className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-surface-800">{d.name}</span>
                  {d.icdCode && <span className="text-xs text-surface-400 ml-2">({d.icdCode})</span>}
                  {d.severity && (
                    <span className={`badge ml-2 ${
                      d.severity === 'critical' ? 'bg-red-50 text-red-700' :
                      d.severity === 'severe' ? 'bg-orange-50 text-orange-700' :
                      'bg-surface-100 text-surface-600'
                    }`}>{d.severity}</span>
                  )}
                  {d.notes && <p className="text-xs text-surface-500 mt-1">{d.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {visit.prescriptions?.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
            <Pill size={12} className="inline mr-1" /> Жор
          </h3>
          {visit.prescriptions.map((rx: any) => (
            <div key={rx._id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-brand-600">{rx.prescriptionNumber}</span>
                <StatusBadge status={rx.status} />
              </div>
              <div className="space-y-2">
                {rx.items.map((item: any, i: number) => (
                  <div key={i} className="p-3 bg-amber-50/50 rounded-xl">
                    <span className="text-sm font-medium text-surface-800">{item.medicationName}</span>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {item.dosage} · {item.frequency}
                      {item.unit && ` · ${item.unit}`}
                      {item.duration && ` · ${item.duration}`}
                    </p>
                    {item.instructions && (
                      <p className="text-xs text-surface-400 mt-1 italic">{item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
              {rx.notes && <p className="text-xs text-surface-500 mt-2">{rx.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
