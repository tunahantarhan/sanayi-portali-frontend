import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { tenantConfig } from '../config';
import { useAuth } from '../auth/AuthContext';

// Tanımsız adresler için gösterilir. Kullanıcıyı oturum durumuna göre panele veya girişe yönlendirir.
export default function NotFound() {
  const { status } = useAuth();
  const target = status === 'authenticated' ? '/panel' : '/login';

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-xl'>
        <div className='bg-brand px-6 py-8 text-white'>
          <img
            src={tenantConfig.logo}
            alt={tenantConfig.name}
            className='mx-auto h-14 w-auto brightness-0 invert'
          />
        </div>
        <div className='px-6 py-10'>
          <p className='text-5xl font-semibold text-brand'>404</p>
          <h1 className='mt-3 text-lg font-medium text-gray-800'>Sayfa bulunamadı</h1>
          <p className='mt-2 text-sm text-gray-500'>
            Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Adresi kontrol ediniz.
          </p>
          <Link
            to={target}
            replace
            className='mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90'
          >
            <ArrowLeft className='h-4 w-4' />
            {status === 'authenticated' ? 'Ana sayfaya dön' : 'Giriş sayfasına dön'}
          </Link>
        </div>
      </div>
    </div>
  );
}
