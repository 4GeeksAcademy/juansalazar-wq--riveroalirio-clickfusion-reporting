import { useState, useEffect } from 'react';
import { getClients, syncContacts } from '../services/api';
import api from '../services/api';
import ClientForm from './ClientForm';
import UserForm from './UserForm';
import UserList from './UserList';
import FieldConfig from './FieldConfig';
import { RefreshCw, Pencil, Trash2, BarChart2, Plus, Users, Settings } from 'lucide-react';

export default function Dashboard({ user, onLogout, onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [configuringClient, setConfiguringClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
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
      await loadClients();
      alert('Sincronización completada!');
    } catch (err) {
      alert('Error al sincronizar');
    }
    setSyncing(null);
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('¿Seguro que quieres eliminar este cliente?')) return;
    try {
      await api.delete(`/api/clients/${clientId}`);
      loadClients();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingClient(null);
    loadClients();
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

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Mis Clientes</h2>
        {user.role === 'admin' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={styles.addBtn} onClick={() => setShowForm(true)}>
              <Plus size={16} style={{marginRight:'6px'}} /> Nuevo Cliente
            </button>
            <button style={{ ...styles.addBtn, backgroundColor: '#8b5cf6' }} onClick={() => setShowUserList(true)}>
              <Users size={16} style={{marginRight:'6px'}} /> Usuarios
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p style={styles.loading}>Cargando clientes...</p>
      ) : (
        <div style={styles.grid}>
          {clients.map(client => (
            <div key={client.id} style={styles.card}>
              <h3 style={styles.clientName}>{client.name}</h3>

              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                Última actualización: {
                  client.last_sync
                    ? new Date(client.last_sync + 'Z').toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : 'Sin sincronizar'
                }
              </p>

              <p style={styles.clientId}>ID: {client.location_id}</p>

              <div style={styles.badge}>
                <span style={{
                  display: 'inline-block',
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  backgroundColor: client.active ? '#10b981' : '#ef4444',
                  marginRight: '6px'
                }}></span>
                {client.active ? 'Activo' : 'Inactivo'}
              </div>

              <div style={styles.actions}>
                <button style={styles.reportBtn} onClick={() => onSelectClient(client)}>
                  <BarChart2 size={15} style={{marginRight:'5px'}} /> Ver Reporte
                </button>
                <button
                  style={styles.syncBtn}
                  onClick={() => handleSync(client.id)}
                  disabled={syncing === client.id}
                  title="Sincronizar"
                >
                  <RefreshCw size={15} style={{
                    animation: syncing === client.id ? 'spin 1s linear infinite' : 'none'
                  }} />
                </button>
                {user.role === 'admin' && (
                  <>
                    <button
                      style={{...styles.editBtn, backgroundColor: '#0ea5e9'}}
                      onClick={() => setConfiguringClient(client.id)}
                      title="Configurar reporte"
                    >
                      <Settings size={15} />
                    </button>
                    <button
                      style={styles.editBtn}
                      onClick={() => { setEditingClient(client); setShowForm(true); }}
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(client.id)}
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingClient(null); }}
        />
      )}

      {showUserForm && (
        <UserForm
          clients={clients}
          onSave={() => setShowUserForm(false)}
          onCancel={() => setShowUserForm(false)}
        />
      )}

      {showUserList && (
        <UserList
          clients={clients}
          onClose={() => setShowUserList(false)}
          onNewUser={() => { setShowUserList(false); setShowUserForm(true); }}
        />
      )}

      {configuringClient && (
        <FieldConfig
          clientId={configuringClient}
          onClose={() => setConfiguringClient(null)}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button { display: inline-flex; align-items: center; justify-content: center; }
      `}</style>
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
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  sectionTitle: { color: '#f8fafc', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center' },
  loading: { color: '#94a3b8' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' },
  clientName: { color: '#f8fafc', margin: '0 0 8px', fontSize: '18px' },
  clientId: { color: '#64748b', fontSize: '12px', margin: '0 0 12px' },
  badge: { color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center' },
  actions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  reportBtn: { flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  syncBtn: { padding: '10px 12px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  editBtn: { padding: '10px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  deleteBtn: { padding: '10px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};
