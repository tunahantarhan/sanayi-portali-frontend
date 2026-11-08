import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

// /panel altındaki sayfaları korur. Oturum yoksa giriş ekranına yönlendirir.
// Not: Bu yalnızca arayüz korumasıdır; asıl yetki kontrolü backend'de her istekte yapılır.
export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <Loader2 className='h-8 w-8 animate-spin text-brand' />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  }

  return children;
}
