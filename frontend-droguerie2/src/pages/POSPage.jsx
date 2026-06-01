import { useEffect, useState, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import api from '../api/axios'
import TicketPrint from '../components/TicketPrint'

export default function POSPage() {
  const [products, setProducts]       = useState([])
  const [categories, setCategories]   = useState([])
  const [clients, setClients]         = useState([])
  const [search, setSearch]           = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [cart, setCart]               = useState([])
  const [clientId, setClientId]       = useState('')
  const [remiseType, setRemiseType]   = useState('percent')
  const [remiseValue, setRemiseValue] = useState('')
  const [paid, setPaid]               = useState('')
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [lastSale, setLastSale]       = useState(null)
  const [alert, setAlert]             = useState(null)

  const searchRef = useRef()
  const printRef  = useRef()
  const handlePrint = useReactToPrint({ contentRef: printRef })

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data))
    api.get('/clients').then(r => setClients(r.data))
  }, [])

  useEffect(() => {
    const t = setTimeout(loadProducts, 280)
    return () => clearTimeout(t)
  }, [search, catFilter])

  const loadProducts = () => {
    api.get('/products', { params: { search: search || undefined, category_id: catFilter || undefined } })
      .then(r => setProducts(r.data))
  }

  const addToCart = useCallback((product) => {
    if (product.stock === 0) return
    setCart(prev => {
      const found = prev.find(i => i.id === product.id)
      if (found) {
        if (found.qty >= product.stock) return prev
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1, customPrice: '' }]
    })
  }, [])

  const updateQty = (id, qty) => {
    const num = parseInt(qty, 10)
    if (!num || num < 1) return removeItem(id)
    setCart(prev => prev.map(i => i.id !== id ? i : { ...i, qty: Math.min(num, i.stock) }))
  }

  const updateCustomPrice = (id, val) => {
    setCart(prev => prev.map(i => i.id !== id ? i : { ...i, customPrice: val }))
  }

  const getPrice = (item) => {
    const cp = parseFloat(item.customPrice)
    return cp > 0 ? cp : +item.price
  }

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => { setCart([]); setClientId(''); setRemiseValue(''); setPaid(''); setNotes('') }

  const subtotal  = cart.reduce((s, i) => s + getPrice(i) * i.qty, 0)
  const remiseNum = parseFloat(remiseValue) || 0
  const remise    = remiseType === 'percent' ? subtotal * remiseNum / 100 : Math.min(remiseNum, subtotal)
  const total     = Math.max(0, subtotal - remise)
  const paidNum   = parseFloat(paid) || 0
  const credit    = Math.max(0, total - paidNum)
  const monnaie   = paidNum > total ? paidNum - total : 0

  const validateSale = async () => {
    if (cart.length === 0) return showAlert('Le panier est vide !', 'warning')
    if (credit > 0 && !clientId) return showAlert('Sélectionnez un client pour une vente à crédit', 'warning')
    setLoading(true)
    try {
      const res = await api.post('/sales', {
        client_id: clientId || null,
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty, custom_price: getPrice(i) !== +i.price ? getPrice(i) : undefined })),
        remise_percent: remiseType === 'percent' ? remiseNum : 0,
        remise:         remiseType === 'fixed'   ? remiseNum : 0,
        paid: paidNum || total,
        payment_method: credit > 0 ? (paidNum > 0 ? 'mixed' : 'credit') : 'cash',
        notes: notes || undefined,
      })
      setLastSale({ ...res.data, subtotal, remise, total, credit, paid: paidNum || total })
      clearCart()
      showAlert('Vente validée avec succès !', 'success')
      setTimeout(() => handlePrint(), 400)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erreur lors de la vente', 'danger')
    } finally { setLoading(false) }
  }

  const showAlert = (msg, type) => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 4000)
  }

  return (
    <div>
      <div style={{ display: 'none' }}><TicketPrint ref={printRef} sale={lastSale} /></div>

      <div className="topbar">
        <h5 className="fw-oswald mb-0">
          <i className="bi bi-cart3 me-2"></i>POINT DE VENTE
        </h5>
        {lastSale && (
          <button className="btn btn-sm fw-bold no-print"
            style={{ background: 'var(--tsk-yellow-soft)', color: 'var(--tsk-blue)', borderRadius: 7 }}
            onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i>Ré-imprimer
          </button>
        )}
      </div>

      {alert && (
        <div className={'alert alert-' + alert.type + ' alert-dismissible py-2 mb-3 no-print d-flex align-items-center gap-2'}
          style={{ borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
          <i className={'bi ' + (alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill')}></i>
          {alert.msg}
          <button type="button" className="btn-close ms-auto" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="row g-3">

        {/* ══ LEFT: Products ══ */}
        <div className="col-lg-7">
          <div className="card mb-3">
            <div className="card-body py-2 px-3">
              <div className="row g-2">
                <div className="col-8">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input
                      ref={searchRef}
                      type="text"
                      className="form-control"
                      placeholder="Recherche: nom ou code-barres..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                    />
                    {search && (
                      <button className="btn btn-outline-secondary"
                        onClick={() => { setSearch(''); searchRef.current?.focus() }}>
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-4">
                  <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option value="">Toutes catégories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-2" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
            {products.length === 0 && (
              <div className="col-12 text-center py-5" style={{ color: 'var(--tsk-muted)' }}>
                <i className="bi bi-inbox d-block mb-2" style={{ fontSize: 40 }}></i>
                <small>Aucun produit trouvé</small>
              </div>
            )}
            {products.map(p => (
              <div key={p.id} className="col-6 col-md-4 col-xl-3">
                <div className={'card pos-product-card h-100 ' + (p.stock === 0 ? 'out-of-stock' : '')}
                  onClick={() => addToCart(p)}>
                  <div className="card-body p-2 text-center">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ height: 65, objectFit: 'cover', borderRadius: 8, width: '100%', marginBottom: 6 }} />
                      : <div style={{ height: 65, background: 'var(--tsk-yellow-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                          <i className="bi bi-box-seam" style={{ fontSize: 24, color: 'var(--tsk-blue)' }}></i>
                        </div>
                    }
                    <div className="fw-bold small text-truncate" style={{ color: 'var(--tsk-blue)', fontSize: 12 }}>{p.name}</div>
                    <div className="product-price" style={{ fontSize: 14 }}>{(+p.price).toFixed(2)} DH</div>
                    <div className={'small ' + (p.low_stock ? 'text-danger fw-semibold' : '')} style={{ fontSize: 11, color: p.low_stock ? undefined : 'var(--tsk-muted)' }}>
                      Stock: {p.stock} {p.low_stock && <i className="bi bi-exclamation-triangle-fill"></i>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT: Cart ══ */}
        <div className="col-lg-5">
          <div className="cart-panel no-print">

            <div className="cart-header">
              <h6>
                <i className="bi bi-cart3 me-2"></i>PANIER
                <span className="badge ms-2" style={{ background: 'var(--tsk-blue)', color: 'var(--tsk-yellow)', fontSize: 11 }}>
                  {cart.reduce((s, i) => s + i.qty, 0)} articles
                </span>
              </h6>
              {cart.length > 0 && (
                <button className="btn btn-sm" onClick={clearCart}
                  style={{ background: 'rgba(220,53,69,0.15)', color: '#ff6b6b', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>
                  <i className="bi bi-trash3 me-1"></i>Vider
                </button>
              )}
            </div>

            <div className="cart-items">
              {cart.length === 0 && (
                <div className="text-center py-5" style={{ color: 'var(--tsk-muted)' }}>
                  <i className="bi bi-cart3 d-block mb-2" style={{ fontSize: 38, color: 'var(--tsk-yellow)' }}></i>
                  <small>Cliquez sur un produit pour l'ajouter</small>
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} className="mb-2 p-2 rounded" style={{ background: '#f4f6fb', border: '1px solid #e8ecf5' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-bold small text-truncate" style={{ color: 'var(--tsk-blue)', fontSize: 12 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--tsk-muted)' }}>{(+item.price).toFixed(2)} DH/u</div>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button className="btn btn-sm" style={{ padding: '1px 8px', background: '#e8ecf5', borderRadius: 5, fontSize: 14 }}
                        onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <input type="number" min={1} max={item.stock} value={item.qty}
                        onChange={e => updateQty(item.id, e.target.value)}
                        className="form-control form-control-sm text-center p-0"
                        style={{ width: 42, height: 28, fontSize: 13, fontWeight: 700 }} />
                      <button className="btn btn-sm" style={{ padding: '1px 8px', background: '#e8ecf5', borderRadius: 5, fontSize: 14 }}
                        onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                    <div className="fw-oswald fw-bold text-end" style={{ minWidth: 68, fontSize: 13, color: 'var(--tsk-blue)' }}>
                      {(getPrice(item) * item.qty).toFixed(2)} DH
                    </div>
                    <button className="btn btn-sm p-1" style={{ color: '#dc3545' }} onClick={() => removeItem(item.id)}>
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-1">
                    <span style={{ fontSize: 10, color: 'var(--tsk-muted)', whiteSpace: 'nowrap' }}>Prix custom:</span>
                    <input
                      type="number" min={0} step="0.01"
                      className="form-control form-control-sm"
                      placeholder={(+item.price).toFixed(2)}
                      value={item.customPrice}
                      onChange={e => updateCustomPrice(item.id, e.target.value)}
                      style={{ height: 24, fontSize: 11, padding: '0 6px', border: item.customPrice ? '1px solid var(--tsk-yellow)' : undefined }}
                    />
                    {item.customPrice && (
                      <button className="btn btn-sm p-0 px-1" style={{ fontSize: 10, color: '#888' }}
                        onClick={() => updateCustomPrice(item.id, '')}>
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">

              {/* Client */}
              <div className="mb-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>
                  <i className="bi bi-person me-1" style={{ color: 'var(--tsk-yellow)' }}></i>Client
                </label>
                <select className="form-select form-select-sm" value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">#000 — Client anonyme</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{String(c.id).padStart(3, '0')} — {c.name}{(+c.credit_used) > 0 ? ` — Crédit: ${(+c.credit_used).toFixed(2)} DH` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remise */}
              <div className="mb-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>
                  <i className="bi bi-tag me-1" style={{ color: 'var(--tsk-yellow)' }}></i>Remise
                </label>
                <div className="btn-group w-100 mb-1">
                  <button
                    className={'btn btn-sm fw-bold ' + (remiseType === 'percent' ? 'btn-success' : 'btn-outline-secondary')}
                    onClick={() => { setRemiseType('percent'); setRemiseValue('') }}>
                    % Pourcentage
                  </button>
                  <button
                    className={'btn btn-sm fw-bold ' + (remiseType === 'fixed' ? 'btn-success' : 'btn-outline-secondary')}
                    onClick={() => { setRemiseType('fixed'); setRemiseValue('') }}>
                    DH Fixe
                  </button>
                </div>
                <div className="input-group input-group-sm">
                  <span className="input-group-text fw-bold">{remiseType === 'percent' ? '%' : 'DH'}</span>
                  <input type="number" min={0} max={remiseType === 'percent' ? 100 : subtotal}
                    className="form-control" placeholder="0"
                    value={remiseValue} onChange={e => setRemiseValue(e.target.value)} />
                  {remise > 0 && (
                    <span className="input-group-text fw-bold" style={{ color: '#dc3545', fontSize: 12 }}>
                      −{remise.toFixed(2)} DH
                    </span>
                  )}
                </div>
              </div>

              {/* Total box */}
              <div className="cart-total-box mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="total-label">Sous-total</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{subtotal.toFixed(2)} DH</span>
                </div>
                {remise > 0 && (
                  <div className="d-flex justify-content-between mb-1">
                    <span className="total-label">Remise</span>
                    <span style={{ color: '#ff9999', fontSize: 13 }}>−{remise.toFixed(2)} DH</span>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 6 }}>
                  <span className="total-label" style={{ fontSize: 13, fontWeight: 700 }}>TOTAL</span>
                  <span className="total-value">{total.toFixed(2)} DH</span>
                </div>
              </div>

              {/* Montant payé */}
              <div className="mb-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>
                  <i className="bi bi-cash me-1" style={{ color: 'var(--tsk-yellow)' }}></i>Montant reçu (DH)
                </label>
                <input type="number" min={0} step="0.01" className="form-control form-control-sm"
                  placeholder={total.toFixed(2)} value={paid} onChange={e => setPaid(e.target.value)} />
                {paidNum > 0 && (
                  <div className={'small mt-1 fw-bold ' + (credit > 0 ? 'text-warning' : 'text-success')} style={{ fontSize: 12 }}>
                    <i className={'bi me-1 ' + (credit > 0 ? 'bi-hourglass-split' : 'bi-check-circle-fill')}></i>
                    {credit > 0
                      ? `Crédit restant: ${credit.toFixed(2)} DH`
                      : `Monnaie à rendre: ${monnaie.toFixed(2)} DH`
                    }
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-3">
                <input type="text" className="form-control form-control-sm"
                  placeholder="Notes (optionnel)..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {/* Validate */}
              <button className="btn-validate" onClick={validateSale} disabled={loading || cart.length === 0}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Traitement...</>
                  : <><i className="bi bi-check2-circle me-2"></i>VALIDER — {total.toFixed(2)} DH</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
