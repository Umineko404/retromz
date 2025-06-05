'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';

interface UserProfile {
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
  favoriteGames: string[];
  joinedDate: string;
  admin: boolean;
  banned: boolean;
}

export default function ProfilePage() {
  const { isLoading, progress, loadingTitle, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await onDataLoad('Profile Data');
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              username: userData.username || currentUser.displayName || 'Retro Gamer',
              email: userData.email || currentUser.email,
              photoURL: userData.photoURL || currentUser.photoURL,
              bio: userData.bio || 'No bio provided yet.',
              favoriteGames: userData.favoriteGames || [],
              joinedDate: userData.createdAt
                ? new Date(userData.createdAt.toDate()).toLocaleDateString()
                : 'N/A',
              admin: userData.admin || false,
              banned: userData.banned || false,
            });
            setNewUsername(userData.username || currentUser.displayName || 'Retro Gamer');
            setNewBio(userData.bio || 'No bio provided yet.');
          } else {
            setError('Profile not found. Please contact support.');
          }
        } catch (err) {
          console.error('Error fetching profile data:', err);
          setError('Failed to load profile data. Please try again.');
        }
      }
    });

    return () => unsubscribe();
  }, [onDataLoad]);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return false;
    setIsCheckingUsername(true);
    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        const { available } = await response.json();
        if (!available) {
          setError('Username already taken');
          return false;
        }
        return true;
      }
      const { error } = await response.json();
      console.error('Username check failed:', error, 'Status:', response.status);
      setError(error || 'Failed to check username');
      return false;
    } catch (err) {
      console.error('Username check error:', err.message, err.stack);
      setError('Network error checking username');
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const getDirectImageUrl = (url: string): string => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    if (url.includes('dropbox.com') && !url.includes('dl=1')) {
      return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }
    return url;
  };

  const handleImageUrlChange = (url: string) => {
    const processedUrl = getDirectImageUrl(url);
    setNewImageUrl(processedUrl);
    setImageError(null);
    setImagePreview(null);

    if (!processedUrl.trim()) {
      return;
    }

    try {
      new URL(processedUrl);
    } catch {
      setImageError('Please enter a valid URL');
      return;
    }

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    const isImageUrl = imageExtensions.test(processedUrl) ||
                      processedUrl.includes('imgur.com') ||
                      processedUrl.includes('cloudinary.com') ||
                      processedUrl.includes('unsplash.com') ||
                      processedUrl.includes('pexels.com') ||
                      processedUrl.includes('cdn.') ||
                      processedUrl.includes('images.') ||
                      processedUrl.includes('drive.google.com/uc') ||
                      processedUrl.includes('dl.dropboxusercontent.com');

    if (!isImageUrl) {
      setImageError('URL should point to an image file (jpg, png, gif, etc.)');
    }

    setIsLoadingImage(true);
    const img = new Image();
    const timeoutId = setTimeout(() => {
      if (isLoadingImage) {
        setIsLoadingImage(false);
        setImageError('Image loading timeout. Please try a different URL.');
      }
    }, 10000);

    img.onload = () => {
      clearTimeout(timeoutId);
      setIsLoadingImage(false);
      setImagePreview(processedUrl);
      setImageError(null);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      setIsLoadingImage(false);
      setImageError('Failed to load image. Please check the URL and try again.');
      setImagePreview(null);
    };

    img.src = processedUrl;
  };

  const handleRemoveImage = () => {
    setNewImageUrl('');
    setImagePreview(null);
    setImageError(null);
  };

  const handleRemoveCurrentImage = async () => {
    if (!user || !profile) return;
    setIsRemovingImage(true);
    try {
      setError(null);

      // Update Firebase Auth profile to remove photoURL
      await updateProfile(user, {
        photoURL: null
      });

      // Update Firestore document to remove photoURL
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: null
      });

      // Update local state
      setProfile({
        ...profile,
        photoURL: null
      });

    } catch (err) {
      console.error('Error removing profile image:', err.message, err.stack);
      setError(`Failed to remove profile image: ${err.message}`);
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      setError(null);

      if (newUsername.trim() !== profile?.username) {
        if (newUsername.length < 3) {
          setError('Username must be at least 3 characters');
          return;
        }
        if (newUsername.length > 20) {
          setError('Username must be less than 20 characters');
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
          setError('Username can only contain letters, numbers, and underscores');
          return;
        }
        const isAvailable = await checkUsernameAvailability(newUsername.trim());
        if (!isAvailable) return;
      }

      let photoURL = profile?.photoURL;
      if (imagePreview && newImageUrl.trim()) {
        photoURL = newImageUrl.trim();
      }

      if (newUsername.trim() !== profile?.username || (photoURL !== profile?.photoURL)) {
        await updateProfile(user, {
          displayName: newUsername.trim(),
          ...(photoURL ? { photoURL } : { photoURL: null })
        });
      }

      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        username: newUsername.trim(),
        bio: newBio.trim(),
        updatedAt: new Date(),
        ...(photoURL ? { photoURL } : { photoURL: null })
      };

      await updateDoc(userRef, updateData);

      setProfile({
        ...profile!,
        username: newUsername.trim(),
        bio: newBio.trim(),
        photoURL: photoURL,
      });

      setIsEditing(false);
      setNewImageUrl('');
      setImagePreview(null);
      setImageError(null);
    } catch (err) {
      console.error('Error updating profile:', err.message, err.stack);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewUsername(profile?.username || '');
    setNewBio(profile?.bio || '');
    setNewImageUrl('');
    setImagePreview(null);
    setImageError(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`} role="alert" aria-label="Loading homepage data">
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

  if (!user) {
    return (
      <>
        <Navbar theme={theme} setTheme={toggleTheme} user={user} />
        <section className="hero py-5">
          <div className="container text-center">
            <h1 className="mb-3">Please Log In</h1>
            <p className="lead mb-4">Sign in to view and customize your RetroMZ profile!</p>
            <div className="d-flex justify-content-center gap-3">
              <Link href="/login" className="btn btn-primary">
                <i className="fas fa-sign-in-alt me-2"></i>Log In
              </Link>
              <Link href="/register" className="btn btn-outline-secondary">
                <i className="fas fa-user-plus me-2"></i>Register
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (profile?.banned) {
    return (
      <>
        <Navbar theme={theme} setTheme={toggleTheme} user={user} />
        <section className="hero py-5">
          <div className="container text-center">
            <h1 className="mb-3">Account Banned</h1>
            <p className="lead mb-4">Your account has been banned. Please contact support for assistance.</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>RetroMZ - Your Profile</title>
        <meta name="description" content="View and customize your RetroMZ profile, including your username, bio, and profile image." />
      </Head>
      <Navbar theme={theme} setTheme={toggleTheme} user={user} />
      <section className="hero py-5">
        <div className="container text-center">
          <h1 className="mb-3">Welcome back, {profile?.username || 'Retro Gamer'}!</h1>
          <p className="lead mb-0">Customize your profile and showcase your gaming journey</p>
        </div>
      </section>
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">Profile Information</div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                  </div>
                )}
                {isEditing ? (
                  <div className="edit-profile-form">
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label">Username</label>
                      <div className="input-group">
                        <input
                          type="text"
                          id="username"
                          className={`form-control ${error && error.includes('Username') ? 'is-invalid' : ''}`}
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          maxLength={20}
                          disabled={isCheckingUsername}
                          aria-describedby="usernameHelp"
                        />
                        {isCheckingUsername && (
                          <span className="input-group-text">
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Checking...</span>
                            </div>
                          </span>
                        )}
                        {error && error.includes('Username') && (
                          <div className="invalid-feedback">{error}</div>
                        )}
                      </div>
                      <small id="usernameHelp" className="form-text text-muted">3-20 characters, letters, numbers, and underscores only</small>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="bio" className="form-label">Bio</label>
                      <textarea
                        id="bio"
                        className="form-control"
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="Tell us about yourself..."
                        aria-describedby="bioHelp"
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                      <small id="bioHelp" className="form-text text-muted">{newBio.length}/500 characters</small>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">Profile Image URL</label>
                      <div className="input-group">
                        <input
                          type="url"
                          id="imageUrl"
                          className={`form-control ${imageError ? 'is-invalid' : imagePreview ? 'is-valid' : ''}`}
                          value={newImageUrl}
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          placeholder="https://example.com/your-image.jpg"
                          aria-describedby="imageUrlHelp"
                        />
                        {newImageUrl && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleRemoveImage}
                            title="Clear image"
                            aria-label="Clear image URL"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                        {isLoadingImage && (
                          <span className="input-group-text">
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </span>
                        )}
                      </div>
                      {imageError && (
                        <div className="invalid-feedback d-block">{imageError}</div>
                      )}
                      <small id="imageUrlHelp" className="form-text text-muted">
                        Enter a direct link to an image (e.g., from Imgur, Google Drive, Dropbox, etc.)
                      </small>
                    </div>
                    {imagePreview && (
                      <div className="mb-3">
                        <label className="form-label">Image Preview</label>
                        <div className="card">
                          <div className="card-body text-center">
                            <img
                              src={imagePreview}
                              alt="Profile preview"
                              className="img-fluid rounded-circle"
                              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                              onError={() => {
                                setImageError('Image failed to load properly');
                                setImagePreview(null);
                              }}
                            />
                            <div className="mt-2">
                              <small className="text-success">
                                <i className="fas fa-check-circle me-1"></i>
                                Image loaded successfully
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {profile?.photoURL && !imagePreview && (
                      <div className="mb-3">
                        <label className="form-label">Current Profile Image</label>
                        <div className="card">
                          <div className="card-body text-center">
                            <img
                              src={profile.photoURL}
                              alt="Current profile"
                              className="img-fluid rounded-circle"
                              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                            <div className="mt-2">
                              <small className="text-muted">
                                Add a new image URL above to change your profile picture
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="card mb-3">
                      <div className="card-body">
                        <h6 className="card-title"><i className="fas fa-lightbulb me-2"></i>Tips for finding image URLs</h6>
                        <ul className="mb-0 small">
                          <li><strong>Imgur:</strong> Upload to imgur.com, right-click → "Copy image address"</li>
                          <li><strong>Google Drive:</strong> Make public, get shareable link (automatically converted)</li>
                          <li><strong>Discord:</strong> Upload to any chat, right-click → "Copy image address"</li>
                          <li><strong>GitHub:</strong> Upload to a repository, use the raw file URL</li>
                          <li><strong>Dropbox:</strong> Get shareable link (automatically converted)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveProfile}
                        disabled={isCheckingUsername || isLoadingImage || (newImageUrl && !imagePreview) || isSaving}
                        aria-label="Save profile changes"
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>Save Changes
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        aria-label="Cancel editing"
                      >
                        <i className="fas fa-times me-2"></i>Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    <div className="row align-items-start">
                      <div className="col-auto">
                        <div className="position-relative" style={{ width: '100px' }}>
                          {profile?.photoURL ? (
                            <img
                              src={profile.photoURL}
                              alt="User avatar"
                              className="rounded-circle"
                              width="100"
                              height="100"
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display =ទ
                              }}
                            />
                          ) : null}
                          <div
                            className={`rounded-circle bg-secondary d-flex align-items-center justify-content-center ${profile?.photoURL ? 'd-none' : ''}`}
                            style={{ width: '100px', height: '100px' }}
                          >
                            <i className="fas fa-user fa-2x text-white"></i>
                          </div>
                          {profile?.photoURL && (
                            <button
                              className="btn btn-sm btn-danger position-absolute rounded-circle"
                              onClick={handleRemoveCurrentImage}
                              disabled={isRemovingImage}
                              aria-label="Remove profile image"
                              style={{ 
                                top: '-8px', 
                                right: '-8px',
                                width: '24px',
                                height: '24px',
                                padding: '0',
                                fontSize: '12px'
                              }}
                            >
                              {isRemovingImage ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                              ) : (
                                <i className="fas fa-times"></i>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col">
                        <div className="ms-3">
                          <h4 className="mb-1">{profile?.username || 'Retro Gamer'}</h4>
                          <p className="text-muted mb-1">{profile?.email}</p>
                          {profile?.admin && (
                            <span className="badge bg-primary">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <strong>Bio:</strong>
                      <div 
                        className="mt-1 mb-0"
                        style={{ 
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          maxWidth: '100%'
                        }}
                      >
                        {profile?.bio}
                      </div>
                    </div>
                    <div>
                      <strong>Joined:</strong>
                      <span className="ms-2">{profile?.joinedDate}</span>
                    </div>
                    <button
                      className="btn btn-primary align-self-start"
                      onClick={() => setIsEditing(true)}
                      aria-label="Edit profile"
                    >
                      <i className="fas fa-edit me-2"></i>Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
            <h3 className="my-4">
              <i className="fas fa-star me-2 text-primary"></i>
              Favorite Games
            </h3>
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">Your Favorite Games</div>
              <div className="card-body">
                {profile?.favoriteGames && profile.favoriteGames.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {profile.favoriteGames.map((game, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <span style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{game}</span>
                        <span className="badge bg-primary rounded-pill ms-2 flex-shrink-0">{index + 1}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-gamepad fa-3x mb-3"></i>
                    <p className="mb-2">No favorite games added yet.</p>
                    <p className="small mb-0">Start exploring our game library to add your favorites!</p>
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