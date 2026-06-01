import { useEffect, useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import TicketPrint from '../components/TicketPrint'

export default function SalesPage() {
  const { isAdmin } = useAuth()
  const [sales, setSales]       = useState([])
  const [meta, setMeta]         = useState({})
  const [page, setPage]         = useState(1)
  const [status, setStatus]     = useState('')
  const [date, setDate]         = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [printSale, setPrintSale] = useState(null)

  const printRef = useRef()
  const handlePrint = useReactToPrint({ contentRef: printRef })

  useEffect(() => { load() }, [page, status, date])

  const load = () => {
    setLoading(true)
    api.get('/sales', { params: { page, status: status || undefined, date: date || undefined } })
      .then(r => { setSales(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Annuler cette vente ?')) return
    await api.post(`/sales/${id}/cancel`); load()
    if (selected?.id === id) setSelected(null)
  }

  const openDetail = async (sale) => {
    const res = await api.get(`/sales/${sale.id}`)
    setSelected(res.data)
  }

  const handleDownload = async (sale, e) => {
    e.stopPropagation()
    const res = await api.get(`/sales/${sale.id}`)
    setPrintSale({ ...res.data, subtotal: +res.data.subtotal, remise: +res.data.remise, total: +res.data.total, credit: +res.data.credit, paid: +res.data.paid })
    setTimeout(() => handlePrint(), 300)
  }

  return (
    <div>
      <div style={{ display: 'none' }}><TicketPrint ref={printRef} sale={printSale} /></div>

      <div className="topbar">
        <h5 className="fw-oswald mb-0"><i className="bi bi-receipt me-2"></i>HISTORIQUE DES VENTES</h5>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
                <option value="">Tous les statuts</option>
                <option value="completed">Payé</option>
                <option value="credit">Crédit</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div className="col-md-4">
              <input type="date" className="form-control form-control-sm" value={date} onChange={e => { setDate(e.target.value); setPage(1) }} />
            </div>
            <div className="col-md-4">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setStatus(''); setDate(''); setPage(1) }}>
                <i className="bi bi-x-circle me-1"></i>Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className={selected ? 'col-lg-7' : 'col-12'}>
          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr><th>Facture</th><th>Client</th><th>Total</th><th>Payé</th><th>Crédit</th><th>Statut</th><th>Date</th><th></th></tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={8} className="text-center py-4"><span className="spinner-border spinner-border-sm" style={{ color: 'var(--tsk-yellow)' }}></span></td></tr>}
                    {!loading && sales.length === 0 && <tr><td colSpan={8} className="text-center py-4" style={{ color: 'var(--tsk-muted)' }}>Aucune vente</td></tr>}
                    {sales.map(s => (
                      <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(s)}>
                        <td><span className="invoice-number">{s.invoice_number}</span></td>
                        <td style={{ fontSize: 13 }}>{s.client?.name || <span style={{ color: 'var(--tsk-muted)' }}>—</span>}</td>
                        <td><span className="fw-oswald fw-bold" style={{ color: 'var(--tsk-blue)' }}>{(+s.total).toFixed(2)} DH</span></td>
                        <td style={{ fontSize: 13 }}>{(+s.paid).toFixed(2)} DH</td>
                        <td>
                          {(+s.credit) > 0
                            ? <span className="badge bg-warning">{(+s.credit).toFixed(2)} DH</span>
                            : <span style={{ color: 'var(--tsk-muted)' }}>—</span>
                          }
                        </td>
                        <td>
                          <span className={'badge ' + (s.status === 'completed' ? 'bg-success' : s.status === 'credit' ? 'bg-warning' : 'bg-danger')}>
                            {s.status === 'completed' ? 'Payé' : s.status === 'credit' ? 'Crédit' : 'Annulé'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--tsk-muted)' }}>{new Date(s.created_at).toLocaleDateString('fr-MA')}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <button className="btn btn-sm btn-outline-primary me-1" style={{ borderRadius: 6 }} onClick={(e) => handleDownload(s, e)} title="Télécharger facture">
                            <i className="bi bi-download"></i>
                          </button>
                          {isAdmin() && s.status !== 'cancelled' && (
                            <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 6 }} onClick={() => handleCancel(s.id)}>
                              <i className="bi bi-x-circle"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta.last_page > 1 && (
                <div className="d-flex justify-content-center gap-2 py-3">
                  <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}><i className="bi bi-chevron-left"></i></button>
                  <span className="btn btn-sm btn-success disabled fw-oswald">{page} / {meta.last_page}</span>
                  <button className="btn btn-sm btn-outline-secondary" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}><i className="bi bi-chevron-right"></i></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {selected && (
          <div className="col-lg-5">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center py-2">
                <span className="invoice-number fw-oswald" style={{ fontSize: 15 }}>{selected.invoice_number}</span>
                <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6 }} onClick={() => setSelected(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="card-body" style={{ fontSize: 13 }}>
                <div className="row g-2 mb-3">
                  <div className="col-6"><div style={{ color: 'var(--tsk-muted)', fontSize: 11 }}>Client</div><div className="fw-bold">{selected.client?.name || '—'}</div></div>
                  <div className="col-6"><div style={{ color: 'var(--tsk-muted)', fontSize: 11 }}>Vendeur</div><div className="fw-bold">{selected.user?.name}</div></div>
                  <div className="col-12"><div style={{ color: 'var(--tsk-muted)', fontSize: 11 }}>Date</div><div className="fw-bold">{new Date(selected.created_at).toLocaleString('fr-MA')}</div></div>
                </div>

                <table className="table table-sm mb-3">
                  <thead><tr><th>Produit</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead>
                  <tbody>
                    {selected.items?.map((item, i) => (
                      <tr key={i}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{(+item.price).toFixed(2)}</td>
                        <td className="fw-bold">{(+item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="rounded p-2" style={{ background: 'var(--tsk-blue)', borderRadius: 10 }}>
                  <div className="d-flex justify-content-between mb-1" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    <span>Sous-total</span><span>{(+selected.subtotal).toFixed(2)} DH</span>
                  </div>
                  {(+selected.remise) > 0 && (
                    <div className="d-flex justify-content-between mb-1" style={{ color: '#ff9999', fontSize: 12 }}>
                      <span>Remise</span><span>−{(+selected.remise).toFixed(2)} DH</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 6 }}>
                    <span className="fw-oswald fw-bold" style={{ color: '#fff' }}>Total</span>
                    <span className="fw-oswald fw-bold" style={{ color: 'var(--tsk-yellow)', fontSize: 16 }}>{(+selected.total).toFixed(2)} DH</span>
                  </div>
                  <div className="d-flex justify-content-between mt-1" style={{ fontSize: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Payé</span>
                    <span style={{ color: '#90ee90' }}>{(+selected.paid).toFixed(2)} DH</span>
                  </div>
                  {(+selected.credit) > 0 && (
                    <div className="d-flex justify-content-between" style={{ fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Crédit</span>
                      <span style={{ color: 'var(--tsk-yellow)' }}>{(+selected.credit).toFixed(2)} DH</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
