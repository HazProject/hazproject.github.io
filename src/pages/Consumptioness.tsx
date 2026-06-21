import React from 'react';
import { useNavigate } from 'react-router-dom';
import './consumptioness.css';

const FEATURES = [
  {
    icon: '🖥️',
    title: 'Auto Hardware Detection',
    desc: 'Detects your CPU, GPU, RAM, and storage via WMI (Windows) or systeminformation (Electron). No manual input — just click "Scan". 500+ CPU & 300+ GPU TDP values included.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Power Monitoring',
    desc: 'Live wattage updates every second based on actual CPU & GPU load. Watch your power draw change as you work, game, or idle.',
  },
  {
    icon: '💰',
    title: 'TNB Malaysia Tariff',
    desc: 'Uses TNB Tariff A (Residential) progressive block pricing — 21.8 to 57.1 sen/kWh. Auto-calculates your cost in Malaysian Ringgit (RM).',
  },
  {
    icon: '📊',
    title: 'Cost Breakdown',
    desc: 'See exactly how much your PC costs per hour, day, month, and year. Includes standby/idle cost estimates so you can save on electricity.',
  },
  {
    icon: '💤',
    title: 'Standby Mode Estimate',
    desc: 'Estimates power draw and cost when your PC is idle or sleeping. Helps you decide when to turn off vs leave on.',
  },
  {
    icon: '📄',
    title: 'Export Reports',
    desc: 'Export professional reports to PDF or Excel (.xlsx) with one click. Includes hardware specs, live readings, cost breakdowns, and TNB tariff data.',
  },
  {
    icon: '🔄',
    title: 'Auto Update Checker',
    desc: 'Automatically checks for new versions on startup. One-click download and install. Always up to date.',
  },
];

const TARIFF_BLOCKS = [
  { block: 'Block 1', range: '1–200 kWh', rate: '21.8' },
  { block: 'Block 2', range: '201–300 kWh', rate: '33.4' },
  { block: 'Block 3', range: '301–600 kWh', rate: '51.6' },
  { block: 'Block 4', range: '601–900 kWh', rate: '54.6' },
  { block: 'Block 5', range: '901+ kWh', rate: '57.1' },
];

export default function Consumptioness() {
  const navigate = useNavigate();

  return (
    <div className="consumptioness-page">
      <div className="cp-back-btn" onClick={() => navigate('/')}>← Back to Projects</div>

      <header className="cp-header">
        <div className="cp-icon">⚡</div>
        <h1 className="cp-title">Consumptioness</h1>
        <p className="cp-subtitle">PC Power Consumption Calculator<br />for Malaysia</p>
        <div className="cp-version-badge">v0.0.1</div>
      </header>

      <div className="cp-download-section">
        <h2>Download</h2>
        <p className="cp-download-desc">Choose the version that suits you:</p>
        <div className="cp-download-grid">
          <a href="https://github.com/HazProject/Consumptioness/releases/download/v0.0.1/Consumptioness-v0.0.1-win64.zip"
             className="cp-download-card" target="_blank" rel="noopener noreferrer">
            <span className="cp-dl-icon">🪟</span>
            <span className="cp-dl-title">C# Native (Recommended)</span>
            <span className="cp-dl-desc">~82 MB · Windows 10/11 · Self-contained</span>
            <span className="cp-dl-badge">Best hardware detection</span>
          </a>
          <a href="https://github.com/HazProject/Consumptioness/releases/tag/v0.0.1"
             className="cp-download-card" target="_blank" rel="noopener noreferrer">
            <span className="cp-dl-icon">🌐</span>
            <span className="cp-dl-title">Electron (Source)</span>
            <span className="cp-dl-desc">Build from source · Cross-platform</span>
            <span className="cp-dl-badge">View release page</span>
          </a>
        </div>
        <a href="https://github.com/HazProject/Consumptioness" className="cp-github-link" target="_blank" rel="noopener noreferrer">
          🌟 View on GitHub
        </a>
      </div>

      <section className="cp-section">
        <h2>What is Consumptioness?</h2>
        <p>
          A desktop app that auto-detects your PC hardware and calculates real-time power consumption
          using <strong>TNB Malaysia tariff rates</strong>. No manual input needed — just click <strong>"Scan My PC"</strong>
          and it automatically identifies your components, estimates power draw, and shows your running cost
          in <strong>Malaysian Ringgit (RM)</strong>.
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
          <div className="cp-req-item">💾 100MB disk space (C#) / 500MB (Electron)</div>
          <div className="cp-req-item">🌐 Internet connection for updates only</div>
        </div>
      </section>

      <section className="cp-section">
        <h2>Supported Hardware (Auto-Detect)</h2>
        <div className="cp-reqs">
          <div className="cp-req-item">🖥️ Intel Core i3/i5/i7/i9/Ultra series</div>
          <div className="cp-req-item">🖥️ AMD Ryzen 3/5/7/9/Threadripper series</div>
          <div className="cp-req-item">🎮 NVIDIA GeForce GTX / RTX series</div>
          <div className="cp-req-item">🎮 AMD Radeon RX series & Intel Arc</div>
          <div className="cp-req-item">💾 500+ CPU & 300+ GPU TDP values in database</div>
          <div className="cp-req-item">💽 All DDR4/DDR5 RAM, SATA/NVMe SSDs & HDDs</div>
        </div>
      </section>

      <section className="cp-section">
        <h2>TNB Tariff (Tariff A — Residential)</h2>
        <div className="cp-tariff-table">
          <div className="cp-tariff-header">
            <span>Block</span>
            <span>kWh Range</span>
            <span>sen/kWh</span>
            <span>RM/kWh</span>
          </div>
          {TARIFF_BLOCKS.map((t, i) => (
            <div key={i} className="cp-tariff-row">
              <span>{t.block}</span>
              <span>{t.range}</span>
              <span>{t.rate}</span>
              <span>{(Number(t.rate) / 100).toFixed(4)}</span>
            </div>
          ))}
        </div>
        <p className="cp-tariff-note">*Rates based on TNB's latest published tariff schedule. Subject to change.</p>
      </section>

      <section className="cp-section">
        <h2>Tech Stack</h2>
        <div className="cp-tech-stack">
          <span className="cp-tech-tag">C# WPF (.NET 8)</span>
          <span className="cp-tech-tag">Electron + React</span>
          <span className="cp-tech-tag">systeminformation</span>
          <span className="cp-tech-tag">WMI / Performance Counters</span>
          <span className="cp-tech-tag">QuestPDF / ClosedXML</span>
          <span className="cp-tech-tag">jsPDF / ExcelJS</span>
          <span className="cp-tech-tag">electron-updater</span>
        </div>
      </section>

      <footer className="cp-footer">
        <p>Version 0.0.1 &middot; MIT License &middot; Made by <a href="https://github.com/HazProject" target="_blank" rel="noopener noreferrer">Haz</a></p>
      </footer>
    </div>
  );
}
