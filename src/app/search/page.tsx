'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import ScrollProgressBar from '../../../components/ScrollProgressBar';
import PacmanLoader from '../../../components/PacmanLoader';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, limit as firestoreLimit } from 'firebase/firestore';

// Custom debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

interface Game {
  id: string;
  title: string;
  system: string;
  console?: string;
  players: string;
  image: string;
}

interface Console {
  id: string;
  name: string;
  shortName: string;
  games: string;
  tooltip: string;
  image: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  photoURL?: string;
}

export default function SearchPage() {
  const { isLoading, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    games: Game[];
    consoles: Console[];
    users: User[];
  }>({ games: [], consoles: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitialLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Read query from URL on mount and update searchQuery
  useEffect(() => {
    const query = searchParams.get('query') || '';
    setSearchQuery(decodeURIComponent(query));
  }, [searchParams]);

  // Trigger search when debouncedSearchQuery changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults({ games: [], consoles: [], users: [] });
      setSearchError(null);
    }
  }, [debouncedSearchQuery]);

  const performSearch = async (queryString: string) => {
    if (!queryString.trim()) {
      setSearchError('Please enter a search term.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      await onDataLoad('Searching Database');
      const lowerQuery = queryString.toLowerCase();
      const maxResults = 50;

      const applyLimit = typeof firestoreLimit === 'function' ? firestoreLimit : (n: number) => n;
      console.log('Using limit function:', applyLimit === firestoreLimit ? 'firestoreLimit' : 'fallback');

      // Search Games
      const gamesRef = collection(db, 'games');
      const gamesQuery = applyLimit === firestoreLimit
        ? query(gamesRef, applyLimit(maxResults))
        : query(gamesRef);
      const gamesSnapshot = await getDocs(gamesQuery);
      console.log('Games fetched:', gamesSnapshot.docs.length, 'Query:', lowerQuery);
      const games = gamesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          system: doc.data().system || '',
          console: doc.data().consoleId,
          players: `${doc.data().playingCount || 0} playing`,
          image: doc.data().coverImageUrl || 'https://via.placeholder.com/300',
        }))
        .filter((game) => game.title && game.title.toLowerCase().includes(lowerQuery));

      // Search Consoles
      const consolesRef = collection(db, 'consoles');
      const consolesQuery = applyLimit === firestoreLimit
        ? query(consolesRef, applyLimit(maxResults))
        : query(consolesRef);
      const consolesSnapshot = await getDocs(consolesQuery);
      console.log('Consoles fetched:', consolesSnapshot.docs.length, 'Query:', lowerQuery);
      const consoles = consolesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          shortName: doc.data().shortName,
          games: `${doc.data().gamesCount || 0} Games`,
          tooltip: `Browse ${doc.data().gamesCount || 0}+ ${doc.data().name} games`,
          image: doc.data().imageUrl || `/images/${doc.data().shortName}-Controller-Flat.png`,
        }))
        .filter((console) => console.name && console.name.toLowerCase().includes(lowerQuery));

      // Search Users
      const usersRef = collection(db, 'users');
      const usersQuery = applyLimit === firestoreLimit
        ? query(usersRef, applyLimit(maxResults))
        : query(usersRef);
      const usersSnapshot = await getDocs(usersQuery);
      console.log('Users fetched:', usersSnapshot.docs.length, 'Query:', lowerQuery);
      const users = usersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          username: doc.data().username || doc.data().email.split('@')[0],
          email: doc.data().email,
          photoURL: doc.data().photoURL || 'https://via.placeholder.com/150',
        }))
        .filter((user) => user.username && user.username.toLowerCase().includes(lowerQuery));

      setSearchResults({ games, consoles, users });
      if (games.length === 0 && consoles.length === 0 && users.length === 0) {
        setSearchError(
          `No results found for "${queryString}". Try terms like "Sonic", "Nintendo", or "Aman".`
        );
      }
    } catch (err: any) {
      console.error('Search error:', err.message, err.code, err.stack);
      setSearchError(
        `Failed to search: ${err.message || 'Unknown error'}. Please check your Firebase setup or try again.`
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  if (isLoading || isSearching || initialLoading) {
    return <PacmanLoader message={loadingText || 'Loading Search Page'} />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} user={user} />
      <section className="hero">
        <div className="container">
          <h1>Search Retro Gaming</h1>
          <p className="lead mb-4">Find games, consoles, and users in our retro community</p>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search for games, consoles, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={isSearching}>
                <i className="fas fa-search me-2"></i>Search
              </button>
            </div>
          </form>
          {searchError && <div className="alert alert-warning mt-3">{searchError}</div>}
          <Link href="/games" className="btn btn-outline-secondary me-2">
            <i className="fas fa-gamepad me-2"></i>Browse All Games
          </Link>
          <Link href="/forum" className="btn btn-secondary">
            <i className="fas fa-comments me-2"></i>Visit Forum
          </Link>
        </div>
      </section>

      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            {searchQuery && (
              <>
                {/* Games Results */}
                {searchResults.games.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-4">
                      <i className="fas fa-gamepad me-2 text-primary-custom"></i>
                      Games
                    </h3>
                    <div className="row">
                      {searchResults.games.map((game) => (
                        <div key={game.id} className="col-md-4 mb-2">
                          <Link
                            href={`/games/${encodeURIComponent(game.title.toLowerCase().replace(/\s+/g, '-'))}`}
                            className="text-decoration-none"
                          >
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
                  </div>
                )}

                {/* Consoles Results */}
                {searchResults.consoles.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-4">
                      <i className="fas fa-star me-2 text-primary-custom"></i>
                      Consoles
                    </h3>
                    <div className="row">
                      {searchResults.consoles.map((console) => (
                        <div key={console.id} className="col-6 col-md-4">
                          <Link href={`/consoles/${console.shortName}`} className="text-decoration-none">
                            <div className="card category-card" title={console.tooltip}>
                              <div className="card-body text-center">
                                <img
                                  src={console.image}
                                  alt={`${console.name} logo`}
                                  className="mb-3 system-icon system-image"
                                  width="250"
                                  height="250"
                                  style={{ objectFit: 'contain' }}
                                />
                                <h5>{console.name}</h5>
                                <small>{console.games}</small>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Results */}
                {searchResults.users.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-3">
                      <i className="fas fa-users me-2 text-primary-custom"></i>
                      Users
                    </h3>
                    <div className="row">
                      {searchResults.users.map((user) => (
                        <div key={user.id} className="col-md-4 mb-2">
                          <Link href={`/profile/${user.id}`} className="text-decoration-none">
                            <div className="card game-card">
                              <div className="game-image-container">
                                <img
                                  src={user.photoURL}
                                  className="card-img-top rounded-circle"
                                  alt={`${user.username} avatar`}
                                  width="100%"
                                  height="300px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                              <div className="card-body text-center">
                                <h5>{user.username}</h5>
                                <small>{user.email}</small>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <Sidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}