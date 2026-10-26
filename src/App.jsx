import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ana dizin (/) direkt Login sayfasına yönlendirir */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        {/* /panel ile başlayan tüm URL'ler Layout sarmalayıcısının içinde açılır */}
        <Route path="/panel" element={<Layout />}>
          {/* Outlet kısmına yerleşecek varsayılan alt sayfa Dashboard'dur */}
          <Route index element={<Dashboard />} />
          
          {/* TODO: İleride faturalar sayfasını buraya ekleyeceğiz: */}
          {/* <Route path="faturalar" element={<Faturalar />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;