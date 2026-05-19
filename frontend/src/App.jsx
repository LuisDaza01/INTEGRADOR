import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { USER_ROLES } from './constants';

// PUBLIC
import WelcomeMenu from './components/layout/WelcomeMenu';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';

// CONSUMER
import DashboardConsumidor from './pages/consumer/DashboardConsumidor';
import Inicio from './pages/consumer/Inicio';
import Productores from './pages/consumer/Productores';
import Carrito from './pages/consumer/Carrito';
import MisPedidos from './pages/consumer/MisPedidos';
import PerfilConsumidor from './pages/consumer/PerfilConsumidor';
import PerfilProductorConsumidor from './pages/consumer/PerfilProductorConsumidor';
import AyudaConsumidor from './pages/consumer/AyudaConsumidor';
import Tienda from './pages/consumer/Tienda';
import MisReservas from './pages/consumer/MisReservas';
import MensajesConsumidor from './pages/consumer/MensajesConsumidor'
import MapaProductores from './pages/consumer/MapaProductores';

// PRODUCER — layout
import DashboardProductor from './pages/producer/DashboardProductor';
import Calendario          from './pages/producer/Calendario';
import ReservasProductor   from './pages/producer/Reservas';
// PRODUCER — secciones (rutas anidadas)
import Monitoring from './pages/producer/Monitoring';
import Pedidos from './pages/producer/Pedidos';
import Inventario from './pages/producer/Inventario';
import Estadisticas from './pages/producer/Estadisticas';
import Mensajes from './pages/producer/Mensajes';
import Notificaciones from './pages/producer/Notificaciones';
import Ajustes from './pages/producer/Ajustes';
import Ayuda from './pages/producer/Ayuda';
import PerfilProductor from './pages/producer/PerfilProductor';

// DRIVER
import DashboardRepartidor from './pages/driver/DashboardRepartidor';

// ADMIN
import DashboardAdmin from './pages/admin/DashboardAdmin';
import EstadisticasAdmin from './pages/admin/EstadisticasAdmin';
import ProductosAdmin from './pages/admin/ProductosAdmin';
import PedidosAdmin from './pages/admin/PedidosAdmin';
import CategoriasAdmin from './pages/admin/CategoriasAdmin';
import UsuariosAdmin from './pages/admin/UsuariosAdmin';
import RegistrarProductor from './pages/admin/RegistrarProductor';
import TrazabilidadPublica from './pages/consumer/TrazabilidadPublica';
import TrackingPedidoWeb from './pages/consumer/TrackingPedidoWeb';
import AnalizarFrescura from './pages/consumer/AnalizarFrescura';
import FloatingAssistant from './components/common/FloatingAssistant';

const ProtectedRouteInner = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { D } = useTheme();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.primary, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol_id)) {
    if (user?.rol_id === USER_ROLES.ADMIN)    return <Navigate to="/dashboard-admin" replace />;
    if (user?.rol_id === USER_ROLES.PRODUCER) return <Navigate to="/dashboard-productor" replace />;
    if (user?.rol_id === USER_ROLES.CONSUMER) return <Navigate to="/dashboard-consumidor" replace />;
    if (user?.rol_id === USER_ROLES.DRIVER)   return <Navigate to="/dashboard-repartidor" replace />;
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <FloatingAssistant />
    </>
  );
};

const ProtectedRoute = (props) => <ProtectedRouteInner {...props} />;

const App = () => {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<WelcomeMenu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* CONSUMER */}
          <Route path="/dashboard-consumidor" element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CONSUMER]}>
              <DashboardConsumidor />
            </ProtectedRoute>
          }>
            <Route index element={<Inicio />} />
            <Route path="productores" element={<Productores />} />
            <Route path="tienda" element={<Tienda />} />
            <Route path="carrito" element={<Carrito />} />
            <Route path="mis-pedidos" element={<MisPedidos />} />
            <Route path="mis-reservas" element={<MisReservas />} />
            <Route path="mensajes" element={<MensajesConsumidor />} />
            <Route path="mapa-productores" element={<MapaProductores />} />
            <Route path="perfil" element={<PerfilConsumidor />} />
            <Route path="ayuda" element={<AyudaConsumidor />} />
            <Route path="productor/:id" element={<PerfilProductorConsumidor />} />
            <Route path="tracking/:pedidoId" element={<TrackingPedidoWeb />} />
            <Route path="analizar-frescura" element={<AnalizarFrescura />} />
          </Route>

          {/* PRODUCER */}
          <Route path="/dashboard-productor" element={
            <ProtectedRoute allowedRoles={[USER_ROLES.PRODUCER]}>
              <DashboardProductor />
            </ProtectedRoute>
          }>
            {/* index = panel principal con KPIs y sensores */}
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={null} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="reservas"   element={<ReservasProductor />} />
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="mensajes" element={<Mensajes />} />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route path="perfil" element={<PerfilProductor />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="ayuda" element={<Ayuda />} />
          </Route>

          {/* DRIVER */}
          <Route path="/dashboard-repartidor" element={
            <ProtectedRoute allowedRoles={[USER_ROLES.DRIVER]}>
              <DashboardRepartidor />
            </ProtectedRoute>
          } />

          {/* ADMIN */}
          <Route path="/dashboard-admin" element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }>
            <Route index element={<EstadisticasAdmin />} />
            <Route path="productos" element={<ProductosAdmin />} />
            <Route path="pedidos" element={<PedidosAdmin />} />
            <Route path="categorias" element={<CategoriasAdmin />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="registrar-productor" element={<RegistrarProductor />} />
          </Route>

          {/* TRAZABILIDAD — pública, sin login */}
          <Route path="/trazabilidad/:productoId" element={<TrazabilidadPublica />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;