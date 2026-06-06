import { useEffect, useState } from 'react';

export default function Landing({ onEnter }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.grid}></div>
      <div style={styles.glow}></div>

      <div style={{
        ...styles.content,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s ease'
      }}>

        <img
          src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/qy3OfVBMtn5G20G2QNWp/media/67929297c21e37975bb0e1db.png"
          alt="ClickFusion"
          style={styles.logoImg}
        />

        <div style={styles.badge}>
          <span style={styles.badgeDot}></span>
          Sistema de Reportes en Tiempo Real
        </div>

        <p style={styles.tagline}>
          Todos tus datos de marketing<br />en un solo lugar
        </p>

        <p style={styles.description}>
          Conecta GoHighLevel, Facebook Ads y Google Analytics.<br />
          Visualiza leads, inversión y tráfico en tiempo real.
        </p>

        <div style={styles.features}>
          {[
            { icon: '⚡', text: 'Sync automático con GHL' },
            { icon: '📊', text: 'Reportes de Facebook Ads' },
            { icon: '🌐', text: 'Tráfico Google Analytics' },
            { icon: '🔒', text: 'Acceso por cliente' },
          ].map((f, i) => (
            <div key={i} style={styles.feature}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        <button
          style={styles.cta}
          onClick={onEnter}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Iniciar Sesión →
        </button>

        <p style={styles.footer}>
          Powered by <strong>Ja Marketing</strong> · ClickFusion CRM
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@300;400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes gridMove { from{transform:translateY(0)} to{transform:translateY(40px)} }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#020817',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    animation: 'gridMove 8s linear infinite alternate',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
    animation: 'pulse 4s ease-in-out infinite',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    padding: '40px 24px',
    maxWidth: '680px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoImg: {
    width: '280px',
    maxWidth: '75%',
    marginBottom: '28px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: '100px',
    padding: '6px 16px',
    color: '#60a5fa',
    fontSize: '13px',
    marginBottom: '28px',
    letterSpacing: '0.3px',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
  },
  tagline: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(22px, 3vw, 32px)',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 16px',
    lineHeight: 1.3,
  },
  description: {
    fontSize: '16px',
    color: '#64748b',
    lineHeight: 1.7,
    margin: '0 0 40px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    width: '100%',
    maxWidth: '480px',
    marginBottom: '48px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
    padding: '14px 16px',
    textAlign: 'left',
  },
  featureIcon: {
    fontSize: '18px',
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  cta: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    boxShadow: '0 0 40px rgba(59,130,246,0.4)',
    marginBottom: '32px',
    fontFamily: "'Syne', sans-serif",
  },
  footer: {
    color: '#334155',
    fontSize: '13px',
  },
};
