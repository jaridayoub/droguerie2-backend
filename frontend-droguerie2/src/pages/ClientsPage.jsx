import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const emptyForm = { name: '', phone: '', email: '', address: '', credit_limit: 0 }

export default function ClientsPage() {
  const [clients, setClients]       = useState([])
  const [form, setForm]             = useState(emptyForm)
  const [editId, setEditId]         = useState(null)
  const [showModal, setShowModal]   = useState(false)
  const [showCredit, setShowCredit] = useState(false)
  const [selected, setSelected]     = useState(null)
  const [history, setHistory]       = useState(null)
  const [payAmount, setPayAmount]   = useState('')
  const [payNotes, setPayNotes]     = useState('')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(false)
  const { isAdmin } = useAuth()

  useEffect(() => { load() }, [search])
  const load = () => api.get('/clients', { params: { search: search || undefined } }).then(r => setClients(r.data))
  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true) }
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', credit_limit: c.credit_limit }); setEditId(c.id); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (editId) await api.put(`/clients/${editId}`, form)
      else await api.post('/clients', form)
      setShowModal(false); load()
    } catch (err) { alert(err.response?.data?.message || 'Erreur') }
    finally { setLoading(false) }
  }

  const handleDelete = async (c) => {
    const hasCredit = (+c.credit_used) > 0
    const msg = hasCredit
      ? `⚠️ Ce client a un crédit en cours de ${(+c.credit_used).toFixed(2)} DH !\n\nVoulez-vous quand même le supprimer ?`
      : `Supprimer le client "${c.name}" ?`
    if (!window.confirm(msg)) return
    try {
      await api.delete(`/clients/${c.id}`); load()
    } catch (err) { alert(err.response?.data?.message || 'Erreur lors de la suppression') }
  }

  const openCreditModal = async (client) => {
    setSelected(client); setPayAmount(''); setPayNotes('')
    const res = await api.get(`/clients/${client.id}/credit-history`)
    setHistory(res.data); setShowCredit(true)
  }

  const handlePayCredit = async () => {
    if (!payAmount || +payAmount <= 0) return alert('Montant invalide')
    setLoading(true)
    try {
      await api.post(`/clients/${selected.id}/pay-credit`, { amount: +payAmount, notes: payNotes })
      const res = await api.get(`/clients/${selected.id}/credit-history`)
      setHistory(res.data); setSelected(res.data.client); setPayAmount(''); load()
    } catch (err) { alert(err.response?.data?.message || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="topbar">
        <h5 className="fw-oswald mb-0"><i className="bi bi-people me-2"></i>CLIENTS</h5>
        <button className="btn btn-success btn-sm fw-bold" onClick={openNew}>
          <i className="bi bi-person-plus me-1"></i>Nouveau client
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <input className="form-control mb-3" placeholder="Rechercher par nom ou téléphone..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr><th>Nom</th><th>Téléphone</th><th>Email</th><th>Crédit en cours</th><th>Plafond</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {clients.length === 0 && <tr><td colSpan={6} className="text-center py-4" style={{ color: 'var(--tsk-muted)' }}>Aucun client</td></tr>}
                {clients.map(c => (
                  <tr key={c.id}>
                    <td><span className="fw-bold" style={{ color: 'var(--tsk-blue)' }}>{c.name}</span></td>
                    <td style={{ fontSize: 13 }}>{c.phone || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--tsk-muted)' }}>{c.email || '—'}</td>
                    <td>
                      {(+c.credit_used) > 0
                        ? <span className="badge bg-warning fw-oswald">{(+c.credit_used).toFixed(2)} DH</span>
                        : <span className="badge bg-success">Soldé</span>
                      }
                    </td>
                    <td style={{ fontSize: 13 }}>{(+c.credit_limit) > 0 ? `${(+c.credit_limit).toFixed(2)} DH` : '—'}</td>
                    <td>
                      <button className="btn btn-sm fw-bold me-1" style={{ background: 'var(--tsk-yellow-soft)', color: 'var(--tsk-blue)', borderRadius: 6, fontSize: 12 }} onClick={() => openCreditModal(c)}>
                        <i className="bi bi-credit-card me-1"></i>Crédit
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-1" style={{ borderRadius: 6 }} onClick={() => openEdit(c)}><i className="bi bi-pencil"></i></button>
                      {isAdmin() && (
                        <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 6 }} onClick={() => handleDelete(c)}><i className="bi bi-trash"></i></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(13,27,75,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Modifier' : 'Nouveau'} Client</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label">Nom *</label><input className="form-control" value={form.name} required onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div className="col-6"><label className="form-label">Téléphone</label><input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                    <div className="col-6"><label className="form-label">Email</label><input type="email" className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                    <div className="col-12"><label className="form-label">Adresse</label><textarea className="form-control" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})}></textarea></div>
                    <div className="col-12"><label className="form-label">Plafond crédit (DH)</label><input type="number" min="0" className="form-control" value={form.credit_limit} onChange={e => setForm({...form, credit_limit: e.target.value})} /></div>
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

      {/* Modal Crédit */}
      {showCredit && selected && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(13,27,75,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-credit-card me-2"></i>Crédit — {selected.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCredit(false)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center p-3 rounded mb-3"
                  style={{ background: 'var(--tsk-blue)', borderRadius: 10 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Crédit en cours</div>
                    <div className="fw-oswald fw-bold" style={{ color: 'var(--tsk-yellow)', fontSize: 22 }}>
                      {(+selected.credit_used).toFixed(2)} DH
                    </div>
                  </div>
                  {(+selected.credit_limit) > 0 && (
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right' }}>
                      Plafond<br /><strong style={{ color: '#fff' }}>{(+selected.credit_limit).toFixed(2)} DH</strong>
                    </div>
                  )}
                </div>

                {(+selected.credit_used) > 0 && (
                  <div className="card mb-3" style={{ border: '2px solid var(--tsk-yellow)' }}>
                    <div className="card-header fw-oswald fw-bold" style={{ background: 'var(--tsk-yellow)', color: 'var(--tsk-blue)' }}>
                      <i className="bi bi-cash me-2"></i>Enregistrer un paiement
                    </div>
                    <div className="card-body">
                      <div className="row g-2 align-items-end">
                        <div className="col-md-5"><label className="form-label small">Montant (DH) *</label><input type="number" className="form-control form-control-sm" value={payAmount} min={0.01} max={selected.credit_used} step={0.01} onChange={e => setPayAmount(e.target.value)} /></div>
                        <div className="col-md-5"><label className="form-label small">Notes</label><input type="text" className="form-control form-control-sm" value={payNotes} onChange={e => setPayNotes(e.target.value)} /></div>
                        <div className="col-md-2">
                          <button className="btn btn-success btn-sm w-100 fw-bold" onClick={handlePayCredit} disabled={loading}>
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check2"></i> OK</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {history && (
                  <>
                    <h6 className="fw-oswald mb-2" style={{ color: 'var(--tsk-blue)' }}>Paiements effectués</h6>
                    {history.payments.length === 0
                      ? <p style={{ color: 'var(--tsk-muted)', fontSize: 13 }}>Aucun paiement enregistré</p>
                      : <table className="table table-sm mb-3"><thead><tr><th>Date</th><th>Montant</th><th>Par</th><th>Notes</th></tr></thead>
                          <tbody>{history.payments.map(p => (
                            <tr key={p.id}>
                              <td style={{ fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('fr-MA')}</td>
                              <td><span className="badge bg-success fw-oswald">+{(+p.amount).toFixed(2)} DH</span></td>
                              <td style={{ fontSize: 12 }}>{p.user?.name}</td>
                              <td style={{ fontSize: 12, color: 'var(--tsk-muted)' }}>{p.notes || '—'}</td>
                            </tr>
                          ))}</tbody></table>
                    }
                    <h6 className="fw-oswald mb-2" style={{ color: 'var(--tsk-blue)' }}>Ventes à crédit</h6>
                    {history.credits.length === 0
                      ? <p style={{ color: 'var(--tsk-muted)', fontSize: 13 }}>Aucune vente à crédit</p>
                      : <table className="table table-sm"><thead><tr><th>Facture</th><th>Total</th><th>Payé</th><th>Restant</th><th>Date</th></tr></thead>
                          <tbody>{history.credits.map(s => (
                            <tr key={s.id}>
                              <td className="invoice-number" style={{ fontSize: 12 }}>{s.invoice_number}</td>
                              <td style={{ fontSize: 12 }}>{(+s.total).toFixed(2)} DH</td>
                              <td style={{ fontSize: 12, color: 'var(--tsk-muted)' }}>{(+s.paid).toFixed(2)} DH</td>
                              <td><span className="badge bg-warning">{(+s.credit).toFixed(2)} DH</span></td>
                              <td style={{ fontSize: 12, color: 'var(--tsk-muted)' }}>{new Date(s.created_at).toLocaleDateString('fr-MA')}</td>
                            </tr>
                          ))}</tbody></table>
                    }
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}