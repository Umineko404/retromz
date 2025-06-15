'use client';
import { useEffect, useState } from 'react';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default function IRCChatPage() {
  const { isLoading, progress, loadingTitle, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState(null);
  
  const ircUrl = `https://thelounge-production.up.railway.app/?theme=${theme}`;
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadIRCChat = async () => {
      try {
        await onDataLoad('Community IRC Chat');
      } catch (error) {
        console.error('Error loading IRC chat:', error);
      }
    };
    loadIRCChat();
  }, [onDataLoad]);

  if (isLoading) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading IRC chat">
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
    <>
      <Navbar theme={theme} setTheme={toggleTheme} user={user} />
      <div className="container pb-0" style={{ paddingTop: '50px' }}>
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">
                    <i className="fas fa-comments me-2 text-primary-custom"></i>
                    Community IRC Chat
                  </h3>
                  {user && (
                    <small className="text-secondary-custom">
                      Welcome, {user.displayName || user.email}!
                    </small>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                <div className="irc-chat-container">
                  <iframe
                    src={ircUrl}
                    width="100%" 
                    height="900px"
                    frameBorder="0"
                    title="Community IRC Chat"
                    style={{ border: 'none', display: 'block' }}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}