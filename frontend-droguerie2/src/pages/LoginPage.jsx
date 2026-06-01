import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(() => localStorage.getItem('loginError') || '')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      localStorage.removeItem('loginError')
      navigate('/')
    } catch (err) {
      const msg = 'Email ou mot de passe incorrect'
      localStorage.setItem('loginError', msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #16213e 0%, #0a0f1d 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <img src="/A2.jpeg" alt="Tassouki" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '12px' }} />
          <h1 style={{ color: '#0d1b4b', fontWeight: '900', fontSize: '2.2rem', margin: 0 }}>TASSOUKI</h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '2px' }}>DROGUERIE — GESTION</p>
        </div>

        {error && <div className="alert alert-danger py-2 mb-3 small" style={{ borderRadius: '10px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="mb-3">
            <label className="fw-bold small mb-1" style={{ color: '#334155' }}>EMAIL</label>
            <input
              type="email"
              className="form-control shadow-none"
              style={{ background: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '10px' }}
              placeholder="admin@tassouki.ma"
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="mb-4" style={{ position: 'relative' }}>
            <label className="fw-bold small mb-1" style={{ color: '#334155' }}>MOT DE PASSE</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control shadow-none"
              style={{ background: '#f1f5f9', border: 'none', padding: '12px 40px 12px 12px', borderRadius: '10px' }}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '10px',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '1.2rem'
              }}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </span>
          </div>

          <button 
            type="submit" 
            className="btn w-100 py-3 fw-bold shadow-sm" 
            style={{ 
              background: '#ffb400', 
              color: '#0d1b4b', 
              borderRadius: '12px', 
              border: 'none',
              transition: '0.3s'
            }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              'SE CONNECTER'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
