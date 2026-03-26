import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ME_QUERY } from '../graphql/queries';
import { LOGIN_MUTATION } from '../graphql/mutations';
import { getToken, setToken, removeToken, isAuthenticated as checkAuth } from '../lib/auth';
import { client } from '../graphql/client';
import type { User } from '../types';

const ADMIN_ROLES = ['data_operator', 'doctor', 'nurse', 'superadmin'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, isAuthenticated: false,
  login: async () => {}, logout: () => {}, hasRole: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { loading: queryLoading, refetch } = useQuery(ME_QUERY, {
    skip: !checkAuth(),
    onCompleted: (data) => {
      if (data.me && ADMIN_ROLES.includes(data.me.role)) {
        setUser(data.me);
      } else {
        removeToken();
        setUser(null);
      }
      setLoading(false);
    },
    onError: () => { removeToken(); setUser(null); setLoading(false); },
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION);

  useEffect(() => { if (!checkAuth()) setLoading(false); }, []);

  const login = async (phone: string, password: string) => {
    const { data } = await loginMutation({ variables: { phone, password } });
    const { token, user: u } = data.loginUser;
    if (!ADMIN_ROLES.includes(u.role)) throw new Error('Энэ хэрэглэгчид админ хандах эрх байхгүй');
    setToken(token);
    setUser(u);
    await refetch();
  };

  const logout = () => { removeToken(); setUser(null); client.clearStore(); };
  const hasRole = (...roles: string[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading: loading || queryLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
