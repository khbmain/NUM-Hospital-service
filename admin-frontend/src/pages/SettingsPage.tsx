import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { CHANGE_PASSWORD, UPDATE_PROFILE } from '../graphql/mutations';
import { ME_QUERY } from '../graphql/queries';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/ToastProvider';
import { Lock, Save, Settings, User } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    gender: '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', repeat: '' });
  const [updateProfile, { loading: savingProfile }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: ME_QUERY }],
  });
  const [changePassword, { loading: savingPassword }] = useMutation(CHANGE_PASSWORD);

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || '',
    });
  }, [user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await updateProfile({
        variables: {
          input: {
            firstname: profile.firstname,
            lastname: profile.lastname,
            email: profile.email || undefined,
            phone: profile.phone || undefined,
            gender: profile.gender || undefined,
          },
        },
      });
      toast('Профайл хадгалагдлаа', 'success');
    } catch (err: any) {
      toast(err.message || 'Профайл хадгалахад алдаа гарлаа', 'error');
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.repeat) {
      toast('Шинэ нууц үг давтахтайгаа таарахгүй байна', 'error');
      return;
    }
    try {
      await changePassword({ variables: { password: passwords.current, newPassword: passwords.next } });
      setPasswords({ current: '', next: '', repeat: '' });
      toast('Нууц үг солигдлоо', 'success');
    } catch (err: any) {
      toast(err.message || 'Нууц үг солиход алдаа гарлаа', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-display text-surface-900">Тохиргоо</h1>
        <p className="mt-1 text-sm text-surface-500">Өөрийн бүртгэл, нэвтрэх нууц үг, системийн үндсэн мэдээлэл.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form onSubmit={saveProfile} className="card space-y-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-brand-600" />
            <h2 className="font-display text-surface-900">Профайл</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Овог</span>
              <input value={profile.lastname} onChange={(e) => setProfile({ ...profile, lastname: e.target.value })} className="input-field" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Нэр</span>
              <input value={profile.firstname} onChange={(e) => setProfile({ ...profile, firstname: e.target.value })} className="input-field" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Утас</span>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Имэйл</span>
              <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="input-field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Хүйс</span>
              <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} className="input-field">
                <option value="">Сонгохгүй</option>
                <option value="male">Эрэгтэй</option>
                <option value="female">Эмэгтэй</option>
                <option value="other">Бусад</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary text-sm">
            <Save size={14} /> {savingProfile ? 'Хадгалж байна...' : 'Профайл хадгалах'}
          </button>
        </form>

        <div className="space-y-5">
          <form onSubmit={savePassword} className="card space-y-4">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-brand-600" />
              <h2 className="font-display text-surface-900">Нууц үг</h2>
            </div>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="input-field" placeholder="Одоогийн нууц үг" required />
            <input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className="input-field" placeholder="Шинэ нууц үг" required minLength={4} />
            <input type="password" value={passwords.repeat} onChange={(e) => setPasswords({ ...passwords, repeat: e.target.value })} className="input-field" placeholder="Шинэ нууц үг давтах" required minLength={4} />
            <button type="submit" disabled={savingPassword} className="btn-secondary w-full text-sm">
              {savingPassword ? 'Сольж байна...' : 'Нууц үг солих'}
            </button>
          </form>

          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-brand-600" />
              <h2 className="font-display text-surface-900">Систем</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-surface-500">Role</span><span className="font-medium text-surface-800">{user?.role}</span></div>
              <div className="flex justify-between gap-3"><span className="text-surface-500">Status</span><span className="font-medium text-surface-800">{user?.status || 'active'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-surface-500">Audit retention</span><span className="font-medium text-surface-800">365 өдөр</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
