import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Poppins', sans-serif", backgroundImage: 'url(/A1.jpeg)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>

      {/* NAVBAR */}
      <nav style={{ background: 'linear-gradient(90deg, #0d1b4b 0%, #1a2f6b 100%)', borderBottom: '4px solid #ffb400', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 40 }}>
            <img src="/A2.jpeg" alt="Tassouki" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            {[
              { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', exact: true },
              { to: '/pos', label: 'Vente', icon: 'bi-cart3' },
              { to: '/sales', label: 'Historique', icon: 'bi-receipt' },
              { to: '/clients', label: 'Clients', icon: 'bi-people' },
              ...(isAdmin() ? [
                { to: '/products', label: 'Produits', icon: 'bi-box-seam' },
                { to: '/categories', label: 'Catégories', icon: 'bi-tags' },
                { to: '/users', label: 'Utilisateurs', icon: 'bi-person-gear' },
              ] : []),
            ].map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  background: isActive ? '#ffb400' : 'transparent',
                  color: isActive ? '#0d1b4b' : 'rgba(255,255,255,0.8)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                })}>
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid rgba(255,180,0,0.3)', paddingLeft: 16 }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ background: '#ffb400', color: '#0d1b4b', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ color: '#ffb400', fontSize: 10, textTransform: 'uppercase' }}>{user?.role}</div>
              </div>
            </Link>
            <button onClick={logout} style={{ background: 'rgba(255,180,0,0.15)', border: '1px solid rgba(255,180,0,0.4)', color: '#ffb400', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 16 }}>
              <i className="bi bi-power"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ background: 'rgba(248,249,252,0.35)', minHeight: 'calc(100vh - 68px)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>

    </div>
  );
}
