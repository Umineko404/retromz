'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { auth } from '../src/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

let globalIframe = null;

export default function Sidebar({ pageId = 'default' }) {
  const [activeTab, setActiveTab] = useState('login');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeContainerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Create iframe only once globally
    if (!globalIframe) {
      globalIframe = document.createElement('iframe');
      globalIframe.src = 'https://thelounge-production.up.railway.app';
      globalIframe.title = 'Community IRC Chat';
      globalIframe.className = 'w-100';
      globalIframe.style.cssText = 'height: 600px; border: none; min-height: 400px;';
      globalIframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups';
      globalIframe.allow = 'encrypted-media';
      globalIframe.onload = () => setIsLoading(false);
    }

    // Move the iframe to this component's container
    if (iframeContainerRef.current && globalIframe) {
      iframeContainerRef.current.appendChild(globalIframe);
      setIsLoading(false);
    }

    // Cleanup: don't remove the iframe, just detach it
    return () => {
      if (globalIframe && globalIframe.parentNode) {
        globalIframe.parentNode.removeChild(globalIframe);
      }
    };
  }, []);

  return (
    <div className="col-lg-3">
      {/* User-Specific Section or Login/Register Tabs */}
      <div className="card mb-3">
        {user ? (
          <>
            <div className="card-header">
              <span>Welcome, {user.displayName || user.email}!</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                <Link href="/profile" className="btn btn-primary btn-sm">
                  <i className="fas fa-user me-2 icon-glow"></i>View Profile
                </Link>
                <Link href="/recent-activity" className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-history me-2 icon-glow"></i>Recent Activity
                </Link>
                <Link href="/favorites" className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-heart me-2 icon-glow"></i>Favorites
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card-header p-0">
              <div className="nav-tabs d-flex">
                <button
                  className={`nav-tab flex-fill text-center ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
                <button
                  className={`nav-tab flex-fill text-center ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => setActiveTab('register')}
                >
                  Register
                </button>
              </div>
            </div>
            <div className="card-body p-3">
              {activeTab === 'login' ? (
                <div>
                  <div className="mb-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-dark border-secondary">
                        <i className="fas fa-user"></i>
                      </span>
                      <input
                        type="text"
                        placeholder="Username"
                        className="form-control form-control-sm bg-dark border-secondary"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-dark border-secondary">
                        <i className="fas fa-lock"></i>
                      </span>
                      <input
                        type="password"
                        placeholder="Password"
                        className="form-control form-control-sm bg-dark border-secondary"
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="d-flex align-items-center text-muted">
                      <input type="checkbox" className="me-2" />
                      Remember
                    </label>
                    <button className="btn btn-primary btn-sm">Login</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <input type="text" placeholder="Username" className="form-control form-control-sm bg-dark border-secondary" />
                  </div>
                  <div className="mb-3">
                    <input type="email" placeholder="Email" className="form-control form-control-sm bg-dark border-secondary" />
                  </div>
                  <div className="mb-3">
                    <input type="password" placeholder="Password" className="form-control form-control-sm bg-dark border-secondary" />
                  </div>
                  <button className="btn btn-secondary btn-sm w-100">Create Account</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* IRC Chat */}
      <div className="card mb-3 irc-chat-card">
        <div className="card-header">
          <i className="fas fa-comments me-1 icon-glow"></i>Community IRC Chat
        </div>
        <div className="card-body p-3">
          {isLoading && <div>Loading chat...</div>}
          <div ref={iframeContainerRef} className="iframe-container">
            {/* The persistent iframe will be moved here */}
          </div>
        </div>
      </div>
    </div>
  );
}