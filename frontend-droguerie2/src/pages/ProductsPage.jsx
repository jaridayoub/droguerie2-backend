import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom' // Zid useNavigate
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  name: '',
  category_id: '',
  price: '',
  cost_price: '',
  stock: '',
  stock_alert: 5,
  tva: 20,
  barcode: '',
  description: '',
  active: true
}

export default function ProductsPage() {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // T-ched l-ID dial l-catégorie men l-URL
  const queryParams = new URLSearchParams(location.search)
  const catIdFromUrl = queryParams.get('category')

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAll = () => setSelected(selected.length === products.length ? [] : products.map(p => p.id))

  const handleBulkDelete = async () => {
    if (!window.confirm(`Supprimer ${selected.length} produit(s) ?`)) return
    await Promise.all(selected.map(id => api.delete(`/products/${id}`)))
    setSelected([])
    loadProducts()
  }

  // Reload mlli t-beddel search aw l-catégorie f l-URL
  useEffect(() => { 
    loadProducts() 
  }, [search, location.search])

  useEffect(() => { 
    api.get('/categories').then(r => setCategories(r.data)) 
  }, [])

  const loadProducts = () => {
    // Sift ga3 l-params l-backend (search + category_id)
    const params = { 
      search: search || undefined,
      category_id: catIdFromUrl || undefined 
    }
    
    api.get('/products', { params })
      .then(r => setProducts(r.data))
  }

  const clearFilter = () => {
    setSearch('')
    navigate('/products') // Rejja3 l-URL l-halto l-asliya
  }

  const openModal = (p = null) => {
    if (p) {
      setForm({ ...p, barcode: p.barcode || '', description: p.description || '', tva: String(parseInt(p.tva ?? 20)) })
      setEditId(p.id)
    } else {
      setForm(emptyForm)
      setEditId(null)
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    const skip = ['image_url', 'image', 'category', 'low_stock']
    Object.entries(form).forEach(([k, v]) => {
      if (skip.includes(k) || v === '' || v === null || v === undefined) return
      if (['category_id', 'price', 'cost_price', 'stock', 'stock_alert', 'tva'].includes(k)) fd.append(k, Number(v))
      else if (k === 'active') fd.append(k, v ? 1 : 0)
      else fd.append(k, v)
    })
    if (imageFile) fd.append('image', imageFile)
    else if (editId) fd.append('keep_image', 1)
    if (editId) fd.append('_method', 'PUT')

    try {
      await api.post(editId ? `/products/${editId}` : '/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowModal(false)
      loadProducts()
    } catch (err) {
      alert('Erreur de validation. Vérifiez les champs.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce produit ?')) {
      await api.delete(`/products/${id}`)
      loadProducts()
    }
  }

  return (
    <div className="animate__animated animate__fadeIn px-3">
      {/* --- HEADER --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-oswald text-uppercase mb-0" style={{ color: '#0d1b4b' }}>Gestion du Stock</h3>
          {catIdFromUrl && (
            <span className="badge bg-info-subtle text-info mt-1">
              Filtre par catégorie actif 
              <i className="bi bi-x-circle ms-2 cp" onClick={clearFilter} style={{cursor: 'pointer'}}></i>
            </span>
          )}
        </div>
        {isAdmin() && (
          <div className="d-flex gap-2">
            {selected.length > 0 && (
              <button className="btn btn-danger fw-bold px-3 shadow-sm" onClick={handleBulkDelete}>
                <i className="bi bi-trash3 me-2"></i>Supprimer ({selected.length})
              </button>
            )}
            <button className="btn btn-warning fw-bold px-4 shadow-sm" onClick={() => openModal()}>
              <i className="bi bi-plus-lg me-2"></i>NOUVEAU PRODUIT
            </button>
          </div>
        )}
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="card border-0 shadow-sm mb-4 p-2 rounded-3">
        <div className="input-group">
          <span className="input-group-text bg-white border-0 text-muted"><i className="bi bi-search"></i></span>
          <input 
            className="form-control border-0 shadow-none" 
            placeholder="Rechercher par nom ou code barre..." 
            value={search} onChange={e => setSearch(e.target.value)}
          />
          { (search || catIdFromUrl) && (
            <button className="btn btn-link text-muted text-decoration-none" onClick={clearFilter}>
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase fw-bold">
                {isAdmin() && <th className="ps-3"><input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={toggleAll} /></th>}
                <th className="ps-4">Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">Aucun produit trouvé.</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    {isAdmin() && <td className="ps-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>}
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <img src={p.image_url || ''} onError={e => e.target.style.display='none'} className="rounded me-3 border" style={{width:'45px', height:'45px', objectFit:'cover'}} />
                        <div className="fw-bold text-dark">{p.name}</div>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark border">{p.category?.name}</span></td>
                    <td className="fw-bold text-primary">{parseFloat(p.price).toFixed(2)} DH</td>
                    <td>
                      <span className={`badge ${p.stock <= p.stock_alert ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                        {p.stock} unités
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-outline-primary border-0 me-1" onClick={() => openModal(p)}><i className="bi bi-pencil-square"></i></button>
                      {isAdmin() && <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDelete(p.id)}><i className="bi bi-trash3"></i></button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <form className="modal-content border-0 shadow-lg rounded-4" onSubmit={handleSubmit}>
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold">{editId ? 'Modifier Produit' : 'Nouveau Produit'}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-bold">Nom du produit</label>
                    <input className="form-control bg-light border-0" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Catégorie</label>
                    <select className="form-select bg-light border-0" required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                      <option value="">Choisir...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Prix de Vente</label>
                    <div className="input-group">
                      <input type="number" step="0.01" className="form-control bg-light border-0" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                      <span className="input-group-text bg-light border-0 small">DH</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Prix d'Achat</label>
                    <input type="number" step="0.01" className="form-control bg-light border-0" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">TVA (%)</label>
                    <select className="form-select bg-light border-0" value={form.tva} onChange={e => setForm({...form, tva: e.target.value})}>
                      <option value="0">0% — Exonéré</option>
                      <option value="7">7%</option>
                      <option value="10">10%</option>
                      <option value="14">14%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Stock Actuel</label>
                    <input type="number" className="form-control bg-light border-0" required value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-bold">Image du produit</label>
                    {editId && form.image_url && !imageFile && (
                      <div className="mb-2">
                        <img src={form.image_url} alt="actuelle" style={{ height: 60, borderRadius: 8, objectFit: 'cover' }} />
                        <small className="ms-2 text-muted">Image actuelle</small>
                      </div>
                    )}
                    <input type="file" className="form-control bg-light border-0" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                    {imageFile && <small className="text-success mt-1 d-block"><i className="bi bi-check-circle me-1"></i>Nouvelle image sélectionnée: {imageFile.name}</small>}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-warning fw-bold px-4" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}