'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { auth, db } from '../src/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDocs, collection, query, where, Timestamp } from 'firebase/firestore';

export default function Sidebar({ showRelatedGames = false, relatedGames = [] }) {
  const [activeTab, setActiveTab] = useState('login');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    members: 0,
    games: 0,
    posts: 0,
    online: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCommunityStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch total users
      let membersCount = 0;
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        membersCount = usersSnapshot.size;
      } catch (err) {
        console.warn('Failed to fetch users count:', err);
        if (err.code === 'permission-denied') {
          setError((prev) => prev || 'Members count unavailable (requires authentication)');
        } else {
          setError((prev) => prev || 'Unable to load members count');
        }
      }

      // Fetch total games
      let gamesCount = 0;
      try {
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        gamesCount = gamesSnapshot.size;
      } catch (err) {
        console.warn('Failed to fetch games count:', err);
        setError((prev) => prev || 'Unable to load games count');
      }

      // Fetch total posts
      let postsCount = 0;
      if (auth.currentUser) { // Only try if authenticated
        try {
          const postsSnapshot = await getDocs(collection(db, 'discussions'));
          postsCount = postsSnapshot.size;
        } catch (err) {
          console.warn('Failed to fetch posts count:', err);
          setError((prev) => prev || 'Unable to load posts count');
        }
      } else {
        setError((prev) => prev || 'Posts count unavailable (requires authentication)');
      }

      // Fetch online users (with fallback)
      let onlineCount = 0;
      if (auth.currentUser) { // Only try if authenticated
        try {
          const fiveMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
          const onlineQuery = query(
            collection(db, 'users'),
            where('lastActive', '>=', fiveMinutesAgo)
          );
          const onlineSnapshot = await getDocs(onlineQuery);
          onlineCount = onlineSnapshot.size;
        } catch (err) {
          console.warn('Failed to fetch online users count:', err);
          onlineCount = Math.floor(Math.random() * 100) + 50; // Fallback: 50-150
          setError((prev) => prev || 'Online users count unavailable; showing estimate');
        }
      } else {
        onlineCount = Math.floor(Math.random() * 100) + 50; // Fallback: 50-150
        setError((prev) => prev || 'Online users count unavailable (requires authentication)');
      }

      setStats({
        members: membersCount,
        games: gamesCount,
        posts: postsCount,
        online: onlineCount,
      });
    } catch (err) {
      console.error('Unexpected error fetching community stats:', err);
      setError('Failed to load community stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchCommunityStats();

    return () => unsubscribe();
  }, []);

  return (
    <div className="col-lg-3">
      {/* Community Stats */}
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Community Stats</span>
          <i
            className="fas fa-sync-alt icon-glow"
            style={{ cursor: 'pointer' }}
            title="Refresh stats"
            onClick={() => {
              setLoading(true);
              fetchCommunityStats();
            }}
          ></i>
        </div>
        <div className="card-body p-2">
          {loading ? (
            <div className="text-center">
              <i className="fas fa-spinner fa-spin me-2"></i>Loading stats...
            </div>
          ) : error ? (
            <div className="text-danger small text-center">
              {error}
              <button className="btn btn-sm btn-primary ms-2" onClick={fetchCommunityStats}>
                Retry
              </button>
            </div>
          ) : (
            <div className="game-stat p-3 rounded">
              <div className="d-flex justify-content-between mb-1 small">
                <span><i className="fas fa-users me-1 icon-glow"></i>Members:</span>
                <span className="fw-bold">{stats.members.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-1 small">
                <span><i className="fas fa-gamepad me-1 icon-glow"></i>Games:</span>
                <span className="fw-bold">{stats.games.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-1 small">
                <span><i className="fas fa-comment me-1 icon-glow"></i>Posts:</span>
                <span className="fw-bold">{stats.posts.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span><i className="fas fa-user me-1 icon-glow"></i>Online:</span>
                <span className="text-light-custom fw-bold">{stats.online.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User-Specific Section or Login/Register Tabs */}
      <div className="card mb-3">
        {user ? (
          <>
            <div className="card-header">
              <span>Welcome, {user.displayName || user.email}!</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-2">
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
                  <div className="mb-2">
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
                  <div className="mb-2">
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
                  <div className="mb-2">
                    <input type="text" placeholder="Username" className="form-control form-control-sm bg-dark border-secondary" />
                  </div>
                  <div className="mb-2">
                    <input type="email" placeholder="Email" className="form-control form-control-sm bg-dark border-secondary" />
                  </div>
                  <div className="mb-2">
                    <input type="password" placeholder="Password" className="form-control form-control-sm bg-dark border-secondary" />
                  </div>
                  <button className="btn btn-secondary btn-sm w-100">Create Account</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Quick Links */}
      <div className="card mb-3">
        <div className="card-header">
          <i className="fas fa-link me-2 icon-glow"></i>Quick Links
        </div>
        <div>
          <Link href="/leaderboards" className="nav-link d-block p-3 border-bottom">
            <i className="fas fa-trophy me-2 text-primary-custom icon-glow"></i>Leaderboards
          </Link>
          <Link href="/rom-hacks" className="nav-link d-block p-3 border-bottom">
            <i className="fas fa-download me-2 text-primary-custom icon-glow"></i>ROM Hacks
          </Link>
          <Link href="/streamers" className="nav-link d-block p-3 border-bottom">
            <i className="fas fa-microphone me-2 text-primary-custom icon-glow"></i>Streamers
          </Link>
          <Link href="/music" className="nav-link d-block p-3">
            <i className="fas fa-headphones me-2 text-primary-custom icon-glow"></i>Game Music
          </Link>
        </div>
      </div>

      {/* Related Games (Optional) */}
      {showRelatedGames && (
        <div className="card mb-3">
          <div className="card-header">
            <i className="fas fa-gamepad me-2 icon-glow"></i>Related Games
          </div>
          <div className="card-body p-0">
            {relatedGames.map((related, index) => (
              <div
                key={index}
                className={`d-flex align-items-center p-3 ${index < relatedGames.length - 1 ? 'border-bottom' : ''}`}
              >
                <Image
                  src={related.image || '/api/placeholder/75/50'}
                  width={75}
                  height={50}
                  className="me-2 rounded"
                  style={{ objectFit: 'cover' }}
                  alt={`${related.title} thumbnail`}
                />
                <div>
                  <h6 className="mb-0">{related.title}</h6>
                  <small className="text-muted">{related.system} | {related.genre}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}