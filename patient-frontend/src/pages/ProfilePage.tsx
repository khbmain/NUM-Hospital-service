import { useQuery } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { MY_PATIENT_PROFILE } from '../graphql/queries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { User, Phone, Mail, MapPin, Droplets, AlertTriangle, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { data, loading } = useQuery(MY_PATIENT_PROFILE);
  const patient = data?.getMyPatientProfile;

  if (loading) return <LoadingSpinner />;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-3 border-b border-surface-100 last:border-0">
        <Icon size={16} className="text-surface-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-xs text-surface-400">{label}</span>
          <p className="text-sm text-surface-800">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display text-surface-900">Миний профайл</h1>

      {/* User info card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
            <span className="text-xl font-display text-brand-700">
              {user?.firstname?.charAt(0)}{user?.lastname?.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-display text-surface-900">
              {user?.lastname} {user?.firstname}
            </h2>
            <p className="text-sm text-surface-500">
              {patient?.registrationNumber || 'Бүртгэлгүй'}
            </p>
          </div>
        </div>

        <InfoRow icon={Phone} label="Утас" value={user?.phone || patient?.phone} />
        <InfoRow icon={Mail} label="Имэйл" value={user?.email || patient?.email} />
        <InfoRow icon={User} label="Хүйс" value={
          user?.gender === 'male' ? 'Эрэгтэй' : user?.gender === 'female' ? 'Эмэгтэй' : user?.gender
        } />
      </div>

      {/* Patient details */}
      {patient && (
        <>
          <div className="card">
            <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">Эмнэлгийн мэдээлэл</h3>
            <InfoRow icon={Shield} label="Ангилал" value={
              patient.category === 'student' ? 'Оюутан' :
              patient.category === 'teacher' ? 'Багш' :
              patient.category === 'employee' ? 'Ажилтан' :
              'Гадны'
            } />
            <InfoRow icon={Droplets} label="Цусны бүлэг" value={patient.bloodType !== 'unknown' ? patient.bloodType : undefined} />
            <InfoRow icon={MapPin} label="Хаяг" value={patient.address} />
          </div>

          {/* Allergies */}
          {patient.allergies?.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
                <AlertTriangle size={12} className="inline mr-1 text-amber-500" /> Харшил
              </h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((a: string, i: number) => (
                  <span key={i} className="badge bg-red-50 text-red-700">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Emergency contact */}
          {patient.emergencyContact?.name && (
            <div className="card">
              <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">Яаралтай холбоо барих</h3>
              <InfoRow icon={User} label="Нэр" value={patient.emergencyContact.name} />
              <InfoRow icon={Phone} label="Утас" value={patient.emergencyContact.phone} />
            </div>
          )}
        </>
      )}

      {!patient && (
        <div className="card text-center py-8">
          <p className="text-surface-500 text-sm">
            Өвчтөний дэлгэрэнгүй бүртгэл олдсонгүй. Бүртгэлийн ажилтантай холбогдоно уу.
          </p>
        </div>
      )}
    </div>
  );
}
