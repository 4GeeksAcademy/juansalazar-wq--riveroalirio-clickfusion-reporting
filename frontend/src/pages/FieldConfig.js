import { useState, useEffect } from 'react';
import { getFieldConfig, saveFieldConfig, getFieldLabels } from '../services/api';
import { Eye, EyeOff, Save, X } from 'lucide-react';

export default function FieldConfig({ clientId, onClose }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [labelsRes, configRes] = await Promise.all([
        getFieldLabels(clientId),
        getFieldConfig(clientId)
      ]);

      const labelsData = labelsRes.data;
      const existingConfigs = configRes.data;

      const configMap = {};
      existingConfigs.forEach(c => {
        configMap[c.field_id] = c;
      });

      const allFields = Object.entries(labelsData).map(([field_id, field_label], i) => ({
        field_id,
        field_label,
        visible: configMap[field_id]?.visible ?? false,
        position: configMap[field_id]?.position ?? i
      }));

      setConfigs(allFields);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleVisible = (field_id) => {
    setConfigs(prev => prev.map(c =>
      c.field_id === field_id ? { ...c, visible: !c.visible } : c
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFieldConfig(clientId, configs);
      alert('Configuración guardada!');
      onClose();
    } catch (err) {
      alert('Error al guardar');
    }
    setSaving(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Configurar campos del reporte</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Cargando campos...</p>
        ) : (
          <>
            <p style={styles.subtitle}>
              Activa los campos que quieres mostrar en el reporte
            </p>
            <div style={styles.list}>
              {configs.map(c => (
                <div key={c.field_id} style={styles.item}>
                  <span style={styles.label}>{c.field_label}</span>
                  <button
                    style={{ ...styles.toggleBtn, backgroundColor: c.visible ? '#10b981' : '#334155' }}
                    onClick={() => toggleVisible(c.field_id)}
                  >
                    {c.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span style={{marginLeft:'6px'}}>{c.visible ? 'Visible' : 'Oculto'}</span>
                  </button>
                </div>
              ))}
            </div>
            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              <Save size={16} style={{ marginRight: '8px' }} />
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </>
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
    zIndex: 1000, padding: '20px'
  },
  modal: {
    backgroundColor: '#1e293b', padding: '32px',
    borderRadius: '12px', width: '100%', maxWidth: '600px',
    border: '1px solid #334155', maxHeight: '80vh',
    display: 'flex', flexDirection: 'column'
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '8px'
  },
  title: { color: '#f8fafc', margin: 0, fontSize: '20px' },
  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '20px' },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', padding: '4px'
  },
  list: { overflowY: 'auto', flex: 1, marginBottom: '20px' },
  item: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '12px 0',
    borderBottom: '1px solid #334155'
  },
  label: { color: '#f8fafc', fontSize: '14px', flex: 1, marginRight: '16px' },
  toggleBtn: {
    display: 'inline-flex', alignItems: 'center',
    padding: '6px 12px', border: 'none', borderRadius: '6px',
    color: 'white', cursor: 'pointer', fontSize: '13px',
    whiteSpace: 'nowrap'
  },
  saveBtn: {
    width: '100%', padding: '12px',
    backgroundColor: '#3b82f6', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '15px', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center'
  }
};
