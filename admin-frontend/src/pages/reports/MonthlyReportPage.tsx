import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { MONTHLY_REPORT } from '../../graphql/queries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BarChart3, CalendarDays, Download } from 'lucide-react';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function currentMonthRange() {
  const month = currentMonth();
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    dateFrom: `${month}-01`,
    dateTo: `${month}-${lastDay.toString().padStart(2, '0')}`,
  };
}

function toGraphQLDateTime(date: string) {
  return date ? `${date}T00:00:00.000Z` : undefined;
}

function escapeCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadAgeGenderExcel(report: any) {
  const rows = report.ageGenderRows || [];
  const ageGroups = report.ageGroups || [];
  const totals = ageGroups.map((group: string) => {
    const total = rows.reduce(
      (sum: { female: number; male: number }, row: any) => {
        const cell = row.cells.find((item: any) => item.ageGroup === group);
        return {
          female: sum.female + (cell?.female || 0),
          male: sum.male + (cell?.male || 0),
        };
      },
      { female: 0, male: 0 },
    );
    return { ageGroup: group, ...total };
  });
  const totalFemale = rows.reduce((sum: number, row: any) => sum + row.totalFemale, 0);
  const totalMale = rows.reduce((sum: number, row: any) => sum + row.totalMale, 0);

  const headerGroups = ageGroups.map((group: string) => `<th colspan="2">${escapeCell(group)}</th>`).join('');
  const headerGender = ageGroups.map(() => '<th>эм</th><th>эр</th>').join('');
  const bodyRows = rows.map((row: any) => {
    const cells = ageGroups.map((group: string) => {
      const cell = row.cells.find((item: any) => item.ageGroup === group) || { female: 0, male: 0 };
      return `<td>${cell.female || ''}</td><td>${cell.male || ''}</td>`;
    }).join('');
    return `<tr><th>${escapeCell(row.label)}</th>${cells}<td>${row.totalFemale || ''}</td><td>${row.totalMale || ''}</td><td>${row.total || ''}</td></tr>`;
  }).join('');
  const totalCells = totals.map((cell: any) => `<td>${cell.female || ''}</td><td>${cell.male || ''}</td>`).join('');
  const totalRow = rows.length > 0
    ? `<tr><th>Нийт</th>${totalCells}<td>${totalFemale || ''}</td><td>${totalMale || ''}</td><td>${totalFemale + totalMale || ''}</td></tr>`
    : '';

  const workbook = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #999; padding: 6px; text-align: center; }
    th:first-child, td:first-child { text-align: left; }
  </style>
</head>
<body>
  <h2>Нас, хүйсээр нэгтгэсэн тайлан</h2>
  <p>${escapeCell(report.month)}</p>
  <table>
    <thead>
      <tr><th rowspan="2">Үзүүлэлт</th>${headerGroups}<th colspan="3">Нийт</th></tr>
      <tr>${headerGender}<th>эм</th><th>эр</th><th>бүгд</th></tr>
    </thead>
    <tbody>${bodyRows || `<tr><td colspan="${ageGroups.length * 2 + 4}">Мэдээлэл байхгүй</td></tr>`}${totalRow}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nas-huis-tailan-${String(report.month || '').replace(/\s+/g, '')}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function AgeGenderMatrix({ report }: { report: any }) {
  const rows = report.ageGenderRows || [];
  const ageGroups = report.ageGroups || [];
  const totals = ageGroups.map((group: string) => {
    const total = rows.reduce(
      (sum: { female: number; male: number }, row: any) => {
        const cell = row.cells.find((item: any) => item.ageGroup === group);
        return {
          female: sum.female + (cell?.female || 0),
          male: sum.male + (cell?.male || 0),
        };
      },
      { female: 0, male: 0 },
    );
    return { ageGroup: group, ...total };
  });
  const totalFemale = rows.reduce((sum: number, row: any) => sum + row.totalFemale, 0);
  const totalMale = rows.reduce((sum: number, row: any) => sum + row.totalMale, 0);

  return (
    <div className="card overflow-hidden">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-display text-surface-900">Нас, хүйсээр нэгтгэсэн тайлан</h2>
          <p className="mt-1 text-xs text-surface-500">Загварын дагуу насны бүлэг бүрийг эм/эр баганаар харуулна.</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-surface-500">{report.month}</p>
          <button type="button" onClick={() => downloadAgeGenderExcel(report)} className="btn-secondary text-xs">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] border-collapse text-xs">
          <thead>
            <tr>
              <th rowSpan={2} className="sticky left-0 z-10 w-48 border border-surface-300 bg-white px-2 py-2 text-left font-semibold text-surface-700">
                Үзүүлэлт
              </th>
              {ageGroups.map((group: string) => (
                <th key={group} colSpan={2} className="border border-surface-300 bg-surface-50 px-2 py-2 text-center font-semibold text-surface-700">
                  {group}
                </th>
              ))}
              <th colSpan={3} className="border border-surface-300 bg-brand-50 px-2 py-2 text-center font-semibold text-brand-800">
                Нийт
              </th>
            </tr>
            <tr>
              {ageGroups.map((group: string) => (
                <Fragment key={group}>
                  <th className="border border-surface-300 bg-surface-50 px-2 py-1 text-center font-medium text-surface-500">эм</th>
                  <th className="border border-surface-300 bg-surface-50 px-2 py-1 text-center font-medium text-surface-500">эр</th>
                </Fragment>
              ))}
              <th className="border border-surface-300 bg-brand-50 px-2 py-1 text-center font-medium text-brand-700">эм</th>
              <th className="border border-surface-300 bg-brand-50 px-2 py-1 text-center font-medium text-brand-700">эр</th>
              <th className="border border-surface-300 bg-brand-50 px-2 py-1 text-center font-medium text-brand-700">бүгд</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={(ageGroups.length * 2) + 4} className="border border-surface-300 px-3 py-8 text-center text-surface-400">
                  Мэдээлэл байхгүй
                </td>
              </tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.label} className="hover:bg-surface-50">
                  <th className="sticky left-0 z-10 border border-surface-300 bg-white px-2 py-2 text-left font-medium text-surface-700">
                    {row.label}
                  </th>
                  {ageGroups.map((group: string) => {
                    const cell = row.cells.find((item: any) => item.ageGroup === group) || { female: 0, male: 0 };
                    return (
                      <Fragment key={group}>
                        <td className="border border-surface-300 px-2 py-2 text-center text-surface-700">{cell.female || ''}</td>
                        <td className="border border-surface-300 px-2 py-2 text-center text-surface-700">{cell.male || ''}</td>
                      </Fragment>
                    );
                  })}
                  <td className="border border-surface-300 bg-brand-50/50 px-2 py-2 text-center font-semibold text-surface-900">{row.totalFemale || ''}</td>
                  <td className="border border-surface-300 bg-brand-50/50 px-2 py-2 text-center font-semibold text-surface-900">{row.totalMale || ''}</td>
                  <td className="border border-surface-300 bg-brand-50/50 px-2 py-2 text-center font-semibold text-surface-900">{row.total || ''}</td>
                </tr>
              ))
            )}
            {rows.length > 0 && (
              <tr>
                <th className="sticky left-0 z-10 border border-surface-300 bg-surface-100 px-2 py-2 text-left font-semibold text-surface-900">
                  Нийт
                </th>
                {totals.map((cell: any) => (
                  <Fragment key={cell.ageGroup}>
                    <td className="border border-surface-300 bg-surface-100 px-2 py-2 text-center font-semibold text-surface-900">{cell.female || ''}</td>
                    <td className="border border-surface-300 bg-surface-100 px-2 py-2 text-center font-semibold text-surface-900">{cell.male || ''}</td>
                  </Fragment>
                ))}
                <td className="border border-surface-300 bg-brand-100 px-2 py-2 text-center font-semibold text-brand-900">{totalFemale || ''}</td>
                <td className="border border-surface-300 bg-brand-100 px-2 py-2 text-center font-semibold text-brand-900">{totalMale || ''}</td>
                <td className="border border-surface-300 bg-brand-100 px-2 py-2 text-center font-semibold text-brand-900">{totalFemale + totalMale || ''}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MonthlyReportPage() {
  const initialRange = currentMonthRange();
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);
  const hasInvalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const reportVariables = useMemo(() => ({
    dateFrom: toGraphQLDateTime(dateFrom),
    dateTo: toGraphQLDateTime(dateTo),
  }), [dateFrom, dateTo]);
  const { data, loading, error } = useQuery(MONTHLY_REPORT, {
    variables: reportVariables,
    skip: !dateFrom || !dateTo || hasInvalidRange,
  });
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-surface-600">
          <CalendarDays size={16} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field w-auto" />
          <span className="text-surface-400">-</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field w-auto" />
        </div>
      </div>

      {hasInvalidRange && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">Эхлэх огноо дуусах огнооноос өмнө байх ёстой.</div>
      )}
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

          <AgeGenderMatrix report={report} />

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
