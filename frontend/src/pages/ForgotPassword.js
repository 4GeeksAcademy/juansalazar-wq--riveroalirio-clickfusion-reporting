import { useState } from 'react';
import { forgotPassword } from '../services/api';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>ClickFusion</h1>
        <p style={styles.subtitle}>Restablecer contraseña</p>

        {sent ? (
          <div style={styles.successBox}>
            <p style={styles.successText}>
              Si el email está registrado, recibirás un enlace en los próximos minutos.
              Revisa también tu carpeta de spam.
            </p>
            <button style={styles.button} onClick={onBack}>
              Volver al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={styles.hint}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <input
              style={styles.input}
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        {!sent && (
          <button style={styles.backLink} onClick={onBack}>
            ← Volver al login
          </button>
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
    marginBottom: '24px',
  },
  hint: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '20px',
    lineHeight: '1.5',
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
  backLink: {
    marginTop: '16px',
    width: '100%',
    padding: '10px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
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