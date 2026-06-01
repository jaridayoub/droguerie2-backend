import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; 

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [totalCreditRestant, setTotalCreditRestant] = useState(null);
  const [topVendeur, setTopVendeur] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
    api.get('/clients').then(res => {
      const total = res.data.filter(c => (+c.credit_used) > 0).reduce((s, c) => s + (+c.credit_used), 0);
      setTotalCreditRestant(total);
    });
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    api.get('/sales', { params: { per_page: 2000 } }).then(res => {
      const sales = res.data.data || res.data || []
      const thisMonth = sales.filter(s => s.created_at?.startsWith(firstDay.slice(0, 7)))
      const grouped = {}
      thisMonth.forEach(s => {
        const uid = s.user_id || s.user?.id
        if (!uid) return
        if (!grouped[uid]) grouped[uid] = { name: s.user?.name || `Vendeur #${uid}`, total: 0, count: 0 }
        grouped[uid].total += (+s.total || 0)
        grouped[uid].count++
      })
      const sorted = Object.values(grouped).sort((a, b) => b.total - a.total)
      if (sorted.length > 0) setTopVendeur(sorted[0])
    }).catch(() => {})
  }, []);

  const openModal = async (type) => {
    setModal(type); setModalLoading(true); setModalData([]);
    try {
      if (type === 'sales') {
        const res = await api.get('/sales', { params: { date: new Date().toISOString().slice(0,10), per_page: 100 } });
        setModalData(res.data.data || res.data);
      } else if (type === 'credits') {
        const res = await api.get('/clients', { params: { has_credit: 1 } });
        setModalData(res.data.filter(c => (+c.credit_used) > 0));
      } else if (type === 'stock') {
        const res = await api.get('/products', { params: { low_stock: 1 } });
        setModalData(res.data.filter(p => p.low_stock || p.stock <= p.stock_alert));
      }
    } finally { setModalLoading(false); }
  };

  if (loading || !data) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-warning" role="status"></div>
    </div>
  );

  return (
    <div className="animate__animated animate__fadeIn px-3">
      {/* ══════ HEADER ══════ */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-oswald text-uppercase mb-0" style={{ color: '#0d1b4b' }}>Tableau de Bord</h3>
          <p className="text-muted small">Session: {isAdmin() ? 'Administrateur' : 'Vendeur'}</p>
        </div>
        
        {/* L-Vendeur */}
        <Link to="/pos" className="btn btn-warning fw-bold px-4 shadow-sm">
          <i className="bi bi-cart-plus me-2"></i>NOUVELLE VENTE
        </Link>
      </div>

      {/* ══════ QUICK ACTIONS  ══════ */}
      {isAdmin() && (
        <div className="row g-3 mb-5">
          <div className="col-md-12">
            <h6 className="fw-bold text-muted mb-3 small text-uppercase ls-1">Actions de Gestion (Admin Uniquement)</h6>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/products" className="btn btn-white shadow-sm border-0 py-2 px-3 rounded-3 bg-white text-dark fw-bold small">
                <i className="bi bi-plus-circle-fill text-primary me-2"></i>Ajouter Produit
              </Link>
              <Link to="/clients" className="btn btn-white shadow-sm border-0 py-2 px-3 rounded-3 bg-white text-dark fw-bold small">
                <i className="bi bi-plus-circle-fill text-success me-2"></i>Ajouter Client
              </Link>
              <Link to="/categories" className="btn btn-white shadow-sm border-0 py-2 px-3 rounded-3 bg-white text-dark fw-bold small">
                <i className="bi bi-plus-circle-fill text-warning me-2"></i>Gérer Catégories
              </Link>
              <Link to="/users" className="btn btn-white shadow-sm border-0 py-2 px-3 rounded-3 bg-white text-dark fw-bold small">
                <i className="bi bi-person-plus-fill text-danger me-2"></i>Gérer Rôles
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/*STATS CARDS  */}
      <div className="row g-4 mb-4">
        <div className="col-md-3" style={{ cursor: 'pointer' }} onClick={() => openModal('sales')}>
          <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-4 hover-card">
            <div className="mb-2"><i className="bi bi-cash-stack text-primary fs-1"></i></div>
            <div className="text-muted small fw-bold">VENTES JOUR</div>
            <div className="h4 fw-bold fw-oswald">{(+data.today_sales).toFixed(2)} DH</div>
            <small className="text-muted" style={{ fontSize: 10 }}><i className="bi bi-eye me-1"></i>Voir détails</small>
          </div>
        </div>

          <div className="col-md-3" style={{ cursor: 'pointer' }} onClick={() => openModal('credits')}>
            <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-4">
              <div className="mb-2"><i className="bi bi-hourglass-split text-danger fs-1"></i></div>
              <div className="text-muted small fw-bold">CRÉDITS TOTAL</div>
              <div className="h4 fw-bold fw-oswald text-danger">{totalCreditRestant !== null ? totalCreditRestant.toFixed(2) : '...'} DH</div>
              <small className="text-muted" style={{ fontSize: 10 }}><i className="bi bi-eye me-1"></i>Voir clients</small>
            </div>
          </div>
        

        <div className="col-md-3" style={{ cursor: 'pointer' }} onClick={() => openModal('stock')}>
          <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-4">
            <div className="mb-2"><i className="bi bi-box-seam text-warning fs-1"></i></div>
            <div className="text-muted small fw-bold">STOCK FAIBLE</div>
            <div className="h4 fw-bold fw-oswald">{data.low_stock}</div>
            <small className="text-muted" style={{ fontSize: 10 }}><i className="bi bi-eye me-1"></i>Voir produits</small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-4" style={{
            background: topVendeur ? 'linear-gradient(135deg, #0d1b4b, #1a2f6b)' : '#fff'
          }}>
            <div className="mb-2"><i className="bi bi-trophy-fill" style={{ fontSize: '2rem', color: topVendeur ? '#ffb400' : '#94a3b8' }}></i></div>
            <div className="small fw-bold" style={{ color: topVendeur ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>VENDEUR DU MOIS</div>
            {topVendeur ? (
              <>
                <div className="h5 fw-bold mt-1 mb-0" style={{ color: '#ffb400', fontFamily: 'Oswald, sans-serif' }}>{topVendeur.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>{topVendeur.total.toFixed(2)} DH</div>
              </>
            ) : (
              <div className="h5 fw-bold fw-oswald mt-1 mb-0" style={{ color: '#94a3b8' }}>—</div>
            )}
          </div>
        </div>

      </div>

      {/* ══════ RECENT ACTIVITY ══════ */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3">
          <h6 className="fw-bold mb-0 text-uppercase small">Dernières Ventes</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="small text-muted">
                  <th className="ps-4">FACTURE</th>
                  <th>CLIENT</th>
                  <th>TOTAL</th>
                  <th>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sales?.slice(0, 5).map(sale => (
                  <tr key={sale.id} className="small">
                    <td className="ps-4 fw-bold">{sale.invoice_number}</td>
                    <td>{sale.client?.name || 'Passager'}</td>
                    <td className="fw-bold text-primary">{(+sale.total).toFixed(2)} DH</td>
                    <td>
                      <span className={`badge rounded-pill ${sale.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                        {sale.status === 'completed' ? 'Payé' : 'Crédit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ══════ MODALS ══════ */}
      {modal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(13,27,75,0.6)' }} onClick={() => setModal(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-oswald">
                  {modal === 'sales' && <><i className="bi bi-cash-stack me-2 text-primary"></i>Ventes du Jour</>}
                  {modal === 'credits' && <><i className="bi bi-hourglass-split me-2 text-danger"></i>Clients avec Crédit</>}
                  {modal === 'stock' && <><i className="bi bi-box-seam me-2 text-warning"></i>Produits Stock Faible</>}
                </h5>
                <button className="btn-close" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body">
                {modalLoading && <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>}

                {/* VENTES DU JOUR */}
                {!modalLoading && modal === 'sales' && (
                  modalData.length === 0
                    ? <p className="text-center text-muted py-3">Aucune vente aujourd'hui</p>
                    : <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light"><tr className="small text-muted">
                          <th>Facture</th><th>Client</th><th>Total</th><th>Statut</th><th>Heure</th>
                        </tr></thead>
                        <tbody>
                          {modalData.map(s => (
                            <tr key={s.id} className="small">
                              <td className="fw-bold">{s.invoice_number}</td>
                              <td>{s.client?.name || 'Passager'}</td>
                              <td className="fw-bold text-primary">{(+s.total).toFixed(2)} DH</td>
                              <td><span className={`badge rounded-pill ${s.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{s.status === 'completed' ? 'Payé' : 'Crédit'}</span></td>
                              <td className="text-muted">{new Date(s.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-light">
                          <tr><td colSpan={2} className="fw-bold">Total</td>
                            <td className="fw-bold text-primary">{modalData.reduce((s, v) => s + (+v.total), 0).toFixed(2)} DH</td>
                            <td colSpan={2}></td></tr>
                        </tfoot>
                      </table>
                )}

                {/* CLIENTS CRÉDIT */}
                {!modalLoading && modal === 'credits' && (
                  modalData.length === 0
                    ? <p className="text-center text-muted py-3">Aucun crédit en cours</p>
                    : <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light"><tr className="small text-muted">
                          <th>Client</th><th>Téléphone</th><th>Crédit restant</th><th>Plafond</th>
                        </tr></thead>
                        <tbody>
                          {modalData.map(c => (
                            <tr key={c.id} className="small" style={{ cursor: 'pointer' }} onClick={() => { setModal(null); navigate('/clients'); }}>
                              <td className="fw-bold" style={{ color: 'var(--tsk-blue)' }}>{c.name}</td>
                              <td>{c.phone || '—'}</td>
                              <td><span className="badge bg-warning fw-oswald">{(+c.credit_used).toFixed(2)} DH</span></td>
                              <td className="text-muted">{(+c.credit_limit) > 0 ? `${(+c.credit_limit).toFixed(2)} DH` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-light">
                          <tr>
                            <td colSpan={2} className="fw-bold">Total restant</td>
                            <td><span className="badge bg-danger fw-oswald fs-6">{modalData.reduce((s, c) => s + (+c.credit_used), 0).toFixed(2)} DH</span></td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                )}

                {/* STOCK FAIBLE */}
                {!modalLoading && modal === 'stock' && (
                  modalData.length === 0
                    ? <p className="text-center text-muted py-3">Aucun produit en stock faible</p>
                    : <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light"><tr className="small text-muted">
                          <th>Produit</th><th>Catégorie</th><th>Stock</th><th>Seuil</th>
                        </tr></thead>
                        <tbody>
                          {modalData.map(p => (
                            <tr key={p.id} className="small" style={{ cursor: 'pointer' }} onClick={() => { setModal(null); navigate(`/products`); }}>
                              <td className="fw-bold" style={{ color: 'var(--tsk-blue)' }}>{p.name}</td>
                              <td><span className="badge bg-light text-dark border">{p.category?.name || '—'}</span></td>
                              <td><span className="badge bg-danger">{p.stock} unités</span></td>
                              <td className="text-muted">{p.stock_alert}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}