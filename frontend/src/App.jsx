import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import BrowseRestaurants from './pages/BrowseRestaurants';
import BookTable from './pages/BookTable';
import MyReservations from './pages/MyReservations';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import FloorPlan from './pages/FloorPlan';
import Analytics from './pages/Analytics';
import UserProfile from './pages/UserProfile';
import PaymentSuccess from './pages/PaymentSuccess';
import MockPayment from './pages/MockPayment';
import QrVerify from './pages/QrVerify';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import UserProfileBadge from './components/UserProfileBadge';
import NotificationBell from './components/NotificationBell';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/restaurants" replace />;
  return children;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTheme();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className={`${t.nav} p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-all duration-500`}>
      <div className="flex items-center gap-6">
        <Link to="/restaurants" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size="sm" showText={false} />
          <span className="font-bold text-lg hidden sm:inline">TableReserve</span>
        </Link>
        <div className="space-x-1 sm:space-x-4 text-sm font-medium">
          <Link to="/restaurants" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Restaurants</Link>
          <Link to="/my-reservations" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">My Bookings</Link>
          <Link to="/qr-verify" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors hidden md:inline">QR Check-in</Link>
          {user.role === 'owner' && <Link to="/owner" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">My Restaurant</Link>}
          {user.role === 'admin' && <Link to="/admin" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Admin</Link>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle compact />
        <NotificationBell />
        <UserProfileBadge user={user} />
        <button onClick={handleLogout} className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 transition-colors">
          Logout
        </button>
      </div>
    </nav>
  );
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/restaurants" element={<ProtectedRoute><BrowseRestaurants /></ProtectedRoute>} />
        <Route path="/book/:restaurantId" element={<ProtectedRoute><BookTable /></ProtectedRoute>} />
        <Route path="/my-reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/owner" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/floorplan/:restaurantId" element={<ProtectedRoute><FloorPlan /></ProtectedRoute>} />
        <Route path="/analytics/:restaurantId" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/mock-payment" element={<ProtectedRoute><MockPayment /></ProtectedRoute>} />
        <Route path="/qr-verify" element={<ProtectedRoute><QrVerify /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
