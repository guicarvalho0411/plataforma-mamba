import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chamados  from './pages/Chamados';
import Salas     from './pages/Salas';
import Escala    from './pages/Escala';

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/"         element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/chamados" element={<RotaProtegida><Chamados /></RotaProtegida>} />
        <Route path="/salas"    element={<RotaProtegida><Salas /></RotaProtegida>} />
        <Route path="/escala"   element={<RotaProtegida><Escala /></RotaProtegida>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
