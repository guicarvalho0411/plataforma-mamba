import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro]         = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.bg}>
      <div style={s.left}>
        <img src="/logo.png" alt="Mamba" style={s.bgLogo} />
        <div style={s.tagline}>Plataforma de<br/>Gestão Interna</div>
      </div>
      <div style={s.right}>
        <div style={s.card}>
          <img src="/logo.png" alt="Mamba" style={s.cardLogo} />
          <h1 style={s.titulo}>Bem-vindo de volta</h1>
          <p style={s.sub}>Entre com suas credenciais para acessar</p>
          <form onSubmit={handleLogin} style={s.form}>
            <label style={s.label}>E-mail</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            <label style={s.label}>Senha</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            {erro && <div style={s.erro}>{erro}</div>}
            <button style={loading ? s.btnOff : s.btn} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  bg:       { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" },
  left:     { flex: 1, background: '#1E0A3C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 48 },
  bgLogo:   { width: 180, opacity: 0.95 },
  tagline:  { color: 'rgba(255,255,255,0.4)', fontSize: 18, textAlign: 'center', lineHeight: 1.5, letterSpacing: '0.02em' },
  right:    { width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F1FA', padding: 32 },
  card:     { width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 40px rgba(30,10,60,0.10)' },
  cardLogo: { width: 90, marginBottom: 24 },
  titulo:   { fontSize: 22, fontWeight: 700, color: '#1E0A3C', margin: '0 0 6px' },
  sub:      { fontSize: 13, color: '#999', margin: '0 0 28px' },
  form:     { display: 'flex', flexDirection: 'column', gap: 10 },
  label:    { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:    { padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E8E0F0', fontSize: 14, outline: 'none', background: '#FAFAFA', color: '#1E0A3C' },
  erro:     { background: '#FFF0F0', color: '#C0392B', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  btn:      { marginTop: 8, padding: '13px', borderRadius: 10, background: '#1E0A3C', color: '#F5C000', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.02em' },
  btnOff:   { marginTop: 8, padding: '13px', borderRadius: 10, background: '#ccc', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'not-allowed' },
};
