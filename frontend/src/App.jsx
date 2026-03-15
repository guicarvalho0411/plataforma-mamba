import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Chamados       from './pages/Chamados';
import ClientMeetings from './pages/ClientMeetings';
import Salas          from './pages/Salas';
import Estoque        from './pages/Estoque';
import Escala         from './pages/Escala';
import Lugares        from './pages/Lugares';
import Admin          from './pages/Admin';
import Perfil         from './pages/Perfil';

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"             element={<Login />} />
        <Route path="/"                  element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/chamados"          element={<RotaProtegida><Chamados /></RotaProtegida>} />
        <Route path="/reunioes-cliente"  element={<RotaProtegida><ClientMeetings /></RotaProtegida>} />
        <Route path="/salas"             element={<RotaProtegida><Salas /></RotaProtegida>} />
        <Route path="/estoque"           element={<RotaProtegida><Estoque /></RotaProtegida>} />
        <Route path="/escala"            element={<RotaProtegida><Escala /></RotaProtegida>} />
        <Route path="/lugares"           element={<RotaProtegida><Lugares /></RotaProtegida>} />
        <Route path="/admin"             element={<RotaProtegida><Admin /></RotaProtegida>} />
        <Route path="/perfil"            element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
