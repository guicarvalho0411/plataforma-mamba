import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Dashboard() {
  const [escalaHoje, setEscalaHoje] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/schedules/hoje').then(r => setEscalaHoje(r.data)).catch(() => {});
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <Layout>
      <div style={s.topbar}>
        <div>
          <h1 style={s.titulo}>{saudacao}, {user.name} 👋</h1>
          <p style={s.sub}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      <div style={s.cards}>
        <StatCard icon="🎫" label="Chamados" desc="Solicitações internas" cor="#1E0A3C" href="/chamados" />
        <StatCard icon="⬡" label="Salas de Reunião" desc="Agendar espaços" cor="#5B2D8E" href="/salas" />
        <StatCard icon="◈" label="Escala" desc="Equipe de limpeza" cor="#F5C000" href="/escala" textCor="#1E0A3C" />
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionIcon}>◈</span>
          <h2 style={s.sectionTitulo}>Equipe de limpeza hoje</h2>
        </div>
        {escalaHoje.length === 0
          ? <p style={s.vazio}>Nenhuma colaboradora escalada hoje.</p>
          : escalaHoje.map((e, i) => (
            <div key={i} style={s.escalaItem}>
              <div style={s.escalaAvatar}>{e.colaboradora?.[0]}</div>
              <div style={s.escalaInfo}>
                <span style={s.escalaNome}>{e.colaboradora}</span>
                <span style={s.escalaArea}>{e.area || e.default_area}</span>
              </div>
              <span style={s.escalaTurno}>{e.shift_start?.slice(0,5)} — {e.shift_end?.slice(0,5)}</span>
            </div>
          ))
        }
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, desc, cor, href, textCor = '#fff' }) {
  return (
    <div style={{ ...s.card, background: cor }} onClick={() => window.location.href = href}>
      <span style={{ fontSize: 28, marginBottom: 12, display: 'block' }}>{icon}</span>
      <div style={{ ...s.cardLabel, color: textCor }}>{label}</div>
      <div style={{ ...s.cardDesc, color: textCor === '#1E0A3C' ? 'rgba(30,10,60,0.55)' : 'rgba(255,255,255,0.6)' }}>{desc}</div>
    </div>
  );
}

const s = {
  topbar:       { marginBottom: 28 },
  titulo:       { fontSize: 26, fontWeight: 700, color: '#1E0A3C', margin: '0 0 4px' },
  sub:          { fontSize: 13, color: '#999', margin: 0, textTransform: 'capitalize' },
  cards:        { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 },
  card:         { flex: '1 1 160px', borderRadius: 16, padding: '22px 20px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(30,10,60,0.12)', transition: 'transform 0.15s' },
  cardLabel:    { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  cardDesc:     { fontSize: 12 },
  section:      { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(30,10,60,0.06)' },
  sectionHeader:{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionIcon:  { color: '#F5C000', fontSize: 18 },
  sectionTitulo:{ fontSize: 15, fontWeight: 700, color: '#1E0A3C', margin: 0 },
  vazio:        { color: '#bbb', fontSize: 14 },
  escalaItem:   { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F4F1FA' },
  escalaAvatar: { width: 34, height: 34, borderRadius: 8, background: '#F4F1FA', color: '#5B2D8E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  escalaInfo:   { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  escalaNome:   { fontSize: 13, fontWeight: 600, color: '#1E0A3C' },
  escalaArea:   { fontSize: 11, color: '#999' },
  escalaTurno:  { fontSize: 12, color: '#5B2D8E', fontWeight: 600 },
};
