'use client';
import { useEffect, useState } from 'react';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';

export default function ForumPage() {
  const { isLoading, progress, loadingTitle, loadingText, onDataLoad } = useThemeAwareLoader();
  
  const forumUrl = 'https://retromzforums.infinityfreeapp.com/';

  useEffect(() => {
    const loadForum = async () => {
      try {
        await onDataLoad('Community Forum');
      } catch (error) {
        console.error('Error loading forum:', error);
      }
    };

    loadForum();
  }, [onDataLoad]);

  if (isLoading) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading community forum">
        <div className="loading-content">
          <h1 className="loading-title">{loadingTitle}</h1>
          <div className="loading-spinner"></div>
          <div className="loading-progress">
            <div className="loading-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="loading-text">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-page">
      <iframe
        src={forumUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Community Forum"
        style={{ border: 'none', display: 'block' }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        loading="lazy"
      />
    </div>
  );
}