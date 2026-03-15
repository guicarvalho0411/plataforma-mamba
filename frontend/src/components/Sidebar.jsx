import { useNavigate, useLocation } from 'react-router-dom';

const menus = [
  { path: '/',           label: 'Dashboard',         icon: '▦' },
  { path: '/chamados',   label: 'Chamados',           icon: '◎' },
  { path: '/salas',      label: 'Salas de Reunião',   icon: '⬡' },
  { path: '/escala',     label: 'Escala Limpeza',     icon: '◈' },
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

  return (
    <div style={s.sidebar}>
      <div>
        <div style={s.logoWrap}>
          <img src="/logo.png" alt="Mamba" style={s.logo} />
          <div style={s.logoSub}>Gestão Interna</div>
        </div>
        <div style={s.userPill}>
          <div style={s.avatar}>{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>{user.role}</div>
          </div>
        </div>
        <div style={s.divider} />
        <nav>
          {menus.map(m => {
            const active = location.pathname === m.path;
            return (
              <div key={m.path} style={active ? s.itemActive : s.item} onClick={() => navigate(m.path)}>
                <span style={active ? s.iconActive : s.icon}>{m.icon}</span>
                <span>{m.label}</span>
                {active && <div style={s.activeDot} />}
              </div>
            );
          })}
        </nav>
      </div>
      <div style={s.footer}>
        <div style={s.divider} />
        <div style={s.sair} onClick={sair}><span style={{ marginRight: 8 }}>⏻</span>Sair</div>
      </div>
    </div>
  );
}

const s = {
  sidebar:    { width: 240, minHeight: '100vh', background: '#1E0A3C', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0 0 16px' },
  logoWrap:   { padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  logo:       { width: 110, display: 'block', marginBottom: 4 },
  logoSub:    { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 },
  userPill:   { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 12px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' },
  avatar:     { width: 32, height: 32, borderRadius: 8, background: '#F5C000', color: '#1E0A3C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName:   { color: '#fff', fontSize: 13, fontWeight: 600 },
  userRole:   { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 },
  divider:    { height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 16px' },
  item:       { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, borderRadius: 8, margin: '2px 8px', position: 'relative' },
  itemActive: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', color: '#fff', background: 'rgba(245,192,0,0.12)', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderRadius: 8, margin: '2px 8px', position: 'relative', borderLeft: '3px solid #F5C000' },
  icon:       { fontSize: 15, width: 18, textAlign: 'center', opacity: 0.5 },
  iconActive: { fontSize: 15, width: 18, textAlign: 'center', color: '#F5C000' },
  activeDot:  { width: 6, height: 6, borderRadius: '50%', background: '#F5C000', marginLeft: 'auto' },
  footer:     {},
  sair:       { display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, margin: '0 8px', borderRadius: 8 },
};
