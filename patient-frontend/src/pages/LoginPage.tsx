import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestEmailOtp, loginWithEmailOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (!otpSent) {
        const message = await requestEmailOtp(email);
        setOtpSent(true);
        setInfo(message);
        return;
      }

      await loginWithEmailOtp(email, otp);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
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
          <p className="text-surface-500 mb-8">Зөвхөн `@num.edu.mn` эсвэл `@stud.num.edu.mn` МУИС-ийн мэйлээр OTP авч нэвтэрнэ.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="name@num.edu.mn эсвэл name@stud.num.edu.mn"
                  className="input-field pl-10"
                  required
                  disabled={otpSent}
                />
              </div>
            </div>

            {otpSent && (
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
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setInfo('');
                    setError('');
                  }}
                  className="mt-2 text-sm text-brand-600 hover:text-brand-700"
                >
                  Имэйлээ солих
                </button>
              </div>
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
                  {otpSent ? 'OTP баталгаажуулаад нэвтрэх' : 'OTP код авах'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-surface-400">
            Бүртгэлгүй бол бүртгэлийн ажилтантай холбогдоно уу
          </p>
        </div>
      </div>
    </div>
  );
}
