import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpicyProvider } from './context/SpicyContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SetupProfile } from './pages/SetupProfile';
import { Discover } from './pages/Discover';
import { Matches } from './pages/Matches';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Navbar } from './components/Navbar';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--skin-bg)' }}>
        <div className="w-10 h-10 border-4 border-[var(--skin-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!user.is_setup_complete) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupProfile />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto" style={{ background: 'var(--skin-bg)' }}>
      <div className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </div>
      <Navbar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SpicyProvider>
          <AppRoutes />
        </SpicyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
