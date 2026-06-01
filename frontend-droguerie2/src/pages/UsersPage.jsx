import { useEffect, useState } from 'react'
import api from '../api/axios'

const emptyForm = { name: '', email: '', password: '', role: 'vendeur', active: true }

export default function UsersPage() {
  const [users, setUsers]         = useState([])
  const [form, setForm]           = useState(emptyForm)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(false)

  useEffect(() => { load() }, [])
  const load = () => api.get('/users').then(r => setUsers(r.data))
  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true) }
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active }); setEditId(u.id); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editId) await api.put(`/users/${editId}`, payload)
      else await api.post('/users', payload)
      setShowModal(false); load()
    } catch (err) { alert(err.response?.data?.message || 'Erreur') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    await api.delete(`/users/${id}`); load()
  }

  return (
    <div>
      <div className="topbar">
        <h5 className="fw-oswald mb-0"><i className="bi bi-person-gear me-2"></i>UTILISATEURS</h5>
        <button className="btn btn-success btn-sm fw-bold" onClick={openNew}>
          <i className="bi bi-person-plus me-1"></i>Nouvel utilisateur
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={5} className="text-center py-4" style={{ color: 'var(--tsk-muted)' }}>Aucun utilisateur</td></tr>}
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: u.role === 'admin' ? 'var(--tsk-yellow)' : '#e8ecf5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Oswald, sans-serif', fontWeight: 700, fontSize: 14,
                          color: u.role === 'admin' ? 'var(--tsk-blue)' : 'var(--tsk-blue-mid)',
                          flexShrink: 0,
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-bold" style={{ color: 'var(--tsk-blue)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--tsk-muted)' }}>{u.email}</td>
                    <td>
                      <span className={'badge ' + (u.role === 'admin' ? 'bg-primary' : 'bg-secondary')}>
                        <i className={'bi me-1 ' + (u.role === 'admin' ? 'bi-shield-fill-check' : 'bi-person-fill')}></i>
                        {u.role === 'admin' ? 'Admin' : 'Vendeur'}
                      </span>
                    </td>
                    <td><span className={'badge ' + (u.active ? 'bg-success' : 'bg-danger')}>{u.active ? 'Actif' : 'Inactif'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" style={{ borderRadius: 6 }} onClick={() => openEdit(u)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 6 }} onClick={() => handleDelete(u.id)}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(13,27,75,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Modifier' : 'Nouvel'} Utilisateur</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label">Nom *</label><input className="form-control" value={form.name} required onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div className="col-12"><label className="form-label">Email *</label><input type="email" className="form-control" value={form.email} required onChange={e => setForm({...form, email: e.target.value})} /></div>
                    <div className="col-12">
                      <label className="form-label">Mot de passe {editId && <span style={{ color: 'var(--tsk-muted)', fontSize: 11 }}>(laisser vide = pas de changement)</span>}</label>
                      <input type="password" className="form-control" value={form.password} required={!editId} minLength={editId ? 0 : 6} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Rôle</label>
                      <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                        <option value="vendeur">Vendeur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Statut</label>
                      <select className="form-select" value={form.active} onChange={e => setForm({...form, active: e.target.value === 'true'})}>
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm me-2"></span>}Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}