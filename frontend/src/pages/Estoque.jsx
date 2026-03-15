import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const CATEGORIAS = ['Geral','Limpeza','Higiene','Descartáveis','Químicos'];

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [modal, setModal]       = useState(false);
  const [modalBaixa, setModalBaixa] = useState(null);
  const [form, setForm]         = useState({ name:'', category:'Geral', quantity:'', min_quantity:'', unit:'un' });
  const [qtdBaixa, setQtdBaixa] = useState(1);
  const [busca, setBusca]       = useState('');
  const [erro, setErro]         = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function carregar() {
    const { data } = await api.get('/stock');
    setProdutos(data);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault(); setErro('');
    try {
      await api.post('/stock', form);
      setModal(false);
      setForm({ name:'', category:'Geral', quantity:'', min_quantity:'', unit:'un' });
      carregar();
    } catch (err) { setErro(err.response?.data?.error || 'Erro ao salvar'); }
  }

  async function confirmarBaixa() {
    if (!modalBaixa || qtdBaixa <= 0) return;
    await api.patch(`/stock/${modalBaixa.id}/baixa`, { quantidade: qtdBaixa });
    setModalBaixa(null); setQtdBaixa(1); carregar();
  }

  async function remover(id) {
    if (!confirm('Remover este produto?')) return;
    await api.delete(`/stock/${id}`);
    carregar();
  }

  const filtrados = produtos.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()));
  const emAlerta  = produtos.filter(p => p.quantity <= p.min_quantity);

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Estoque de Limpeza</h1>
          <p style={s.sub}>Controle de materiais e produtos</p>
        </div>
        <button style={s.btn} onClick={() => setModal(true)}>+ Novo produto</button>
      </div>

      {/* Alerta de reposição */}
      {emAlerta.length > 0 && (
        <div style={s.alerta}>
          <span style={s.alertaIcon}>⚠</span>
          <div>
            <div style={s.alertaTitulo}>{emAlerta.length} produto{emAlerta.length > 1 ? 's' : ''} precisam de reposição</div>
            <div style={s.alertaSub}>{emAlerta.map(p => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div style={s.buscaWrap}>
        <span style={s.buscaIcon}>🔍</span>
        <input style={s.buscaInput} placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {/* Lista */}
      <div style={s.list}>
        {filtrados.length === 0 ? (
          <div style={s.vazio}>
            <div style={s.vazioIcon}>📦</div>
            <p style={s.vazioText}>Nenhum produto cadastrado</p>
          </div>
        ) : filtrados.map(p => {
          const pct = Math.min(100, Math.round((p.quantity / Math.max(p.min_quantity * 2, 1)) * 100));
          const critico = p.quantity <= p.min_quantity;
          const cor = critico ? '#EF4444' : p.quantity <= p.min_quantity * 1.5 ? '#F59E0B' : '#10B981';
          return (
            <div key={p.id} style={{ ...s.card, border: critico ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)' }}>
              <div style={s.cardLeft}>
                <div style={s.cardNome}>{p.name}</div>
                <div style={s.cardCat}>{p.category}</div>
                <div style={s.progressBar}>
                  <div style={{ ...s.progressFill, width:`${pct}%`, background: cor }} />
                </div>
                <div style={s.cardQtd}>
                  <span style={{ color: cor, fontWeight:600 }}>{p.quantity} {p.unit}</span>
                  <span style={s.cardMin}> / mín {p.min_quantity} {p.unit}</span>
                  {critico && <span style={s.criticoTag}>⚠ Repor</span>}
                </div>
              </div>
              <div style={s.acoes}>
                <button style={s.btnBaixa} onClick={() => { setModalBaixa(p); setQtdBaixa(1); }}>Dar baixa</button>
                {(user.role === 'admin' || user.role === 'facilities') && (
                  <button style={s.btnRemover} onClick={() => remover(p.id)}>✕</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal novo produto */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modalEl}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Novo produto</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={salvar} style={s.form}>
              <div style={s.field}><label style={s.label}>NOME DO PRODUTO</label>
                <input style={s.input} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Ex: Água Sanitária" required />
              </div>
              <div style={s.field}><label style={s.label}>CATEGORIA</label>
                <select style={s.input} value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ ...s.field, flex:1 }}><label style={s.label}>QUANTIDADE ATUAL</label>
                  <input type="number" style={s.input} value={form.quantity} onChange={e => setForm({...form, quantity:e.target.value})} min="0" required />
                </div>
                <div style={{ ...s.field, flex:1 }}><label style={s.label}>QUANTIDADE MÍNIMA</label>
                  <input type="number" style={s.input} value={form.min_quantity} onChange={e => setForm({...form, min_quantity:e.target.value})} min="1" required />
                </div>
                <div style={{ ...s.field, width:80 }}><label style={s.label}>UNIDADE</label>
                  <select style={s.input} value={form.unit} onChange={e => setForm({...form, unit:e.target.value})}>
                    {['un','L','ml','kg','g','cx','pct','rolo'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {erro && <div style={s.erro}>{erro}</div>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" style={s.btn}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal dar baixa */}
      {modalBaixa && (
        <div style={s.overlay}>
          <div style={{ ...s.modalEl, maxWidth:340 }}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Dar baixa</h2>
              <button style={s.closeBtn} onClick={() => setModalBaixa(null)}>✕</button>
            </div>
            <p style={s.modalSubText}>{modalBaixa.name}</p>
            <p style={s.modalSubText2}>Estoque atual: <b style={{ color:'var(--text)' }}>{modalBaixa.quantity} {modalBaixa.unit}</b></p>
            <div style={s.field}>
              <label style={s.label}>QUANTIDADE UTILIZADA</label>
              <div style={s.qtdControl}>
                <button style={s.qtdBtn} onClick={() => setQtdBaixa(q => Math.max(1, q-1))}>−</button>
                <span style={s.qtdNum}>{qtdBaixa}</span>
                <button style={s.qtdBtn} onClick={() => setQtdBaixa(q => q+1)}>+</button>
                <span style={s.qtdUnit}>{modalBaixa.unit}</span>
              </div>
            </div>
            <div style={{ ...s.modalBtns, marginTop:20 }}>
              <button style={s.btnCancel} onClick={() => setModalBaixa(null)}>Cancelar</button>
              <button style={s.btn} onClick={confirmarBaixa}>Confirmar baixa</button>
            </div>
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
  alerta:       { background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-start' },
  alertaIcon:   { fontSize:20, flexShrink:0 },
  alertaTitulo: { fontSize:13, fontWeight:600, color:'#F59E0B', marginBottom:2 },
  alertaSub:    { fontSize:12, color:'var(--text3)' },
  buscaWrap:    { position:'relative', marginBottom:16 },
  buscaIcon:    { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' },
  buscaInput:   { width:'100%', padding:'11px 14px 11px 40px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--text)', outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box' },
  list:         { display:'flex', flexDirection:'column', gap:8 },
  card:         { background:'var(--card)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:16 },
  cardLeft:     { flex:1, minWidth:0 },
  cardNome:     { fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 },
  cardCat:      { fontSize:11, color:'var(--text3)', marginBottom:8 },
  progressBar:  { height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:6, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2, transition:'width 0.3s' },
  cardQtd:      { display:'flex', alignItems:'center', gap:4, fontSize:13 },
  cardMin:      { fontSize:12, color:'var(--text3)' },
  criticoTag:   { fontSize:11, background:'rgba(239,68,68,0.1)', color:'#EF4444', borderRadius:6, padding:'2px 8px', marginLeft:6 },
  acoes:        { display:'flex', gap:8, flexShrink:0 },
  btnBaixa:     { background:'rgba(124,58,237,0.15)', color:'var(--purple2)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif' },
  btnRemover:   { background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'7px 10px', fontSize:13, cursor:'pointer', fontFamily:'Sora,sans-serif' },
  vazio:        { textAlign:'center', padding:'60px 0' },
  vazioIcon:    { fontSize:40, opacity:0.2, marginBottom:12 },
  vazioText:    { fontSize:14, color:'var(--text3)' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(4px)' },
  modalEl:      { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' },
  modalHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  modalTitulo:  { fontSize:18, fontWeight:700, color:'var(--text)' },
  modalSubText: { fontSize:14, color:'var(--text2)', marginBottom:4 },
  modalSubText2:{ fontSize:13, color:'var(--text3)', marginBottom:16 },
  closeBtn:     { background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:8, width:30, height:30, cursor:'pointer', color:'var(--text2)', fontSize:13, fontFamily:'Sora,sans-serif' },
  form:         { display:'flex', flexDirection:'column', gap:14 },
  field:        { display:'flex', flexDirection:'column', gap:6 },
  label:        { fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.1em' },
  input:        { padding:'11px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--text)', outline:'none', fontFamily:'Sora,sans-serif' },
  erro:         { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:13 },
  modalBtns:    { display:'flex', gap:10, justifyContent:'flex-end' },
  btnCancel:    { background:'rgba(255,255,255,0.05)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 18px', fontSize:13, cursor:'pointer', fontFamily:'Sora,sans-serif' },
  qtdControl:   { display:'flex', alignItems:'center', gap:12, marginTop:4 },
  qtdBtn:       { width:36, height:36, borderRadius:10, background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'var(--purple2)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,sans-serif' },
  qtdNum:       { fontSize:24, fontWeight:700, color:'var(--text)', minWidth:40, textAlign:'center' },
  qtdUnit:      { fontSize:13, color:'var(--text3)' },
};
