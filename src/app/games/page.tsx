'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import PacmanLoader from '../../../components/PacmanLoader';
import ScrollProgressBar from '../../../components/ScrollProgressBar';
import { db } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Game {
  id: string;
  title: string;
  system: string;
  genre?: string;
  rating?: number;
  viewCount?: number;
  year?: string;
  description?: string;
  coverImageUrl?: string;
  playingCount?: number;
}

const Games = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedSystem, setSelectedSystem] = useState('All');
  const [sortOption, setSortOption] = useState('a-z'); // Default sort: A-Z
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get system from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const systemParam = urlParams.get('system');
      if (systemParam) {
        setSelectedSystem(systemParam);
      }
    }
  }, []);

  // Fetch games from Firebase
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesRef = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesRef);
        const fetchedGames: Game[] = gamesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Game));
        setGames(fetchedGames);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Failed to load games: ' + (err as Error).message);
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Initialize theme and bootstrap
  useEffect(() => {
    const initializePage = async () => {
      if (typeof window !== 'undefined') {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-bs-theme', initialTheme);

        // Load bootstrap
        await import('bootstrap/dist/js/bootstrap.bundle.min.js');

        // Simulate additional loading time if needed
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    const popularGames = games.slice(0, 3); // Get top 3 games for slider
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (popularGames.length || 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [games]);

  // Filter and sort games
  const filteredGames = games
    .filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || game.genre === selectedGenre;
      const matchesSystem = selectedSystem === 'All' || game.system === selectedSystem;
      return matchesSearch && matchesGenre && matchesSystem;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  // Get unique genres and systems for filters
  const genres = ['All', ...new Set(games.map(game => game.genre).filter(Boolean) as string[])];
  const systems = ['All', ...new Set(games.map(game => game.system).filter(Boolean) as string[])];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  if (error) {
    return (
      <div className="container text-center py-5">
        <h1 className="text-danger">{error}</h1>
      </div>
    );
  }

  if (isLoading) {
    return <PacmanLoader message="Loading Games" />;
  }

  const popularGames = games.sort((a, b) => a.title.localeCompare(b.title)).slice(0, 5);

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      <div className="container-fluid p-0">
        {/* Hero Slider Section */}
        <div className="hero-slider position-relative" style={{ height: '60vh', overflow: 'hidden' }}>
          {popularGames.map((game, index) => (
            <div
              key={game.id}
              className={`slide position-absolute w-100 h-100 transition-all duration-1000 ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-30 scale-95'
              }`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${game.coverImageUrl || '/placeholder.jpg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: index === currentSlide ? 10 : 1,
                transform: index === currentSlide ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 1s ease-in-out'
              }}
            >
              <div className="position-absolute bottom-0 start-0 p-5 text-white">
                <h1 className="display-4 fw-bold mb-3">{game.title}</h1>
                <p className="lead mb-3">{game.description || 'No description available.'}</p>
                <div className="d-flex align-items-center mb-4">
                  <span className="badge bg-primary me-3">{game.system}</span>
                  <span className="badge bg-secondary me-3">{game.genre || 'N/A'}</span>
                  <span className="badge bg-warning text-dark">{game.year || 'N/A'}</span>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <div className="d-flex me-4">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star ${i < Math.floor(game.rating || 0) ? 'text-warning' : 'text-muted'}`}
                      ></i>
                    ))}
                    <span className="ms-2">{game.rating || 0}</span>
                  </div>
                  <span className="text-light">
                    <i className="fas fa-eye me-1"></i>
                    {game.viewCount || 0} views
                  </span>
                </div>
                <Link
                  href={`/games/${encodeURIComponent(game.title.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="btn btn-primary btn-lg me-3"
                >
                  <i className="fas fa-play me-2"></i>
                  Play Now
                </Link>
                <button className="btn btn-outline-light btn-lg">
                  <i className="fas fa-info-circle me-2"></i>
                  Learn More
                </button>
              </div>
            </div>
          ))}
          
          {/* Slider Navigation Dots */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
            <div className="d-flex gap-2">
              {popularGames.map((_, index) => (
                <button
                  key={index}
                  className={`btn rounded-circle p-0 ${
                    index === currentSlide ? 'btn-primary' : 'btn-outline-light'
                  }`}
                  style={{ width: '12px', height: '12px' }}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Games Catalog Section */}
        <div className="container py-5">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="mb-4">
                <i className="fas fa-gamepad me-2"></i>
                Game Library
              </h2>
              
              {/* Filters and Sorting */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <label htmlFor="searchInput" className="form-label">Search Games</label>
                  <input
                    id="searchInput"
                    type="text"
                    className="form-control"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="genreSelect" className="form-label">Genre</label>
                  <select
                    id="genreSelect"
                    className="form-select"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    <option value="All">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="systemSelect" className="form-label">System</label>
                  <select
                    id="systemSelect"
                    className="form-select"
                    value={selectedSystem}
                    onChange={(e) => setSelectedSystem(e.target.value)}
                  >
                    <option value="All">All Systems</option>
                    {systems.map(system => (
                      <option key={system} value={system}>{system}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="sortSelect" className="form-label">Sort By</label>
                  <select
                    id="sortSelect"
                    className="form-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="a-z">A-Z</option>
                    <option value="z-a">Z-A</option>
                    <option value="rating">Highest Rating</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Games Grid */}
          <div className="row">
            {filteredGames.map((game) => (
              <div key={game.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div className="card game-card h-100 border-0 shadow-sm">
                  <div className="position-relative overflow-hidden">
                    <Image
                      src={game.coverImageUrl || '/placeholder.jpg'}
                      width={300}
                      height={400}
                      className="card-img-top"
                      style={{ objectFit: 'fill', width: '300px', height: '300px' }}
                      alt={`${game.title} cover`}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="position-absolute top-0 end-0 p-2">
                      <span className="badge bg-primary">{game.system}</span>
                    </div>
                    <div className="position-absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black to-transparent p-3">
                      <div className="d-flex align-items-center">
                        <div className="d-flex me-2">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star ${i < Math.floor(game.rating || 0) ? 'text-warning' : 'text-muted'}`}
                              style={{ fontSize: '0.8rem' }}
                            ></i>
                          ))}
                        </div>
                        <small className="text-white">{game.rating || 0}</small>
                      </div>
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title mb-2">{game.title}</h6>
                    <p className="card-text text-muted small flex-grow-1">
                      {game.description?.substring(0, 80) || 'No description available.'}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-secondary">{game.genre || 'N/A'}</span>
                      <small className="text-muted">{game.year || 'N/A'}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="fas fa-users me-1"></i>
                        {game.playingCount || 0} playing
                      </small>
                      <Link
                        href={`/games/${encodeURIComponent(game.title.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="btn btn-primary btn-sm"
                      >
                        <i className="fas fa-play me-1"></i>
                        Play
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No games found</h4>
              <p className="text-muted">Try adjusting your search, filter, or sort criteria</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Games;