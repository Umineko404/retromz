'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../src/firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, getDocs, limit as firestoreLimit } from 'firebase/firestore';

export default function Navbar() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
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

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Theme and auth state setup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const lowerQuery = searchQuery.toLowerCase().trim();
        const maxResults = 10; // Increased limit to capture more results
        const applyLimit = typeof firestoreLimit === 'function' ? firestoreLimit : (n) => n;

        // Flexible matching function with special character handling
        const matchesQuery = (text, query) => {
          if (!text) return false;
          // Normalize text and query: remove accents, special chars, and extra spaces
          const normalize = (str) =>
            str
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s]/g, '')
              .trim();
          const normalizedText = normalize(text);
          const normalizedQuery = normalize(query);
          const queryWords = normalizedQuery.split(/\s+/);
          return queryWords.every((word) =>
            normalizedText.includes(word) ||
            normalizedText.split(/\s+/).some((part) => part.startsWith(word))
          );
        };

        // Search Games
        const gamesRef = collection(db, 'games');
        const gamesQuery = query(gamesRef, applyLimit(maxResults));
        const gamesSnapshot = await getDocs(gamesQuery);
        const games = gamesSnapshot.docs
          .map((doc) => ({
            type: 'game',
            id: doc.id,
            title: doc.data().title || 'Untitled Game',
            system: doc.data().system || 'Unknown',
            image: doc.data().coverImageUrl || 'https://via.placeholder.com/300',
          }))
          .filter((game) => matchesQuery(game.title, lowerQuery));

        // Search Consoles
        const consolesRef = collection(db, 'consoles');
        const consolesQuery = query(consolesRef, applyLimit(maxResults));
        const consolesSnapshot = await getDocs(consolesQuery);
        const consoles = consolesSnapshot.docs
          .map((doc) => ({
            type: 'console',
            id: doc.id,
            title: doc.data().name || 'Untitled Console',
            shortName: doc.data().shortName || doc.id, // Fallback to id if shortName missing
            gamesCount: `${doc.data().gamesCount || 0} Games`,
            image: doc.data().imageUrl || `/images/${doc.data().shortName || 'default'}-Controller-Flat.png`,
          }))
          .filter((console) => matchesQuery(console.title, lowerQuery));

        // Search Users
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, applyLimit(maxResults));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs
          .map((doc) => ({
            type: 'user',
            id: doc.id,
            title: doc.data().username || doc.data().email?.split('@')[0] || 'Unknown User',
            image: doc.data().photoURL || 'https://via.placeholder.com/150',
          }))
          .filter((user) => matchesQuery(user.title, lowerQuery));

        // Combine and limit total suggestions
        const suggestions = [...games, ...consoles, ...users].slice(0, 15);
        setSearchSuggestions(suggestions);
        setShowSearchDropdown(true);

        // Debug logs
        console.log('Search query:', lowerQuery);
        console.log('Raw games fetched:', gamesSnapshot.docs.map((doc) => doc.data().title));
        console.log('Games filtered:', games.map((g) => g.title));
        console.log('Consoles filtered:', consoles.map((c) => c.title));
        console.log('Users filtered:', users.map((u) => u.title));
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSearchSuggestions([]);
        setShowSearchDropdown(true);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

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
    return user?.photoURL || '/default-avatar.png';
  };

  const getUserDisplayName = () => {
    return user?.displayName || user?.email || 'User';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    if (suggestion.type === 'game') {
      router.push(`/games/${encodeURIComponent(suggestion.title.toLowerCase().replace(/\s+/g, '-'))}`);
    } else if (suggestion.type === 'console') {
      router.push(`/consoles/${encodeURIComponent(suggestion.shortName)}`);
    } else if (suggestion.type === 'user') {
      router.push(`/profile/${suggestion.id}`);
    }
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
              <Link href="/reviews" className="nav-link">
                <i className="fas"></i>Reviews
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/forum" className="nav-link">
                <i className="fas"></i>Forums
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
            <div className="position-relative">
              <form onSubmit={handleSearch} className="d-flex">
                <input
                  type="search"
                  placeholder="Search"
                  className="form-control form-control-sm bg-dark border-secondary form-search me-3"
                  style={{ width: user ? '450px' : '260px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  ref={searchInputRef}
                />
                <button className="btn btn-sm btn-outline-primary btn-search" type="submit">
                  <i className="fas fa-search"></i>
                </button>
              </form>
              {showSearchDropdown && (
                <div
                  ref={searchDropdownRef}
                  className="dropdown-menu show position-absolute w-100"
                  style={{
                    zIndex: 1050,
                    backgroundColor: theme === 'dark' ? '#1a1a2e' : '#fff',
                    border: `1px solid ${theme === 'dark' ? '#495057' : '#dee2e6'}`,
                    borderRadius: '0.375rem',
                    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.type}-${suggestion.id}-${index}`}
                        className="dropdown-item d-flex align-items-center py-2"
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          cursor: 'pointer',
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                        }}
                      >
                        <Image
                          src={suggestion.image || 'https://via.placeholder.com/40'}
                          alt={suggestion.title}
                          width={40}
                          height={40}
                          className={suggestion.type === 'user' ? 'rounded-circle me-2' : 'me-2'}
                          style={{ objectFit: suggestion.type === 'user' ? 'cover' : 'contain' }}
                        />
                        <div>
                          <div className="fw-bold">{suggestion.title}</div>
                          <small className="text-muted">
                            {suggestion.type === 'game' && `Game • ${suggestion.system}`}
                            {suggestion.type === 'console' && `Console • ${suggestion.gamesCount}`}
                            {suggestion.type === 'user' && 'User'}
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item text-muted py-2">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
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
                      border: '2px solid #ff4040',
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
                      boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
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
                        textDecoration: 'none',
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
                        textDecoration: 'none',
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
                        cursor: 'pointer',
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
                <Link href="/login" className="btn btn-sm btn-primary btn-login">
                  Login
                </Link>
                <Link href="/register" className="btn btn-sm btn-secondary btn-register">
                  Register
                </Link>
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