import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const TABS = ['Usuários', 'Salas', 'Colaboradoras'];

export default function Admin() {
  const [tab, setTab] = useState('Usuários');

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Administração</h1>
          <p style={s.sub}>Gerencie usuários, salas e equipe de limpeza</p>
        </div>
      </div>
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} style={tab === t ? s.tabAtivo : s.tab} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Usuários'      && <TabUsuarios />}
      {tab === 'Salas'         && <TabSalas />}
      {tab === 'Colaboradoras' && <TabColaboradoras />}
    </Layout>
  );
}

// ─── ABA USUÁRIOS ───────────────────────────────────────────
function TabUsuarios() {
  const [users, setUsers]   = useState([]);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'colaborador', department: '' });
  const [erro, setErro]     = useState('');

  async function carregar() {
    const { data } = await api.get('/users');
    setUsers(data);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault(); setErro('');
    try {
      await api.post('/users', form);
      setModal(false);
      setForm({ name: '', email: '', password: '', role: 'colaborador', department: '' });
      carregar();
    } catch (err) { setErro(err.response?.data?.error || 'Erro ao salvar'); }
  }

  async function toggleAtivo(u) {
    await api.put(`/users/${u.id}`, { ...u, active: !u.active });
    carregar();
  }

  return (
    <div>
      <div style={s.listHeader}>
        <span style={s.listCount}>{users.length} usuários</span>
        <button style={s.btn} onClick={() => setModal(true)}>+ Novo usuário</button>
      </div>
      <div style={s.list}>
        {users.map(u => (
          <div key={u.id} style={s.card}>
            <div style={s.cardAvatar}>{u.name[0]}</div>
            <div style={s.cardInfo}>
              <div style={s.cardNome}>{u.name}</div>
              <div style={s.cardSub}>{u.email} · {u.department || 'Sem depto'}</div>
            </div>
            <span style={{ ...s.roleBadge, ...(u.role === 'admin' ? s.roleAdmin : u.role === 'facilities' ? s.roleFacilities : s.roleColab) }}>{u.role}</span>
            <div style={{ ...s.statusDot, background: u.active ? '#10B981' : '#EF4444' }} title={u.active ? 'Ativo' : 'Inativo'} onClick={() => toggleAtivo(u)} />
          </div>
        ))}
      </div>
      {modal && (
        <Modal titulo="Novo usuário" onClose={() => setModal(false)}>
          <form onSubmit={salvar} style={s.form}>
            <Field label="NOME"><input style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></Field>
            <Field label="EMAIL"><input type="email" style={s.input} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></Field>
            <Field label="SENHA"><input type="password" style={s.input} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></Field>
            <Field label="PERFIL">
              <select style={s.input} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="colaborador">Colaborador</option>
                <option value="facilities">Facilities</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="DEPARTAMENTO"><input style={s.input} value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Ex: RH, TI, Financeiro" /></Field>
            {erro && <div style={s.erro}>{erro}</div>}
            <ModalBtns onClose={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── ABA SALAS ───────────────────────────────────────────────
function TabSalas() {
  const [salas, setSalas] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ name: '', floor: '', capacity: '' });
  const [erro, setErro]   = useState('');

  async function carregar() { const { data } = await api.get('/rooms'); setSalas(data); }
  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault(); setErro('');
    try {
      await api.post('/rooms', form);
      setModal(false); setForm({ name: '', floor: '', capacity: '' }); carregar();
    } catch (err) { setErro(err.response?.data?.error || 'Erro ao salvar'); }
  }

  async function toggleAtivo(sala) {
    await api.put(`/rooms/${sala.id}`, { ...sala, active: !sala.active });
    carregar();
  }

  return (
    <div>
      <div style={s.listHeader}>
        <span style={s.listCount}>{salas.length} salas</span>
        <button style={s.btn} onClick={() => setModal(true)}>+ Nova sala</button>
      </div>
      <div style={s.list}>
        {salas.map(sala => (
          <div key={sala.id} style={s.card}>
            <div style={{ ...s.cardAvatar, background: 'rgba(14,165,233,0.2)', color: '#0EA5E9' }}>⬡</div>
            <div style={s.cardInfo}>
              <div style={s.cardNome}>{sala.name}</div>
              <div style={s.cardSub}>Andar {sala.floor} · {sala.capacity} pessoas</div>
            </div>
            <div style={{ ...s.statusDot, background: sala.active ? '#10B981' : '#EF4444', cursor: 'pointer' }} title={sala.active ? 'Ativa' : 'Inativa'} onClick={() => toggleAtivo(sala)} />
          </div>
        ))}
      </div>
      {modal && (
        <Modal titulo="Nova sala" onClose={() => setModal(false)}>
          <form onSubmit={salvar} style={s.form}>
            <Field label="NOME DA SALA"><input style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Sala Jaguar" required /></Field>
            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="ANDAR" style={{ flex: 1 }}><input type="number" style={s.input} value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} required /></Field>
              <Field label="CAPACIDADE" style={{ flex: 1 }}><input type="number" style={s.input} value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} required /></Field>
            </div>
            {erro && <div style={s.erro}>{erro}</div>}
            <ModalBtns onClose={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── ABA COLABORADORAS ───────────────────────────────────────
function TabColaboradoras() {
  const [cleaners, setCleaners] = useState([]);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ name: '', type: 'fixa', default_area: '', phone: '' });
  const [erro, setErro]         = useState('');

  async function carregar() { const { data } = await api.get('/cleaners'); setCleaners(data); }
  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault(); setErro('');
    try {
      await api.post('/cleaners', form);
      setModal(false); setForm({ name: '', type: 'fixa', default_area: '', phone: '' }); carregar();
    } catch (err) { setErro(err.response?.data?.error || 'Erro ao salvar'); }
  }

  async function toggleAtivo(c) {
    await api.put(`/cleaners/${c.id}`, { ...c, active: !c.active });
    carregar();
  }

  return (
    <div>
      <div style={s.listHeader}>
        <span style={s.listCount}>{cleaners.filter(c => c.active).length} ativas</span>
        <button style={s.btn} onClick={() => setModal(true)}>+ Nova colaboradora</button>
      </div>
      <div style={s.list}>
        {cleaners.map(c => (
          <div key={c.id} style={s.card}>
            <div style={{ ...s.cardAvatar, background: 'rgba(245,192,0,0.15)', color: '#F5C000' }}>{c.name[0]}</div>
            <div style={s.cardInfo}>
              <div style={s.cardNome}>{c.name}</div>
              <div style={s.cardSub}>{c.default_area || 'Sem área definida'} · {c.type} · {c.phone || 'Sem telefone'}</div>
            </div>
            <span style={{ ...s.roleBadge, background: c.type === 'fixa' ? 'rgba(16,185,129,0.1)' : 'rgba(167,139,250,0.1)', color: c.type === 'fixa' ? '#10B981' : '#A78BFA' }}>{c.type}</span>
            <div style={{ ...s.statusDot, background: c.active ? '#10B981' : '#EF4444', cursor: 'pointer' }} title={c.active ? 'Ativa' : 'Inativa'} onClick={() => toggleAtivo(c)} />
          </div>
        ))}
      </div>
      {modal && (
        <Modal titulo="Nova colaboradora" onClose={() => setModal(false)}>
          <form onSubmit={salvar} style={s.form}>
            <Field label="NOME"><input style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></Field>
            <Field label="TIPO">
              <select style={s.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="fixa">Fixa</option>
                <option value="rotativa">Rotativa</option>
              </select>
            </Field>
            <Field label="ÁREA PADRÃO"><input style={s.input} value={form.default_area} onChange={e => setForm({...form, default_area: e.target.value})} placeholder="Ex: Andar 1 - Recepção" /></Field>
            <Field label="TELEFONE / WHATSAPP"><input style={s.input} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(11) 99999-9999" /></Field>
            {erro && <div style={s.erro}>{erro}</div>}
            <ModalBtns onClose={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── COMPONENTES REUTILIZÁVEIS ───────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitulo}>{titulo}</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, style: st }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...st }}><label style={s.label}>{label}</label>{children}</div>;
}

function ModalBtns({ onClose }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
      <button type="button" style={s.btnCancel} onClick={onClose}>Cancelar</button>
      <button type="submit" style={s.btn}>Salvar</button>
    </div>
  );
}

const s = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo:       { fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  sub:          { fontSize: 13, color: 'var(--text3)' },
  tabs:         { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' },
  tab:          { padding: '8px 18px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif' },
  tabAtivo:     { padding: '8px 18px', borderRadius: 8, border: 'none', background: 'rgba(124,58,237,0.2)', color: 'var(--purple2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' },
  listHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  listCount:    { fontSize: 13, color: 'var(--text3)' },
  btn:          { background: 'linear-gradient(135deg, var(--purple), var(--purple2))', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' },
  list:         { display: 'flex', flexDirection: 'column', gap: 8 },
  card:         { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 },
  cardAvatar:   { width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.2)', color: 'var(--purple2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  cardInfo:     { flex: 1, minWidth: 0 },
  cardNome:     { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  cardSub:      { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  roleBadge:    { fontSize: 11, borderRadius: 20, padding: '3px 10px', fontWeight: 500 },
  roleAdmin:    { background: 'rgba(245,192,0,0.15)', color: '#F5C000' },
  roleFacilities:{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  roleColab:    { background: 'rgba(255,255,255,0.06)', color: 'var(--text3)' },
  statusDot:    { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, cursor: 'pointer' },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modal:        { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitulo:  { fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  closeBtn:     { background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text2)', fontSize: 13, fontFamily: 'Sora, sans-serif' },
  form:         { display: 'flex', flexDirection: 'column', gap: 14 },
  label:        { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em' },
  input:        { padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'Sora, sans-serif' },
  erro:         { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13 },
  btnCancel:    { background: 'rgba(255,255,255,0.05)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif' },
};
