import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_AUDIT_LOGS } from '../graphql/queries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Activity, Filter, Monitor } from 'lucide-react';

const actions = ['', 'create', 'update', 'upsert', 'delete', 'login', 'logout', 'access', 'export'];

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDetails(details: any) {
  if (!details) return '-';
  const text = JSON.stringify(details);
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');

  const filter = useMemo(() => ({
    action: action || undefined,
    resource: resource || undefined,
    page: 1,
    limit: 50,
  }), [action, resource]);

  const { data, loading, refetch } = useQuery(LIST_AUDIT_LOGS, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
  });

  const logs = data?.listAuditLogs?.logs || [];
  const total = data?.listAuditLogs?.total || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-surface-900">Аудит лог</h1>
          <p className="mt-1 text-sm text-surface-500">Нэвтрэлт, бүртгэл, өөрчлөлтийн түүх.</p>
        </div>
        <button onClick={() => refetch({ filter })} className="btn-secondary text-sm">
          <Activity size={14} /> Шинэчлэх
        </button>
      </div>

      <div className="card !p-4">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-surface-500">Action</span>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="input-field">
              {actions.map((item) => (
                <option key={item || 'all'} value={item}>{item || 'Бүгд'}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-surface-500">Resource</span>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input value={resource} onChange={(e) => setResource(e.target.value)} className="input-field pl-9" placeholder="patient, visit, appointment..." />
            </div>
          </label>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="border-b border-surface-100 px-4 py-3 text-sm text-surface-500">
          Нийт {total} бичлэгээс эхний {logs.length}
        </div>
        {loading ? (
          <LoadingSpinner text="Аудит лог ачааллаж байна..." />
        ) : logs.length === 0 ? (
          <div className="py-14 text-center text-sm text-surface-500">Лог олдсонгүй.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-xs uppercase tracking-wider text-surface-400">
                <tr>
                  <th className="px-4 py-3">Огноо</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {logs.map((log: any) => (
                  <tr key={log._id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-surface-600">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-surface-800">{log.user ? `${log.user.lastname || ''} ${log.user.firstname || ''}`.trim() : '-'}</p>
                      <p className="text-xs text-surface-400">{log.user?.role || log.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3"><span className="badge bg-brand-50 text-brand-700">{log.action}</span></td>
                    <td className="px-4 py-3 text-surface-700">
                      <p>{log.resource}</p>
                      {log.resourceId && <p className="text-xs text-surface-400">{log.resourceId}</p>}
                    </td>
                    <td className="max-w-xs px-4 py-3 font-mono text-xs text-surface-500">{formatDetails(log.details)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-surface-500">
                      <Monitor size={13} className="mr-1 inline" /> {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
