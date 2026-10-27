import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Faturalar from './pages/Faturalar';
import Basvurular from './pages/Basvurular';
import Kavaleto from './pages/Kavaleto';
import Firmam from './pages/Firmam';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;