import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function ProfilePage() {
  const { user } = useAuth()
  const [salesCount, setSalesCount] = useState(null)
  const [salesTotal, setSalesTotal] = useState(0)

  useEffect(() => {
    if (!user) return
    api.get('/sales', { params: { per_page: 1000 } }).then(res => {
      const userSales = res.data.data?.filter(s => s.user_id === user.id || s.user?.id === user.id) || []
      setSalesCount(userSales.length)
      setSalesTotal(userSales.reduce((sum, s) => sum + (+s.total || 0), 0))
    }).catch(() => {})
  }, [user])

  if (!user) return null

  return (
    <div>
      <div className="topbar">
        <h5 className="fw-oswald mb-0"><i className="bi bi-person-circle me-2"></i>MON PROFIL</h5>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body p-4 text-center">
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: '#ffb400', color: '#0d1b4b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 32, margin: '0 auto 16px',
                fontFamily: 'Oswald, sans-serif'
              }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <h4 className="fw-bold mb-1" style={{ color: 'var(--tsk-blue)' }}>{user.name}</h4>
              <span className={`badge ${user.role === 'admin' ? 'bg-primary' : 'bg-secondary'} mb-3`}>
                {user.role === 'admin' ? 'Administrateur' : 'Vendeur'}
              </span>

              <hr />

              <div className="text-start">
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Email</small>
                  <p className="mb-0 fw-semibold" style={{ color: 'var(--tsk-blue)' }}>{user.email}</p>
                </div>
                {user.phone && (
                  <div className="mb-3">
                    <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Téléphone</small>
                    <p className="mb-0 fw-semibold" style={{ color: 'var(--tsk-blue)' }}>{user.phone}</p>
                  </div>
                )}
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Statut</small>
                  <p className="mb-0 fw-semibold" style={{ color: 'var(--tsk-blue)' }}>
                    <span className={`badge ${user.active !== false ? 'bg-success' : 'bg-danger'}`}>
                      {user.active !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                </div>
                <hr />
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Ventes réalisées</small>
                  <p className="mb-0 fw-semibold" style={{ color: 'var(--tsk-blue)', fontSize: 22 }}>
                    {salesCount !== null ? salesCount : <span className="spinner-border spinner-border-sm"></span>}
                  </p>
                </div>
                <div>
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Montant total des ventes</small>
                  <p className="mb-0 fw-semibold" style={{ color: 'var(--tsk-blue)', fontSize: 18 }}>
                    {salesCount !== null ? `${salesTotal.toFixed(2)} DH` : <span className="spinner-border spinner-border-sm"></span>}
                  </p>
                </div>
                {user.created_at && (
                  <div className="mt-3">
                    <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Membre depuis</small>
                    <p className="mb-0 fw-semibold" style={{ color: 'var(--tsk-blue)' }}>
                      {new Date(user.created_at).toLocaleDateString('fr-MA')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
