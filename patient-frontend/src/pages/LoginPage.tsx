import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/ToastProvider';
import { Mail, Phone, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestEmailOtp, loginWithEmailOtp, loginWithPhonePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'phone') {
        await loginWithPhonePassword(phone, password);
        toast('Амжилттай нэвтэрлээ.', 'success');
        navigate('/');
        return;
      }

      if (!otpSent) {
        const message = await requestEmailOtp(email);
        setOtpSent(true);
        toast(message, 'success');
        return;
      }

      await loginWithEmailOtp(email, otp);
      toast('Амжилттай нэвтэрлээ.', 'success');
      navigate('/');
    } catch (err: any) {
      toast(err.message || 'Нэвтрэхэд алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      <div className="hidden lg:flex flex-1 bg-brand-600 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md px-12">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
            <span className="text-3xl font-display text-white">N</span>
          </div>
          <h1 className="text-4xl font-display text-white leading-tight mb-4">
            NUM Эмнэлгийн
            <br />
            мэдээллийн систем
          </h1>
          <p className="text-brand-100 text-lg leading-relaxed">
            Цаг захиалах, үзлэгийн түүхээ харах, жорын мэдээллээ нэг дороос удирдах боломжтой.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-display">N</span>
              </div>
              <h1 className="text-xl font-display text-surface-900">NUM Эмнэлэг</h1>
            </div>
          </div>

          <h2 className="text-2xl font-display text-surface-900 mb-1">Нэвтрэх</h2>
          <p className="text-surface-500 mb-6">Имэйл OTP эсвэл үзлэгийн дараа мессежээр ирсэн утасны нууц үгээр нэвтэрнэ.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-100 p-1">
              <button
                type="button"
                onClick={() => { setMode('email'); setOtpSent(false); setOtp(''); }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'email' ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-500 hover:text-surface-800'}`}
              >
                Имэйл OTP
              </button>
              <button
                type="button"
                onClick={() => { setMode('phone'); setOtpSent(false); setOtp(''); }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'phone' ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-500 hover:text-surface-800'}`}
              >
                Утас
              </button>
            </div>

            {mode === 'email' ? (
              <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Имэйл хаяг
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="***@num.edu.mn, ***@stud.num.edu.mn"
                  className="input-field pl-10"
                  required
                  disabled={otpSent}
                />
              </div>
            </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Утас эсвэл имэйл
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="99112233 эсвэл patient001@bulk-test.num.edu.mn"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Нууц үг
                  </label>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Мессежээр ирсэн нууц үг"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'email' && otpSent && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  OTP код
                </label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    className="input-field pl-10"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            )}

            <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-xs leading-5 text-brand-800">
              {mode === 'phone'
                ? 'Утсаар эсвэл имэйлээр бүртгэгдсэн өвчтөн нууц үгээрээ нэвтэрнэ.'
                : otpSent
                ? 'OTP ирэхгүй бол имэйл хаягаа зөв эсэхийг шалгаад солих эсвэл дахин илгээнэ үү. Алдаатай/байхгүй хаягт код хүрэхгүй.'
                : 'OTP нь зөвхөн `@num.edu.mn` эсвэл `@stud.num.edu.mn` имэйлд илгээгдэнэ.'}
            </div>

            {mode === 'email' && otpSent && (
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-60"
              >
                Имэйлээ солих
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
                  {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'phone' ? 'Нууц үгээр нэвтрэх' : otpSent ? 'OTP баталгаажуулаад нэвтрэх' : 'OTP код авах'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-surface-400">
            МУИС-ийн имэйлтэй бол бүртгэл автоматаар үүснэ. Имэйлгүй бол бүртгэлийн ажилтантай холбогдоно уу.
          </p>
        </div>
      </div>
    </div>
  );
}
