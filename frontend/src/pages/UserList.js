import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';

export default function UserList({ clients, onClose, onNewUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a ${name}?`)) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const getClientName = (clientId) => {
    if (!clientId) return '—';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : '—';
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Gestión de Usuarios</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <button style={styles.newBtn} onClick={onNewUser}>
          + Nuevo Usuario
        </button>

        {loading ? (
          <p style={styles.empty}>Cargando...</p>
        ) : users.length === 0 ? (
          <p style={styles.empty}>No hay usuarios registrados.</p>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.col}>Nombre</span>
              <span style={styles.col}>Email</span>
              <span style={styles.colSmall}>Rol</span>
              <span style={styles.col}>Cliente</span>
              <span style={styles.colAction}></span>
            </div>
            {users.map(u => (
              <div key={u.id} style={styles.row}>
                <span style={styles.col}>{u.name}</span>
                <span style={{ ...styles.col, color: '#94a3b8' }}>{u.email}</span>
                <span style={styles.colSmall}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: u.role === 'admin' ? '#1d4ed8' : '#6d28d9'
                  }}>
                    {u.role}
                  </span>
                </span>
                <span style={{ ...styles.col, color: '#94a3b8' }}>
                  {getClientName(u.client_id)}
                </span>
                <span style={styles.colAction}>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(u.id, u.name)}
                  >
                    🗑️
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#1e293b', padding: '32px',
    borderRadius: '12px', width: '100%', maxWidth: '760px',
    border: '1px solid #334155', maxHeight: '80vh', overflowY: 'auto'
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '20px'
  },
  title: { color: '#f8fafc', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    fontSize: '20px', cursor: 'pointer'
  },
  newBtn: {
    marginBottom: '20px', padding: '10px 20px',
    backgroundColor: '#8b5cf6', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
  },
  empty: { color: '#94a3b8', textAlign: 'center', padding: '24px 0' },
  table: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tableHeader: {
    display: 'flex', padding: '8px 12px',
    color: '#64748b', fontSize: '12px', textTransform: 'uppercase'
  },
  row: {
    display: 'flex', alignItems: 'center', padding: '12px',
    backgroundColor: '#0f172a', borderRadius: '8px',
    border: '1px solid #334155'
  },
  col: { flex: 2, color: '#f8fafc', fontSize: '14px' },
  colSmall: { flex: 1, fontSize: '14px' },
  colAction: { flex: 0.5, display: 'flex', justifyContent: 'flex-end' },
  badge: {
    padding: '3px 10px', borderRadius: '20px',
    color: 'white', fontSize: '12px'
  },
  deleteBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '16px'
  }
};