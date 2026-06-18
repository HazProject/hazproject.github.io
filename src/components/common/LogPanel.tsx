import React, { useEffect, useRef } from 'react'
import './common.css'

interface LogEntry {
  message: string
  type: 'info' | 'warn' | 'error' | 'success'
  timestamp: Date
}

interface LogPanelProps {
  entries: LogEntry[]
  className?: string
}

export const LogPanel: React.FC<LogPanelProps> = ({ entries, className = '' }) => {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [entries])

  return (
    <div ref={logRef} className={`log-panel ${className}`}>
      {entries.length === 0 ? (
        <div className="text-muted">No log entries</div>
      ) : (
        entries.map((entry, index) => (
          <div key={index} className={`log-entry ${entry.type}`}>
            [{entry.timestamp.toLocaleTimeString()}] {entry.message}
          </div>
        ))
      )}
    </div>
  )
}