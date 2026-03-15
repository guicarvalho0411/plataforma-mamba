import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const TIPO = {
  turno:      { cor: '#10B981', bg: 'rgba(16,185,129,0.15)',  bdr: 'rgba(16,185,129,0.25)',  label: 'Turno' },
  folga:      { cor: '#6B7280', bg: 'rgba(107,114,128,0.12)', bdr: 'rgba(107,114,128,0.2)',  label: 'Folga' },
  ferias:     { cor: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  bdr: 'rgba(245,158,11,0.25)',  label: 'Férias' },
  hora_extra: { cor: '#A78BFA', bg: 'rgba(167,139,250,0.15)', bdr: 'rgba(167,139,250,0.25)', label: 'H. Extra' },
};

function inicioSemana(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
  return d.toISOString().split('T')[0];
}

function gerarDias(inicio) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function Escala() {
  const [offset, setOffset]   = useState(0);
  const [inicio, setInicio]   = useState(inicioSemana(0));
  const [dias, setDias]       = useState(gerarDias(inicioSemana(0)));
  const [cleaners, setCleaners] = useState([]);
  const [escala, setEscala]   = useState([]);

  useEffect(() => {
    const i = inicioSemana(offset);
    setInicio(i); setDias(gerarDias(i));
  }, [offset]);

  useEffect(() => {
    api.get(`/schedules?week=${inicio}`).then(r => setEscala(r.data)).catch(() => {});
    api.get('/schedules/cleaners').then(r => setCleaners(r.data)).catch(() => {});
  }, [inicio]);

  function getCelula(cleanerId, dia) {
    return escala.find(e => e.cleaner_id === cleanerId && e.date?.split('T')[0] === dia);
  }

  function labelSemana() {
    const d1 = new Date(inicio + 'T12:00:00');
    const d2 = new Date(inicio + 'T12:00:00');
    d2.setDate(d2.getDate() + 6);
    return `${d1.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${d2.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Escala de Limpeza</h1>
          <p style={s.sub}>Gestão de turnos e colaboradoras</p>
        </div>
        <div style={s.navSemana}>
          <button style={s.navBtn} onClick={() => setOffset(o => o - 1)}>←</button>
          <span style={s.semanaLabel}>{labelSemana()}</span>
          <button style={s.navBtn} onClick={() => setOffset(o => o + 1)}>→</button>
        </div>
      </div>

      {/* Legenda */}
      <div style={s.legenda}>
        {Object.entries(TIPO).map(([k, v]) => (
          <span key={k} style={{ ...s.legItem, background: v.bg, border: `1px solid ${v.bdr}`, color: v.cor }}>{v.label}</span>
        ))}
      </div>

      {/* Tabela */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.thNome}>Colaboradora</th>
              {dias.map(d => {
                const hoje = d === new Date().toISOString().split('T')[0];
                return (
                  <th key={d} style={{ ...s.th, ...(hoje ? s.thHoje : {}) }}>
                    <div>{DIAS[new Date(d + 'T12:00:00').getDay()]}</div>
                    <div style={s.thData}>{new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                    {hoje && <div style={s.thHojeDot} />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {cleaners.length === 0 ? (
              <tr><td colSpan={8} style={s.tdVazio}>Nenhuma colaboradora cadastrada</td></tr>
            ) : cleaners.map(c => (
              <tr key={c.id}>
                <td style={s.tdNome}>
                  <div style={s.cleanerRow}>
                    <div style={s.cleanerAvatar}>{c.name[0]}</div>
                    <div>
                      <div style={s.cleanerNome}>{c.name}</div>
                      <div style={s.cleanerArea}>{c.default_area}</div>
                    </div>
                  </div>
                </td>
                {dias.map(d => {
                  const cel = getCelula(c.id, d);
                  const tp = cel ? TIPO[cel.type] : null;
                  return (
                    <td key={d} style={s.td}>
                      {cel ? (
                        <div style={{ ...s.celula, background: tp.bg, border: `1px solid ${tp.bdr}` }}>
                          <div style={{ ...s.celulaLabel, color: tp.cor }}>{tp.label}</div>
                          {cel.shift_start && <div style={s.celulaHora}>{cel.shift_start.slice(0,5)}</div>}
                        </div>
                      ) : <div style={s.celulaVazia}>—</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

const s = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  titulo:       { fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  sub:          { fontSize: 13, color: 'var(--text3)' },
  navSemana:    { display: 'flex', alignItems: 'center', gap: 10 },
  navBtn:       { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text2)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  semanaLabel:  { fontSize: 13, fontWeight: 500, color: 'var(--text)', minWidth: 180, textAlign: 'center' },
  legenda:      { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  legItem:      { borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 500 },
  tableWrap:    { overflowX: 'auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20 },
  table:        { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  thNome:       { padding: '14px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', letterSpacing: '0.06em' },
  th:           { padding: '14px 8px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', minWidth: 80 },
  thHoje:       { color: 'var(--purple2)' },
  thData:       { fontSize: 10, opacity: 0.6, marginTop: 2 },
  thHojeDot:    { width: 5, height: 5, borderRadius: '50%', background: 'var(--purple2)', margin: '4px auto 0' },
  tdNome:       { padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td:           { padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' },
  tdVazio:      { padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 },
  cleanerRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  cleanerAvatar:{ width: 30, height: 30, borderRadius: 8, background: 'rgba(124,58,237,0.2)', color: 'var(--purple2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 },
  cleanerNome:  { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  cleanerArea:  { fontSize: 10, color: 'var(--text3)', marginTop: 1 },
  celula:       { borderRadius: 8, padding: '5px 4px', textAlign: 'center' },
  celulaLabel:  { fontSize: 10, fontWeight: 600 },
  celulaHora:   { fontSize: 9, opacity: 0.7, marginTop: 2 },
  celulaVazia:  { color: 'rgba(255,255,255,0.1)', fontSize: 14 },
};
