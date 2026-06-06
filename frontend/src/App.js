import { useState } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedClient, setSelectedClient] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'viewer' && userData.client_id) {
      setSelectedClient({ id: userData.client_id });
    }
    setScreen('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedClient(null);
    setScreen('landing');
  };

  // Si ya hay sesión activa, ir directo al app
  if (user && screen === 'landing') {
    if (user.role === 'viewer' && user.client_id && !selectedClient) {
      setSelectedClient({ id: user.client_id });
    }
    setScreen('app');
  }

  if (screen === 'landing') return <Landing onEnter={() => setScreen('login')} />;
  if (screen === 'forgot') return <ForgotPassword onBack={() => setScreen('login')} />;
  if (screen === 'reset') return <ResetPassword onBack={() => setScreen('login')} />;

  if (screen === 'login' || !user) return (
    <Login
      onLogin={handleLogin}
      onForgotPassword={() => setScreen('forgot')}
    />
  );

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