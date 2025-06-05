'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import Sidebar from '../../../../components/Sidebar';
import Footer from '../../../../components/Footer';
import EmulatorPlayer from '../../../../components/EmulatorPlayer';
import { db } from '../../../firebase/firebase';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useThemeAwareLoader } from '../../hooks/useThemeAwareLoader';

interface Game {
  id: string;
  title: string;
  console: string;
  system: string;
  release_year: number;
  description?: string;
  gameUrl?: string;
  screenshots?: string[];
  controls?: string;
  coverImageUrl?: string; // Updated to match Firestore
  genre?: string;
  rating?: number;
  viewCount?: number;
}

const GameDetails = () => {
  const { isLoading, progress, loadingTitle, loadingText, onDataLoad } = useThemeAwareLoader();
  const params = useParams();
  const gameTitleParam = params.gameTitle as string | undefined;
  const [game, setGame] = useState<Game | null>(null);
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'about' | 'gameplay' | 'screenshots' | 'controls' | 'comments'>('about');
  const [startEmulator, setStartEmulator] = useState(false);

  const generateStarRating = (rating: number = 0): JSX.Element[] => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const stars: JSX.Element[] = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star star-rating icon-glow"></i>);
    }
    if (halfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt star-rating icon-glow"></i>);
    }
    for (let i = fullStars + halfStar; i < 5; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star star-rating icon-glow"></i>);
    }
    return stars;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameTitleParam || typeof gameTitleParam !== 'string') {
        console.error('Invalid or missing gameTitle:', gameTitleParam);
        setError('Invalid game title.');
        return;
      }

      try {
        await onDataLoad(`${gameTitleParam.replace(/-/g, ' ')}`);
        const queryTitle = gameTitleParam.replace(/-/g, ' ');
        const gamesRef = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesRef);

        const gameDoc = gamesSnapshot.docs.find(
          (doc) => doc.data().title.toLowerCase() === queryTitle.toLowerCase()
        );

        if (!gameDoc) {
          setError('Game not found.');
          return;
        }

        const gameId = gameDoc.id;
        const data: Game = { id: gameId, ...gameDoc.data() } as Game;
        setGame(data);

        const auth = getAuth();
        const viewCountKey = `viewCount_${gameId}_${auth.currentUser?.uid || 'guest'}`;
        if (auth.currentUser && !sessionStorage.getItem(viewCountKey)) {
          const gameRef = doc(db, 'games', gameId);
          try {
            await updateDoc(gameRef, {
              viewCount: (data.viewCount || 0) + 1,
            });
            sessionStorage.setItem(viewCountKey, 'true');
            setGame((prev) => (prev ? { ...prev, viewCount: (prev.viewCount || 0) + 1 } : prev));
          } catch (updateErr) {
            console.warn('Failed to update viewCount:', updateErr);
          }
        } else {
          console.log(auth.currentUser ? 'ViewCount already incremented' : 'Guest user, skipping viewCount');
        }

        const related: Game[] = gamesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Game))
          .filter((g) => g.id !== gameId && g.system === data.system)
          .slice(0, 5);
        setRelatedGames(related);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError('Failed to load game data: ' + (err as Error).message);
      }
    };

    fetchGameData();
  }, [gameTitleParam, onDataLoad]);

  const handlePlayNow = async () => {
    setActiveTab('gameplay');
    setStartEmulator(true);
    await onDataLoad(`Emulator for ${game?.title || 'Game'}`);
  };

  if (error) {
    return (
      <div className="container text-center py-5">
        <h1 className="text-danger">{error}</h1>
      </div>
    );
  }

  if (isLoading || !game) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading game data">
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
      <Navbar toggleTheme={toggleTheme} theme={theme} />

      <div className="hero game-banner">
        <div className="container">
          <div className="row">
            <div className="col-md-3">
              <Image
                src={game.coverImageUrl || '/placeholder.jpg'}
                alt={`${game.title} cover`}
                width={300}
                height={300}
                className="game-cover img-fluid rounded"
                priority
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.jpg';
                }}
              />
            </div>
            <div className="col-md-9">
              <h1 className="text-glitch">{game.title}</h1>
              <div className="d-flex flex-wrap mb-3 gap-2">
                <div className="me-3 mb-2">
                  <span className="badge bg-primary me-2">{game.console}</span>
                  <span className="badge bg-secondary">{game.release_year}</span>
                </div>
                <div className="d-flex gap-3">
                  {game.rating && (
                    <span>
                      {generateStarRating(game.rating)} ({game.rating}/5)
                    </span>
                  )}
                  <span>
                    <i className="fas fa-eye me-1 icon-glow"></i>
                    {game.viewCount || 0} views
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2">
                {game.gameUrl ? (
                  <button className="btn btn-primary" onClick={handlePlayNow}>
                    <i className="fas fa-gamepad me-2"></i>Play Now
                  </button>
                ) : (
                  <button className="btn btn-primary disabled">
                    <i className="fas fa-gamepad me-2"></i>Play Not Available
                  </button>
                )}
                <Link href="#" className="btn btn-outline-secondary">
                  <i className="fas fa-bookmark me-2"></i>Add to Collection
                </Link>
                <Link href="#" className="btn btn-outline-secondary">
                  <i className="fas fa-share-alt"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <div className="nav-tabs d-flex border-bottom">
              {['about', 'gameplay', 'screenshots', 'controls', 'comments'].map((tab) => (
                <button
                  key={tab}
                  className={`nav-tab flex-fill text-center ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="tab-content mt-4">
              {activeTab === 'about' && (
                <div>
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-info-circle me-2 icon-glow"></i>Game Information
                    </div>
                    <div className="card-body">
                      <p>{game.description || 'No description available.'}</p>
                      <h5 className="mt-4">Game Details</h5>
                      <div className="d-flex flex-wrap gap-4">
                        <table className="table w-50">
                          <tbody>
                            <tr>
                              <td className="fw-bold">Title:</td>
                              <td>{game.title}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Console:</td>
                              <td>{game.console}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Release Year:</td>
                              <td>{game.release_year}</td>
                            </tr>
                          </tbody>
                        </table>
                        <table className="table w-50">
                          <tbody>
                            {game.genre && (
                              <tr>
                                <td className="fw-bold">Genre:</td>
                                <td>{game.genre}</td>
                              </tr>
                            )}
                            {game.rating && (
                              <tr>
                                <td className="fw-bold">Rating:</td>
                                <td>
                                  {generateStarRating(game.rating)} ({game.rating}/5)
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="fw-bold">Views:</td>
                              <td>{game.viewCount || 0}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gameplay' && (
                <div>
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-gamepad me-2 icon-glow"></i>Gameplay
                    </div>
                    <div className="card-body">
                      {game.gameUrl && startEmulator ? (
                        <EmulatorPlayer romPath={game.gameUrl} />
                      ) : (
                        <p>
                          {game.gameUrl
                            ? 'Click "Play Now" to start the emulator.'
                            : 'Gameplay not available.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'screenshots' && (
                <div>
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-image me-2 icon-glow"></i>Screenshots
                    </div>
                    <div className="card-body">
                      {game.screenshots && game.screenshots.length > 0 ? (
                        <div className="row">
                          {game.screenshots.map((url, index) => (
                            <div className="col-md-4 mb-3" key={index}>
                              <Image
                                src={url}
                                alt={`Screenshot ${index + 1}`}
                                width={300}
                                height={200}
                                className="img-fluid rounded shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No screenshots available.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'controls' && (
                <div>
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-keyboard me-2 icon-glow"></i>Controls
                    </div>
                    <div className="card-body">
                      <p>{game.controls || 'Controls information not provided.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div>
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-comments me-2 icon-glow"></i>Comments
                    </div>
                    <div className="card-body">
                      <p>Comments feature coming soon.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Sidebar
            consoleData={{ name: game.console, shortName: game.system } as any}
            games={relatedGames}
            relatedConsoles={[]}
            generateStarRating={generateStarRating}
          />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default GameDetails;