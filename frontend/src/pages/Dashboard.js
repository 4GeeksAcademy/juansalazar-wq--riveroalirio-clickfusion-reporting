import { useState, useEffect } from 'react';
import { getClients, syncContacts } from '../services/api';

export default function Dashboard({ user, onLogout, onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSync = async (clientId) => {
    setSyncing(clientId);
    try {
      await syncContacts(clientId);
      alert('Sincronización completada!');
    } catch (err) {
      alert('Error al sincronizar');
    }
    setSyncing(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ClickFusion Reporting</h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>Hola, {user.name}</span>
          <button style={styles.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Mis Clientes</h2>

      {loading ? (
        <p style={styles.loading}>Cargando clientes...</p>
      ) : (
        <div style={styles.grid}>
          {clients.map(client => (
            <div key={client.id} style={styles.card}>
              <h3 style={styles.clientName}>{client.name}</h3>
              <p style={styles.clientId}>ID: {client.location_id}</p>
              <div style={styles.badge}>
                {client.active ? '🟢 Activo' : '🔴 Inactivo'}
              </div>
              <div style={styles.actions}>
                <button
                  style={styles.reportBtn}
                  onClick={() => onSelectClient(client)}
                >
                  Ver Reporte
                </button>
                <button
                  style={styles.syncBtn}
                  onClick={() => handleSync(client.id)}
                  disabled={syncing === client.id}
                >
                  {syncing === client.id ? 'Sincronizando...' : '🔄 Sync'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0f172a', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { color: '#f8fafc', fontSize: '24px', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  userName: { color: '#94a3b8' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  sectionTitle: { color: '#f8fafc', marginBottom: '24px' },
  loading: { color: '#94a3b8' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' },
  clientName: { color: '#f8fafc', margin: '0 0 8px', fontSize: '18px' },
  clientId: { color: '#64748b', fontSize: '12px', margin: '0 0 12px' },
  badge: { color: '#94a3b8', marginBottom: '16px' },
  actions: { display: 'flex', gap: '8px' },
  reportBtn: { flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  syncBtn: { padding: '10px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};