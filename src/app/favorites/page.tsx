'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PacmanLoader from '../../../components/PacmanLoader';
import ScrollProgressBar from '../../../components/ScrollProgressBar';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';

interface Game {
  id: string;
  title: string;
  system: string;
  console?: string;
  players: string;
  image: string;
}

export default function FavoritesPage() {
  const { isLoading, progress, loadingTitle, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState<any>(null);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteGames([]);
        return;
      }

      try {
        await onDataLoad('Favorites Data');

        // Fetch user's favorite games
        const favoritesQuery = query(
          collection(db, 'user_favorites'),
          where('userId', '==', user.uid)
        );
        const favoritesSnapshot = await getDocs(favoritesQuery);
        const gameIds = favoritesSnapshot.docs.map((doc) => doc.data().gameId);

        // Fetch game details for each favorite
        const gamesPromises = gameIds.map(async (gameId: string) => {
          const gameDoc = await getDocs(query(collection(db, 'games'), where('id', '==', gameId)));
          return gameDoc.docs[0]?.data();
        });
        const gamesData = (await Promise.all(gamesPromises)).filter(Boolean);

        const games: Game[] = gamesData.map((game) => ({
          id: game.id,
          title: game.title,
          system: game.system || '',
          console: game.console,
          players: `${game.playingCount || 0} playing`,
          image: game.coverImageUrl || 'https://via.placeholder.com/300',
        }));

        setFavoriteGames(games);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };

    fetchFavorites();
    return () => unsubscribe();
  }, [user, onDataLoad]);

  if (isLoading) {
    return <PacmanLoader message={loadingText || 'Loading Favorites'} />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} user={user} />
      <section className="hero">
        <div className="container">
          {user ? (
            <>
              <h1>Your Favorites, {user.displayName || user.email}</h1>
              <p className="lead mb-4">Explore your favorite retro games</p>
              <Link href="/games" className="btn btn-primary me-2">
                <i className="fas fa-gamepad me-2"></i>Discover More Games
              </Link>
              <Link href="/profile" className="btn btn-outline-secondary">
                <i className="fas fa-user me-2"></i>View Profile
              </Link>
            </>
          ) : (
            <>
              <h1>Favorites</h1>
              <p className="lead mb-4">Sign in to view and manage your favorite games</p>
              <Link href="/login" className="btn btn-primary me-2">
                <i className="fas fa-sign-in-alt me-2"></i>Sign In
              </Link>
              <Link href="/games" className="btn btn-outline-secondary">
                <i className="fas fa-gamepad me-2"></i>Explore Games
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <h3 className="mb-4">
              <i className="fas fa-heart me-2 text-primary-custom"></i>
              Your Favorite Games
            </h3>
            {user ? (
              favoriteGames.length > 0 ? (
                <div className="row">
                  {favoriteGames.map((game) => (
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
              ) : (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  No favorite games yet. Browse games and add your favorites!
                </div>
              )
            ) : (
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Please sign in to view your favorite games.
              </div>
            )}
          </div>
          <Sidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}