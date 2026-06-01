import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import POSPage from './pages/POSPage';
import SalesPage from './pages/SalesPage';
import ClientsPage from './pages/ClientsPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children, adminOnly }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="products" element={<PrivateRoute adminOnly><ProductsPage /></PrivateRoute>} />
        <Route path="categories" element={<PrivateRoute adminOnly><CategoriesPage /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}