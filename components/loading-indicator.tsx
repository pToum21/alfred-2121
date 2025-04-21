// components/LoadingIndicator.tsx
import React, { useEffect, useRef } from 'react';

const LoadingIndicator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const path = svg.querySelector('path');
    if (!path) return;

    const originalD = path.getAttribute('d');
    if (!originalD) return;

    const animate = () => {
      const t = (performance.now() / 1000) % 5; // 5-second loop
      const progress = t / 5;

      // Generate a morphed path
      const morphedPath = originalD.split(/(?=[MLZ])/).map(cmd => {
        const type = cmd[0];
        const coords = cmd.slice(1).split(',').map(Number);
        
        if (type === 'M' || type === 'L') {
          const noise = Math.sin(progress * Math.PI * 2 + coords[0] / 10) * 20;
          return `${type}${coords[0] + noise},${coords[1] + noise}`;
        }
        return cmd;
      }).join('');

      path.setAttribute('d', morphedPath);

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="loading-indicator">
      <style jsx>{`
        .loading-indicator {
          width: 200px;
          height: 200px;
          margin: auto;
          position: relative;
        }
        
        .logo-path {
          fill: none;
          stroke: #2c7359;
          stroke-width: 4px;
          filter: drop-shadow(0 0 10px rgba(44, 115, 89, 0.7));
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <svg ref={svgRef} viewBox="0 0 221.96 231.92" xmlns="http://www.w3.org/2000/svg">
        <path 
          className="logo-path" 
          d="M34.33,231.92l29.11-54.75,64.63,28.41,59.66,26.33h0s14.94,0,14.94,0c10.82-1.05,19.28-10.17,19.28-21.27,0-3.28-.74-6.39-2.06-9.17l-1.05-1.95-60-110.97-23.67,44.52,20.18,37.95c-.75-.29-1.49-.61-2.21-.99l-69.58-30.71,3.33-6.25,24.15-45.41,23.47-44.14L110.98,0l-23.47,43.41-24.35,45.03L2.92,199.87l-.71,1.31c-1.42,2.86-2.21,6.07-2.21,9.47,0,11.1,8.46,20.22,19.28,21.27h15.05Z"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{
            animation: 'dash 5s linear infinite alternate'
          }}
        />
      </svg>
    </div>
  );
};

export default LoadingIndicator;