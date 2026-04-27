import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedClient, setSelectedClient] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    // Si es viewer, cargamos su cliente automáticamente
    if (userData.role === 'viewer' && userData.client_id) {
      setSelectedClient({ id: userData.client_id });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedClient(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

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