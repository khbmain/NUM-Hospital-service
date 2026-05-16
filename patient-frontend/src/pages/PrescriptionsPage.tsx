import { useQuery } from '@apollo/client';
import { MY_PRESCRIPTIONS } from '../graphql/queries';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Pill } from 'lucide-react';

export default function PrescriptionsPage() {
  const { data, loading } = useQuery(MY_PRESCRIPTIONS, { variables: { limit: 50 } });
  const prescriptions = data?.getMyPrescriptions || [];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <LoadingSpinner text="Ачааллаж байна..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-surface-900">Жорын жагсаалт</h1>

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={<Pill size={40} />}
          title="Жор байхгүй"
          description="Эмчийн бичсэн жорууд энд харагдана"
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx: any) => (
            <div key={rx._id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-medium text-brand-600">{rx.prescriptionNumber}</span>
                  <span className="text-xs text-surface-400 ml-2">{formatDate(rx.createdAt)}</span>
                </div>
                <StatusBadge status={rx.status} />
              </div>
              <p className="text-xs text-surface-500 mb-3">
                Эмч: {rx.doctor?.userId?.firstname} · {rx.doctor?.specialization}
              </p>
              <div className="space-y-2">
                {rx.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Pill size={14} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-surface-800">{item.medicationName}</span>
                      <p className="text-xs text-surface-500">
                        {item.dosage} · {item.frequency}
                        {item.duration && ` · ${item.duration}`}
                        {item.quantity ? ` · ${item.quantity} ${item.unit || ''}` : item.unit && ` · ${item.unit}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {rx.notes && (
                <p className="text-xs text-surface-400 mt-3 italic">{rx.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
