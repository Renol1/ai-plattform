import React from 'react';

export default function CodeLogo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <div className={`logo-box${compact ? ' compact' : ''} ${className}`} aria-label="RENSTROM – KREATIV INTELLIGENS">
      <h1 className="logo">RENSTROM</h1>
      <p className="tagline">KREATIV INTELLIGENS</p>
      {/* @ts-expect-error styled-jsx prop is provided by Next.js runtime */}
      <style jsx>{`
        .logo-box {
          display: inline-block;
          background: transparent;
          border: 4px solid #7d3fc3;
          border-radius: 25px;
          box-shadow: 0 0 10px #9b59b6, 0 0 30px #8e44ad, 0 0 60px #7d3fc3;
          padding: 60px 120px;
          text-align: center;
          transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
        .logo-box:hover {
          box-shadow: 0 0 14px #9b59b6, 0 0 40px #8e44ad, 0 0 90px #7d3fc3;
          transform: translateY(-1px);
        }
        .logo {
          margin: 0;
          font-family: 'Orbitron', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #3c1361;
          text-shadow: 0 0 10px #8e44ad, 0 0 25px #7d3fc3;
          font-size: clamp(28px, 6vw, 64px);
          line-height: 1.05;
        }
        .tagline {
          margin: 10px 0 0;
          font-family: 'Orbitron', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #5e2d91;
          text-shadow: 0 0 10px #9b59b6;
          font-size: clamp(12px, 2.8vw, 20px);
        }

        /* Compact header variant */
        .logo-box.compact {
          padding: 10px 16px;
          border-radius: 14px;
          box-shadow: 0 0 6px #9b59b6, 0 0 16px #8e44ad, 0 0 28px #7d3fc3;
        }
        .logo-box.compact .logo {
          font-size: clamp(14px, 2.6vw, 24px);
          letter-spacing: 0.18em;
          text-shadow: 0 0 6px #8e44ad, 0 0 14px #7d3fc3;
        }
        .logo-box.compact .tagline {
          font-size: clamp(9px, 1.6vw, 12px);
          letter-spacing: 0.32em;
          margin-top: 4px;
          text-shadow: 0 0 5px #9b59b6;
        }
      `}</style>
    </div>
  );
}
