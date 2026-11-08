import { lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Login from './pages/Login';
import Layout from './components/Layout';

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
      <Router>
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
          <Route path='*' element={<Navigate to='/panel' replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
