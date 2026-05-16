import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = params.get('error');

    if (error) {
      navigate(`/login?error=${error || 'unknown'}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [params, navigate]);

  return <LoadingSpinner text="Нэвтэрч байна..." />;
}
