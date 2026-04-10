import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';


const STATUS_MEETING = {
  agendado:  { cor:'#3B82F6', bg:'rgba(59,130,246,0.1)',  label:'Agendado' },
  realizado: { cor:'#10B981', bg:'rgba(16,185,129,0.1)',  label:'Realizado' },
  cancelado: { cor:'#EF4444', bg:'rgba(239,68,68,0.1)',   label:'Cancelado' },
};

export default function ClientMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [salas, setSalas]       = useState([]);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ client_name:'', client_company:'', dia:'', mes:'', start_time:'', room_name:'', notes:'', cafe_agua:false });
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState('');

  async function carregar() {
    const [m, s] = await Promise.all([api.get('/client-meetings'), api.get('/rooms')]);
    setMeetings(m.data); setSalas(s.data);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault(); setErro(''); setLoading(true);
    try {
      const hoje = new Date();
      let ano = hoje.getFullYear();
      const mesNum = parseInt(form.mes);
      const diaNum = parseInt(form.dia);
      // Se a data já passou este ano, usa o próximo ano
      if (mesNum < hoje.getMonth() + 1 || (mesNum === hoje.getMonth() + 1 && diaNum < hoje.getDate())) {
        ano += 1;
      }
      const meeting_date = `${ano}-${String(mesNum).padStart(2,'0')}-${String(diaNum).padStart(2,'0')}`;
      await api.post('/client-meetings', { ...form, meeting_date });
      setModal(false);
      setForm({ client_name:'', client_company:'', dia:'', mes:'', start_time:'', room_name:'', notes:'', cafe_agua:false });
      carregar();
    } catch (err) { setErro(err.response?.data?.error || 'Erro ao agendar'); }
    finally { setLoading(false); }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar esta reunião?')) return;
    await api.delete(`/client-meetings/${id}`);
    carregar();
  }

  async function excluir(id) {
    if (!confirm('Excluir esta reunião permanentemente?')) return;
    await api.delete(`/client-meetings/${id}/excluir`);
    carregar();
  }

  const hoje = new Date().toISOString().split('T')[0];
  const proximas = meetings.filter(m => m.meeting_date?.split('T')[0] >= hoje && m.status === 'agendado');
  const passadas  = meetings.filter(m => m.meeting_date?.split('T')[0] < hoje || m.status !== 'agendado');

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Reuniões com Clientes</h1>
          <p style={s.sub}>A equipe de limpeza é notificada automaticamente</p>
        </div>
        <button style={s.btn} onClick={() => setModal(true)}>+ Agendar reunião</button>
      </div>

      {/* Próximas */}
      {proximas.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>📅 Próximas reuniões</div>
          <div style={s.list}>
            {proximas.map(m => <MeetingCard key={m.id} m={m} onCancel={cancelar} onExcluir={excluir} />)}
          </div>
        </div>
      )}

      {/* Histórico */}
      {passadas.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>🕐 Histórico</div>
          <div style={s.list}>
            {passadas.map(m => <MeetingCard key={m.id} m={m} onCancel={cancelar} onExcluir={excluir} />)}
          </div>
        </div>
      )}

      {meetings.length === 0 && (
        <div style={s.vazio}>
          <div style={s.vazioIcon}>🤝</div>
          <p style={s.vazioText}>Nenhuma reunião agendada</p>
          <p style={s.vazioSub}>Clique em "Agendar reunião" para começar</p>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Agendar reunião com cliente</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <p style={s.modalSub}>A equipe de limpeza receberá notificação no WhatsApp para preparar o espaço.</p>
            <form onSubmit={salvar} style={s.form}>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ ...s.field, flex:1 }}><label style={s.label}>NOME DO CLIENTE</label>
                  <input style={s.input} value={form.client_name} onChange={e => setForm({...form, client_name:e.target.value})} placeholder="João Silva" required />
                </div>
                <div style={{ ...s.field, flex:1 }}><label style={s.label}>EMPRESA</label>
                  <input style={s.input} value={form.client_company} onChange={e => setForm({...form, client_company:e.target.value})} placeholder="Empresa Ltda" />
                </div>
              </div>
              <div style={s.field}><label style={s.label}>DATA</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input style={{ ...s.input, width:80, textAlign:'center', flexShrink:0 }} value={form.dia} onChange={e => setForm({...form, dia:e.target.value.replace(/\D/g,'')})} placeholder="Dia" maxLength={2} required />
                  <select style={s.selectDark} value={form.mes} onChange={e => setForm({...form, mes:e.target.value})} required>
                    <option value="">Mês</option>
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m,i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={s.field}><label style={s.label}>INÍCIO</label>
                <input type="time" style={s.input} value={form.start_time} onChange={e => setForm({...form, start_time:e.target.value})} required />
              </div>
              <div style={s.field}><label style={s.label}>SALA DE REUNIÃO</label>
                <input style={s.input} value={form.room_name} onChange={e => setForm({...form, room_name:e.target.value})} placeholder="Ex: Sala 3, Sala da Diretoria..." />
              </div>
              <div style={s.field}><label style={s.label}>OBSERVAÇÕES</label>
                <textarea style={{ ...s.input, minHeight:70, resize:'vertical' }} value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Ex: Preparar sala, trazer documentos..." />
              </div>
              <div style={s.checkRow} onClick={() => setForm({...form, cafe_agua:!form.cafe_agua})}>
                <div style={{ ...s.checkbox, ...(form.cafe_agua ? s.checkboxOn : {}) }}>
                  {form.cafe_agua && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                </div>
                <span style={s.checkLabel}>☕ Preparar café e água para a reunião</span>
              </div>
              {erro && <div style={s.erro}>{erro}</div>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" style={loading ? {...s.btn, opacity:0.6} : s.btn} disabled={loading}>
                  {loading ? 'Agendando...' : 'Agendar e notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function MeetingCard({ m, onCancel, onExcluir }) {
  const st = STATUS_MEETING[m.status] || STATUS_MEETING.agendado;
  const d = m.meeting_date ? new Date(m.meeting_date + 'T12:00:00') : null;
  const dia = d ? String(d.getDate()).padStart(2, '0') : '--';
  const mes = d ? d.toLocaleDateString('pt-BR', { month:'short' }) : '--';
  return (
    <div style={s.card}>
      <div style={s.cardDate}>
        <div style={s.cardDay}>{dia}</div>
        <div style={s.cardMonth}>{mes}</div>
      </div>
      <div style={s.cardBody}>
        <div style={s.cardTop}>
          <span style={s.cardNome}>{m.client_name}</span>
          {m.client_company && <span style={s.cardEmpresa}>{m.client_company}</span>}
          <span style={{ ...s.badge, background:st.bg, color:st.cor }}>{st.label}</span>
        </div>
        <div style={s.cardMeta}>
          <span>🕐 {m.start_time?.slice(0,5)}</span>
          {(m.sala_nome || m.attendees) && <span>🚪 {m.sala_nome || m.attendees}</span>}
          <span>👤 {m.agendado_por}</span>
        </div>
        {m.notes && <div style={s.cardNotes}>📝 {m.notes}</div>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
        {m.status === 'agendado' && (
          <button style={s.btnCancel2} onClick={() => onCancel(m.id)}>Cancelar</button>
        )}
        {m.status === 'cancelado' && (
          <button style={s.btnExcluir} onClick={() => onExcluir(m.id)}>✕ Excluir</button>
        )}
      </div>
    </div>
  );
}

const s = {
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  titulo:      { fontSize:26, fontWeight:700, color:'var(--text)', margin:'0 0 4px' },
  sub:         { fontSize:13, color:'var(--text3)' },
  btn:         { background:'linear-gradient(135deg, var(--purple), var(--purple2))', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif', whiteSpace:'nowrap' },
  section:     { marginBottom:24 },
  sectionTitle:{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:10 },
  list:        { display:'flex', flexDirection:'column', gap:8 },
  card:        { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:16 },
  cardDate:    { background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:10, padding:'8px 12px', textAlign:'center', minWidth:48, flexShrink:0 },
  cardDay:     { fontSize:20, fontWeight:700, color:'var(--purple2)', lineHeight:1 },
  cardMonth:   { fontSize:10, color:'var(--text3)', marginTop:2, textTransform:'uppercase' },
  cardBody:    { flex:1, minWidth:0 },
  cardTop:     { display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' },
  cardNome:    { fontSize:14, fontWeight:600, color:'var(--text)' },
  cardEmpresa: { fontSize:12, color:'var(--text3)', background:'rgba(255,255,255,0.05)', borderRadius:6, padding:'2px 8px' },
  badge:       { fontSize:11, fontWeight:600, borderRadius:20, padding:'2px 8px' },
  cardMeta:    { display:'flex', gap:12, fontSize:12, color:'var(--text3)', flexWrap:'wrap' },
  cardNotes:   { fontSize:12, color:'var(--text3)', marginTop:6, fontStyle:'italic' },
  btnCancel2:  { background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 12px', fontSize:11, cursor:'pointer', fontFamily:'Sora,sans-serif', flexShrink:0 },
  vazio:       { textAlign:'center', padding:'60px 0' },
  vazioIcon:   { fontSize:40, marginBottom:12 },
  vazioText:   { fontSize:16, fontWeight:600, color:'var(--text2)', marginBottom:6 },
  vazioSub:    { fontSize:13, color:'var(--text3)' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' },
  modal:       { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  modalTitulo: { fontSize:18, fontWeight:700, color:'var(--text)' },
  modalSub:    { fontSize:12, color:'#10B981', marginBottom:20, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:8, padding:'8px 12px' },
  closeBtn:    { background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:8, width:30, height:30, cursor:'pointer', color:'var(--text2)', fontSize:13, fontFamily:'Sora,sans-serif' },
  form:        { display:'flex', flexDirection:'column', gap:14 },
  field:       { display:'flex', flexDirection:'column', gap:6 },
  label:       { fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.1em' },
  input:       { padding:'11px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--text)', outline:'none', fontFamily:'Sora,sans-serif' },
  erro:        { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:13 },
  modalBtns:   { display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 },
  btnCancel:   { background:'rgba(255,255,255,0.05)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', fontFamily:'Sora,sans-serif' },
  selectDark:  { flex:1, padding:'11px 14px', background:'#1a1625', border:'1px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--text)', outline:'none', fontFamily:'Sora,sans-serif', appearance:'none', WebkitAppearance:'none' },
  btnExcluir:  { background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 12px', fontSize:11, cursor:'pointer', fontFamily:'Sora,sans-serif', flexShrink:0 },
  checkRow:    { display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:10 },
  checkbox:    { width:18, height:18, borderRadius:5, border:'1.5px solid var(--border)', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' },
  checkboxOn:  { background:'var(--purple)', border:'1.5px solid var(--purple2)' },
  checkLabel:  { fontSize:13, color:'var(--text2)' },
};
