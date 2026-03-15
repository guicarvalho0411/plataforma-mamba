import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Dashboard() {
  const [escalaHoje, setEscalaHoje] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    api.get('/schedules/hoje').then(r => setEscalaHoje(r.data)).catch(() => {});
  }, []);

  return (
    <Layout>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.saudacaoLabel}>{saudacao} 👋</p>
          <h1 style={s.titulo}>{user.name}</h1>
          <p style={s.data}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={s.headerBadge}>
          <div style={s.badgeDot} />
          Sistema online
        </div>
      </div>

      {/* Cards */}
      <div style={s.cards}>
        <ModuleCard icon="◎" label="Chamados" desc="Solicitações internas abertas" cor="#7C3AED" href="/chamados" />
        <ModuleCard icon="⬡" label="Salas de Reunião" desc="Agende espaços disponíveis" cor="#0EA5E9" href="/salas" />
        <ModuleCard icon="◈" label="Escala" desc="Equipe de limpeza da semana" cor="#F5C000" textCor="#1E0A3C" href="/escala" />
      </div>

      {/* Escala hoje */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionIconBox}>◈</div>
          <div>
            <h2 style={s.sectionTitulo}>Equipe de limpeza hoje</h2>
            <p style={s.sectionSub}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
          </div>
        </div>

        {escalaHoje.length === 0 ? (
          <div style={s.vazio}>
            <div style={s.vazioBig}>◈</div>
            <p style={s.vazioText}>Nenhuma colaboradora escalada hoje</p>
          </div>
        ) : (
          <div style={s.escalaList}>
            {escalaHoje.map((e, i) => (
              <div key={i} style={s.escalaItem}>
                <div style={s.escalaAvatar}>{e.colaboradora?.[0]}</div>
                <div style={s.escalaInfo}>
                  <span style={s.escalaNome}>{e.colaboradora}</span>
                  <span style={s.escalaArea}>{e.area || e.default_area}</span>
                </div>
                <div style={s.escalaTurnoBox}>
                  <span style={s.escalaTurno}>{e.shift_start?.slice(0,5)} — {e.shift_end?.slice(0,5)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ModuleCard({ icon, label, desc, cor, href, textCor = '#fff' }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ ...s.card, background: hover ? cor : `${cor}22`, border: `1px solid ${cor}44`, transform: hover ? 'translateY(-2px)' : 'none', transition: 'all 0.2s' }}
      onClick={() => window.location.href = href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ ...s.cardIconBox, background: `${cor}33`, color: hover ? '#fff' : cor }}>{icon}</div>
      <div style={{ ...s.cardLabel, color: hover ? '#fff' : 'var(--text)' }}>{label}</div>
      <div style={{ ...s.cardDesc, color: hover ? 'rgba(255,255,255,0.7)' : 'var(--text3)' }}>{desc}</div>
      <div style={{ ...s.cardArrow, color: hover ? '#fff' : cor }}>→</div>
    </div>
  );
}

const s = {
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  saudacaoLabel: { fontSize: 13, color: 'var(--text3)', marginBottom: 4 },
  titulo:        { fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  data:          { fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize' },
  headerBadge:   { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#10B981' },
  badgeDot:      { width: 6, height: 6, borderRadius: '50%', background: '#10B981' },
  cards:         { display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' },
  card:          { flex: '1 1 160px', borderRadius: 16, padding: '20px', cursor: 'pointer', position: 'relative' },
  cardIconBox:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 12 },
  cardLabel:     { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  cardDesc:      { fontSize: 12, lineHeight: 1.4, marginBottom: 12 },
  cardArrow:     { fontSize: 18, fontWeight: 300 },
  section:       { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionIconBox:{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,192,0,0.15)', color: '#F5C000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  sectionTitulo: { fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 },
  sectionSub:    { fontSize: 11, color: 'var(--text3)', marginTop: 2, textTransform: 'capitalize' },
  vazio:         { textAlign: 'center', padding: '32px 0' },
  vazioBig:      { fontSize: 32, marginBottom: 8, opacity: 0.2 },
  vazioText:     { fontSize: 13, color: 'var(--text3)' },
  escalaList:    { display: 'flex', flexDirection: 'column', gap: 8 },
  escalaItem:    { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' },
  escalaAvatar:  { width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.2)', color: 'var(--purple2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  escalaInfo:    { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  escalaNome:    { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  escalaArea:    { fontSize: 11, color: 'var(--text3)' },
  escalaTurnoBox:{ background: 'rgba(245,192,0,0.1)', border: '1px solid rgba(245,192,0,0.2)', borderRadius: 8, padding: '4px 10px' },
  escalaTurno:   { fontSize: 11, color: 'var(--yellow)', fontWeight: 600 },
};
