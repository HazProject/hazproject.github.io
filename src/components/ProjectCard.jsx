import React from 'react'
import './ProjectCard.css'

export default function ProjectCard({ project }) {
  return (
    <a href={project.link} className="project-card" target="_blank" rel="noopener noreferrer">
      <div className="project-icon">{project.icon}</div>
      <div className="project-content">
        <div className="project-header">
          <span className="project-tag">{project.tag}</span>
          <h3 className="project-title">{project.title}</h3>
        </div>
        <p className="project-desc">{project.desc}</p>
        <div className="project-tech">
          {project.tech.map((tech, index) => (
            <span key={index} className="tech-tag">{tech}</span>
          ))}
        </div>
      </div>
    </a>
  )
}