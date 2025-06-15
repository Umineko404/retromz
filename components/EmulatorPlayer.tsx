'use client';
import { useState, useEffect } from 'react';

interface EmulatorPlayerProps {
  romPath: string;
}

export default function EmulatorPlayer({ romPath }: EmulatorPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeSrc = `/emulator.html?rom=${encodeURIComponent(romPath)}`;

  useEffect(() => {
    // Validate ROM extension - added z64 and v64 for N64
    if (!romPath || !romPath.match(/\.(nes|sfc|smc|gba|gb|gbc|n64|z64|v64|bin|gen|smd|md|nds)$/i)) {
      setError('Invalid or unsupported ROM file format.');
      setIsLoading(false);
      return;
    }

    // Timeout to prevent infinite loading - slightly longer for N64
    const isN64 = romPath.match(/\.(n64|z64|v64)$/i);
    const timeout = setTimeout(() => {
      if (isLoading) {
        setError('Emulator failed to load. Please check the ROM or emulator resources.');
        setIsLoading(false);
      }
    }, isN64 ? 20000 : 10000); // 20s for N64, 10s for others

    return () => clearTimeout(timeout);
  }, [romPath, isLoading]);

  if (error) {
    return (
      <div className="alert alert-danger text-center">
        <h4>Emulator Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="position-relative">
      {isLoading && (
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2">
            <strong>Loading Emulator...</strong>
          </div>
        </div>
      )}
      <iframe
        src={iframeSrc}
        width="100%"
        height="600"
        frameBorder="0"
        title="Game Emulator"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}