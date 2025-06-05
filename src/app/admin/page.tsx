'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from '../../../components/Navbar';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';

export default function AdminPortal() {
  const { isLoading, progress, loadingTitle, loadingText, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [consoles, setConsoles] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [gameFormData, setGameFormData] = useState({
    title: '',
    system: '',
    consoleId: '',
    releaseDate: '',
    genre: '',
    developer: '',
    publisher: '',
    description: '',
    coverImageUrl: '',
    fullDescription: '',
    gameplayDescription: '',
    achievements: '',
    tips: '',
    screenshots: '',
    controls: '',
    comments: '',
    relatedGames: [],
    gameUrl: '', // Added gameUrl
  });
  const [consoleFormData, setConsoleFormData] = useState({
    name: '',
    shortName: '',
    gamesCount: 0,
    manufacturer: '',
    releaseDate: '',
    generation: '',
    description: '',
    imageUrl: '',
  });
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().admin) {
          setIsAdmin(true);
          fetchData();
        } else {
          setError('You are not authorized to access this page.');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      await onDataLoad('Admin Portal Data'); // Trigger loading screen
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const gamesSnapshot = await getDocs(collection(db, 'games'));
      setGames(gamesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const consolesSnapshot = await getDocs(collection(db, 'consoles'));
      setConsoles(consolesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const discussionsSnapshot = await getDocs(collection(db, 'discussions'));
      setDiscussions(discussionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await setDoc(doc(db, 'users', userId), { banned: true }, { merge: true });
      setUsers(users.map((u) => (u.id === userId ? { ...u, banned: true } : u)));
      alert('User banned successfully.');
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user.');
    }
  };

  const handleToggleAdmin = async (userId, currentAdminStatus) => {
    try {
      if (!isAdmin) {
        alert('You do not have permission to perform this action.');
        return;
      }
      await setDoc(doc(db, 'users', userId), { admin: !currentAdminStatus }, { merge: true });
      setUsers(users.map((u) => (u.id === userId ? { ...u, admin: !currentAdminStatus } : u)));
      alert(`User ${!currentAdminStatus ? 'promoted to' : 'demoted from'} admin successfully.`);
    } catch (err) {
      console.error('Error toggling admin status:', err);
      alert('Failed to toggle admin status.');
    }
  };

  const handleDeleteGame = async (gameId) => {
    try {
      const game = games.find((g) => g.id === gameId);
      if (game && game.consoleId) {
        const consoleRef = doc(db, 'consoles', game.consoleId);
        const consoleDoc = await getDoc(consoleRef);
        if (consoleDoc.exists()) {
          await updateDoc(consoleRef, { gamesCount: consoleDoc.data().gamesCount - 1 });
        }
      }
      await deleteDoc(doc(db, 'games', gameId));
      setGames(games.filter((g) => g.id !== gameId));
      alert('Game deleted successfully.');
    } catch (err) {
      console.error('Error deleting game:', err);
      alert('Failed to delete game.');
    }
  };

  const handleDeleteConsole = async (consoleId) => {
    try {
      await setDoc(doc(db, 'consoles', consoleId), { deleted: true }, { merge: true });
      setConsoles(consoles.filter((c) => c.id !== consoleId));
      alert('Console marked as deleted.');
    } catch (err) {
      console.error('Error deleting console:', err);
      alert('Failed to delete console.');
    }
  };

  const handleDeleteDiscussion = async (discussionId) => {
    try {
      await deleteDoc(doc(db, 'discussions', discussionId));
      setDiscussions(discussions.filter((d) => d.id !== discussionId));
      alert('Discussion deleted successfully.');
    } catch (err) {
      console.error('Error deleting discussion:', err);
      alert('Failed to delete discussion.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Failed to log out.');
    }
  };

  const handleSaveGame = async (e) => {
    e.preventDefault();
    try {
      if (!gameFormData.title || !gameFormData.system || !gameFormData.consoleId || !gameFormData.releaseDate || !gameFormData.genre || !gameFormData.developer || !gameFormData.publisher) {
        alert('Please fill in all required fields.');
        return;
      }
      await onDataLoad(`Saving Game: ${gameFormData.title}`); // Trigger loading screen
      const gameData = {
        title: gameFormData.title,
        system: gameFormData.system,
        consoleId: gameFormData.consoleId,
        releaseDate: gameFormData.releaseDate,
        genre: gameFormData.genre,
        developer: gameFormData.developer,
        publisher: gameFormData.publisher,
        description: gameFormData.description,
        coverImageUrl: gameFormData.coverImageUrl || '',
        fullDescription: gameFormData.fullDescription || '',
        gameplayDescription: gameFormData.gameplayDescription || '',
        achievements: gameFormData.achievements ? JSON.parse(gameFormData.achievements) : [],
        tips: gameFormData.tips ? JSON.parse(gameFormData.tips) : [],
        screenshots: gameFormData.screenshots ? JSON.parse(gameFormData.screenshots) : [],
        controls: gameFormData.controls ? JSON.parse(gameFormData.controls) : [],
        comments: gameFormData.comments ? JSON.parse(gameFormData.comments) : [],
        relatedGames: gameFormData.relatedGames || [],
        gameUrl: gameFormData.gameUrl || '', // Include gameUrl
      };
      if (selectedGame) {
        await setDoc(doc(db, 'games', selectedGame.id), gameData, { merge: true });
        setGames(games.map((g) => (g.id === selectedGame.id ? { ...g, ...gameData } : g)));
        alert('Game updated successfully.');
      } else {
        const newGameRef = doc(collection(db, 'games'));
        await setDoc(newGameRef, { ...gameData, id: newGameRef.id, viewCount: 0, playingCount: 0, rating: 0 });
        setGames([...games, { id: newGameRef.id, ...gameData, viewCount: 0, playingCount: 0, rating: 0 }]);

        const consoleRef = doc(db, 'consoles', gameFormData.consoleId);
        const consoleDoc = await getDoc(consoleRef);
        if (consoleDoc.exists()) {
          await updateDoc(consoleRef, { gamesCount: (consoleDoc.data().gamesCount || 0) + 1 });
          setConsoles(consoles.map((c) => (c.id === gameFormData.consoleId ? { ...c, gamesCount: (c.gamesCount || 0) + 1 } : c)));
        }
        alert('Game added successfully.');
      }
      setSelectedGame(null);
      setGameFormData({
        title: '',
        system: '',
        consoleId: '',
        releaseDate: '',
        genre: '',
        developer: '',
        publisher: '',
        description: '',
        coverImageUrl: '',
        fullDescription: '',
        gameplayDescription: '',
        achievements: '',
        tips: '',
        screenshots: '',
        controls: '',
        comments: '',
        relatedGames: [],
        gameUrl: '', // Reset gameUrl
      });
    } catch (err) {
      console.error('Error saving game:', err);
      alert('Failed to save game.');
    }
  };

  const handleSaveConsole = async (e) => {
    e.preventDefault();
    try {
      if (!consoleFormData.name || !consoleFormData.shortName || !consoleFormData.manufacturer || !consoleFormData.releaseDate || !consoleFormData.generation) {
        alert('Please fill in all required fields.');
        return;
      }
      await onDataLoad(`Saving Console: ${consoleFormData.name}`); // Trigger loading screen
      const consoleData = {
        name: consoleFormData.name,
        shortName: consoleFormData.shortName,
        gamesCount: parseInt(consoleFormData.gamesCount) || 0,
        manufacturer: consoleFormData.manufacturer,
        releaseDate: consoleFormData.releaseDate,
        generation: consoleFormData.generation,
        description: consoleFormData.description,
        imageUrl: consoleFormData.imageUrl || '',
      };
      if (selectedConsole) {
        await setDoc(doc(db, 'consoles', selectedConsole.id), consoleData, { merge: true });
        setConsoles(consoles.map((c) => (c.id === selectedConsole.id ? { ...c, ...consoleData } : c)));
        alert('Console updated successfully.');
      } else {
        const newConsoleRef = doc(collection(db, 'consoles'));
        await setDoc(newConsoleRef, { ...consoleData, id: newConsoleRef.id });
        setConsoles([...consoles, { id: newConsoleRef.id, ...consoleData }]);
        alert('Console added successfully.');
      }
      setSelectedConsole(null);
      setConsoleFormData({
        name: '',
        shortName: '',
        gamesCount: 0,
        manufacturer: '',
        releaseDate: '',
        generation: '',
        description: '',
        imageUrl: '',
      });
    } catch (err) {
      console.error('Error saving console:', err);
      alert('Failed to save console.');
    }
  };

  const handleEditGame = (game) => {
    setSelectedGame(game);
    setGameFormData({
      title: game.title,
      system: game.system,
      consoleId: game.consoleId || '',
      releaseDate: game.releaseDate || '',
      genre: game.genre || '',
      developer: game.developer || '',
      publisher: game.publisher || '',
      description: game.description || '',
      coverImageUrl: game.coverImageUrl || '',
      fullDescription: game.fullDescription || '',
      gameplayDescription: game.gameplayDescription || '',
      achievements: game.achievements ? JSON.stringify(game.achievements) : '',
      tips: game.tips ? JSON.stringify(game.tips) : '',
      screenshots: game.screenshots ? JSON.stringify(game.screenshots) : '',
      controls: game.controls ? JSON.stringify(game.controls) : '',
      comments: game.comments ? JSON.stringify(game.comments) : '',
      relatedGames: game.relatedGames || [],
      gameUrl: game.gameUrl || '', // Populate gameUrl
    });
  };

  const handleEditConsole = (console) => {
    setSelectedConsole(console);
    setConsoleFormData({
      name: console.name || '',
      shortName: console.shortName || '',
      gamesCount: console.gamesCount || 0,
      manufacturer: console.manufacturer || '',
      releaseDate: console.releaseDate || '',
      generation: console.generation || '',
      description: console.description || '',
      imageUrl: console.imageUrl || '',
    });
  };

  if (error) {
    return (
      <div className="container text-center py-5">
        <h1 className={`text-${theme === 'dark' ? 'light' : 'danger'}`}>{error}</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading admin data">
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
      <Navbar user={user} />
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Admin Portal</h1>
          <button className="btn btn-danger" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="nav-tabs d-flex border-bottom mb-4">
          {['users', 'games', 'consoles', 'discussions', 'analytics'].map((tab) => (
            <button
              key={tab}
              className={`nav-tab flex-fill text-center ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="card-header">
                <i className="fas fa-users me-2"></i>Manage Users
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Display Name</th>
                      <th>Status</th>
                      <th>Admin</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.displayName || 'N/A'}</td>
                        <td>{u.banned ? 'Banned' : 'Active'}</td>
                        <td>{u.admin ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            className={`btn btn-${u.admin ? 'warning' : 'success'} btn-sm me-2`}
                            onClick={() => handleToggleAdmin(u.id, u.admin)}
                          >
                            {u.admin ? 'Demote' : 'Promote'}
                          </button>
                          {!u.banned && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleBanUser(u.id)}
                            >
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="card">
              <div className="card-header">
                <i className="fas fa-gamepad me-2"></i>Manage Games
              </div>
              <div className="card-body">
                <h5 className="mb-3">Add/Edit Game</h5>
                <form onSubmit={handleSaveGame}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Super Mario Bros."
                        value={gameFormData.title}
                        onChange={(e) => setGameFormData({ ...gameFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">System *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., NES"
                        value={gameFormData.system}
                        onChange={(e) => setGameFormData({ ...gameFormData, system: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Console *</label>
                      <select
                        className="form-select"
                        value={gameFormData.consoleId}
                        onChange={(e) => setGameFormData({ ...gameFormData, consoleId: e.target.value })}
                        required
                      >
                        <option value="">Select Console</option>
                        {consoles.map((console) => (
                          <option key={console.id} value={console.id}>
                            {console.name} ({console.shortName})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Release Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={gameFormData.releaseDate}
                        onChange={(e) => setGameFormData({ ...gameFormData, releaseDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Genre *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Platformer"
                        value={gameFormData.genre}
                        onChange={(e) => setGameFormData({ ...gameFormData, genre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Developer *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Nintendo"
                        value={gameFormData.developer}
                        onChange={(e) => setGameFormData({ ...gameFormData, developer: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Publisher *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Nintendo"
                        value={gameFormData.publisher}
                        onChange={(e) => setGameFormData({ ...gameFormData, publisher: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ROM URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., /roms/pokemon-ruby.gba"
                        value={gameFormData.gameUrl}
                        onChange={(e) => setGameFormData({ ...gameFormData, gameUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      placeholder="Brief overview of the game"
                      value={gameFormData.description}
                      onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Full Description</label>
                    <textarea
                      className="form-control"
                      placeholder="Detailed description of the game"
                      value={gameFormData.fullDescription}
                      onChange={(e) => setGameFormData({ ...gameFormData, fullDescription: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Gameplay Description</label>
                    <textarea
                      className="form-control"
                      placeholder="How to play the game"
                      value={gameFormData.gameplayDescription}
                      onChange={(e) => setGameFormData({ ...gameFormData, gameplayDescription: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Cover Image URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="e.g., https://example.com/cover.jpg"
                      value={gameFormData.coverImageUrl}
                      onChange={(e) => setGameFormData({ ...gameFormData, coverImageUrl: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Achievements (JSON)</label>
                    <textarea
                      className="form-control"
                      placeholder='e.g., [{"name": "First Win", "description": "Win your first game"}]'
                      value={gameFormData.achievements}
                      onChange={(e) => setGameFormData({ ...gameFormData, achievements: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tips (JSON)</label>
                    <textarea
                      className="form-control"
                      placeholder='e.g., ["Use the jump button to avoid enemies"]'
                      value={gameFormData.tips}
                      onChange={(e) => setGameFormData({ ...gameFormData, tips: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Screenshots (JSON)</label>
                    <textarea
                      className="form-control"
                      placeholder='e.g., ["https://example.com/screenshot1.jpg"]'
                      value={gameFormData.screenshots}
                      onChange={(e) => setGameFormData({ ...gameFormData, screenshots: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Controls (JSON)</label>
                    <textarea
                      className="form-control"
                      placeholder='e.g., [{"action": "Jump", "keyboard": "Space"}]'
                      value={gameFormData.controls}
                      onChange={(e) => setGameFormData({ ...gameFormData, controls: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Comments (JSON)</label>
                    <textarea
                      className="form-control"
                      placeholder='e.g., [{"user": "Player1", "text": "Great game!"}]'
                      value={gameFormData.comments}
                      onChange={(e) => setGameFormData({ ...gameFormData, comments: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Related Games (Optional)</label>
                    <select
                      multiple
                      className="form-control"
                      value={gameFormData.relatedGames}
                      onChange={(e) => setGameFormData({
                        ...gameFormData,
                        relatedGames: Array.from(e.target.selectedOptions, (option) => option.value),
                      })}
                    >
                      {games
                        .filter((g) => g.id !== selectedGame?.id)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {selectedGame ? 'Update Game' : 'Add Game'}
                  </button>
                  {selectedGame && (
                    <button
                      type="button"
                      className="btn btn-secondary ms-2"
                      onClick={() => {
                        setSelectedGame(null);
                        setGameFormData({
                          title: '',
                          system: '',
                          consoleId: '',
                          releaseDate: '',
                          genre: '',
                          developer: '',
                          publisher: '',
                          description: '',
                          coverImageUrl: '',
                          fullDescription: '',
                          gameplayDescription: '',
                          achievements: '',
                          tips: '',
                          screenshots: '',
                          controls: '',
                          comments: '',
                          relatedGames: [],
                          gameUrl: '',
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
                <table className="table mt-4">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>System</th>
                      <th>Console</th>
                      <th>Release Date</th>
                      <th>Genre</th>
                      <th>Developer</th>
                      <th>Publisher</th>
                      <th>ROM URL</th>
                      <th>Rating</th>
                      <th>Playing</th>
                      <th>Views</th>
                      <th>Related Games</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g) => {
                      const consoleName = consoles.find((c) => c.id === g.consoleId)?.name || 'N/A';
                      const relatedTitles = g.relatedGames
                        ?.map((id) => games.find((game) => game.id === id)?.title || 'N/A')
                        .join(', ') || 'None';
                      return (
                        <tr key={g.id}>
                          <td>{g.title}</td>
                          <td>{g.system}</td>
                          <td>{consoleName}</td>
                          <td>{g.releaseDate}</td>
                          <td>{g.genre}</td>
                          <td>{g.developer}</td>
                          <td>{g.publisher}</td>
                          <td>{g.gameUrl || 'N/A'}</td>
                          <td>{g.rating || 0}</td>
                          <td>{g.playingCount || 0}</td>
                          <td>{g.viewCount || 0}</td>
                          <td>{relatedTitles}</td>
                          <td>
                            <button
                              className="btn btn-warning btn-sm me-2"
                              onClick={() => handleEditGame(g)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteGame(g.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Consoles Tab */}
          {activeTab === 'consoles' && (
            <div className="card">
              <div className="card-header">
                <i className="fas fa-gamepad me-2"></i>Manage Consoles
              </div>
              <div className="card-body">
                <h5 className="mb-3">Add/Edit Console</h5>
                <form onSubmit={handleSaveConsole}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Nintendo Entertainment System"
                        value={consoleFormData.name}
                        onChange={(e) => setConsoleFormData({ ...consoleFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Short Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., NES"
                        value={consoleFormData.shortName}
                        onChange={(e) => setConsoleFormData({ ...consoleFormData, shortName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Manufacturer *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Nintendo"
                        value={consoleFormData.manufacturer}
                        onChange={(e) => setConsoleFormData({ ...consoleFormData, manufacturer: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Release Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={consoleFormData.releaseDate}
                        onChange={(e) => setConsoleFormData({ ...consoleFormData, releaseDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Generation *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Third Generation"
                        value={consoleFormData.generation}
                        onChange={(e) => setConsoleFormData({ ...consoleFormData, generation: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      placeholder="Brief history or overview of the console"
                      value={consoleFormData.description}
                      onChange={(e) => setConsoleFormData({ ...consoleFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Image URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="e.g., https://example.com/console.jpg"
                      value={consoleFormData.imageUrl}
                      onChange={(e) => setConsoleFormData({ ...consoleFormData, imageUrl: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {selectedConsole ? 'Update Console' : 'Add Console'}
                  </button>
                  {selectedConsole && (
                    <button
                      type="button"
                      className="btn btn-secondary ms-2"
                      onClick={() => {
                        setSelectedConsole(null);
                        setConsoleFormData({
                          name: '',
                          shortName: '',
                          gamesCount: 0,
                          manufacturer: '',
                          releaseDate: '',
                          generation: '',
                          description: '',
                          imageUrl: '',
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
                <table className="table mt-4">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Short Name</th>
                      <th>Manufacturer</th>
                      <th>Release Date</th>
                      <th>Generation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consoles.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.shortName}</td>
                        <td>{c.manufacturer}</td>
                        <td>{c.releaseDate}</td>
                        <td>{c.generation}</td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => handleEditConsole(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteConsole(c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Discussions Tab */}
          {activeTab === 'discussions' && (
            <div className="card">
              <div className="card-header">
                <i className="fas fa-comments me-2"></i>Manage Discussions
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Replies</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((d) => (
                      <tr key={d.id}>
                        <td>{d.title}</td>
                        <td>{d.author}</td>
                        <td>{d.replies}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDiscussion(d.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="card">
              <div className="card-header">
                <i className="fas fa-chart-line me-2"></i>Analytics
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body text-center">
                        <h5>Total Users</h5>
                        <p>{users.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body text-center">
                        <h5>Total Games</h5>
                        <p>{games.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body text-center">
                        <h5>Total Consoles</h5>
                        <p>{consoles.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body text-center">
                        <h5>Total Discussions</h5>
                        <p>{discussions.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}