'use client';
import { useState, useEffect } from 'react';

interface EmulatorPlayerProps {
  romPath: string;
}

export default function EmulatorPlayer({ romPath }: EmulatorPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeSrc = `/emulator.html?rom=${encodeURIComponent(romPath)}`;

  useEffect(() => {
    // Validate ROM extension
    if (!romPath || !romPath.match(/\.(nes|sfc|smc|gba|gb|gbc|n64|bin|gen|smd|md|nds)$/i)) {
      setError('Invalid or unsupported ROM file format.');
      setIsLoading(false);
      return;
    }

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        setError('Emulator failed to load. Please check the ROM or emulator resources.');
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [romPath, isLoading]);

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="emulator-container" style={{ position: 'relative', width: '100%', height: '500px' }}>
      {isLoading && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div className="text-center text-white">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading Emulator...</p>
          </div>
        </div>
      )}
      <iframe
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="EmulatorJS"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}