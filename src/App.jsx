import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';

// Uygulama VITE_BASE_PATH altında yayınlanır (ör. /sanayi-portali-frontend/ veya /).
// Sunucu, bilinmeyen adreslerde index.html döndürür (IIS: public/web.config, Pages: 404.html).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

// Panel sayfaları ayrı paketlere bölünür; giriş ekranı grafik kütüphanesini yüklemez.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Faturalar = lazy(() => import('./pages/Faturalar'));
const Basvurular = lazy(() => import('./pages/Basvurular'));
const Kavaleto = lazy(() => import('./pages/Kavaleto'));
const Firmam = lazy(() => import('./pages/Firmam'));
const Bilgilendirmeler = lazy(() => import('./pages/Bilgilendirmeler'));

function App() {
  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          <Route path='/' element={<Navigate to='/login' replace />} />
          <Route path='/login' element={<Login />} />
          <Route
            path='/panel'
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path='faturalar' element={<Faturalar />} />
            <Route path='basvurular' element={<Basvurular />} />
            <Route path='kavaleto' element={<Kavaleto />} />
            <Route path='bilgilendirmeler' element={<Bilgilendirmeler />} />
            <Route path='firmam' element={<Firmam />} />
          </Route>
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
