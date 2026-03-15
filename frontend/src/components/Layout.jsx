import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F1FA', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
