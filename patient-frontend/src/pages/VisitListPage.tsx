import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { MY_VISITS } from '../graphql/queries';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Stethoscope, ArrowRight } from 'lucide-react';

export default function VisitListPage() {
  const { data, loading } = useQuery(MY_VISITS, { variables: { limit: 50 } });
  const visits = data?.getMyVisitHistory || [];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <LoadingSpinner text="Ачааллаж байна..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-surface-900">Үзлэгийн түүх</h1>

      {visits.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={40} />}
          title="Үзлэгийн түүх байхгүй"
          description="Эмчид үзүүлсний дараа энд харагдана"
        />
      ) : (
        <div className="space-y-3">
          {visits.map((visit: any) => (
            <Link
              key={visit._id}
              to={`/visits/${visit._id}`}
              className="card block hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-surface-800">{formatDate(visit.visitDate)}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={visit.status} />
                  <ArrowRight size={14} className="text-surface-300 group-hover:text-brand-500 transition-colors" />
                </div>
              </div>
              <p className="text-xs text-surface-500 mb-2">
                {visit.doctor?.userId?.lastname?.charAt(0)}.{visit.doctor?.userId?.firstname}
                {visit.doctor?.department?.name && ` · ${visit.doctor.department.name}`}
              </p>
              {visit.chiefComplaint && (
                <p className="text-sm text-surface-600 mb-2">{visit.chiefComplaint}</p>
              )}
              {visit.assessment && (
                <p className="text-sm text-surface-700 line-clamp-2">{visit.assessment}</p>
              )}
              {visit.diagnoses?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {visit.diagnoses.map((d: any) => (
                    <span key={d._id} className="badge bg-purple-50 text-purple-700">{d.name}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
