import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

// { status: 'loading' | 'authenticated' | 'anonymous', firma, signIn, signOut, refresh }
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
};
