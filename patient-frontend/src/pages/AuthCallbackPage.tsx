import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../lib/auth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      setToken(token);
      navigate('/', { replace: true });
    } else {
      navigate(`/login?error=${error || 'unknown'}`, { replace: true });
    }
  }, [params, navigate]);

  return <LoadingSpinner text="Нэвтэрч байна..." />;
}
