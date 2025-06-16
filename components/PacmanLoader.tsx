
'use client';

import { useState, useEffect } from 'react';

interface PacmanLoaderProps {
  message?: string;
}

export default function PacmanLoader({ message = "Loading..." }: PacmanLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pacman-loader-overlay">
      <div className="pacman-loader-content">
        <div className="pacman-container">
          <div className="pacman">
            <div className="pacman-top"></div>
            <div className="pacman-bottom"></div>
          </div>
          <div className="dots-trail">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
            <div className="dot dot-4"></div>
          </div>
        </div>
        <h2 className="pacman-message">{message}{dots}</h2>
      </div>
    </div>
  );
}
