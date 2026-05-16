import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ME_QUERY } from '../graphql/queries';
import { LOGIN_MUTATION } from '../graphql/mutations';
import { removeToken, logoutSession } from '../lib/auth';
import { client } from '../graphql/client';
import type { User } from '../types';

const ADMIN_ROLES = ['doctor', 'nurse', 'receptionist', 'superadmin'];

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

  const login = async (phone: string, password: string) => {
    const { data } = await loginMutation({ variables: { phone, password } });
    const { user: u } = data.loginUser;
    if (!ADMIN_ROLES.includes(u.role)) throw new Error('Энэ хэрэглэгчид админ хандах эрх байхгүй');
    setUser(u);
    await refetch();
  };

  const logout = () => {
    removeToken();
    void logoutSession();
    setUser(null);
    client.clearStore();
  };
  const hasRole = (...roles: string[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading: loading || queryLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
