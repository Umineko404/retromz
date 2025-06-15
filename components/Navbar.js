'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { auth } from '../src/firebase/firebase'; // Adjust the path if needed
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Navbar() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null); // Track authentication state
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const getProfilePicture = () => {
    // Return user's photo URL if available, otherwise use a default avatar
    return user?.photoURL;
  };

  const getUserDisplayName = () => {
    return user?.displayName || user?.email || 'User';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        <Link href="/" className="navbar-brand">
          <Image
            src="/retromz-logo.png"
            alt="RETROMZ Logo"
            width={120}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link href="/games" className="nav-link">
                <i className="fas"></i>Games
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/forum" className="nav-link">
                <i className="fas"></i>Forums
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/reviews" className="nav-link">
                <i className="fas"></i>Reviews
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/requests" className="nav-link">
                <i className="fab"></i>Requests
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/about" className="nav-link">
                <i className="fas"></i>About
              </Link>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex">
              <input
                type="search"
                placeholder="Search"
                className="form-control form-control-sm bg-dark border-secondary form-search me-3"
		style={{ width: user ? '450px' : '260px' }}
              />
              <button className="btn btn-sm btn-outline-primary btn-search">
                <i className="fas fa-search"></i>
              </button>
            </div>
            {user ? (
              <div className="position-relative profile-dropdown-container">
                <div 
                  className="profile-picture-container" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Image
                    src={getProfilePicture()}
                    alt="Profile"
                    width={35}
                    height={35}
                    className="rounded-circle"
                    style={{ 
                      objectFit: 'cover',
                      border: '2px solid #ff4040'
                    }}
                  />
                </div>
                {showDropdown && (
                  <div 
                    className="dropdown-menu show position-absolute end-0"
                    style={{ 
                      minWidth: '200px',
                      marginTop: '2px',
                      zIndex: 1050,
                      backgroundColor: theme === 'dark' ? '#1a1a2e' : 'rgba(255, 240, 243, 0.9)',
                      border: `1px solid ${theme === 'dark' ? '#495057' : '#dee2e6'}`,
                      borderRadius: '0.375rem',
                      boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <div className="px-3 py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <Image
                          src={getProfilePicture()}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-circle me-2"
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <div className="fw-bold text-truncate" style={{ maxWidth: '120px' }}>
                            {getUserDisplayName()}
                          </div>
                          <small className="text-muted text-truncate d-block" style={{ maxWidth: '120px' }}>
                            {user.email}
                          </small>
                        </div>
                      </div>
                    </div>
                    <Link 
                      href="/profile" 
                      className="dropdown-item d-flex align-items-center py-2"
                      style={{ 
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        textDecoration: 'none'
                      }}
                    >
                      <i className="fas fa-user me-2"></i>
                      Profile
                    </Link>
                    <Link 
                      href="/settings" 
                      className="dropdown-item d-flex align-items-center py-2"
                      style={{ 
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        textDecoration: 'none'
                      }}
                    >
                      <i className="fas fa-cog me-2"></i>
                      Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleLogout} 
                      className="dropdown-item d-flex align-items-center py-2 text-danger"
                      style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn btn-sm btn-primary btn-login">Login</Link>
                <Link href="/register" className="btn btn-sm btn-secondary btn-register">Register</Link>
              </>
            )}
            <button className="btn btn-outline-light btn-sm btn-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}