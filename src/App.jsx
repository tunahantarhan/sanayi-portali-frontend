import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Faturalar from './pages/Faturalar';
import Basvurular from './pages/Basvurular';
import Kavaleto from './pages/Kavaleto';
import Firmam from './pages/Firmam';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/panel" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="faturalar" element={<Faturalar />} />
          <Route path="basvurular" element={<Basvurular />} />
          <Route path="kavaleto" element={<Kavaleto />} />
          <Route path="firmam" element={<Firmam />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;