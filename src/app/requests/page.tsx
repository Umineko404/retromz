'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import ScrollProgressBar from '../../../components/ScrollProgressBar';
import PacmanLoader from '../../../components/PacmanLoader';
import { db } from '../../../src/firebase/firebase'; // Adjust path to your Firebase config
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

export default function RequestsPage() {
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [consoles, setConsoles] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    system: '',
    consoleId: '',
    releaseDate: '',
    genre: '',
    developer: '',
    publisher: '',
    description: '',
    reason: '',
    status: 'Pending', // Default status
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      if (typeof window !== 'undefined') {
        // Initialize theme
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-bs-theme', initialTheme);

        // Load bootstrap
        await import('bootstrap/dist/js/bootstrap.bundle.min.js');

        try {
          // Fetch consoles from Firebase
          const consolesSnapshot = await getDocs(collection(db, 'consoles'));
          const consolesData = consolesSnapshot.docs
            .filter((doc) => !doc.data().deleted)
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          setConsoles(consolesData);

          // Fetch recent requests from Firebase (handle if collection doesn't exist)
          try {
            const recentRequestsQuery = query(
              collection(db, 'requests'),
              orderBy('createdAt', 'desc'),
              limit(5)
            );
            const recentRequestsSnapshot = await getDocs(recentRequestsQuery);
            const recentRequestsData = recentRequestsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setRecentRequests(recentRequestsData);
          } catch (requestsErr) {
            console.log('Requests collection does not exist yet, starting with empty array');
            setRecentRequests([]);
          }
        } catch (err) {
          console.error('Error fetching consoles:', err);
          setError('Failed to load consoles.');
        }

        // Simulate loading time
        await new Promise((resolve) => setTimeout(resolve, 1500));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newRequest = await addDoc(collection(db, 'requests'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      
      alert('Game request submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        system: '',
        consoleId: '',
        releaseDate: '',
        genre: '',
        developer: '',
        publisher: '',
        description: '',
        reason: '',
        status: 'Pending',
      });

      // Refresh recent requests
      try {
        const recentRequestsQuery = query(
          collection(db, 'requests'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentRequestsSnapshot = await getDocs(recentRequestsQuery);
        const recentRequestsData = recentRequestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentRequests(recentRequestsData);
      } catch (requestsErr) {
        console.log('Error refreshing requests, keeping current state');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: 'bg-warning text-dark',
      Approved: 'bg-success',
      Rejected: 'bg-danger',
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <PacmanLoader message="Loading Requests" />;
  }

  if (error) {
    return (
      <div className="container text-center py-5">
        <h1 className={`text-${theme === 'dark' ? 'light' : 'danger'}`}>{error}</h1>
      </div>
    );
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      <div className="container-fluid py-0 px-0">
        <div className="hero text-center mb-5">
          <h1>
            <i className="fas fa-plus-circle me-2"></i>Game Requests
          </h1>
          <p className="lead">Request your favorite retro games to be added to our collection</p>
        </div>
      </div>
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-9">
            <div className="card mb-4">
              <div className="card-header">
                <h3>Request a game</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="title" className="form-label">
                        Game Title *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="title"
                        placeholder="e.g., Super Mario Bros."
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="system" className="form-label">
                        System *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="system"
                        placeholder="e.g., NES"
                        value={formData.system}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="consoleId" className="form-label">
                        Console *
                      </label>
                      <select
                        className="form-select"
                        id="consoleId"
                        value={formData.consoleId}
                        onChange={handleChange}
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
                      <label htmlFor="releaseDate" className="form-label">
                        Release Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="releaseDate"
                        value={formData.releaseDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="genre" className="form-label">
                        Genre *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="genre"
                        placeholder="e.g., Platformer"
                        value={formData.genre}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="developer" className="form-label">
                        Developer *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="developer"
                        placeholder="e.g., Nintendo"
                        value={formData.developer}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="publisher" className="form-label">
                        Publisher *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="publisher"
                        placeholder="e.g., Nintendo"
                        value={formData.publisher}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      placeholder="Brief overview of the game"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reason" className="form-label">
                      Why do you want this game? *
                    </label>
                    <textarea
                      className="form-control"
                      id="reason"
                      rows={3}
                      placeholder="Tell us why this game should be added"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    <i className="fas fa-paper-plane me-2"></i>Submit Request
                  </button>
                </form>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3>Recent Requests</h3>
              </div>
              <div className="card-body">
                {recentRequests.length > 0 ? (
                  <div className="list-group">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="list-group-item">
                        <div className="d-flex w-100 justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{request.title}</h6>
                            <p className="mb-1 text-muted small">
                              {request.system} • {request.genre} • {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <span className={`badge ${getStatusBadge(request.status)} ms-2`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <i className="fas fa-clock fa-2x text-muted mb-2"></i>
		    <p className="text-muted">No recent requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}