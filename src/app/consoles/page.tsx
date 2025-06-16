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

interface Console {
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
  imageUrl?: string;
}

const Consoles = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [selectedGeneration, setSelectedGeneration] = useState('All');
  const [sortOption, setSortOption] = useState('a-z'); // Default sort: A-Z
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch consoles from Firebase
  useEffect(() => {
    const fetchConsoles = async () => {
      try {
        const consolesRef = collection(db, 'consoles');
        const consolesSnapshot = await getDocs(consolesRef);
        const fetchedConsoles: Console[] = consolesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Console));
        setConsoles(fetchedConsoles);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching consoles:', err);
        setError('Failed to load consoles: ' + (err as Error).message);
        setIsLoading(false);
      }
    };

    fetchConsoles();
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
    const popularConsoles = consoles.slice(0, 3); // Get top 3 consoles for slider
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (popularConsoles.length || 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [consoles]);

  // Filter and sort consoles
  const filteredConsoles = consoles
    .filter(console => {
      const matchesSearch = console.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesManufacturer = selectedManufacturer === 'All' || console.manufacturer === selectedManufacturer;
      const matchesGeneration = selectedGeneration === 'All' || console.generation === selectedGeneration;
      return matchesSearch && matchesManufacturer && matchesGeneration;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'a-z':
          return a.name.localeCompare(b.name);
        case 'z-a':
          return b.name.localeCompare(a.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Get unique manufacturers and generations for filters
  const manufacturers = ['All', ...new Set(consoles.map(console => console.manufacturer).filter(Boolean) as string[])];
  const generations = ['All', ...new Set(consoles.map(console => console.generation).filter(Boolean) as string[])];

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
    return <PacmanLoader message="Loading Consoles" />;
  }

  const popularConsoles = consoles.slice(0, 3); // Top 3 consoles for slider

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      <div className="container-fluid p-0">
        {/* Hero Slider Section */}
        <div className="hero-slider position-relative" style={{ height: '60vh', overflow: 'hidden' }}>
          {popularConsoles.map((console, index) => (
            <div
              key={console.id}
              className={`slide position-absolute w-100 h-100 transition-all duration-1000 ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${console.imageUrl || '/placeholder.jpg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: index === currentSlide ? 10 : 1,
                transform: index === currentSlide ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 1s ease-in-out'
              }}
            >
              <div className="position-absolute bottom-0 start-0 p-5 text-white">
                <h1 className="display-4 fw-bold mb-3">{console.name}</h1>
                <p className="lead mb-3">{console.description || 'No description available.'}</p>
                <div className="d-flex align-items-center mb-4">
                  <span className="badge bg-primary me-3">{console.manufacturer}</span>
                  <span className="badge bg-secondary me-3">{console.generation}</span>
                  <span className="badge bg-warning text-dark">{console.releaseDate}</span>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <div className="d-flex me-4">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star ${i < Math.floor(console.rating || 0) ? 'text-warning' : 'text-muted'}`}
                      ></i>
                    ))}
                    <span className="ms-2">{console.rating || 0}</span>
                  </div>
                  <span className="text-light">
                    <i className="fas fa-eye me-1"></i>
                    {console.viewCount || 0} views
                  </span>
                </div>
                <Link
                  href={`/consoles/${encodeURIComponent(console.shortName.toLowerCase())}`}
                  className="btn btn-primary btn-lg me-3"
                >
                  <i className="fas fa-info-circle me-2"></i>
                  View Console
                </Link>
                <Link
                  href={`/games?console=${console.shortName}`}
                  className="btn btn-outline-light btn-lg"
                >
                  <i className="fas fa-gamepad me-2"></i>
                  Browse Games
                </Link>
              </div>
            </div>
          ))}
          
          {/* Slider Navigation Dots */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
            <div className="d-flex gap-2">
              {popularConsoles.map((_, index) => (
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

        {/* Consoles Catalog Section */}
        <div className="container py-5">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="mb-4">
                <i className="fas fa-gamepad me-2"></i>
                Console Library
              </h2>
              
              {/* Filters and Sorting */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <label htmlFor="searchInput" className="form-label">Search Consoles</label>
                  <input
                    id="searchInput"
                    type="text"
                    className="form-control"
                    placeholder="Search consoles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="manufacturerSelect" className="form-label">Manufacturer</label>
                  <select
                    id="manufacturerSelect"
                    className="form-select"
                    value={selectedManufacturer}
                    onChange={(e) => setSelectedManufacturer(e.target.value)}
                  >
                    <option value="All">All Manufacturers</option>
                    {manufacturers.map(manufacturer => (
                      <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="generationSelect" className="form-label">Generation</label>
                  <select
                    id="generationSelect"
                    className="form-select"
                    value={selectedGeneration}
                    onChange={(e) => setSelectedGeneration(e.target.value)}
                  >
                    <option value="All">All Generations</option>
                    {generations.map(generation => (
                      <option key={generation} value={generation}>{generation}</option>
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
 Ascending
            </div>
          </div>

          {/* Consoles Grid */}
          <div className="row">
            {filteredConsoles.map((console) => (
              <div key={console.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div className="card console-card h-100 border-0 shadow-sm">
                  <div className="position-relative overflow-hidden">
                    <Image
                      src={console.imageUrl || '/placeholder.jpg'}
                      width={300}
                      height={400}
                      className="card-img-top"
                      style={{ objectFit: 'contain', width: '300px', height: '300px' }}
                      alt={`${console.name} cover`}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="position-absolute top-0 end-0 p-2">
                      <span className="badge bg-primary">{console.manufacturer}</span>
                    </div>
                    <div className="position-absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black to-transparent p-3">
                      <div className="d-flex align-items-center">
                        <div className="d-flex me-2">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star ${i < Math.floor(console.rating || 0) ? 'text-warning' : 'text-muted'}`}
                              style={{ fontSize: '0.8rem' }}
                            ></i>
                          ))}
                        </div>
                        <small className="text-white">{console.rating || 0}</small>
                      </div>
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title mb-2">{console.name}</h6>
                    <p className="card-text text-muted small flex-grow-1">
                      {console.description?.substring(0, 80) || 'No description available.'}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-secondary">{console.generation}</span>
                      <small className="text-muted">{console.releaseDate}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="fas fa-gamepad me-1"></i>
                        {console.gamesCount || 0} games
                      </small>
                      <Link
                        href={`/consoles/${encodeURIComponent(console.shortName.toLowerCase())}`}
                        className="btn btn-primary btn-sm"
                      >
                        <i className="fas fa-info-circle me-1"></i>
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredConsoles.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No consoles found</h4>
              <p className="text-muted">Try adjusting your search, filter, or sort criteria</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Consoles;