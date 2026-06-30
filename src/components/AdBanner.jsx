import React, { useEffect, useRef } from 'react';

/**
 * AdBanner Component
 * 
 * Renders an Adsterra 300x250 Banner unit dynamically.
 * 
 * @param {Object} props
 * @param {Object} [props.style] - Custom styles
 */
export const AdBanner = ({ style = {} }) => {
  const adContainerRef = useRef(null);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (isDev) return;
    if (!adContainerRef.current) return;

    // Clear any previous ad content
    adContainerRef.current.innerHTML = '';

    // Set Adsterra configurations globally
    window.atOptions = {
      'key': '65095e3e1d4df2d6cdbc9a57485f8ae2',
      'format': 'iframe',
      'height': 250,
      'width': 300,
      'params': {}
    };

    // Create the script element to invoke the ad
    const script = document.createElement('script');
    script.src = 'https://www.highperformanceformat.com/65095e3e1d4df2d6cdbc9a57485f8ae2/invoke.js';
    script.async = true;

    adContainerRef.current.appendChild(script);
  }, [isDev]);

  if (isDev) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          width: '300px',
          height: '250px',
          margin: '20px auto',
          boxSizing: 'border-box',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          textAlign: 'center',
          ...style
        }}
      >
        <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' }}>Sponsored</span>
        <div style={{ marginTop: '8px', fontWeight: '500' }}>Adsterra 300x250 Banner</div>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>
          Placeholder (Dev Mode)
        </div>
      </div>
    );
  }

  return (
    <div 
      className="ad-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '20px auto',
        width: '100%',
        minHeight: '250px',
        overflow: 'hidden',
        ...style
      }}
    >
      <div ref={adContainerRef} style={{ width: '300px', height: '250px' }} />
    </div>
  );
};
