import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const HORAS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

export default function Salas() {
  const [salas, setSalas]         = useState([]);
  const [reservas, setReservas]   = useState([]);
  const [data, setData]           = useState(new Date().toISOString().split('T')[0]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ room_id: '', title: '', start_time: '', end_time: '' });
  const [erro, setErro]           = useState('');

  async function carregar() {
    try {
      const [s, r] = await Promise.all([
        api.get('/rooms'),
        api.get(`/rooms/bookings?date=${data}`),
      ]);
      setSalas(s.data);
      setReservas(r.data);
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
    e.preventDefault();
    setErro('');
    try {
      await api.post('/rooms/bookings', {
        ...form,
        start_time: `${data}T${form.start_time}:00`,
        end_time:   `${data}T${form.end_time}:00`,
      });
      setModal(false);
      setForm({ room_id: '', title: '', start_time: '', end_time: '' });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao reservar');
    }
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
          <p style={s.emptyText}>Nenhuma sala cadastrada ainda.</p>
          <p style={s.emptyHint}>Peça ao administrador para cadastrar as salas no banco de dados.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {salas.map(sala => (
            <div key={sala.id} style={s.salaCard}>
              <div style={s.salaHeader}>
                <div>
                  <div style={s.salaNome}>{sala.name}</div>
                  <div style={s.salaInfo}>Andar {sala.floor} · {sala.capacity} pessoas</div>
                </div>
                <div style={s.salaTag}>{sala.active ? 'Disponível' : 'Inativa'}</div>
              </div>
              <div style={s.timeline}>
                {HORAS.map(hora => {
                  const res = temReserva(sala.id, hora);
                  return (
                    <div key={hora} style={res ? s.slotOcupado : s.slotLivre} title={res ? `${res.title || 'Reservado'} por ${res.solicitante}` : hora}>
                      <span style={s.horaLabel}>{hora}</span>
                      {res && <span style={s.resLabel}>{res.title || 'Reservado'}</span>}
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
            <h2 style={s.modalTitulo}>Nova reserva</h2>
            <form onSubmit={reservar} style={s.form}>
              <label style={s.label}>Sala</label>
              <select style={s.input} value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} required>
                <option value="">Selecione...</option>
                {salas.map(s2 => <option key={s2.id} value={s2.id}>{s2.name}</option>)}
              </select>

              <label style={s.label}>Título da reunião</label>
              <input style={s.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Reunião de planejamento" />

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Início</label>
                  <input type="time" style={s.input} value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Fim</label>
                  <input type="time" style={s.input} value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
                </div>
              </div>

              {erro && <div style={s.erro}>{erro}</div>}

              <div style={s.modalBtns}>
                <button type="button" style={s.btnCancelar} onClick={() => setModal(false)}>Cancelar</button>
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
  titulo:      { fontSize: 26, fontWeight: 700, color: '#1E0A3C', margin: '0 0 4px' },
  sub:         { fontSize: 13, color: '#999', margin: 0 },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  dateInput:   { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E8E0F0', fontSize: 13, color: '#1E0A3C', background: '#fff', outline: 'none' },
  btn:         { background: '#1E0A3C', color: '#F5C000', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  empty:       { textAlign: 'center', padding: '60px 20px' },
  emptyIcon:   { fontSize: 48, marginBottom: 12, color: '#D0C0E8' },
  emptyText:   { fontSize: 16, fontWeight: 600, color: '#5B2D8E', margin: '0 0 8px' },
  emptyHint:   { fontSize: 13, color: '#aaa' },
  grid:        { display: 'flex', flexDirection: 'column', gap: 16 },
  salaCard:    { background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(30,10,60,0.06)' },
  salaHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  salaNome:    { fontSize: 16, fontWeight: 700, color: '#1E0A3C' },
  salaInfo:    { fontSize: 12, color: '#999', marginTop: 2 },
  salaTag:     { background: '#F0EBFA', color: '#5B2D8E', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600 },
  timeline:    { display: 'flex', gap: 4, flexWrap: 'wrap' },
  slotLivre:   { position: 'relative', background: '#F4F1FA', borderRadius: 6, padding: '6px 8px', minWidth: 62, cursor: 'default', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  slotOcupado: { position: 'relative', background: '#1E0A3C', borderRadius: 6, padding: '6px 8px', minWidth: 62, cursor: 'default', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  horaLabel:   { fontSize: 10, color: '#999', fontWeight: 500 },
  resLabel:    { fontSize: 9, color: '#F5C000', marginTop: 2, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' },
  cancelBtn:   { fontSize: 9, color: 'rgba(245,192,0,0.5)', marginTop: 2, cursor: 'pointer' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(30,10,60,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' },
  modalTitulo: { fontSize: 18, fontWeight: 700, color: '#1E0A3C', margin: '0 0 20px' },
  form:        { display: 'flex', flexDirection: 'column', gap: 10 },
  label:       { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:       { padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E8E0F0', fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#1E0A3C' },
  erro:        { background: '#FFF0F0', color: '#C0392B', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  modalBtns:   { display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' },
  btnCancelar: { background: '#F4F1FA', color: '#5B2D8E', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
};
