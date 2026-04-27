import { useState } from 'react';
import { resetPassword } from '../services/api';

export default function ResetPassword({ token, onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      window.history.replaceState({}, '', '/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al restablecer. El enlace puede haber expirado.';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>ClickFusion</h1>
        <p style={styles.subtitle}>Nueva contraseña</p>

        {done ? (
          <div style={styles.successBox}>
            <p style={styles.successText}>
              Contraseña actualizada correctamente.
            </p>
            <button style={styles.button} onClick={onSuccess}>
              Ir al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              style={styles.input}
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  title: {
    color: '#f8fafc',
    textAlign: 'center',
    fontSize: '28px',
    marginBottom: '4px',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: '32px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  error: {
    color: '#ef4444',
    marginBottom: '12px',
    fontSize: '14px',
  },
  successBox: {
    textAlign: 'center',
  },
  successText: {
    color: '#86efac',
    marginBottom: '24px',
    lineHeight: '1.6',
    fontSize: '15px',
  },
};