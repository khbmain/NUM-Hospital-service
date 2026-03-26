import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ME_QUERY } from '../graphql/queries';
import { LOGIN_WITH_EMAIL_OTP, SEND_EMAIL_LOGIN_OTP } from '../graphql/mutations';
import { getToken, setToken, removeToken, isAuthenticated as checkAuth } from '../lib/auth';
import { client } from '../graphql/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  requestEmailOtp: (email: string) => Promise<string>;
  loginWithEmailOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  requestEmailOtp: async () => '',
  loginWithEmailOtp: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { loading: queryLoading, refetch } = useQuery(ME_QUERY, {
    skip: !checkAuth(),
    onCompleted: (data) => {
      setUser(data.me);
      setLoading(false);
    },
    onError: () => {
      removeToken();
      setUser(null);
      setLoading(false);
    },
  });

  const [sendOtpMutation] = useMutation(SEND_EMAIL_LOGIN_OTP);
  const [loginWithOtpMutation] = useMutation(LOGIN_WITH_EMAIL_OTP);

  useEffect(() => {
    if (!checkAuth()) setLoading(false);
  }, []);

  const requestEmailOtp = async (email: string) => {
    const { data } = await sendOtpMutation({ variables: { email } });
    return data.sendEmailLoginOTP;
  };

  const loginWithEmailOtp = async (email: string, code: string) => {
    const { data } = await loginWithOtpMutation({ variables: { email, code } });
    const { token, user: userData } = data.loginWithEmailOTP;
    setToken(token);
    setUser(userData);
    await refetch();
  };

  const logout = () => {
    removeToken();
    setUser(null);
    client.clearStore();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || queryLoading,
        isAuthenticated: !!user,
        requestEmailOtp,
        loginWithEmailOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
