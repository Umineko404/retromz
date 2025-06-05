'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebase/firebase';
import Navbar from '../../../../components/Navbar';
import Sidebar from '../../../../components/Sidebar';
import Footer from '../../../../components/Footer';
import { useThemeAwareLoader } from '../../hooks/useThemeAwareLoader';

interface ConsoleData {
  id: string;
  name: string;
  shortName: string;
  manufacturer: string;
  releaseDate: string;
  generation: string;
  gamesCount: number;
  viewCount: number;
  rating?: number;
  description?: string;
  imageUrl: string;
}

interface Game {
  id: string;
  title: string;
  system: string;
  console: string;
  genre?: string;
  year?: string;
  rating?: number;
  coverImage?: string;
}

export default function ConsolePage() {
  const { isLoading, progress, loadingTitle, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [activeTab, setActiveTab] = useState<'about' | 'games'>('about');
  const [consoleData, setConsoleData] = useState<ConsoleData | null>(null);
  const [relatedConsoles, setRelatedConsoles] = useState<ConsoleData[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { shortName } = useParams();

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
    const fetchConsoleData = async () => {
      if (!shortName || typeof shortName !== 'string') {
        setError('Invalid console shortName.');
        return;
      }

      try {
        await onDataLoad(`${shortName} Data`);
        const uppercaseShortName = shortName.toUpperCase();
        const consolesRef = collection(db, 'consoles');
        const q = query(consolesRef, where('shortName', '==', uppercaseShortName));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Console not found.');
          return;
        }

        const consoleDoc = querySnapshot.docs[0];
        const consoleId = consoleDoc.id;
        const data: ConsoleData = { id: consoleId, ...consoleDoc.data() } as ConsoleData;
        setConsoleData(data);

        const auth = getAuth();
        const viewCountKey = `viewCount_${consoleId}_${auth.currentUser?.uid || 'guest'}`;
        if (auth.currentUser && !sessionStorage.getItem(viewCountKey)) {
          const consoleRef = doc(db, 'consoles', consoleId);
          await updateDoc(consoleRef, {
            viewCount: (data.viewCount || 0) + 1,
          });
          sessionStorage.setItem(viewCountKey, 'true');
          setConsoleData((prev) => (prev ? { ...prev, viewCount: (prev.viewCount || 0) + 1 } : prev));
        }

        const consolesSnapshot = await getDocs(collection(db, 'consoles'));
        const allConsoles: ConsoleData[] = consolesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ConsoleData[];
        const related = allConsoles
          .filter((c) => c.id !== consoleId && c.manufacturer === data.manufacturer)
          .slice(0, 5);
        setRelatedConsoles(related);

        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const consoleGames: Game[] = gamesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            system: doc.data().system || '',
            console: doc.data().console || '',
            genre: doc.data().genre,
            year: doc.data().releaseDate?.toString(),
            rating: doc.data().rating,
             coverImage: doc.data().coverImageUrl,
          }))
          .filter((game) => game.system === data.shortName);
        setGames(consoleGames);
      } catch (err) {
        console.error('Error fetching console data:', err);
        setError('Failed to load console data: ' + (err as Error).message);
      }
    };

    fetchConsoleData();
  }, [shortName, onDataLoad]);

  if (error) {
    return (
      <div className="container text-center py-5">
        <h1 className="text-danger">{error}</h1>
      </div>
    );
  }

  if (isLoading || !consoleData) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading console data">
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
              <img
                src={consoleData.imageUrl}
                alt={`${consoleData.name} console`}
                width="300"
                height="300"
                className="game-cover img-fluid rounded"
              />
            </div>
            <div className="col-md-9">
              <h1 className="text-glitch text-start">{consoleData.name}</h1>
              <div className="d-flex flex-wrap mb-3 gap-2">
                <div className="me-3 mb-2">
                  <span className="badge bg-primary me-2">{consoleData.manufacturer}</span>
                  <span className="badge bg-secondary me-2">{consoleData.releaseDate}</span>
                  <span className="badge bg-secondary">{consoleData.generation}</span>
                </div>
                <div className="d-flex gap-3">
                  <span>
                    <i className="fas fa-gamepad me-1 icon-glow"></i>
                    {consoleData.gamesCount} games
                  </span>
                  {consoleData.rating && (
                    <span>
                      {generateStarRating(consoleData.rating)} ({consoleData.rating}/5)
                    </span>
                  )}
                  <span>
                    <i className="fas fa-eye me-1 icon-glow"></i>
                    {consoleData.viewCount} views
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Link href={`/games?console=${consoleData.shortName}`} className="btn btn-primary">
                  <i className="fas fa-gamepad me-2"></i>Browse Games
                </Link>
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
              {['about', 'games'].map((tab) => (
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
                      <i className="fas fa-info-circle me-2 icon-glow"></i>Console Information
                    </div>
                    <div className="card-body">
                      <p>{consoleData.description || 'No description provided.'}</p>
                      <h5 className="mt-4">Console Details</h5>
                      <div className="row g-0">
                        <div className="col-md-6 pe-3">
                          <table className="table console-details-table">
                            <tbody>
                              <tr>
                                <td className="fw-bold">Name:</td>
                                <td>{consoleData.name}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Short Name:</td>
                                <td>{consoleData.shortName}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Manufacturer:</td>
                                <td>{consoleData.manufacturer}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Release Date:</td>
                                <td>{consoleData.releaseDate}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col-md-6 ps-3">
                          <table className="table left-align-table">
                            <tbody>
                              <tr>
                                <td className="fw-bold">Generation:</td>
                                <td>{consoleData.generation}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Games Available:</td>
                                <td>{consoleData.gamesCount}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Views:</td>
                                <td>{consoleData.viewCount}</td>
                              </tr>
                              {consoleData.rating && (
                                <tr>
                                  <td className="fw-bold">Rating:</td>
                                  <td>
                                    {generateStarRating(consoleData.rating)} ({consoleData.rating}/5)
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'games' && (
                <div>
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-gamepad me-2 icon-glow"></i>Available Games ({consoleData.gamesCount})
                    </div>
                    <div className="card-body p-0">
                      {games.length > 0 ? (
                        <div className="row g-0 p-3">
                          {games.map((game) => (
                            <div key={game.id} className="col-md-6 mb-3 pe-2">
                              <div className="d-flex align-items-center p-3 border rounded">
                                <Image
                                  src={game.coverImage || '/api/placeholder.png'}
                                  width={60}
                                  height={60}
                                  className="me-3 rounded"
                                  alt={`${game.title} cover`}
                                />
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">
                                    <Link href={`/games/${encodeURIComponent(game.title.toLowerCase().replace(/\s+/g, '-'))}`} className="text-decoration-none">
                                      {game.title}
                                    </Link>
                                  </h6>
                                  <small className="text-muted">
                                    {game.genre || 'Unknown genre'}  {game.year || 'Unknown year'}
                                  </small>
                                  {game.rating && (
                                    <div className="mt-1">
                                      {generateStarRating(game.rating)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted p-3">No games available for this console.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Sidebar
            consoleData={consoleData}
            games={games}
            relatedConsoles={relatedConsoles}
            generateStarRating={generateStarRating}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}