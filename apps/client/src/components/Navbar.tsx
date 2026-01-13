import { useEffect, useState } from 'react';

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="navbar">
      <div className="logo">InsuranceClaimFusion AI</div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a href="/" className="btn-soft-blue">Submit Claim</a>
        <a href="/admin" className="btn-soft-blue">Admin</a>
        <button
          onClick={toggleTheme}
          className="secondary"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            width: 'auto',
            marginLeft: '0.5rem',
            background: 'transparent'
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  )
}
