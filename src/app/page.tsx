'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useThemeAwareLoader } from './hooks/useThemeAwareLoader';

interface Game {
  id: string;
  title: string;
  system: string;
  console?: string;
  players: string;
  image: string;
}

interface GamingSystem {
  name: string;
  shortName: string;
  games: string;
  tooltip: string;
  image: string;
}

export default function HomePage() {
  const { isLoading, progress, loadingTitle, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState<any>(null);
  const [gamingSystems, setGamingSystems] = useState<GamingSystem[]>([]);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [showForumIframe, setShowForumIframe] = useState(false);

  const forumUrl = `https://retromzforums.infinityfreeapp.com/`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const fetchData = async () => {
      try {
        await onDataLoad('Homepage Data');
        const consolesSnapshot = await getDocs(collection(db, 'consoles'));
        const systems = consolesSnapshot.docs.map((doc) => ({
          name: doc.data().name,
          shortName: doc.data().shortName,
          games: `${doc.data().gamesCount || 0}+ Games`,
          tooltip: `Browse ${doc.data().gamesCount || 0}+ ${doc.data().name} games`,
          image: doc.data().imageUrl || `/images/${doc.data().shortName}-Controller-Flat.png`,
        }));
        setGamingSystems(systems);

        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const games = gamesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            system: doc.data().system || '',
            console: doc.data().console,
            playingCount: doc.data().playingCount,
            coverImageUrl: doc.data().coverImageUrl,
          }))
          .sort((a, b) => (b.playingCount || 0) - (a.playingCount || 0))
          .slice(0, 3);
        setPopularGames(
          games.map((game) => ({
            id: game.id,
            title: game.title,
            system: game.system,
            console: game.console,
            players: `${game.playingCount || 0} playing`,
            image: game.coverImageUrl || 'https://via.placeholder.com/300',
          }))
        );
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    return () => unsubscribe();
  }, [onDataLoad]);

  if (isLoading) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading homepage data">
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
      <section className="hero">
        <div className="container">
          {user ? (
            <>
              <h1>Welcome Back, {user.displayName || user.email}!</h1>
              <p className="lead mb-4">Jump back into your retro gaming adventures</p>
              <Link href="/games" className="btn btn-primary me-2">
                <i className="fas fa-gamepad me-2"></i>Play Now
              </Link>
              <Link href="/profile" className="btn btn-outline-secondary me-2">
                <i className="fas fa-user me-2"></i>View Your Profile
              </Link>
              <Link href="/forum" className="btn btn-outline-info">
                <i className="fas fa-comments me-2"></i>Visit Forum
              </Link>
            </>
          ) : (
            <>
              <h1>Play 10,000+ Retro Games</h1>
              <p className="lead mb-4">The ultimate gaming community for retro enthusiasts</p>
              <Link href="/games" className="btn btn-primary me-2">
                <i className="fas fa-gamepad me-2"></i>Play Now
              </Link>
              <Link href="/forum" className="btn btn-outline-secondary">
                <i className="fas fa-comments me-2"></i>Visit Forum
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Forum Iframe Section */}
      {showForumIframe && (
        <section className="forum-preview-section py-4 bg-light">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>
                <i className="fas fa-comments me-2 text-primary-custom"></i>
                Community Forum
              </h3>
              <div>
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setShowForumIframe(false)}
                >
                  <i className="fas fa-times me-1"></i>Close
                </button>
                <a 
                  href={forumUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-sm btn-primary"
                >
                  <i className="fas fa-external-link-alt me-1"></i>
                  Open in New Tab
                </a>
              </div>
            </div>
            <div className="forum-iframe-container">
              <iframe
                src={forumUrl}
                width="100%"
                height="600"
                frameBorder="0"
                title="Community Forum Preview"
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px'
                }}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}

      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <h3 className="mb-4">
              <i className="fas fa-star me-2 text-primary-custom"></i>
              Top Gaming Systems
            </h3>
            <div className="row mb-4">
              {gamingSystems.map((system) => (
                <div key={system.name} className="col-6 col-md-4">
                  <Link href={`/consoles/${system.shortName}`} passHref className="text-decoration-none">
                    <div className="card category-card" title={system.tooltip}>
                      <div className="card-body text-center">
                        <img
                          src={system.image}
                          alt={`${system.name} logo`}
                          className="mb-3 system-icon system-image"
                          width="250"
                          height="250"
                          style={{ objectFit: 'contain' }}
                        />
                        <h5>{system.name}</h5>
                        <small>{system.games}</small>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            <h3 className="mb-4">
              <i className="fas fa-fire me-2 text-primary-custom"></i>
              Popular Games
            </h3>
            <div className="row">
              {popularGames.map((game) => (
                <div key={game.id} className="col-md-4 mb-2">
                  <Link href={`/games/${encodeURIComponent(game.title.toLowerCase().replace(/\s+/g, '-'))}`} passHref className="text-decoration-none">
                    <div className="card game-card">
                      <div className="game-image-container">
                        <img
                          src={game.image}
                          className="card-img-top"
                          alt={`${game.title} screenshot`}
                          width="300"
                          height="300"
                          style={{ objectFit: 'fill' }}
                        />
                      </div>
                      <div className="card-body text-center">
                        <h5>{game.title}</h5>
                        <div className="d-flex justify-content-center gap-2">
                          <span className="badge bg-primary">{game.system}</span>
                          <small>
                            <i className="fas fa-users me-1"></i> {game.players}
                          </small>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-5 mb-4">
              <h3 className="mb-3">
                <i className="fas fa-comments me-2 text-primary-custom"></i>
                Community Forum Preview
              </h3>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Latest Forum Activity</h5>
                    <div>
                      <Link 
                        href="/forum"
                        className="btn btn-sm btn-primary me-2"
                      >
                        <i className="fas fa-expand me-1"></i>
                        Full Screen
                      </Link>
                      <button 
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => setShowForumIframe(!showForumIframe)}
                      >
                        {showForumIframe ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    </div>
                  </div>
                  
                  {!showForumIframe && (
                    <div className="forum-preview-small">
                      <iframe
                        src={forumUrl}
                        width="100%"
                        height="400px"
                        frameBorder="0"
                        title="Forum Preview"
                        style={{
                          border: '1px solid #dee2e6',
                          borderRadius: '4px'
                        }}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}