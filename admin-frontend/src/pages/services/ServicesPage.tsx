import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Boxes, Building2, Pencil, Plus, RefreshCcw, Wrench, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../components/common/ToastProvider';
import { LIST_RESOURCES, LIST_SERVICES, LIST_STAFF } from '../../graphql/queries';
import { CREATE_RESOURCE, CREATE_SERVICE, SEED_DEFAULT_SCHEDULING, UPDATE_SERVICE } from '../../graphql/mutations';

const SERVICE_CATEGORIES = [
  { value: 'consultation', label: 'Үзлэг' },
  { value: 'injection', label: 'Тарилга' },
  { value: 'infusion', label: 'Дусал' },
  { value: 'procedure', label: 'Ажилбар' },
  { value: 'device', label: 'Төхөөрөмж' },
  { value: 'lab', label: 'Шинжилгээ' },
  { value: 'other', label: 'Бусад' },
];

const OWNER_OPTIONS = [
  { value: 'doctor', label: 'Эмч', description: 'Эмчийн нөөц, цаг дээр хамаарна' },
  { value: 'nurse', label: 'Сувилагч', description: 'Сувилагчийн урсгал, цаг дээр хамаарна' },
  { value: 'device', label: 'Төхөөрөмж', description: 'Төхөөрөмж/өрөөний нөөц дээр хамаарна' },
];

const RESOURCE_TYPES = [
  { value: 'room', label: 'Өрөө', description: 'Тарилга, ажилбар зэрэг нэг цагт нэг өвчтөн' },
  { value: 'capacity_room', label: 'Олон суудалтай өрөө', description: 'Дуслын өрөө шиг зэрэг багтаамжтай' },
  { value: 'device', label: 'Төхөөрөмж', description: 'Шарлага, массажны сандал зэрэг төхөөрөмж' },
  { value: 'doctor', label: 'Эмчийн кабинет', description: 'Эмчтэй шууд холбоотой үзлэгийн нөөц' },
  { value: 'nurse', label: 'Сувилагчийн нөөц', description: 'Сувилагчтай холбоотой үйлчилгээний нөөц' },
];

const defaultForm = {
  name: '',
  code: '',
  category: 'consultation',
  ownerType: 'doctor',
  assignedStaffIds: [] as string[],
  description: '',
  defaultDurationMinutes: '20',
  defaultBufferMinutes: '0',
  isActive: true,
};

const defaultResourceForm = {
  name: '',
  type: 'device',
  category: 'device',
  serviceIds: [] as string[],
  staffId: '',
  room: '',
  capacity: '1',
  slotIntervalMinutes: '30',
  defaultDurationMinutes: '30',
  defaultBufferMinutes: '0',
  isActive: true,
  notes: '',
};

function getCategoryLabel(value: string) {
  return SERVICE_CATEGORIES.find(item => item.value === value)?.label || value || 'Тодорхойгүй';
}

function getOwnerType(service: any) {
  if (service?.requiresDoctor) return 'doctor';
  if (service?.requiresNurse) return 'nurse';
  if (service?.requiresDevice) return 'device';
  return '';
}

function getOwnerLabel(service: any) {
  return OWNER_OPTIONS.find(item => item.value === getOwnerType(service))?.label || 'Тохируулаагүй';
}

function getStaffLabel(staff: any) {
  return `${staff?.userId?.lastname?.charAt(0) || ''}.${staff?.userId?.firstname || ''}`;
}

function getResourceTypeLabel(value: string) {
  return RESOURCE_TYPES.find(item => item.value === value)?.label || value || 'Тодорхойгүй';
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'resources'>('services');
  const [showCreate, setShowCreate] = useState(false);
  const [showResourceCreate, setShowResourceCreate] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState(defaultForm);
  const [resourceForm, setResourceForm] = useState(defaultResourceForm);
  const { toast } = useToast();

  const { data, loading, refetch } = useQuery(LIST_SERVICES, {
    variables: { category: categoryFilter || undefined },
  });
  const { data: resourceData, loading: resourcesLoading, refetch: refetchResources } = useQuery(LIST_RESOURCES, {
    variables: {},
  });
  const { data: staffData } = useQuery(LIST_STAFF, { variables: {} });

  const [createService, { loading: creating }] = useMutation(CREATE_SERVICE);
  const [updateService, { loading: updating }] = useMutation(UPDATE_SERVICE);
  const [createResource, { loading: creatingResource }] = useMutation(CREATE_RESOURCE);
  const [seedDefaults, { loading: seeding }] = useMutation(SEED_DEFAULT_SCHEDULING);

  const services = useMemo(() => data?.listServices || [], [data]);
  const resources = useMemo(() => resourceData?.listResources || [], [resourceData]);
  const staffList = useMemo(() => staffData?.listStaff || [], [staffData]);
  const eligibleStaff = useMemo(() => {
    if (formData.ownerType === 'doctor') return staffList.filter((item: any) => item.staffType === 'doctor');
    if (formData.ownerType === 'nurse') return staffList.filter((item: any) => item.staffType === 'nurse');
    return staffList;
  }, [formData.ownerType, staffList]);

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingService(null);
    setShowCreate(false);
  };

  const resetResourceForm = () => {
    setResourceForm(defaultResourceForm);
    setShowResourceCreate(false);
  };

  const openEdit = (service: any) => {
    setEditingService(service);
    setShowCreate(true);
    setFormData({
      name: service.name || '',
      code: service.code || '',
      category: service.category || 'consultation',
      ownerType: getOwnerType(service) || 'doctor',
      assignedStaffIds: (service.assignedStaffs || []).map((item: any) => item._id),
      description: service.description || '',
      defaultDurationMinutes: String(service.defaultDurationMinutes ?? 20),
      defaultBufferMinutes: String(service.defaultBufferMinutes ?? 0),
      isActive: service.isActive !== false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerType) {
      toast('Үйлчилгээ хэнд хамаарахыг заавал сонгоно уу.', 'error');
      return;
    }
    if (!formData.assignedStaffIds.length) {
      toast('Үйлчилгээнд дор хаяж нэг ажилтан онооно уу.', 'error');
      return;
    }

    const input = {
      name: formData.name.trim(),
      ...(editingService ? {} : { code: formData.code.trim().toUpperCase() }),
      category: formData.category,
      description: formData.description.trim() || undefined,
      defaultDurationMinutes: Number(formData.defaultDurationMinutes || 0),
      defaultBufferMinutes: Number(formData.defaultBufferMinutes || 0),
      requiresDoctor: formData.ownerType === 'doctor',
      requiresNurse: formData.ownerType === 'nurse',
      requiresDevice: formData.ownerType === 'device',
      assignedStaffIds: formData.assignedStaffIds,
      isActive: formData.isActive,
    };

    try {
      if (editingService) {
        await updateService({
          variables: {
            id: editingService._id,
            input,
          },
        });
        toast(`${input.name} үйлчилгээ шинэчлэгдлээ.`, 'success');
      } else {
        await createService({
          variables: {
            input: {
              ...input,
              code: formData.code.trim().toUpperCase(),
            },
          },
        });
        toast(`${input.name} үйлчилгээ нэмэгдлээ.`, 'success');
      }

      resetForm();
      await refetch();
    } catch (err: any) {
      toast(err.message || 'Үйлчилгээ хадгалах үед алдаа гарлаа.', 'error');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedDefaults();
      toast('Default scheduling үйлчилгээ, нөөцүүд амжилттай үүслээ.', 'success');
      await refetch();
      await refetchResources();
    } catch (err: any) {
      toast(err.message || 'Default үйлчилгээ үүсгэх үед алдаа гарлаа.', 'error');
    }
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.serviceIds.length) {
      toast('Өрөө/төхөөрөмжийг дор хаяж нэг үйлчилгээнд холбоно уу.', 'error');
      return;
    }
    if (Number(resourceForm.capacity || 0) < 1) {
      toast('Багтаамж 1-ээс бага байж болохгүй.', 'error');
      return;
    }

    try {
      await createResource({
        variables: {
          input: {
            name: resourceForm.name.trim(),
            type: resourceForm.type,
            category: resourceForm.category || undefined,
            serviceIds: resourceForm.serviceIds,
            staffId: resourceForm.staffId || undefined,
            room: resourceForm.room.trim() || undefined,
            capacity: Number(resourceForm.capacity || 1),
            slotIntervalMinutes: Number(resourceForm.slotIntervalMinutes || 30),
            defaultDurationMinutes: Number(resourceForm.defaultDurationMinutes || 30),
            defaultBufferMinutes: Number(resourceForm.defaultBufferMinutes || 0),
            isActive: resourceForm.isActive,
            notes: resourceForm.notes.trim() || undefined,
          },
        },
      });
      toast(`${resourceForm.name} нэмэгдлээ.`, 'success');
      resetResourceForm();
      await refetchResources();
    } catch (err: any) {
      toast(err.message || 'Өрөө/төхөөрөмж нэмэх үед алдаа гарлаа.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-display text-surface-900 flex items-center gap-2">
            <Boxes size={20} /> Үйлчилгээ
          </h1>
          <p className="text-sm text-surface-500 mt-1">Scheduling-д ашиглагдах үйлчилгээ, өрөө, төхөөрөмжийг энд удирдана.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSeedDefaults} disabled={seeding} className="btn-secondary">
            <RefreshCcw size={14} /> {seeding ? 'Үүсгэж байна...' : 'Default үйлчилгээ оруулах'}
          </button>
          {activeTab === 'services' ? (
            <button type="button" onClick={() => {
              setShowCreate(prev => !prev);
              if (showCreate && !editingService) resetForm();
            }} className={showCreate ? 'btn-secondary' : 'btn-primary'}>
              {showCreate ? <><X size={14} /> Хаах</> : <><Plus size={14} /> Шинэ үйлчилгээ</>}
            </button>
          ) : (
            <button type="button" onClick={() => {
              setShowResourceCreate(prev => !prev);
              if (showResourceCreate) resetResourceForm();
            }} className={showResourceCreate ? 'btn-secondary' : 'btn-primary'}>
              {showResourceCreate ? <><X size={14} /> Хаах</> : <><Plus size={14} /> Өрөө/төхөөрөмж нэмэх</>}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-surface-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex-none ${
            activeTab === 'services' ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:bg-surface-50'
          }`}
        >
          <Boxes size={15} /> Үйлчилгээ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex-none ${
            activeTab === 'resources' ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:bg-surface-50'
          }`}
        >
          <Building2 size={15} /> Өрөө & төхөөрөмж
        </button>
      </div>

      {activeTab === 'services' && showCreate && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-display text-surface-900">
              {editingService ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ нэмэх'}
            </h2>
            {editingService && (
              <button type="button" className="btn-ghost text-xs" onClick={resetForm}>
                <X size={14} /> Болих
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Нэр *</label>
              <input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Code *</label>
              <input
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="IRRADIATION"
                required={!editingService}
                disabled={!!editingService}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Ангилал *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {SERVICE_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Идэвх</label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="input-field"
              >
                <option value="true">Идэвхтэй</option>
                <option value="false">Идэвхгүй</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Хэнд хамаарах *</label>
              <select
                value={formData.ownerType}
                onChange={e => setFormData({ ...formData, ownerType: e.target.value, assignedStaffIds: [] })}
                className="input-field"
                required
              >
                {OWNER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Үргэлжлэх хугацаа (мин)</label>
              <input
                type="number"
                min="0"
                value={formData.defaultDurationMinutes}
                onChange={e => setFormData({ ...formData, defaultDurationMinutes: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Завсарлага (мин)</label>
              <input
                type="number"
                min="0"
                value={formData.defaultBufferMinutes}
                onChange={e => setFormData({ ...formData, defaultBufferMinutes: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="block text-xs font-medium text-surface-600 mb-1">Тайлбар</label>
              <input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Үйлчилгээний дэлгэрэнгүй тайлбар"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {OWNER_OPTIONS.map(option => (
              <label
                key={option.value}
                className={`rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                  formData.ownerType === option.value
                    ? 'border-brand-300 bg-brand-50 shadow-sm'
                    : 'border-surface-200 bg-surface-50 hover:border-surface-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={formData.ownerType === option.value}
                    onChange={() => setFormData({ ...formData, ownerType: option.value, assignedStaffIds: [] })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-surface-800">{option.label}</p>
                    <p className="mt-1 text-xs text-surface-500">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-xs font-medium text-surface-600">Оноосон ажилтнууд *</label>
              <span className="text-[11px] text-surface-400">Нэгээс олон хүн сонгож болно</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {eligibleStaff.map((staff: any) => {
                const checked = formData.assignedStaffIds.includes(staff._id);
                return (
                  <label
                    key={staff._id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${
                      checked ? 'border-brand-300 bg-brand-50' : 'border-surface-200 bg-surface-50 hover:border-surface-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...formData.assignedStaffIds, staff._id]
                          : formData.assignedStaffIds.filter((id) => id !== staff._id);
                        setFormData({ ...formData, assignedStaffIds: next });
                      }}
                    />
                    <div>
                      <p className="font-medium text-surface-800">{getStaffLabel(staff)}</p>
                      <p className="text-xs text-surface-500">{staff.specialization || staff.staffType}</p>
                    </div>
                  </label>
                );
              })}
              {eligibleStaff.length === 0 && (
                <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 px-4 py-5 text-sm text-surface-400">
                  Энэ төрөлд тохирох ажилтан алга.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={creating || updating} className="btn-primary">
              <Wrench size={14} />
              {editingService ? (updating ? 'Хадгалж байна...' : 'Өөрчлөлт хадгалах') : (creating ? 'Нэмж байна...' : 'Үйлчилгээ нэмэх')}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost">Цэвэрлэх</button>
          </div>
        </form>
      )}

      {activeTab === 'resources' && showResourceCreate && (
        <form onSubmit={handleResourceSubmit} className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-display text-surface-900">Өрөө/төхөөрөмж нэмэх</h2>
              <p className="mt-1 text-xs text-surface-500">Patient цаг захиалах үед үйлчилгээ сонгосны дараа энэ нөөцүүдээс сонгоно.</p>
            </div>
            <button type="button" className="btn-ghost text-xs" onClick={resetResourceForm}>
              <X size={14} /> Болих
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Нэр *</label>
              <input
                value={resourceForm.name}
                onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })}
                className="input-field"
                placeholder="Шарлагын аппарат 2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Төрөл *</label>
              <select
                value={resourceForm.type}
                onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                className="input-field"
              >
                {RESOURCE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Ангилал</label>
              <select
                value={resourceForm.category}
                onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })}
                className="input-field"
              >
                {SERVICE_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Өрөөний дугаар</label>
              <input
                value={resourceForm.room}
                onChange={e => setResourceForm({ ...resourceForm, room: e.target.value })}
                className="input-field"
                placeholder="303"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Багтаамж *</label>
              <input
                type="number"
                min="1"
                value={resourceForm.capacity}
                onChange={e => setResourceForm({ ...resourceForm, capacity: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Slot interval (мин)</label>
              <input
                type="number"
                min="1"
                value={resourceForm.slotIntervalMinutes}
                onChange={e => setResourceForm({ ...resourceForm, slotIntervalMinutes: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Үргэлжлэх хугацаа</label>
              <input
                type="number"
                min="0"
                value={resourceForm.defaultDurationMinutes}
                onChange={e => setResourceForm({ ...resourceForm, defaultDurationMinutes: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Завсарлага</label>
              <input
                type="number"
                min="0"
                value={resourceForm.defaultBufferMinutes}
                onChange={e => setResourceForm({ ...resourceForm, defaultBufferMinutes: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-2">Холбох үйлчилгээ *</label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-surface-200 bg-surface-50 p-2">
                {services.map((service: any) => {
                  const checked = resourceForm.serviceIds.includes(service._id);
                  return (
                    <label key={service._id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      checked ? 'bg-brand-50 text-brand-700' : 'bg-white text-surface-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...resourceForm.serviceIds, service._id]
                            : resourceForm.serviceIds.filter(id => id !== service._id);
                          setResourceForm({ ...resourceForm, serviceIds: next });
                        }}
                      />
                      <span className="font-medium">{service.name}</span>
                    </label>
                  );
                })}
                {services.length === 0 && (
                  <p className="px-3 py-4 text-sm text-surface-400">Эхлээд үйлчилгээ нэмнэ үү.</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Хариуцах ажилтан</label>
                <select
                  value={resourceForm.staffId}
                  onChange={e => setResourceForm({ ...resourceForm, staffId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Заавал биш</option>
                  {staffList.map((staff: any) => (
                    <option key={staff._id} value={staff._id}>{getStaffLabel(staff)} · {staff.specialization || staff.staffType}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Тайлбар</label>
                <textarea
                  value={resourceForm.notes}
                  onChange={e => setResourceForm({ ...resourceForm, notes: e.target.value })}
                  className="input-field min-h-24 resize-none"
                  placeholder="Жишээ: Аппарат ажиллуулсны дараа 10 минут хөргөх шаардлагатай"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
            Дуслын өрөө шиг олон хүн зэрэг авах бол <b>Олон суудалтай өрөө</b> сонгоод багтаамжийг 8 гэх мэтээр тохируулна. Төхөөрөмж дээр дараагийн цаг давхцахгүй байлгахын тулд завсарлага минут ашиглана.
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={creatingResource} className="btn-primary">
              <Building2 size={14} /> {creatingResource ? 'Нэмж байна...' : 'Өрөө/төхөөрөмж нэмэх'}
            </button>
            <button type="button" onClick={resetResourceForm} className="btn-ghost">Цэвэрлэх</button>
          </div>
        </form>
      )}

      {activeTab === 'services' && (
      <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field w-auto">
            <option value="">Бүх ангилал</option>
            {SERVICE_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-surface-500">{services.length} үйлчилгээ</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Нэр</th>
                <th>Code</th>
                <th>Ангилал</th>
                <th>Хамаарах</th>
                <th>Оноосон</th>
                <th>Хугацаа</th>
                <th>Төлөв</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((service: any) => {
                return (
                  <tr key={service._id}>
                    <td>
                      <div className="font-medium text-surface-800">{service.name}</div>
                      <div className="text-xs text-surface-500 mt-1">{service.description || 'Тайлбаргүй'}</div>
                    </td>
                    <td className="text-xs font-medium text-surface-600">{service.code}</td>
                    <td className="text-xs text-surface-600">{getCategoryLabel(service.category)}</td>
                    <td className="text-xs text-surface-600">
                      <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-1 font-medium text-surface-700">
                        {getOwnerLabel(service)}
                      </span>
                    </td>
                    <td className="text-xs text-surface-600">
                      <div className="flex flex-wrap gap-1.5">
                        {(service.assignedStaffs || []).slice(0, 3).map((staff: any) => (
                          <span key={staff._id} className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                            {getStaffLabel(staff)}
                          </span>
                        ))}
                        {(service.assignedStaffs || []).length > 3 && (
                          <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-1 font-medium text-surface-600">
                            +{service.assignedStaffs.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-surface-600">
                      {service.defaultDurationMinutes || 0} мин
                      <span className="text-surface-400"> / завсар {service.defaultBufferMinutes || 0} мин</span>
                    </td>
                    <td><StatusBadge status={service.isActive === false ? 'draft' : 'active'} /></td>
                    <td className="text-right">
                      <button type="button" onClick={() => openEdit(service)} className="btn-ghost text-xs">
                        <Pencil size={13} /> Засах
                      </button>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-surface-400 py-10">
                    Үйлчилгээ бүртгэгдээгүй байна.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {activeTab === 'resources' && (
        resourcesLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {resources.map((resource: any) => (
              <div key={resource._id} className="card !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-surface-900">{resource.name}</p>
                    <p className="mt-1 text-xs text-surface-500">
                      {getResourceTypeLabel(resource.type)}
                      {resource.room ? ` · Өрөө ${resource.room}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={resource.isActive === false ? 'draft' : 'active'} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-surface-50 px-3 py-2">
                    <span className="text-surface-400">Багтаамж</span>
                    <p className="font-medium text-surface-800">{resource.capacity || 1}</p>
                  </div>
                  <div className="rounded-lg bg-surface-50 px-3 py-2">
                    <span className="text-surface-400">Хугацаа</span>
                    <p className="font-medium text-surface-800">{resource.defaultDurationMinutes || 0} мин</p>
                  </div>
                  <div className="rounded-lg bg-surface-50 px-3 py-2">
                    <span className="text-surface-400">Завсар</span>
                    <p className="font-medium text-surface-800">{resource.defaultBufferMinutes || 0} мин</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(resource.services || []).map((service: any) => (
                    <span key={service._id} className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {service.name}
                    </span>
                  ))}
                  {(resource.services || []).length === 0 && (
                    <span className="text-xs text-surface-400">Үйлчилгээ холбоогүй</span>
                  )}
                </div>
              </div>
            ))}
            {resources.length === 0 && (
              <div className="lg:col-span-2 rounded-xl border border-dashed border-surface-300 bg-white px-4 py-12 text-center text-sm text-surface-400">
                Өрөө/төхөөрөмж бүртгэгдээгүй байна.
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
