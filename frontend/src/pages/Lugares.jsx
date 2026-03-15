import Layout from '../components/Layout';

export default function Lugares() {
  return (
    <Layout>
      <div style={s.wrap}>
        <div style={s.icon}>🗺</div>
        <h1 style={s.titulo}>Mapa de Lugares</h1>
        <p style={s.sub}>Esta funcionalidade está sendo desenvolvida e em breve estará disponível.</p>
        <div style={s.badge}>Em breve</div>
      </div>
    </Layout>
  );
}

const s = {
  wrap:   { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center' },
  icon:   { fontSize:56, marginBottom:16, opacity:0.3 },
  titulo: { fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:8 },
  sub:    { fontSize:14, color:'var(--text3)', maxWidth:360, lineHeight:1.6, marginBottom:20 },
  badge:  { background:'rgba(245,192,0,0.15)', color:'var(--yellow)', border:'1px solid rgba(245,192,0,0.3)', borderRadius:20, padding:'6px 20px', fontSize:13, fontWeight:600 },
};
