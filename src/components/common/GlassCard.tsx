import React from 'react'
import './common.css'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => (
  <div className={`glass-card ${className}`}>{children}</div>
)