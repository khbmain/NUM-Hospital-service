import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LIST_STAFF, LIST_DEPARTMENTS } from '../../graphql/queries';
import { REGISTER_USER, CREATE_STAFF } from '../../graphql/mutations';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserCog, Plus, X, Check } from 'lucide-react';

const STAFF_TYPES = [
  { value: 'doctor', label: 'Эмч' },
  { value: 'nurse', label: 'Сувилагч' },
  { value: 'data_operator', label: 'Бүртгэлийн ажилтан' },
  { value: 'admin_staff', label: 'Админ ажилтан' },
];

export default function StaffListPage() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    firstname: '', lastname: '', phone: '', password: '',
    role: 'doctor', staffType: 'doctor', specialization: '', departmentId: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data, loading, refetch } = useQuery(LIST_STAFF, {
    variables: { staffType: typeFilter || undefined },
  });
  const { data: deptData } = useQuery(LIST_DEPARTMENTS);

  const [registerUser] = useMutation(REGISTER_USER);
  const [createStaff] = useMutation(CREATE_STAFF);

  const staffList = data?.listStaff || [];
  const departments = deptData?.listDepartments || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await registerUser({
        variables: {
          input: {
            phone: formData.phone, password: formData.password,
            firstname: formData.firstname, lastname: formData.lastname,
            role: formData.role,
          },
        },
      });
      await createStaff({
        variables: {
          input: {
            userId: userData.registerUser._id,
            staffType: formData.staffType,
            specialization: formData.specialization || undefined,
            departmentId: formData.departmentId || undefined,
          },
        },
      });
      setSuccess(`${formData.firstname} амжилттай бүртгэгдлээ`);
      setShowForm(false);
      setFormData({ firstname: '', lastname: '', phone: '', password: '', role: 'doctor', staffType: 'doctor', specialization: '', departmentId: '' });
      refetch();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display text-surface-900">Ажилтан</h1>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {showForm ? <><X size={14} /> Хаах</> : <><Plus size={14} /> Шинэ ажилтан</>}
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <Check size={14} /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h3 className="font-display text-surface-900 text-sm">Шинэ ажилтан бүртгэх</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Овог *</label>
              <input value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Нэр *</label>
              <input value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Утас *</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Нууц үг *</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Ажлын төрөл *</label>
              <select value={formData.staffType} onChange={e => setFormData({...formData, staffType: e.target.value, role: e.target.value === 'admin_staff' ? 'superadmin' : e.target.value})} className="input-field">
                {STAFF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Тасаг</label>
              <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="input-field">
                <option value="">-- Сонгох --</option>
                {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Мэргэжил</label>
              <input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="input-field" placeholder="Ерөнхий эмч" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full"><UserCog size={14} /> Бүртгэх</button>
            </div>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field w-auto">
          <option value="">Бүх төрөл</option>
          {STAFF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span className="text-xs text-surface-500 self-center">{staffList.length} ажилтан</span>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Нэр</th><th>Утас</th><th>Төрөл</th><th>Тасаг</th><th>Мэргэжил</th><th>Төлөв</th></tr></thead>
            <tbody>
              {staffList.map((s: any) => (
                <tr key={s._id}>
                  <td className="font-medium text-surface-800">{s.userId?.lastname?.charAt(0)}.{s.userId?.firstname}</td>
                  <td>{s.userId?.phone || '–'}</td>
                  <td className="text-xs">{STAFF_TYPES.find(t => t.value === s.staffType)?.label}</td>
                  <td className="text-xs text-surface-500">{s.department?.name || '–'}</td>
                  <td className="text-xs text-surface-500">{s.specialization || '–'}</td>
                  <td><StatusBadge status={s.status || 'active'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
