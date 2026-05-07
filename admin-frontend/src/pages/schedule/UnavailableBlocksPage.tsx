import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { LIST_RESOURCES, LIST_STAFF, LIST_UNAVAILABLE_BLOCKS } from '../../graphql/queries';
import { CANCEL_UNAVAILABLE_BLOCK, CREATE_UNAVAILABLE_BLOCK, UPDATE_UNAVAILABLE_BLOCK } from '../../graphql/mutations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CalendarX, Wrench, UserX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/ToastProvider';

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function UnavailableBlocksPage() {
  const { user, hasRole } = useAuth();
  const now = new Date();
  const defaultStart = () => toLocalInputValue(new Date());
  const defaultEnd = () => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000));
  const canManageAnySchedule = hasRole('superadmin');
  const { toast } = useToast();
  const [targetType, setTargetType] = useState<'resource' | 'staff'>('resource');
  const [resourceId, setResourceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [startAt, setStartAt] = useState(toLocalInputValue(now));
  const [endAt, setEndAt] = useState(toLocalInputValue(new Date(now.getTime() + 60 * 60 * 1000)));
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [editingBlock, setEditingBlock] = useState<any>(null);

  const dayStart = new Date(`${startAt.slice(0, 10)}T00:00:00`).toISOString();
  const dayEnd = new Date(`${startAt.slice(0, 10)}T23:59:59`).toISOString();
  const { data: resourceData, loading: resourceLoading } = useQuery(LIST_RESOURCES);
  const { data: staffData, loading: staffLoading } = useQuery(LIST_STAFF, { variables: {} });
  const currentStaff = staffData?.listStaff?.find((item: any) => item.userId?._id === user?._id);
  const effectiveStaffId = canManageAnySchedule ? staffId : currentStaff?._id || '';
  const { data: blockData, loading: blockLoading, refetch } = useQuery(LIST_UNAVAILABLE_BLOCKS, {
    variables: {
      dateFrom: dayStart,
      dateTo: dayEnd,
      staffId: canManageAnySchedule ? undefined : effectiveStaffId || undefined,
    },
    skip: !canManageAnySchedule && !effectiveStaffId,
  });
  const [createBlock, { loading: creating }] = useMutation(CREATE_UNAVAILABLE_BLOCK);
  const [updateBlock, { loading: updating }] = useMutation(UPDATE_UNAVAILABLE_BLOCK);
  const [cancelBlock] = useMutation(CANCEL_UNAVAILABLE_BLOCK);

  const resources = resourceData?.listResources || [];
  const staff = staffData?.listStaff || [];
  const blocks = blockData?.listUnavailableBlocks || [];

  const resetForm = (keepSelectedDate = false) => {
    setTargetType(canManageAnySchedule ? 'resource' : 'staff');
    setResourceId('');
    setStaffId('');
    if (!keepSelectedDate) {
      setStartAt(defaultStart());
      setEndAt(defaultEnd());
    }
    setReason('');
    setNote('');
    setEditingBlock(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createBlock({
        variables: {
            input: {
            resourceId: canManageAnySchedule && targetType === 'resource' ? resourceId : undefined,
            staffId: canManageAnySchedule && targetType === 'staff' ? staffId : effectiveStaffId,
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
            reason,
            note: note || undefined,
          },
        },
      });
      const cancelled = result.data?.createUnavailableBlock?.cancelledAppointments?.length || 0;
      toast(`Хязгаарлалт үүслээ. ${cancelled} цаг цуцлагдаж, өвчтөнүүдэд мэдэгдэл илгээгдсэн.`, 'success');
      resetForm(true);
      await refetch();
    } catch (err: any) {
      toast(err.message || 'Хугацаа хаахад алдаа гарлаа.', 'error');
    }
  };

  const startEdit = (block: any) => {
    setEditingBlock(block);
    setTargetType(block.resource ? 'resource' : 'staff');
    setResourceId(block.resource?._id || '');
    setStaffId(block.staff?._id || '');
    setStartAt(toLocalInputValue(new Date(block.startAt)));
    setEndAt(toLocalInputValue(new Date(block.endAt)));
    setReason(block.reason || '');
    setNote(block.note || '');
  };

  const saveEdit = async () => {
    try {
      await updateBlock({
        variables: {
          id: editingBlock._id,
          input: {
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
            reason,
            note: note || undefined,
          },
        },
      });
      setEditingBlock(null);
      resetForm();
      toast('Хаасан хугацаа шинэчлэгдлээ.', 'success');
      await refetch();
    } catch (err: any) {
      toast(err.message || 'Хаасан хугацаа шинэчлэхэд алдаа гарлаа.', 'error');
    }
  };

  const reopenBlock = async (id: string) => {
    try {
      await cancelBlock({ variables: { id } });
      toast('Хаасан хугацааг буцааж нээлээ.', 'success');
      await refetch();
    } catch (err: any) {
      toast(err.message || 'Хаасан хугацааг нээхэд алдаа гарлаа.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display text-surface-900 flex items-center gap-2">
          <CalendarX size={20} /> Цаг авах боломжгүй хугацаа
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          {canManageAnySchedule
            ? 'Эмч, ажилтан, төхөөрөмж, өрөө түр ажиллахгүй үед slot хааж, өмнөх захиалгуудыг цуцална.'
            : 'Өөрийн боломжгүй хугацааг хаахад тухайн хугацаанд өвчтөн цаг авах боломжгүй болно.'}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        {canManageAnySchedule && <div className="inline-flex rounded-lg border border-surface-200 bg-surface-50 p-1">
          <button type="button" onClick={() => setTargetType('resource')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${targetType === 'resource' ? 'bg-white shadow-sm text-brand-700' : 'text-surface-500'}`}>
            <Wrench size={14} className="inline mr-1" /> Нөөц/төхөөрөмж
          </button>
          <button type="button" onClick={() => setTargetType('staff')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${targetType === 'staff' ? 'bg-white shadow-sm text-brand-700' : 'text-surface-500'}`}>
            <UserX size={14} className="inline mr-1" /> Ажилтан
          </button>
        </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!canManageAnySchedule ? (
            <label className="block">
              <span className="block text-xs font-medium text-surface-700 mb-1">Ажилтан</span>
              <input
                value={currentStaff ? `${currentStaff.userId?.lastname?.charAt(0)}.${currentStaff.userId?.firstname} · ${currentStaff.staffType}` : 'Ажилтны бүртгэл олдсонгүй'}
                className="input-field"
                disabled
              />
            </label>
          ) : targetType === 'resource' ? (
            <label className="block">
              <span className="block text-xs font-medium text-surface-700 mb-1">Нөөц/төхөөрөмж</span>
              <select value={resourceId} onChange={e => setResourceId(e.target.value)} className="input-field" required>
                <option value="">Сонгох</option>
                {resourceLoading ? null : resources.map((resource: any) => (
                  <option key={resource._id} value={resource._id}>{resource.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="block text-xs font-medium text-surface-700 mb-1">Ажилтан</span>
              <select value={staffId} onChange={e => setStaffId(e.target.value)} className="input-field" required>
                <option value="">Сонгох</option>
                {staffLoading ? null : staff.map((item: any) => (
                  <option key={item._id} value={item._id}>{item.userId?.lastname?.charAt(0)}.{item.userId?.firstname} · {item.staffType}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-surface-700 mb-1">Шалтгаан</span>
            <input value={reason} onChange={e => setReason(e.target.value)} className="input-field" placeholder="Эмч өвдсөн, төхөөрөмж засварт орсон..." required />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-surface-700 mb-1">Эхлэх</span>
            <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="input-field" required />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-surface-700 mb-1">Дуусах</span>
            <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="input-field" required />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-xs font-medium text-surface-700 mb-1">Нэмэлт тэмдэглэл</span>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input-field resize-none" />
          </label>
        </div>

        <div className="flex gap-2">
          {editingBlock ? (
            <>
              <button type="button" disabled={updating} onClick={saveEdit} className="btn-primary text-sm">
                <CalendarX size={14} /> {updating ? 'Хадгалж байна...' : 'Өөрчлөлт хадгалах'}
              </button>
              <button type="button" onClick={() => resetForm()} className="btn-ghost text-sm">Болих</button>
            </>
          ) : (
            <button disabled={creating || (!canManageAnySchedule && !effectiveStaffId)} className="btn-primary text-sm">
              <CalendarX size={14} /> {creating ? 'Үүсгэж байна...' : 'Хугацаа хаах'}
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h2 className="text-sm font-display text-surface-900 mb-3">Тухайн өдрийн хаасан хугацаанууд</h2>
        {blockLoading ? <LoadingSpinner /> : blocks.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-8">Мэдээлэл байхгүй</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block: any) => (
              <div key={block._id} className="rounded-lg border border-surface-200 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-surface-800">{block.resource?.name || block.staff?.userId?.firstname || 'Нөөц'}</span>
                  <span className="text-xs text-surface-500">{new Date(block.startAt).toLocaleString('mn-MN')} - {new Date(block.endAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-surface-600 mt-1">{block.reason}</p>
                <p className="text-xs text-surface-400 mt-1">Цуцлагдсан цаг: {block.cancelledAppointments?.length || 0}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => startEdit(block)} className="btn-ghost text-xs">Засах</button>
                  <button type="button" onClick={() => reopenBlock(block._id)} className="btn-ghost text-xs text-emerald-600 hover:bg-emerald-50">Буцааж нээх</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
