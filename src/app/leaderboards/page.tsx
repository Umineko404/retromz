'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Sidebar from '../../../components/Sidebar';
import ScrollProgressBar from '../../../components/ScrollProgressBar';
import PacmanLoader from '../../../components/PacmanLoader';

const Leaderboards = () => {
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
      // Simulate loading (or replace with actual data fetching if needed)
      setTimeout(() => {
        setIsLoading(false);
      }, 2000); // Adjust delay as needed
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  if (isLoading) {
    return <PacmanLoader message="Loading Leaderboards Data" />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-9">
            <div className="text-center mb-5">
              <h1 className="display-4 mb-3">
                <i className="fas fa-trophy me-3 text-warning"></i>
                Leaderboards
              </h1>
              <p className="lead text-muted">Competition rankings and achievements</p>
            </div>

            <div className="card border-0 shadow-lg" style={{ height: '738px' }}>
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-trophy fa-5x text-warning mb-3"></i>
                </div>
                <h2 className="h3 mb-3">Coming Soon!</h2>
                <p className="text-muted mb-4">
                  We're working hard to bring you competitive leaderboards, achievement tracking, 
                  and player rankings. Get ready to compete with retro gaming enthusiasts from around the world!
                </p>
                <div className="row text-center">
                  <div className="col-md-4 mb-3">
                    <div className="p-3">
                      <i className="fas fa-medal fa-2x text-primary mb-2"></i>
                      <h5>Global Rankings</h5>
                      <small className="text-muted">Compete worldwide</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3">
                      <i className="fas fa-star fa-2x text-warning mb-2"></i>
                      <h5>Achievements</h5>
                      <small className="text-muted">Unlock rewards</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3">
                      <i className="fas fa-clock fa-2x text-success mb-2"></i>
                      <h5>Speed Runs</h5>
                      <small className="text-muted">Time challenges</small>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg mt-3" disabled>
                  <i className="fas fa-bell me-2"></i>
                  Notify Me When Available
                </button>
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Leaderboards;