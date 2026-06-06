import { useState, useEffect } from 'react';
import { getClients, syncContacts, getGlobalSummary } from '../services/api';
import api from '../services/api';
import ClientForm from './ClientForm';
import UserForm from './UserForm';
import UserList from './UserList';
import FieldConfig from './FieldConfig';
import { RefreshCw, Pencil, Trash2, BarChart2, Plus, Users, Settings, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard({ user, onLogout, onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [configuringClient, setConfiguringClient] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadClients();
    if (user.role === 'admin') loadSummary();
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

  const loadSummary = async () => {
    try {
      const res = await getGlobalSummary();
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
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

  const fmt = (n) => new Intl.NumberFormat('es-CO').format(Math.round(n || 0));
  const currentMonthName = new Date().toLocaleString('es-CO', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ClickFusion Reporting</h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>Hola, {user.name}</span>
          <button style={styles.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      {user.role === 'admin' && summary && (
        <div style={styles.summarySection}>
          <p style={styles.summaryLabel}>Resumen Ejecutivo — Ja Marketing</p>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}><BarChart2 size={20} color="#3b82f6" /></div>
              <div>
                <p style={styles.summaryCardLabel}>Total Leads</p>
                <p style={styles.summaryCardValue}>{fmt(summary.total_leads)}</p>
                <p style={styles.summaryCardSub}>Todos los proyectos</p>
              </div>
            </div>
            <div style={{...styles.summaryCard, borderColor: '#10b981'}}>
              <div style={{...styles.summaryIcon, backgroundColor: 'rgba(16,185,129,0.1)'}}><TrendingUp size={20} color="#10b981" /></div>
              <div>
                <p style={styles.summaryCardLabel}>Leads {currentMonthName}</p>
                <p style={{...styles.summaryCardValue, color: '#34d399'}}>{fmt(summary.current_month_leads)}</p>
                <p style={styles.summaryCardSub}>Mes en curso</p>
              </div>
            </div>
            <div style={{...styles.summaryCard, borderColor: '#7c3aed'}}>
              <div style={{...styles.summaryIcon, backgroundColor: 'rgba(124,58,237,0.1)'}}><Users size={20} color="#7c3aed" /></div>
              <div>
                <p style={styles.summaryCardLabel}>Proyectos Activos</p>
                <p style={{...styles.summaryCardValue, color: '#a78bfa'}}>{summary.total_clients}</p>
                <p style={styles.summaryCardSub}>Clientes en plataforma</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
  summarySection: { marginBottom: '32px' },
  summaryLabel: { color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  summaryCard: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '16px' },
  summaryIcon: { backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryCardLabel: { color: '#64748b', fontSize: '12px', margin: '0 0 4px' },
  summaryCardValue: { color: '#f8fafc', fontSize: '28px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1 },
  summaryCardSub: { color: '#475569', fontSize: '11px', margin: 0 },
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
