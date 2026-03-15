import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Perfil() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [form, setForm]     = useState({ senha_atual: '', nova_senha: '', confirmar: '' });
  const [msg, setMsg]       = useState('');
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);

  async function trocarSenha(e) {
    e.preventDefault(); setMsg(''); setErro('');
    if (form.nova_senha !== form.confirmar)
      return setErro('Nova senha e confirmação não coincidem');
    if (form.nova_senha.length < 6)
      return setErro('A nova senha deve ter no mínimo 6 caracteres');
    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/password`, {
        senha_atual: form.senha_atual,
        nova_senha:  form.nova_senha,
      });
      setMsg('Senha atualizada com sucesso!');
      setForm({ senha_atual: '', nova_senha: '', confirmar: '' });
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao atualizar senha');
    } finally { setLoading(false); }
  }

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.titulo}>Meu Perfil</h1>
        <p style={s.sub}>Informações da sua conta</p>
      </div>

      {/* Card do usuário */}
      <div style={s.userCard}>
        <div style={s.userAvatar}>{user.name?.[0]?.toUpperCase()}</div>
        <div style={s.userInfo}>
          <div style={s.userName}>{user.name}</div>
          <div style={s.userEmail}>{user.email}</div>
          <div style={s.userMeta}>
            <span style={{ ...s.badge, ...(user.role === 'admin' ? s.badgeAdmin : user.role === 'facilities' ? s.badgeFacilities : s.badgeColab) }}>{user.role}</span>
          </div>
        </div>
      </div>

      {/* Trocar senha */}
      <div style={s.section}>
        <h2 style={s.sectionTitulo}>Trocar senha</h2>
        <p style={s.sectionSub}>Use uma senha forte com no mínimo 6 caracteres</p>

        <form onSubmit={trocarSenha} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>SENHA ATUAL</label>
            <input type="password" style={s.input} value={form.senha_atual} onChange={e => setForm({...form, senha_atual: e.target.value})} placeholder="••••••••" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>NOVA SENHA</label>
            <input type="password" style={s.input} value={form.nova_senha} onChange={e => setForm({...form, nova_senha: e.target.value})} placeholder="••••••••" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>CONFIRMAR NOVA SENHA</label>
            <input type="password" style={s.input} value={form.confirmar} onChange={e => setForm({...form, confirmar: e.target.value})} placeholder="••••••••" required />
          </div>

          {erro && <div style={s.erro}>⚠ {erro}</div>}
          {msg  && <div style={s.sucesso}>✓ {msg}</div>}

          <button style={loading ? s.btnOff : s.btn} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

const s = {
  header:       { marginBottom: 24 },
  titulo:       { fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  sub:          { fontSize: 13, color: 'var(--text3)' },
  userCard:     { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 },
  userAvatar:   { width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, var(--purple), var(--purple2))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, flexShrink: 0 },
  userInfo:     { flex: 1 },
  userName:     { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  userEmail:    { fontSize: 13, color: 'var(--text3)', marginBottom: 10 },
  userMeta:     { display: 'flex', gap: 8 },
  badge:        { fontSize: 11, borderRadius: 20, padding: '3px 12px', fontWeight: 500 },
  badgeAdmin:   { background: 'rgba(245,192,0,0.15)', color: '#F5C000' },
  badgeFacilities:{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  badgeColab:   { background: 'rgba(255,255,255,0.06)', color: 'var(--text3)' },
  section:      { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px', maxWidth: 480 },
  sectionTitulo:{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  sectionSub:   { fontSize: 12, color: 'var(--text3)', marginBottom: 20 },
  form:         { display: 'flex', flexDirection: 'column', gap: 14 },
  field:        { display: 'flex', flexDirection: 'column', gap: 6 },
  label:        { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em' },
  input:        { padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'Sora, sans-serif' },
  erro:         { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13 },
  sucesso:      { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7', borderRadius: 10, padding: '10px 14px', fontSize: 13 },
  btn:          { padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg, var(--purple), var(--purple2))', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif' },
  btnOff:       { padding: '13px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text3)', fontSize: 14, border: '1px solid var(--border)', cursor: 'not-allowed', fontFamily: 'Sora, sans-serif' },
};
