import { useState } from 'react';
import api from '../services/api';

export default function UserForm({ clients, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users', {
        name,
        email,
        password,
        role,
        client_id: role === 'viewer' ? parseInt(clientId) : null
      });
      alert(`Usuario ${role} creado exitosamente!`);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario');
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          {role === 'admin' ? 'Nuevo Usuario Admin' : 'Nuevo Usuario Viewer'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            style={styles.input}
            value={role}
            onChange={(e) => { setRole(e.target.value); setClientId(''); }}
          >
            <option value="viewer">Viewer — solo ve su cliente</option>
            <option value="admin">Admin — acceso total</option>
          </select>

          {role === 'viewer' && (
            <select
              style={styles.input}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Selecciona un cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.buttons}>
            <button style={styles.cancelBtn} type="button" onClick={onCancel}>
              Cancelar
            </button>
            <button
              style={{ ...styles.saveBtn, backgroundColor: role === 'admin' ? '#3b82f6' : '#8b5cf6' }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
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
    borderRadius: '12px', width: '100%', maxWidth: '440px',
    border: '1px solid #334155'
  },
  title: { color: '#f8fafc', marginBottom: '24px' },
  input: {
    width: '100%', padding: '12px', marginBottom: '16px',
    borderRadius: '8px', border: '1px solid #334155',
    backgroundColor: '#0f172a', color: '#f8fafc',
    fontSize: '15px', boxSizing: 'border-box'
  },
  error: { color: '#ef4444', marginBottom: '12px' },
  buttons: { display: 'flex', gap: '12px', marginTop: '8px' },
  cancelBtn: {
    flex: 1, padding: '12px', backgroundColor: '#334155',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
  },
  saveBtn: {
    flex: 1, padding: '12px',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
  }
};