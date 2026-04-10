import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';

function WhatsAppBanner() {
  const [desconectado, setDesconectado] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  if (user?.role !== 'admin') return null;

  useEffect(() => {
    async function checar() {
      try {
        const { data } = await api.get('/whatsapp/status');
        setDesconectado(!data.connected);
      } catch { setDesconectado(false); }
    }
    checar();
    const interval = setInterval(checar, 60000); // verifica a cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  if (!desconectado) return null;

  const qrUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/whatsapp/qrcode`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(4px)',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'Sora,sans-serif' }}>
        ⚠️ WhatsApp desconectado — notificações pausadas
      </span>
      <a
        href={qrUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          background: '#fff', color: '#EF4444', borderRadius: 8,
          padding: '4px 12px', fontSize: 12, fontWeight: 700,
          fontFamily: 'Sora,sans-serif', textDecoration: 'none',
        }}
      >
        Reconectar
      </a>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <WhatsAppBanner />
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
