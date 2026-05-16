const TOKEN_KEY = 'num_hospital_token';

export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const API_URL = import.meta.env.VITE_API_URL || '';

export const logoutSession = () =>
  fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
