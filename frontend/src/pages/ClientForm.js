import { useState } from 'react';
import api from '../services/api';

export default function ClientForm({ client, onSave, onCancel }) {
  const [name, setName] = useState(client?.name || '');
  const [locationId, setLocationId] = useState(client?.location_id || '');
  const [apiKey, setApiKey] = useState('');
  const [reporteiProjectId, setReporteiProjectId] = useState(client?.reportei_project_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (client) {
        await api.put(`/api/clients/${client.id}`, {
          name,
          location_id: locationId,
          api_key: apiKey || undefined,
          reportei_project_id: reporteiProjectId ? parseInt(reporteiProjectId) : null
        });
      } else {
        await api.post('/api/clients', {
          name,
          location_id: locationId,
          api_key: apiKey,
          reportei_project_id: reporteiProjectId ? parseInt(reporteiProjectId) : null
        });
      }
      onSave();
    } catch (err) {
      setError('Error al guardar el cliente');
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          {client ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Nombre del cliente</label>
          <input
            style={styles.input}
            placeholder="Ej: Botanika Serena del Mar"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <label style={styles.label}>Location ID de GHL</label>
          <input
            style={styles.input}
            placeholder="Ej: B8GTOjz5FDNr3K3s6rYP"
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            required
          />
          <label style={styles.label}>
            API Key de GHL {client && '(dejar vacío para no cambiar)'}
          </label>
          <input
            style={styles.input}
            placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            required={!client}
          />
          <label style={styles.label}>Reportei Project ID (opcional)</label>
          <input
            style={styles.input}
            placeholder="Ej: 642266"
            value={reporteiProjectId}
            onChange={e => setReporteiProjectId(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.buttons}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={styles.saveBtn}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
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
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid #334155'
  },
  title: { color: '#f8fafc', margin: '0 0 24px', fontSize: '20px' },
  label: { display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' },
  input: {
    width: '100%', padding: '12px', marginBottom: '16px',
    borderRadius: '8px', border: '1px solid #334155',
    backgroundColor: '#0f172a', color: '#f8fafc',
    fontSize: '14px', boxSizing: 'border-box'
  },
  error: { color: '#ef4444', marginBottom: '12px' },
  buttons: { display: 'flex', gap: '12px', marginTop: '8px' },
  cancelBtn: {
    flex: 1, padding: '12px', backgroundColor: '#334155',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
  },
  saveBtn: {
    flex: 1, padding: '12px', backgroundColor: '#3b82f6',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
  },
};