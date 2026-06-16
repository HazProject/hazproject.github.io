import React from 'react';

export default function ProjectCard({ project }) {
  const { icon, tag, title, desc, link, tech } = project;

  const isExternal = link && link.startsWith('http');

  return (
    <a
      href={link}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="project-card"
      aria-label={`Open ${title}`}
    >
      <div className="card-top">
        <div className="card-icon">{icon}</div>
        {tag && <span className="card-tag">{tag}</span>}
      </div>

      <h2 className="card-title">{title}</h2>
      <p className="card-desc">{desc}</p>

      <div className="card-footer">
        <span className="card-link">
          Visit project <span aria-hidden="true">→</span>
        </span>
        <div className="card-tech-list">
          {tech && tech.map((t) => (
            <span key={t} className="card-tech">{t}</span>
          ))}
        </div>
      </div>
    </a>
  );
}
