import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function getInitialPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('token')) return 'reset-password';
  return 'login';
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [page, setPage] = useState(getInitialPage);

  const resetToken = new URLSearchParams(window.location.search).get('token');

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'viewer' && userData.client_id) {
      setSelectedClient({ id: userData.client_id });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedClient(null);
    setPage('login');
  };

  if (!user) {
    if (page === 'forgot-password') {
      return <ForgotPassword onBack={() => setPage('login')} />;
    }
    if (page === 'reset-password') {
      return <ResetPassword token={resetToken} onSuccess={() => setPage('login')} />;
    }
    return <Login onLogin={handleLogin} onForgotPassword={() => setPage('forgot-password')} />;
  }

  if (selectedClient) return (
    <Report
      client={selectedClient}
      onBack={user.role === 'admin' ? () => setSelectedClient(null) : null}
    />
  );

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onSelectClient={setSelectedClient}
    />
  );
}

export default App;