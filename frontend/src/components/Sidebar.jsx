import { useNavigate, useLocation } from 'react-router-dom';

const menus = [
  { path:'/',                label:'Dashboard',         icon:'▦', desc:'Visão geral' },
  { path:'/chamados',        label:'Chamados',           icon:'◎', desc:'Equipe de limpeza' },
  { path:'/reunioes-cliente',label:'Reuniões Clientes',  icon:'🤝', desc:'Agendamentos' },
  { path:'/salas',           label:'Salas de Reunião',   icon:'⬡', desc:'Reservas' },
  { path:'/estoque',         label:'Estoque',            icon:'📦', desc:'Materiais de limpeza' },
  { path:'/escala',          label:'Escala',             icon:'◈', desc:'Equipe de limpeza' },
  { path:'/lugares',         label:'Lugares',            icon:'🗺', desc:'Em breve', breve:true },
];

const menuGestao = [
  { path:'/admin',  label:'Administração', icon:'⚙', desc:'Usuários e salas' },
  { path:'/perfil', label:'Meu Perfil',    icon:'◉', desc:'Conta e senha' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = JSON.parse(localStorage.getItem('user') || '{}');

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function Item({ m }) {
    const active = location.pathname === m.path;
    return (
      <div style={{ ...(active ? s.itemActive : s.item), ...(m.breve ? s.itemBreve : {}) }}
        onClick={() => !m.breve && navigate(m.path)}>
        {active && <div style={s.activeBar} />}
        <div style={active ? s.iconBoxActive : s.iconBox}>
          <span style={{ fontSize:13 }}>{m.icon}</span>
        </div>
        <div style={s.itemText}>
          <div style={{ ...(active ? s.itemLabelActive : s.itemLabel) }}>
            {m.label}
            {m.breve && <span style={s.brevePill}>Em breve</span>}
          </div>
          <div style={s.itemDesc}>{m.desc}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.sidebar}>
      <div style={{ overflowY:'auto', flex:1 }}>
        <div style={s.logoArea}>
          <img src="/logo.png" alt="Mamba" style={s.logo} />
          <div style={s.logoDivider} />
        </div>
        <div style={s.userBox}>
          <div style={s.avatar}>{user.name?.[0]?.toUpperCase()}</div>
          <div style={s.userInfo}>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>{user.role}</div>
          </div>
          <div style={s.userDot} />
        </div>
        <div style={s.navLabel}>MENU</div>
        <nav style={s.nav}>{menus.map(m => <Item key={m.path} m={m} />)}</nav>
        <div style={s.navLabel}>GESTÃO</div>
        <nav style={s.nav}>{menuGestao.map(m => <Item key={m.path} m={m} />)}</nav>
      </div>
      <div style={s.footer}>
        <div style={s.footerDivider} />
        <div style={s.sair} onClick={sair}><span style={s.sairIcon}>⏻</span>Sair da conta</div>
      </div>
    </div>
  );
}

const s = {
  sidebar:        { width:248, height:'100vh', background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0 },
  logoArea:       { padding:'24px 20px 0' },
  logo:           { width:100, display:'block' },
  logoDivider:    { height:1, background:'var(--border)', marginTop:20 },
  userBox:        { display:'flex', alignItems:'center', gap:10, padding:'14px 16px 8px', margin:'8px 8px 0', background:'rgba(255,255,255,0.03)', borderRadius:12 },
  avatar:         { width:32, height:32, borderRadius:9, background:'linear-gradient(135deg, var(--purple), var(--purple2))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 },
  userInfo:       { flex:1, minWidth:0 },
  userName:       { fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userRole:       { fontSize:10, color:'var(--text3)', marginTop:1, textTransform:'capitalize' },
  userDot:        { width:7, height:7, borderRadius:'50%', background:'#10B981', flexShrink:0 },
  navLabel:       { fontSize:9, fontWeight:600, color:'var(--text3)', letterSpacing:'0.12em', padding:'14px 20px 6px' },
  nav:            { display:'flex', flexDirection:'column', gap:1, padding:'0 8px' },
  item:           { display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, cursor:'pointer', position:'relative' },
  itemActive:     { display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, cursor:'pointer', position:'relative', background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.2)' },
  itemBreve:      { opacity:0.4, cursor:'default' },
  activeBar:      { position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:18, background:'var(--yellow)', borderRadius:'0 3px 3px 0' },
  iconBox:        { width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  iconBoxActive:  { width:28, height:28, borderRadius:7, background:'rgba(124,58,237,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  itemText:       { flex:1 },
  itemLabel:      { fontSize:12, color:'var(--text2)', fontWeight:400, display:'flex', alignItems:'center', gap:6 },
  itemLabelActive:{ fontSize:12, color:'var(--text)', fontWeight:600, display:'flex', alignItems:'center', gap:6 },
  itemDesc:       { fontSize:10, color:'var(--text3)', marginTop:1 },
  brevePill:      { fontSize:9, background:'rgba(245,192,0,0.15)', color:'var(--yellow)', borderRadius:4, padding:'1px 6px', fontWeight:600 },
  footer:         {},
  footerDivider:  { height:1, background:'var(--border)', margin:'0 16px 8px' },
  sair:           { display:'flex', alignItems:'center', gap:10, padding:'10px 20px', cursor:'pointer', margin:'0 8px 8px', color:'var(--text3)', fontSize:12 },
  sairIcon:       { fontSize:14 },
};
