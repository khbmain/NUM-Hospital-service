import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEARCH_PATIENTS } from '../../graphql/queries';
import { CREATE_PATIENT } from '../../graphql/mutations';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Search, Plus, X, UserPlus, Check } from 'lucide-react';

const CATEGORIES = [
  { value: 'student', label: 'Оюутан' },
  { value: 'teacher', label: 'Багш' },
  { value: 'employee', label: 'Ажилтан' },
  { value: 'external', label: 'Гадны' },
];

export default function PatientListPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(params.get('action') === 'new');
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    category: 'student',
    gender: 'male',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data, loading, refetch } = useQuery(SEARCH_PATIENTS, {
    variables: { query, page: 1, limit: 30 },
  });

  const [createPatient, { loading: creating }] = useMutation(CREATE_PATIENT);

  const patients = data?.searchPatients?.patients || [];
  const total = data?.searchPatients?.total || 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await createPatient({ variables: { input: formData } });
      setSuccess(`Өвчтөн бүртгэгдлээ: ${data.createPatient.registrationNumber}`);
      setShowForm(false);
      setFormData({
        firstname: '',
        lastname: '',
        phone: '',
        category: 'student',
        gender: 'male',
      });
      refetch();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display text-surface-900">Өвчтөн</h1>
        {hasRole('data_operator', 'superadmin') && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? (
              <>
                <X size={14} /> Хаах
              </>
            ) : (
              <>
                <Plus size={14} /> Шинэ бүртгэл
              </>
            )}
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <Check size={14} /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h3 className="text-sm font-display text-surface-900">Шинэ өвчтөн бүртгэх</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Овог *</label>
              <input
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Нэр *</label>
              <input
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Утас</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Ангилал *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">Хүйс</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="male">Эрэгтэй</option>
                <option value="female">Эмэгтэй</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <UserPlus size={14} /> Бүртгэх
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Нэр, утас, бүртгэлийн дугаараар хайх..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <p className="text-xs text-surface-500">
            {query.trim() ? `${total} үр дүн` : `Нийт ${total} өвчтөн`}
          </p>
          {patients.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Бүртгэл</th>
                    <th>Нэр</th>
                    <th>Утас</th>
                    <th>Ангилал</th>
                    <th>Төлөв</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient: any) => (
                    <tr
                      key={patient._id}
                      className="cursor-pointer"
                      onClick={() => {
                        navigate(`/patients/${patient._id}`);
                      }}
                    >
                      <td className="text-xs font-medium text-brand-600">{patient.registrationNumber}</td>
                      <td className="font-medium text-surface-800">
                        {patient.lastname?.charAt(0)}.{patient.firstname}
                      </td>
                      <td>{patient.phone || '-'}</td>
                      <td className="text-xs">
                        {CATEGORIES.find((category) => category.value === patient.category)?.label || patient.category}
                      </td>
                      <td>
                        <StatusBadge status={patient.status || 'active'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-surface-400">Өвчтөн олдсонгүй</div>
          )}
        </>
      )}
    </div>
  );
}
