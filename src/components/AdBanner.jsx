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
  const isDev = import.meta.env.DEV;

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

  // Inject Adsterra inside a sandboxed iframe to allow new tab clicks while blocking top-level redirects
  const adSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; overflow: hidden; background: transparent; }
        </style>
      </head>
      <body>
        <div id="ad-box"></div>
        <script type="text/javascript">
          window.atOptions = {
            'key': '65095e3e1d4df2d6cdbc9a57485f8ae2',
            'format': 'iframe',
            'height': 250,
            'width': 300,
            'params': {}
          };
          
          var script = document.createElement('script');
          script.src = 'https://www.highperformanceformat.com/65095e3e1d4df2d6cdbc9a57485f8ae2/invoke.js';
          script.async = true;
          document.body.appendChild(script);
        </script>
      </body>
    </html>
  `;

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
      <iframe
        title="Advertisement"
        srcDoc={adSrcDoc}
        width="300"
        height="250"
        scrolling="no"
        frameBorder="0"
        style={{ border: 'none', overflow: 'hidden' }}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      />
    </div>
  );
};
