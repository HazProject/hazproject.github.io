import React, { useEffect } from 'react';

/**
 * AdBanner Component
 * 
 * Renders a Google AdSense ad unit with a fixed aspect ratio or height
 * to prevent Layout Shifts (CLS) and maintain a premium user experience.
 * In development mode, it displays a stylish mockup placeholder.
 * 
 * @param {Object} props
 * @param {string} props.client - Your AdSense publisher ID (e.g., 'ca-pub-XXXXXXXXXXXXXXXX')
 * @param {string} props.slot - Your AdSense slot ID (e.g., 'XXXXXXXXXX')
 * @param {string} [props.format='auto'] - Ad format: 'auto', 'rectangle', 'horizontal', etc.
 * @param {boolean} [props.responsive=true] - Whether the ad is responsive
 * @param {string} [props.style] - Custom styles
 */
export const AdBanner = ({
  client = 'ca-pub-4605730685751024',
  slot = 'XXXXXXXXXX',
  format = 'auto',
  responsive = true,
  style = {}
}) => {
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (isDev) return;

    try {
      // Push the ad to the Google AdSense queue once loaded
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense failed to load:', e);
    }
  }, [isDev]);

  if (isDev) {
    // Show a beautiful mockup ad in development mode to simulate visual layout
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
          padding: '20px',
          margin: '20px 0',
          minHeight: format === 'horizontal' ? '90px' : '250px',
          width: '100%',
          boxSizing: 'border-box',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          textAlign: 'center',
          ...style
        }}
      >
        <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' }}>Sponsored</span>
        <div style={{ marginTop: '8px', fontWeight: '500' }}>Ad Placeholder (Dev Mode)</div>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>
          Format: {format} | Slot: {slot}
        </div>
      </div>
    );
  }

  // Production Google AdSense markup
  return (
    <div 
      className="ad-container"
      style={{
        margin: '20px 0',
        overflow: 'hidden',
        minHeight: format === 'horizontal' ? '90px' : '250px',
        width: '100%',
        ...style
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
