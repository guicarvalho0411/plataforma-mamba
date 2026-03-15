import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPO_ESTILO = {
  turno:      { bg: '#d4edda', cor: '#155724' },
  folga:      { bg: '#f0f0f0', cor: '#555' },
  ferias:     { bg: '#fff3cd', cor: '#856404' },
  hora_extra: { bg: '#e8d5ff', cor: '#5b2d8e' },
};
const TIPO_LABEL = { turno: 'Turno', folga: 'Folga', ferias: 'Férias', hora_extra: 'H. Extra' };

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
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [inicio, setInicio]             = useState(inicioSemana(0));
  const [dias, setDias]                 = useState(gerarDias(inicioSemana(0)));
  const [cleaners, setCleaners]         = useState([]);
  const [escala, setEscala]             = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const i = inicioSemana(semanaOffset);
    setInicio(i);
    setDias(gerarDias(i));
  }, [semanaOffset]);

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
    return `${d1.toLocaleDateString('pt-BR')} — ${d2.toLocaleDateString('pt-BR')}`;
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.titulo}>Escala de Limpeza</h1>
      </div>

      {/* Navegação de semana */}
      <div style={styles.navSemana}>
        <button style={styles.navBtn} onClick={() => setSemanaOffset(o => o - 1)}>← Semana anterior</button>
        <span style={styles.semanaLabel}>{labelSemana()}</span>
        <button style={styles.navBtn} onClick={() => setSemanaOffset(o => o + 1)}>Próxima semana →</button>
      </div>

      {/* Tabela */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Colaboradora</th>
              {dias.map((d, i) => (
                <th key={d} style={styles.th}>
                  {DIAS[(new Date(d + 'T12:00:00').getDay())]}
                  <div style={styles.thData}>{new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cleaners.map(c => (
              <tr key={c.id}>
                <td style={styles.tdNome}>
                  <div style={styles.nome}>{c.name}</div>
                  <div style={styles.area}>{c.default_area}</div>
                </td>
                {dias.map(d => {
                  const cel = getCelula(c.id, d);
                  const est = cel ? TIPO_ESTILO[cel.type] : null;
                  return (
                    <td key={d} style={styles.td}>
                      {cel ? (
                        <div style={{ ...styles.celula, background: est.bg, color: est.cor }}>
                          <div style={styles.celulaLabel}>{TIPO_LABEL[cel.type]}</div>
                          {cel.shift_start && <div style={styles.celulaHora}>{cel.shift_start.slice(0,5)}–{cel.shift_end?.slice(0,5)}</div>}
                          {cel.area && <div style={styles.celulaArea}>{cel.area}</div>}
                        </div>
                      ) : (
                        <div style={styles.celulaVazia}>—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div style={styles.legenda}>
        {Object.entries(TIPO_LABEL).map(([k, v]) => (
          <span key={k} style={{ ...styles.legItem, background: TIPO_ESTILO[k].bg, color: TIPO_ESTILO[k].cor }}>{v}</span>
        ))}
      </div>
    </Layout>
  );
}

const styles = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titulo:      { fontSize: 24, fontWeight: 700, color: '#1a56a0', margin: 0 },
  navSemana:   { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  navBtn:      { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: '#444' },
  semanaLabel: { fontSize: 14, fontWeight: 600, color: '#333' },
  tableWrap:   { overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  th:          { padding: '12px 8px', fontSize: 12, fontWeight: 600, color: '#555', textAlign: 'center', borderBottom: '1px solid #eee', background: '#fafafa' },
  thData:      { fontSize: 11, fontWeight: 400, color: '#999', marginTop: 2 },
  tdNome:      { padding: '10px 16px', borderBottom: '1px solid #f5f5f5', minWidth: 140 },
  td:          { padding: '6px 6px', borderBottom: '1px solid #f5f5f5', textAlign: 'center' },
  nome:        { fontSize: 13, fontWeight: 600, color: '#333' },
  area:        { fontSize: 11, color: '#999', marginTop: 2 },
  celula:      { borderRadius: 6, padding: '5px 6px', fontSize: 11 },
  celulaLabel: { fontWeight: 600 },
  celulaHora:  { fontSize: 10, marginTop: 2, opacity: 0.85 },
  celulaArea:  { fontSize: 10, marginTop: 1, opacity: 0.75 },
  celulaVazia: { color: '#ddd', fontSize: 13 },
  legenda:     { display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  legItem:     { borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500 },
};
