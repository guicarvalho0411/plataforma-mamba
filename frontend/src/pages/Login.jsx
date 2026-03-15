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
    setErro(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login');
    } finally { setLoading(false); }
  }

  return (
    <div style={s.bg}>
      {/* Orbs decorativos */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      <div style={s.wrapper}>
        {/* Lado esquerdo */}
        <div style={s.left}>
          <div style={s.logoBox}>
            <img src="/logo.png" alt="Mamba" style={s.logoImg} />
          </div>
          <p style={s.tagline}>Plataforma de<br/><span style={s.taglineHL}>Gestão Interna</span></p>
          <div style={s.features}>
            {['Agendamento de salas', 'Controle de chamados', 'Escala de limpeza', 'Gestão de estoque'].map(f => (
              <div key={f} style={s.feat}>
                <span style={s.featDot} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Lado direito — card de login */}
        <div style={s.right}>
          <div style={s.card}>
            <div style={s.cardTop}>
              <div style={s.cardIcon}>
                <span style={{ fontSize: 22 }}>🐍</span>
              </div>
              <h1 style={s.titulo}>Bem-vindo de volta</h1>
              <p style={s.sub}>Entre com suas credenciais para acessar</p>
            </div>

            <form onSubmit={handleLogin} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>E-MAIL</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}>✉</span>
                  <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>SENHA</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}>🔒</span>
                  <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>

              {erro && (
                <div style={s.erro}>
                  <span>⚠</span> {erro}
                </div>
              )}

              <button style={loading ? s.btnOff : s.btn} disabled={loading}>
                {loading ? 'Entrando...' : <span style={s.btnInner}>Entrar <span style={s.btnArrow}>→</span></span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  bg:         { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 20 },
  orb1:       { position: 'fixed', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', pointerEvents: 'none' },
  orb2:       { position: 'fixed', bottom: -200, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,192,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  wrapper:    { display: 'flex', gap: 60, alignItems: 'center', maxWidth: 900, width: '100%', zIndex: 1 },
  left:       { flex: 1, display: 'flex', flexDirection: 'column', gap: 28 },
  logoBox:    {},
  logoImg:    { width: 140 },
  tagline:    { fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 },
  taglineHL:  { color: 'var(--yellow)', display: 'block' },
  features:   { display: 'flex', flexDirection: 'column', gap: 12 },
  feat:       { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text2)' },
  featDot:    { width: 8, height: 8, borderRadius: '50%', background: 'var(--purple2)', flexShrink: 0 },
  right:      { width: 380 },
  card:       { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: '36px 32px', boxShadow: 'var(--shadow)' },
  cardTop:    { marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 },
  cardIcon:   { width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  titulo:     { fontSize: 22, fontWeight: 700, color: 'var(--text)' },
  sub:        { fontSize: 13, color: 'var(--text3)' },
  form:       { display: 'flex', flexDirection: 'column', gap: 16 },
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em' },
  inputWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon:  { position: 'absolute', left: 14, fontSize: 14, color: 'var(--text3)', pointerEvents: 'none' },
  input:      { width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none' },
  erro:       { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' },
  btn:        { padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, var(--purple) 0%, var(--purple2) 100%)', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 4 },
  btnOff:     { padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--text3)', fontSize: 15, fontWeight: 600, border: '1px solid var(--border)', cursor: 'not-allowed', marginTop: 4 },
  btnInner:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnArrow:   { fontSize: 18 },
};
