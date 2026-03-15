import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const STATUS_COR = {
  aberto:       { bg: '#fff3cd', cor: '#856404' },
  em_andamento: { bg: '#cce5ff', cor: '#004085' },
  resolvido:    { bg: '#d4edda', cor: '#155724' },
  cancelado:    { bg: '#f8d7da', cor: '#721c24' },
};

const STATUS_LABEL = {
  aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', cancelado: 'Cancelado'
};

export default function Chamados() {
  const [tickets, setTickets]       = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro]         = useState('');
  const [abrindo, setAbrindo]       = useState(false);
  const [form, setForm]             = useState({ category_id: '', description: '', location: '', priority: 'media' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function carregar() {
    const params = filtro ? `?status=${filtro}` : '';
    const [t, c] = await Promise.all([
      api.get(`/tickets${params}`),
      api.get('/tickets/categorias'),
    ]);
    setTickets(t.data);
    setCategorias(c.data);
  }

  useEffect(() => { carregar(); }, [filtro]);

  async function abrirChamado(e) {
    e.preventDefault();
    try {
      await api.post('/tickets', form);
      setAbrindo(false);
      setForm({ category_id: '', description: '', location: '', priority: 'media' });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao abrir chamado');
    }
  }

  async function atualizarStatus(id, status) {
    await api.patch(`/tickets/${id}/status`, { status });
    carregar();
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.titulo}>Chamados</h1>
        <button style={styles.btn} onClick={() => setAbrindo(true)}>+ Novo chamado</button>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        {['', 'aberto', 'em_andamento', 'resolvido'].map(s => (
          <button key={s} style={filtro === s ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro(s)}>
            {s === '' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Lista de chamados */}
      {tickets.length === 0
        ? <p style={styles.vazio}>Nenhum chamado encontrado.</p>
        : tickets.map(t => (
          <div key={t.id} style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.categoria}>{t.categoria}</span>
              <span style={{ ...styles.status, background: STATUS_COR[t.status]?.bg, color: STATUS_COR[t.status]?.cor }}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
            <p style={styles.descricao}>{t.description}</p>
            <div style={styles.cardInfo}>
              <span>📍 {t.location || 'Sem localização'}</span>
              <span>👤 {t.solicitante}</span>
              <span>🕐 {new Date(t.opened_at).toLocaleDateString('pt-BR')}</span>
            </div>
            {/* Botões de ação para facilities/admin */}
            {(user.role === 'facilities' || user.role === 'admin') && t.status !== 'resolvido' && (
              <div style={styles.acoes}>
                {t.status === 'aberto' && (
                  <button style={styles.btnAcao} onClick={() => atualizarStatus(t.id, 'em_andamento')}>Iniciar atendimento</button>
                )}
                {t.status === 'em_andamento' && (
                  <button style={{ ...styles.btnAcao, background: '#1a7a4a' }} onClick={() => atualizarStatus(t.id, 'resolvido')}>Marcar como resolvido</button>
                )}
              </div>
            )}
          </div>
        ))
      }

      {/* Modal novo chamado */}
      {abrindo && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitulo}>Novo chamado</h2>
            <form onSubmit={abrirChamado} style={styles.form}>
              <label style={styles.label}>Categoria</label>
              <select style={styles.input} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label style={styles.label}>Descrição</label>
              <textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o que precisa..." required />

              <label style={styles.label}>Localização</label>
              <input style={styles.input} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Andar 2 - Cozinha" />

              <label style={styles.label}>Prioridade</label>
              <select style={styles.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>

              <div style={styles.modalBtns}>
                <button type="button" style={styles.btnCancelar} onClick={() => setAbrindo(false)}>Cancelar</button>
                <button type="submit" style={styles.btn}>Abrir chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titulo:      { fontSize: 24, fontWeight: 700, color: '#1a56a0', margin: 0 },
  btn:         { background: '#1a56a0', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  filtros:     { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filtro:      { background: '#fff', border: '1px solid #ddd', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', color: '#555' },
  filtroAtivo: { background: '#1a56a0', border: '1px solid #1a56a0', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', color: '#fff', fontWeight: 600 },
  vazio:       { color: '#aaa', fontSize: 14 },
  card:        { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoria:   { fontSize: 13, fontWeight: 600, color: '#1a56a0' },
  status:      { fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px' },
  descricao:   { fontSize: 14, color: '#333', margin: '0 0 10px' },
  cardInfo:    { display: 'flex', gap: 16, fontSize: 12, color: '#888', flexWrap: 'wrap' },
  acoes:       { marginTop: 12, display: 'flex', gap: 8 },
  btnAcao:     { background: '#1a56a0', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#fff', borderRadius: 14, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalTitulo: { fontSize: 18, fontWeight: 700, color: '#1a56a0', margin: '0 0 20px' },
  form:        { display: 'flex', flexDirection: 'column', gap: 8 },
  label:       { fontSize: 13, fontWeight: 500, color: '#444' },
  input:       { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  modalBtns:   { display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' },
  btnCancelar: { background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer' },
};
