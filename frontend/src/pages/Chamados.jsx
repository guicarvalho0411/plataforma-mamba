import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const STATUS = {
  aberto:       { cor:'#F59E0B', bg:'rgba(245,158,11,0.1)',  bdr:'rgba(245,158,11,0.25)',  label:'Aberto' },
  em_andamento: { cor:'#3B82F6', bg:'rgba(59,130,246,0.1)',  bdr:'rgba(59,130,246,0.25)',  label:'Em andamento' },
  resolvido:    { cor:'#10B981', bg:'rgba(16,185,129,0.1)',  bdr:'rgba(16,185,129,0.25)',  label:'Resolvido' },
  cancelado:    { cor:'#EF4444', bg:'rgba(239,68,68,0.1)',   bdr:'rgba(239,68,68,0.25)',   label:'Cancelado' },
};

export default function Chamados() {
  const [tickets, setTickets]       = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro]         = useState('');
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({ category_id:'', description:'', location:'', priority:'media' });
  const [loading, setLoading]       = useState(false);

  async function carregar() {
    const params = filtro ? `?status=${filtro}` : '';
    const [t, c] = await Promise.all([api.get(`/tickets${params}`), api.get('/tickets/categorias')]);
    setTickets(t.data); setCategorias(c.data);
  }

  useEffect(() => { carregar(); }, [filtro]);

  async function abrirChamado(e) {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/tickets', form);
      setModal(false);
      setForm({ category_id:'', description:'', location:'', priority:'media' });
      carregar();
    } catch (err) { alert(err.response?.data?.error || 'Erro ao abrir chamado'); }
    finally { setLoading(false); }
  }

  async function atualizarStatus(id, status) {
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      carregar();
    } catch (err) { alert(err.response?.data?.error || 'Erro ao atualizar'); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este chamado?')) return;
    try {
      await api.patch(`/tickets/${id}/status`, { status: 'cancelado' });
      carregar();
    } catch (err) { alert('Erro ao excluir chamado'); }
  }

  const counts = {
    aberto:       tickets.filter(t => t.status === 'aberto').length,
    em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
    resolvido:    tickets.filter(t => t.status === 'resolvido').length,
  };

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Chamados</h1>
          <p style={s.sub}>Solicitações para a equipe de limpeza</p>
        </div>
        <button style={s.btn} onClick={() => setModal(true)}>+ Novo chamado</button>
      </div>

      {/* Contadores */}
      <div style={s.counters}>
        {[['aberto','Abertos','#F59E0B'],['em_andamento','Em andamento','#3B82F6'],['resolvido','Resolvidos','#10B981']].map(([k,l,c]) => (
          <div key={k} style={{ ...s.counter, borderTop:`3px solid ${c}`, background: filtro === k ? `${c}15` : 'var(--card)' }} onClick={() => setFiltro(filtro === k ? '' : k)}>
            <div style={{ ...s.counterNum, color:c }}>{counts[k]}</div>
            <div style={s.counterLabel}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={s.filtros}>
        {['','aberto','em_andamento','resolvido','cancelado'].map(st => (
          <button key={st} style={filtro === st ? s.filtroAtivo : s.filtro} onClick={() => setFiltro(st)}>
            {st === '' ? 'Todos' : STATUS[st]?.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={s.list}>
        {tickets.length === 0 ? (
          <div style={s.vazio}>
            <div style={s.vazioIcon}>◎</div>
            <p style={s.vazioText}>Nenhum chamado encontrado</p>
          </div>
        ) : tickets.map(t => {
          const st = STATUS[t.status] || STATUS.aberto;
          return (
            <div key={t.id} style={s.card}>
              <div style={{ ...s.cardBorder, background:st.cor }} />
              <div style={s.cardBody}>
                <div style={s.cardTop}>
                  <span style={{ ...s.badge, background:st.bg, border:`1px solid ${st.bdr}`, color:st.cor }}>{st.label}</span>
                  <span style={s.catBadge}>{t.categoria}</span>
                  <span style={{ ...s.prioBadge, color:t.priority==='alta'?'#EF4444':'var(--text3)', background:t.priority==='alta'?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.04)' }}>
                    {t.priority === 'alta' ? '⚡ Alta' : t.priority === 'media' ? '● Média' : '○ Baixa'}
                  </span>
                </div>
                <p style={s.descricao}>{t.description}</p>
                <div style={s.cardMeta}>
                  <span>📍 {t.location || 'Sem localização'}</span>
                  <span>👤 {t.solicitante}</span>
                  <span>🕐 {new Date(t.opened_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              </div>

              {/* Ações — disponíveis para todos */}
              <div style={s.acoes}>
                {t.status === 'aberto' && (
                  <button style={s.btnIniciar} onClick={() => atualizarStatus(t.id, 'em_andamento')}>
                    ▶ Iniciar
                  </button>
                )}
                {t.status === 'em_andamento' && (
                  <button style={s.btnConcluir} onClick={() => atualizarStatus(t.id, 'resolvido')}>
                    ✓ Concluir
                  </button>
                )}
                {t.status !== 'cancelado' && (
                  <button style={s.btnExcluir} onClick={() => excluir(t.id)}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal novo chamado */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modalEl}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Novo chamado de limpeza</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <p style={s.modalSub}>A equipe de limpeza será notificada pelo WhatsApp automaticamente.</p>
            <form onSubmit={abrirChamado} style={s.form}>
              <div style={s.field}><label style={s.label}>TIPO DE SOLICITAÇÃO</label>
                <select style={s.input} value={form.category_id} onChange={e => setForm({...form, category_id:e.target.value})} required>
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={s.field}><label style={s.label}>DESCRIÇÃO</label>
                <textarea style={{ ...s.input, minHeight:80, resize:'vertical' }} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Descreva o que precisa..." required />
              </div>
              <div style={s.field}><label style={s.label}>LOCAL</label>
                <input style={s.input} value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="Ex: Cozinha do 2º andar" />
              </div>
              <div style={s.field}><label style={s.label}>PRIORIDADE</label>
                <div style={s.prioGroup}>
                  {['baixa','media','alta'].map(p => (
                    <div key={p} style={{ ...s.prioOpt, ...(form.priority===p ? s.prioOptAtivo:{}) }} onClick={() => setForm({...form, priority:p})}>
                      {p==='alta'?'⚡ Alta':p==='media'?'● Média':'○ Baixa'}
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.modalBtns}>
                <button type="button" style={s.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" style={loading?{...s.btn,opacity:0.6}:s.btn} disabled={loading}>
                  {loading ? 'Enviando...' : 'Abrir e notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s = {
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  titulo:       { fontSize:26, fontWeight:700, color:'var(--text)', margin:'0 0 4px' },
  sub:          { fontSize:13, color:'var(--text3)' },
  btn:          { background:'linear-gradient(135deg, var(--purple), var(--purple2))', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif', whiteSpace:'nowrap' },
  counters:     { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' },
  counter:      { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px', flex:'1 1 100px', cursor:'pointer', textAlign:'center', transition:'background 0.15s' },
  counterNum:   { fontSize:28, fontWeight:700, lineHeight:1 },
  counterLabel: { fontSize:11, color:'var(--text3)', marginTop:4 },
  filtros:      { display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' },
  filtro:       { background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 16px', fontSize:12, cursor:'pointer', color:'var(--text2)', fontFamily:'Sora,sans-serif' },
  filtroAtivo:  { background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.4)', borderRadius:20, padding:'6px 16px', fontSize:12, cursor:'pointer', color:'var(--purple2)', fontWeight:600, fontFamily:'Sora,sans-serif' },
  list:         { display:'flex', flexDirection:'column', gap:8 },
  card:         { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, display:'flex', overflow:'hidden', alignItems:'stretch' },
  cardBorder:   { width:4, flexShrink:0 },
  cardBody:     { flex:1, padding:'14px 16px' },
  cardTop:      { display:'flex', gap:6, alignItems:'center', marginBottom:8, flexWrap:'wrap' },
  badge:        { fontSize:11, fontWeight:600, borderRadius:20, padding:'3px 10px' },
  catBadge:     { fontSize:11, background:'rgba(255,255,255,0.05)', color:'var(--text2)', borderRadius:20, padding:'3px 10px' },
  prioBadge:    { fontSize:11, borderRadius:20, padding:'3px 10px' },
  descricao:    { fontSize:14, color:'var(--text)', marginBottom:8, lineHeight:1.5 },
  cardMeta:     { display:'flex', gap:14, fontSize:11, color:'var(--text3)', flexWrap:'wrap' },
  acoes:        { display:'flex', flexDirection:'column', justifyContent:'center', gap:6, padding:'12px', borderLeft:'1px solid var(--border)', flexShrink:0 },
  btnIniciar:   { background:'rgba(59,130,246,0.15)', color:'#3B82F6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif', whiteSpace:'nowrap' },
  btnConcluir:  { background:'rgba(16,185,129,0.15)', color:'#10B981', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif', whiteSpace:'nowrap' },
  btnExcluir:   { background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'7px 10px', fontSize:13, cursor:'pointer', fontFamily:'Sora,sans-serif' },
  vazio:        { textAlign:'center', padding:'60px 0' },
  vazioIcon:    { fontSize:36, opacity:0.15, marginBottom:12 },
  vazioText:    { fontSize:14, color:'var(--text3)' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' },
  modalEl:      { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' },
  modalHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  modalTitulo:  { fontSize:18, fontWeight:700, color:'var(--text)' },
  modalSub:     { fontSize:12, color:'#10B981', marginBottom:20, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:8, padding:'8px 12px' },
  closeBtn:     { background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:8, width:30, height:30, cursor:'pointer', color:'var(--text2)', fontSize:13, fontFamily:'Sora,sans-serif' },
  form:         { display:'flex', flexDirection:'column', gap:14 },
  field:        { display:'flex', flexDirection:'column', gap:6 },
  label:        { fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.1em' },
  input:        { padding:'11px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--text)', outline:'none', fontFamily:'Sora,sans-serif' },
  prioGroup:    { display:'flex', gap:8 },
  prioOpt:      { flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)', color:'var(--text3)', fontSize:13, textAlign:'center', cursor:'pointer' },
  prioOptAtivo: { border:'1px solid rgba(124,58,237,0.5)', background:'rgba(124,58,237,0.15)', color:'var(--purple2)', fontWeight:600 },
  modalBtns:    { display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 },
  btnCancel:    { background:'rgba(255,255,255,0.05)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', fontFamily:'Sora,sans-serif' },
};
