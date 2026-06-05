import { useState, useEffect } from 'react';
import { getMetrics, getInvestment, getGA4 } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];

const fmt = (n) => new Intl.NumberFormat('es-CO').format(Math.round(n || 0));
const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export default function Report({ client, onBack }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-04-30');
  const [fbMetrics, setFbMetrics] = useState(null);
  const [ga4Data, setGa4Data] = useState([]);

  useEffect(() => {
    loadAll();
  }, [startDate, endDate]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [metricsRes, investmentRes, ga4Res] = await Promise.all([
        getMetrics(client.id, startDate, endDate),
        getInvestment(client.id, startDate, endDate),
        getGA4(client.id, '2025-05-01', endDate)
      ]);
      setMetrics(metricsRes.data);
      setFbMetrics(investmentRes.data);
      setGa4Data(ga4Res.data.values || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getDailyData = () => {
    if (!metrics) return [];
    return Object.entries(metrics.leads_by_day)
      .map(([date, count]) => ({ date: date.slice(5), leads: count }))
      .slice(-30);
  };

  const getSourceData = () => {
    if (!metrics) return [];
    const sources = Object.entries(metrics.leads_by_source)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const total = sources.reduce((sum, [, v]) => sum + v, 0);
    return sources.map(([name, value]) => ({
      name: name.length > 20 ? name.slice(0, 20) + '...' : name,
      value,
      percent: ((value / total) * 100).toFixed(1)
    }));
  };

const getGA4ChartData = () => {
  if (!ga4Data || !Array.isArray(ga4Data)) return [];
  const dataArray = ga4Data[0]?.data || [];
  return dataArray.map((value, index) => ({
    date: `Día ${index + 1}`,
    usuarios: parseInt(value) || 0
  }));
};

  const spend = fbMetrics?.total_spend || 0;
  const cpl = metrics?.total_leads > 0 ? spend / metrics.total_leads : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {onBack && (
          <button style={styles.backBtn} onClick={onBack}>← Volver</button>
        )}
        <h1 style={styles.title}>{client.name}</h1>
      </div>

      <div style={styles.filters}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.dateInput} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.dateInput} />
        <button style={styles.filterBtn} onClick={loadAll}>Filtrar</button>
      </div>

      {loading ? (
        <p style={styles.loading}>Cargando métricas...</p>
      ) : metrics ? (
        <>
          {/* Tarjetas GHL */}
          <p style={styles.sectionLabel}>Leads (GHL)</p>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Total Leads</p>
              <p style={styles.statValue}>{fmt(metrics.total_leads)}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Fuentes</p>
              <p style={styles.statValue}>{Object.keys(metrics.leads_by_source).length}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Etiquetas</p>
              <p style={styles.statValue}>{Object.keys(metrics.leads_by_tag).length}</p>
            </div>
          </div>

          {/* Tarjetas Facebook Ads */}
          {fbMetrics && fbMetrics.source === 'reportei' && (
            <>
              <p style={styles.sectionLabel}>Facebook Ads</p>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Inversión</p>
                  <p style={styles.statValue}>{fmtCOP(spend)}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Costo por Lead</p>
                  <p style={styles.statValue}>{fmtCOP(cpl)}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Alcance</p>
                  <p style={styles.statValue}>{fmt(fbMetrics.reach)}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Impresiones</p>
                  <p style={styles.statValue}>{fmt(fbMetrics.impressions)}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Clics</p>
                  <p style={styles.statValue}>{fmt(fbMetrics.clicks)}</p>
                </div>
              </div>
            </>
          )}

          {/* Gráfica leads por día */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Leads por día (últimos 30 días)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getDailyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica fuentes */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Top 8 Fuentes de Leads</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={getSourceData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ percent }) => `${percent}%`}>
                  {getSourceData().map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica GA4 */}
          {ga4Data.length > 0 && (
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Tráfico Landing Page (Google Analytics)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getGA4ChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="usuarios" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : <p style={styles.loading}>No hay datos</p>}
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0f172a', padding: '24px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  title: { color: '#f8fafc', margin: 0, fontSize: '22px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' },
  dateInput: { padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc' },
  filterBtn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  loading: { color: '#94a3b8' },
  sectionLabel: { color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', textAlign: 'center' },
  statLabel: { color: '#64748b', margin: '0 0 8px', fontSize: '14px' },
  statValue: { color: '#f8fafc', margin: 0, fontSize: '22px', fontWeight: 'bold', wordBreak: 'break-word', lineHeight: '1.2' },
  chartCard: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', marginBottom: '24px' },
  chartTitle: { color: '#f8fafc', margin: '0 0 20px', fontSize: '16px' },
};