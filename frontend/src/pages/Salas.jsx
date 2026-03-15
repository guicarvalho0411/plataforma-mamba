import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const HORAS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

export default function Salas() {
  const [salas, setSalas]       = useState([]);
  const [reservas, setReservas] = useState([]);
  const [data, setData]         = useState(new Date().toISOString().split('T')[0]);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ room_id: '', title: '', start_time: '', end_time: '' });
  const [erro, setErro]         = useState('');

  async function carregar() {
    try {
      const [s, r] = await Promise.all([api.get('/rooms'), api.get(`/rooms/bookings?date=${data}`)]);
      setSalas(s.data); setReservas(r.data);
    } catch {}
  }

  useEffect(() => { carregar(); }, [data]);

  function temReserva(salaId, hora) {
    return reservas.find(r => {
      const ini = r.start_time?.slice(11,16);
      const fim = r.end_time?.slice(11,16);
      return r.room_id === salaId && hora >= ini && hora < fim;
    });
  }

  async function reservar(e) {
    e.preventDefault(); setErro('');
    try {
      await api.post('/rooms/bookings', { ...form, start_time: `${data}T${form.start_time}:00`, end_time: `${data}T${form.end_time}:00` });
      setModal(false); setForm({ room_id: '', title: '', start_time: '', end_time: '' }); carregar();
    } catch (err) { setErro(err.response?.data?.error || 'Erro ao reservar'); }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar esta reserva?')) return;
    await api.patch(`/rooms/bookings/${id}/status`, { status: 'cancelado' });
    carregar();
  }

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Salas de Reunião</h1>
          <p style={s.sub}>Visualize e reserve espaços disponíveis</p>
        </div>
        <div style={s.headerRight}>
          <input type="date" value={data} onChange={e => setData(e.target.value)} style={s.dateInput} />
          <button style={s.btn} onClick={() => setModal(true)}>+ Nova reserva</button>
        </div>
      </div>

      {salas.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>⬡</div>
          <p style={s.emptyTitle}>Nenhuma sala cadastrada</p>
          <p style={s.emptySub}>Cadastre salas no banco de dados para começar.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {salas.map(sala => (
            <div key={sala.id} style={s.salaCard}>
              <div style={s.salaHeader}>
                <div style={s.salaIconBox}>⬡</div>
                <div style={s.salaInfo}>
                  <div style={s.salaNome}>{sala.name}</div>
                  <div style={s.salaMeta}>Andar {sala.floor} · {sala.capacity} pessoas</div>
                </div>
                <span style={s.salaTag}>{sala.active ? '● Disponível' : '○ Inativa'}</span>
              </div>
              <div style={s.timelineLabel}>Horários do dia</div>
              <div style={s.timeline}>
                {HORAS.map(hora => {
                  const res = temReserva(sala.id, hora);
                  return (
                    <div key={hora} style={res ? s.slotOcupado : s.slotLivre} title={res ? `${res.title || 'Reservado'}` : `Livre às ${hora}`}>
                      <span style={s.horaLabel}>{hora}</span>
                      {res && <span style={s.resLabel}>{res.title || 'Ocupado'}</span>}
                      {res && <span style={s.cancelBtn} onClick={() => cancelar(res.id)}>✕</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Nova reserva</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={reservar} style={s.form}>
              <div style={s.field}><label style={s.label}>SALA</label>
                <select style={s.input} value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} required>
                  <option value="">Selecione...</option>
                  {salas.map(sl => <option key={sl.id} value={sl.id}>{sl.name}</option>)}
                </select>
              </div>
              <div style={s.field}><label style={s.label}>TÍTULO DA REUNIÃO</label>
                <input style={s.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Reunião de planejamento" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...s.field, flex: 1 }}><label style={s.label}>INÍCIO</label>
                  <input type="time" style={s.input} value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
                </div>
                <div style={{ ...s.field, flex: 1 }}><label style={s.label}>FIM</label>
                  <input type="time" style={s.input} value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
                </div>
              </div>
              {erro && <div style={s.erro}>{erro}</div>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" style={s.btn}>Reservar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  titulo:      { fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  sub:         { fontSize: 13, color: 'var(--text3)' },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  dateInput:   { padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', outline: 'none' },
  btn:         { background: 'linear-gradient(135deg, var(--purple), var(--purple2))', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  empty:       { textAlign: 'center', padding: '80px 20px' },
  emptyIcon:   { fontSize: 48, opacity: 0.15, marginBottom: 16 },
  emptyTitle:  { fontSize: 16, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 },
  emptySub:    { fontSize: 13, color: 'var(--text3)' },
  grid:        { display: 'flex', flexDirection: 'column', gap: 14 },
  salaCard:    { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 24px' },
  salaHeader:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  salaIconBox: { width: 38, height: 38, borderRadius: 10, background: 'rgba(14,165,233,0.15)', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  salaInfo:    { flex: 1 },
  salaNome:    { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  salaMeta:    { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  salaTag:     { fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 12px', fontWeight: 500 },
  timelineLabel:{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 8 },
  timeline:    { display: 'flex', gap: 4, flexWrap: 'wrap' },
  slotLivre:   { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  slotOcupado: { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '6px 8px', minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' },
  horaLabel:   { fontSize: 10, color: 'var(--text3)', fontWeight: 500 },
  resLabel:    { fontSize: 9, color: 'var(--purple2)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cancelBtn:   { fontSize: 9, color: 'rgba(245,192,0,0.5)', cursor: 'pointer' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modal:       { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitulo: { fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  closeBtn:    { background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text2)', fontSize: 13 },
  form:        { display: 'flex', flexDirection: 'column', gap: 14 },
  field:       { display: 'flex', flexDirection: 'column', gap: 6 },
  label:       { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em' },
  input:       { padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'Sora, sans-serif' },
  erro:        { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13 },
  modalBtns:   { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  btnCancel:   { background: 'rgba(255,255,255,0.05)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 18px', fontSize: 13, cursor: 'pointer' },
};
