import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Zid hada bach l-lien i-khdem
import api from '../api/axios';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => api.get('/categories').then(r => setCategories(r.data));

  const openNew = () => {
    setForm({ name: '', description: '' }); 
    setEditId(null); 
    setImageFile(null); 
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({ name: c.name, description: c.description || '' });
    setEditId(c.id); 
    setImageFile(null); 
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    if (imageFile) fd.append('image', imageFile);
    if (editId) fd.append('_method', 'PUT');

    try {
      const url = editId ? `/categories/${editId}` : '/categories';
      await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false); 
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Supprimer la catégorie "${c.name}" ?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="animate__animated animate__fadeIn px-3">
      {/* TOPBAR PROFESSIONNEL */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-oswald text-uppercase mb-0" style={{ color: '#0d1b4b' }}>
          <i className="bi bi-tags me-2 text-warning"></i>Catégories
        </h3>
        <button className="btn btn-warning fw-bold px-4 shadow-sm" onClick={openNew}>
          <i className="bi bi-plus-lg me-1"></i>NOUVELLE CATÉGORIE
        </button>
      </div>

      {/* GRID DES CATÉGORIES */}
      <div className="row g-4">
        {categories.length === 0 && (
          <div className="col-12 text-center text-muted py-5">
            <i className="bi bi-tags fs-1 d-block mb-2 opacity-25"></i>Aucune catégorie trouvée
          </div>
        )}
        
        {categories.map(c => (
          <div key={c.id} className="col-md-4 col-lg-3">
            <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
              {/* IMAGE CATEGORIE */}
              <div className="category-img-container bg-light d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <i className="bi bi-tags text-muted opacity-25" style={{ fontSize: '3rem' }}></i>
                )}
              </div>

              <div className="card-body">
                <h6 className="fw-bold mb-1 text-dark">{c.name}</h6>
                <p className="text-muted small mb-3 text-truncate">{c.description || 'Pas de description'}</p>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge bg-light text-dark border small">
                    <i className="bi bi-box-seam me-1 text-primary"></i>{c.products_count} Produits
                  </span>
                </div>

                {/* BOUTON VOIR PRODUITS (FILTRE) */}
                <Link 
                  to={`/products?category=${c.id}`} 
                  className="btn btn-outline-primary btn-sm w-100 fw-bold rounded-pill mb-2"
                >
                  <i className="bi bi-eye me-1"></i>Voir Produits
                </Link>

                <div className="d-flex gap-2 border-top pt-2">
                  <button className="btn btn-sm btn-light flex-fill border" onClick={() => openEdit(c)}>
                    <i className="bi bi-pencil me-1"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL AJOUTER/MODIFIER */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Nom de la catégorie *</label>
                    <input className="form-control bg-light border-0 py-2" value={form.name} required
                      onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description (Optionnel)</label>
                    <textarea className="form-control bg-light border-0" rows={2} value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}></textarea>
                  </div>
                  <div className="mb-1">
                    <label className="form-label small fw-bold">Image / Icône</label>
                    <input type="file" className="form-control bg-light border-0" accept="image/*"
                      onChange={e => setImageFile(e.target.files[0])} />
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button type="button" className="btn btn-light px-4" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-warning fw-bold px-4" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}