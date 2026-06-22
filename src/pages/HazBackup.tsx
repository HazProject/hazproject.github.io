import React from 'react';
import { useNavigate } from 'react-router-dom';
import './consumptioness.css'; // reuse the same clean styles

const FEATURES = [
  {
    icon: '🔐',
    title: 'AES-256 Encryption',
    desc: 'Every backup is encrypted with AES-256 before it touches disk. Your files are safe — even if someone steals your drive.',
  },
  {
    icon: '♾️',
    title: 'Incremental Deduplication',
    desc: 'Powered by Restic, only changed chunks are backed up. Back up hundreds of gigabytes without re-sending files that haven\'t changed.',
  },
  {
    icon: '🎮',
    title: 'Save Game Auto-Detection',
    desc: 'Automatically detects save game folders from common game launchers (Steam, Epic, GOG) and Windows AppData paths. No manual hunting required.',
  },
  {
    icon: '⚙️',
    title: 'AppData & Config Backup',
    desc: 'Backs up browser profiles, developer tool configs, dotfiles, and critical AppData directories — everything you\'d need to restore your PC setup.',
  },
  {
    icon: '📁',
    title: 'Custom Folder Selection',
    desc: 'Add any folder you want backed up. Remove folders you don\'t need. Full control over what gets protected.',
  },
  {
    icon: '🗃️',
    title: 'Snapshot History',
    desc: 'Browse all past backup snapshots, see what was backed up and when, and restore specific snapshots to any location.',
  },
  {
    icon: '📅',
    title: 'Automated Scheduling',
    desc: 'Set hourly, daily, or weekly backup schedules that run silently in the background. Never forget to back up again.',
  },
  {
    icon: '♻️',
    title: 'Restore Wizard',
    desc: 'Select any snapshot and restore files directly to a destination of your choice. Fast, clean, and reliable.',
  },
];

export default function HazBackup() {
  const navigate = useNavigate();

  return (
    <div className="consumptioness-page">
      <div className="cp-back-btn" onClick={() => navigate('/')}>← Back to Projects</div>

      <header className="cp-header">
        <div className="cp-icon">
          <img src="/hazbackup-icon.png" alt="HazBackup" style={{ width: 56, height: 56, objectFit: 'contain' }} />
        </div>
        <h1 className="cp-title">HazBackup</h1>
        <p className="cp-subtitle">Encrypted, incremental backup &amp; restore<br />for Windows — powered by Restic</p>
        <div className="cp-version-badge">v1.0.0</div>
      </header>

      <div className="cp-download-section">
        <h2>Download</h2>
        <p className="cp-download-desc">Get the latest Windows build:</p>
        <div className="cp-download-grid">
          <a href="https://github.com/HazProject/HazBackup/releases"
             className="cp-download-card" target="_blank" rel="noopener noreferrer">
            <span className="cp-dl-icon">🪟</span>
            <span className="cp-dl-title">Windows 10 / 11 (64-bit)</span>
            <span className="cp-dl-desc">C# WPF · .NET 8 · Standalone · Includes Restic</span>
            <span className="cp-dl-badge">AES-256 Encrypted</span>
          </a>
        </div>
        <a href="https://github.com/HazProject/HazBackup" className="cp-github-link" target="_blank" rel="noopener noreferrer">
          🌟 View on GitHub
        </a>
      </div>

      <section className="cp-section">
        <h2>What is HazBackup?</h2>
        <p>
          A native Windows desktop backup &amp; restore application that wraps the battle-tested <strong>Restic</strong> engine.
          It automatically detects your <strong>save games, browser profiles, AppData configs, and developer dotfiles</strong>,
          backs them up with <strong>AES-256 encryption</strong> and incremental deduplication — so backups are fast, secure,
          and never take more disk space than they need to.
        </p>
      </section>

      <section className="cp-section">
        <h2>Features</h2>
        <div className="cp-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="cp-feature-card">
              <span className="cp-feature-icon">{f.icon}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <h2>System Requirements</h2>
        <div className="cp-reqs">
          <div className="cp-req-item">🪟 Windows 10 or 11 (64-bit)</div>
          <div className="cp-req-item">💾 ~100MB disk space (+ your backup data)</div>
          <div className="cp-req-item">🌐 Internet not required — local backups work offline</div>
          <div className="cp-req-item">🔑 .NET 8 Runtime (bundled in installer)</div>
        </div>
      </section>

      <section className="cp-section">
        <h2>What Gets Backed Up</h2>
        <div className="cp-reqs">
          <div className="cp-req-item">🎮 Steam, Epic, GOG, and Windows AppData save games</div>
          <div className="cp-req-item">🌐 Browser profiles (Chrome, Firefox, Edge)</div>
          <div className="cp-req-item">⚙️ Developer configs &amp; dotfiles (.gitconfig, .ssh, etc.)</div>
          <div className="cp-req-item">📂 AppData Roaming &amp; Local config directories</div>
          <div className="cp-req-item">📁 Any custom folders you add manually</div>
        </div>
      </section>

      <section className="cp-section">
        <h2>Tech Stack</h2>
        <div className="cp-tech-stack">
          <span className="cp-tech-tag">C# WPF (.NET 8)</span>
          <span className="cp-tech-tag">Restic Engine</span>
          <span className="cp-tech-tag">XAML / WindowChrome</span>
          <span className="cp-tech-tag">AES-256 Encryption</span>
          <span className="cp-tech-tag">JSON Config</span>
        </div>
      </section>

      <footer className="cp-footer">
        <p>Version 1.0.0 &middot; MIT License &middot; Made by <a href="https://github.com/HazProject" target="_blank" rel="noopener noreferrer">Haz</a></p>
      </footer>
    </div>
  );
}
