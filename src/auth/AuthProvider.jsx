import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { getSession, logout as apiLogout } from '../services/api';
import { setUnauthorizedHandler } from '../services/http';

// Oturumun kaynağı backend'dir (HttpOnly cookie). Frontend token tutmaz;
// açılışta /auth/me ile oturumu sorar, 401 gelirse kullanıcıyı anonim sayar.
export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', firma: null });

  const refresh = useCallback(() => {
    return getSession()
      .then(({ firma }) => setState({ status: 'authenticated', firma }))
      .catch(() => setState({ status: 'anonymous', firma: null }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Herhangi bir istekte oturum düşerse (401) anonim duruma geç; RequireAuth girişe yönlendirir.
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'anonymous', firma: null }));
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback((firma) => setState({ status: 'authenticated', firma }), []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setState({ status: 'anonymous', firma: null });
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, refresh }),
    [state, signIn, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
