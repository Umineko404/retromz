'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Sidebar from '../../../components/Sidebar'; // Import Sidebar component
import PacmanLoader from '../../../components/PacmanLoader';
import ScrollProgressBar from '../../../components/ScrollProgressBar';

export default function AboutPage() {
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

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
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  if (isLoading) {
    return <PacmanLoader message="Loading About Information" />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      <div className="container-fluid py-0 px-0">
        <div className="hero text-center mb-5">
          <h1><i className="fas fa-info-circle me-2"></i>About RETROMZ</h1>
          <p className="lead">The ultimate destination for retro gaming enthusiasts</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="card mb-4">
                <div className="card-body">
                  <h3 className="mb-4">Our Mission</h3>
                  <p>
                    RETROMZ is dedicated to preserving and celebrating the golden age of gaming. We provide a platform 
                    where gamers can relive their childhood memories and discover classic titles that shaped the gaming industry.
                  </p>
                  
                  <h3 className="mb-4 mt-5">What We Offer</h3>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-start">
                        <i className="fas fa-gamepad text-primary me-3 mt-1"></i>
                        <div>
                          <h5>Extensive Game Library</h5>
                          <p>Over 10,000+ retro games from various consoles and systems</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-start">
                        <i className="fas fa-users text-primary me-3 mt-1"></i>
                        <div>
                          <h5>Active Community</h5>
                          <p>Connect with fellow retro gaming enthusiasts</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-start">
                        <i className="fas fa-star text-primary me-3 mt-1"></i>
                        <div>
                          <h5>Game Reviews</h5>
                          <p>Read and write reviews for your favorite titles</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-start">
                        <i className="fas fa-cog text-primary me-3 mt-1"></i>
                        <div>
                          <h5>Easy to Use</h5>
                          <p>Play games directly in your browser with no downloads required</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mb-4 mt-5">Our Story</h3>
                  <p>
                    Founded by passionate gamers who grew up with classic consoles, RETROMZ was created to ensure 
                    that these timeless games remain accessible to future generations. We believe that retro games 
                    are not just entertainment, but cultural artifacts that deserve to be preserved and celebrated.
                  </p>

                  <h3 className="mb-4 mt-5">Meet Our Founders</h3>
                  <div className="row mb-3">
                    <div className="col-md-6 mb-4">
                      <div className="card founder-card">
                        <div className="founder-image-container position-relative">
                          <img 
                            src="https://i.ibb.co/WNL517xC/Chat-GPT-Image-Jun-15-2025-07-35-10-PM.png" 
                            alt="Ahmad Suleman"
                            className="card-img-top founder-image"
                          />
                          <div className="founder-overlay">
                            <div className="founder-quote">
                              "Let it RIP!!"
                              <div className="mt-3">
                                <a 
                                  href="https://github.com/Ahsulem" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-dark github-btn"
                                >
                                  <i className="fab fa-github me-2"></i>View GitHub
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card founder-card">
                        <div className="founder-image-container position-relative">
                          <img 
                            src="https://i.ibb.co/My9ChSr4/Chat-GPT-Image-Jun-15-2025-07-32-07-PM.png" 
                            alt="Aman Malik"
                            className="card-img-top founder-image"
                          />
                          <div className="founder-overlay">
                            <div className="founder-quote">
                              "Gotta catch 'em all!"
                              <div className="mt-3">
                                <a 
                                  href="https://github.com/Umineko404" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-dark github-btn"
                                >
                                  <i className="fab fa-github me-2"></i>View GitHub
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-5">
                    <div className="col-md-6 text-center">
                      <h5 className="card-title">Ahmad Suleman</h5>
                      <p className="founder-title">Founder</p>
                      <p className="text-muted">(SP23-BSE-002)</p>
                    </div>
                    <div className="col-md-6 text-center">
                      <h5 className="card-title">Aman Malik</h5>
                      <p className="founder-title">Founder</p>
                      <p className="text-muted">(SP23-BSE-005)</p>
                    </div>
                  </div>

                  <div className="text-center mt-5">
                    <h4 className="mb-3">Join Our Community</h4>
                    <p>Ready to dive into the world of retro gaming?</p>
                    <a href="/games" className="btn btn-primary me-2">
                      <i className="fas fa-gamepad me-2"></i>Start Playing
                    </a>
                    <a href="/register" className="btn btn-outline-secondary">
                      <i className="fas fa-user-plus me-2"></i>Sign Up
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <Sidebar /> {/* Add Sidebar component */}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}