import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import ProjectCard from './components/ProjectCard';
import { DocMarker } from './pages/DocMarker';

/* -------------------------------------------------------
   LOGO — inline SVG (always renders, no file deps)
------------------------------------------------------- */
const LogoMark = () => (
  <svg
    className="logo-mark"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <filter id="lg" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc"/>
        <stop offset="100%" stopColor="#a8d8ea"/>
      </linearGradient>
    </defs>
    {/* Outer diamond */}
    <polygon points="22,2 40,22 22,42 4,22" fill="url(#dg)" filter="url(#lg)" opacity="0.95"/>
    {/* Inner cutout */}
    <polygon points="22,10 34,22 22,34 10,22" fill="#0d0b15"/>
    {/* Center cross */}
    <line x1="22" y1="16" x2="22" y2="28" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    <line x1="16" y1="22" x2="28" y2="22" stroke="#a8d8ea" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    {/* Center dot */}
    <circle cx="22" cy="22" r="2.2" fill="#ffffff" opacity="0.9" filter="url(#lg)"/>
    {/* Sparkle top-right */}
    <circle cx="36" cy="8" r="1.4" fill="#ffc3a0" opacity="0.9" filter="url(#lg)"/>
    <line x1="36" y1="5.5" x2="36" y2="10.5" stroke="#ffc3a0" strokeWidth="0.8" opacity="0.7"/>
    <line x1="33.5" y1="8" x2="38.5" y2="8" stroke="#ffc3a0" strokeWidth="0.8" opacity="0.7"/>
    {/* Accent dot bottom-left */}
    <circle cx="9" cy="36" r="1.1" fill="#a8d8ea" opacity="0.7" filter="url(#lg)"/>
  </svg>
);

/* -------------------------------------------------------
    PROJECTS DATA — add / remove projects here
------------------------------------------------------- */
const PROJECTS = [
  {
    id: 'sorter',
    icon: '🗂️',
    tag: 'Tool',
    title: 'MRN AutoSorter',
    desc: 'Upload an Excel file to automatically sort and separate MRN records. Includes a sample Patient Register (Jan 2026). Shoplot MRN rows are moved to the bottom with a gold divider.',
    link: '/sorter/index.html',
    tech: ['ExcelJS', 'Firebase', 'Vanilla JS'],
  },
  {
    id: 'doc-marker',
    icon: '📄',
    tag: 'Tool',
    title: 'Document Mark Detector',
    desc: 'Upload documents (PDF/images) to automatically detect marks/checkmarks and convert to Excel with intelligent sorting. Includes ML-based detection and manual review capabilities.',
    link: '/doc-marker',
    tech: ['React', 'TensorFlow.js', 'PDF.js', 'Tesseract.js', 'ExcelJS'],
  },
  {
    id: 'renta',
    icon: '🏠',
    tag: 'App',
    title: 'R3nta',
    desc: 'A modern rental marketplace for listing, browsing, and booking properties with an intuitive user experience.',
    link: 'https://r3nta.ddns.net/',
    tech: ['React', 'Firebase'],
  },
  // ← Add more projects here
];

const BRAND_COLORS = ['#c084fc', '#a8d8ea', '#ffc3a0'];

/* -------------------------------------------------------
   APP
------------------------------------------------------- */
export default function App() {
  const bgRef    = useRef(null);
  const trailRef = useRef(null);
  const snowRef  = useRef(null);

  /* ── Ambient cursor drift background ── */
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    let raf;
    let mouseX = 50, mouseY = 50, curX = 50, curY = 50;
    const onMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 100;
      mouseY = (e.clientY / window.innerHeight) * 100;
    };
    const animate = () => {
      curX += (mouseX - curX) * 0.06;
      curY += (mouseY - curY) * 0.06;
      el.style.setProperty('--cx', `${curX}%`);
      el.style.setProperty('--cy', `${curY}%`);
      raf = requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  /* ── Cursor trail — glowing ring particles ── */
  useEffect(() => {
    const canvas = trailRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();

    const particles = [];

    const onMove = (e) => {
      // Spawn 2 particles per frame on movement
      for (let i = 0; i < 2; i++) {
        const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          r: Math.random() * 3.5 + 1.5,   // radius
          alpha: 0.85,
          color,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * 1.2 + 0.3), // drift upward
          decay: Math.random() * 0.022 + 0.014,
        });
      }
    };

    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.02; // slight gravity pull
        p.r  *= 0.978;
        p.alpha -= p.decay;
        if (p.alpha <= 0 || p.r < 0.3) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        // Glowing ring (stroke only — no fill → hollow like a tiny halo)
        ctx.shadowBlur  = 10;
        ctx.shadowColor = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        // Tiny bright center dot
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.fillStyle   = '#ffffff';
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ── Snow / floating particles ── */
  useEffect(() => {
    const canvas = snowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();

    const COUNT = 70;
    const flakes = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 1.6 + 0.4,
      speed: Math.random() * 0.55 + 0.2,
      drift: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.35 + 0.08,
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
      twinkle: Math.random() * Math.PI * 2, // phase offset
    }));

    let raf;
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      for (const f of flakes) {
        f.y += f.speed;
        f.x += f.drift;
        // gentle horizontal sway
        f.x += Math.sin(frame * 0.008 + f.twinkle) * 0.18;

        if (f.y > canvas.height + 4) { f.y = -4; f.x = Math.random() * canvas.width; }
        if (f.x > canvas.width + 4)  f.x = -4;
        if (f.x < -4)                f.x = canvas.width + 4;

        // subtle twinkle
        const twinkledAlpha = f.alpha * (0.75 + 0.25 * Math.sin(frame * 0.04 + f.twinkle));

        ctx.save();
        ctx.globalAlpha = twinkledAlpha;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = f.color;
        ctx.fillStyle   = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Router>
      {/* Static animated orbs */}
      <div className="orb-container" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Ambient cursor drift background */}
      <div className="cursor-bg" ref={bgRef} aria-hidden="true" />

      {/* Snow / floating particles */}
      <canvas ref={snowRef} className="fx-canvas" aria-hidden="true" />

      {/* Cursor trail */}
      <canvas ref={trailRef} className="fx-canvas fx-trail" aria-hidden="true" />

      <Routes>
        <Route path="/" element={
          <div className="page-wrapper">
            {/* Header */}
            <header className="site-header">
              <LogoMark />
              <span className="site-title">haz.</span>
            </header>

            {/* Projects section */}
            <main>
              <h1 className="section-heading">Projects</h1>
              <p className="section-sub">A curated collection of things I've built.</p>

              <div className="project-grid">
                {PROJECTS.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </main>
          </div>
        } />
        <Route path="/doc-marker" element={<DocMarker />} />
      </Routes>
    </Router>
  );
}
