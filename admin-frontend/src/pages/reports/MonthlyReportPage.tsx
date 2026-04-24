import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { MONTHLY_REPORT } from '../../graphql/queries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BarChart3, CalendarDays } from 'lucide-react';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function ReportTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div className="card">
      <h2 className="text-sm font-display text-surface-900 mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-surface-400 py-6 text-center">Мэдээлэл байхгүй</p>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-surface-600 truncate">{row.label}</span>
              <span className="font-semibold text-surface-900">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonthlyReportPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, loading, error } = useQuery(MONTHLY_REPORT, { variables: { month } });
  const report = data?.monthlyReport;
  const total = useMemo(() => (report?.completedAppointments || 0) + (report?.completedVisits || 0), [report]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display text-surface-900 flex items-center gap-2">
            <BarChart3 size={20} /> Сарын тайлан
          </h1>
          <p className="text-sm text-surface-500 mt-1">Дууссан үзлэг, үйлчилгээний нас/хүйс/нөөцийн нэгтгэл</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-surface-600">
          <CalendarDays size={16} />
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto" />
        </label>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error.message}</div>}
      {loading ? <LoadingSpinner /> : report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card">
              <p className="text-xs text-surface-500">Нийт</p>
              <p className="text-2xl font-display text-surface-900 mt-1">{total}</p>
            </div>
            <div className="card">
              <p className="text-xs text-surface-500">Цагт үйлчилгээ</p>
              <p className="text-2xl font-display text-surface-900 mt-1">{report.completedAppointments}</p>
            </div>
            <div className="card">
              <p className="text-xs text-surface-500">Эмчийн үзлэг</p>
              <p className="text-2xl font-display text-surface-900 mt-1">{report.completedVisits}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportTable title="Насны бүлгээр" rows={report.byAgeGroup} />
            <ReportTable title="Хүйсээр" rows={report.byGender} />
            <ReportTable title="Үйлчилгээгээр" rows={report.byService} />
            <ReportTable title="Төхөөрөмж / нөөцөөр" rows={report.byResource} />
            <ReportTable title="Эмчээр" rows={report.byDoctor} />
          </div>
        </>
      )}
    </div>
  );
}
