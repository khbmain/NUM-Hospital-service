import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ME_QUERY } from '../graphql/queries';
import { LOGIN_WITH_EMAIL_OTP, LOGIN_WITH_PHONE_PASSWORD, SEND_EMAIL_LOGIN_OTP } from '../graphql/mutations';
import { removeToken, logoutSession } from '../lib/auth';
import { client } from '../graphql/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  requestEmailOtp: (email: string) => Promise<string>;
  loginWithEmailOtp: (email: string, code: string) => Promise<void>;
  loginWithPhonePassword: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  requestEmailOtp: async () => '',
  loginWithEmailOtp: async () => {},
  loginWithPhonePassword: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { loading: queryLoading, refetch } = useQuery(ME_QUERY, {
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
  const [loginWithPhoneMutation] = useMutation(LOGIN_WITH_PHONE_PASSWORD);

  const requestEmailOtp = async (email: string) => {
    const { data } = await sendOtpMutation({ variables: { email } });
    return data.sendEmailLoginOTP;
  };

  const loginWithEmailOtp = async (email: string, code: string) => {
    const { data } = await loginWithOtpMutation({ variables: { email, code } });
    const { user: userData } = data.loginWithEmailOTP;
    setUser(userData);
    await refetch();
  };

  const loginWithPhonePassword = async (phone: string, password: string) => {
    const { data } = await loginWithPhoneMutation({ variables: { phone, password } });
    const { user: userData } = data.loginUser;
    setUser(userData);
    await refetch();
  };

  const logout = () => {
    removeToken();
    void logoutSession();
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
        loginWithPhonePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
