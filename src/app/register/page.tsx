'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { auth, db } from '../../firebase/firebase';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [theme, setTheme] = useState('dark');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;

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
          setErrors((prev) => ({ ...prev, username: 'Username already taken' }));
        } else {
          setErrors((prev) => ({ ...prev, username: '' }));
        }
      } else {
        const { error } = await response.json();
        console.error('Username check failed:', error, 'Status:', response.status);
        setErrors((prev) => ({ ...prev, username: error || 'Failed to check username' }));
      }
    } catch (error) {
      console.error('Username check error:', error.message, error.stack);
      setErrors((prev) => ({ ...prev, username: 'Network error checking username' }));
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const validateField = (name, value, formData) => {
    let error = '';
    switch (name) {
      case 'username':
        if (!value.trim()) error = 'Username is required';
        else if (value.length < 3) error = 'Username must be at least 3 characters';
        else if (value.length > 20) error = 'Username must be less than 20 characters';
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) error = 'Username can only contain letters, numbers, and underscores';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 6) error = 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match';
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    const error = validateField(name, value, newFormData);
    setErrors((prev) => ({ ...prev, [name]: error }));

    if (name === 'password') {
      const confirmError = validateField('confirmPassword', newFormData.confirmPassword, newFormData);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }

    if (name === 'username' && value.length >= 3) {
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }
      const timeout = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      setUsernameCheckTimeout(timeout);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.username = validateField('username', formData.username, formData);
    newErrors.email = validateField('email', formData.email, formData);
    newErrors.password = validateField('password', formData.password, formData);
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword, formData);

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error) && !isCheckingUsername;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const usernameCheckResponse = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username.trim() }),
      });

      if (!usernameCheckResponse.ok) {
        const { error } = await usernameCheckResponse.json();
        setErrors({ username: error });
        setIsSubmitting(false);
        return;
      }

      const { available } = await usernameCheckResponse.json();
      if (!available) {
        setErrors({ username: 'Username already taken' });
        setIsSubmitting(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.username.trim() });

      await setDoc(doc(db, 'users', user.uid), {
        admin: false,
        banned: false,
        createdAt: new Date(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        bio: '',
        photoURL: null,
        favoriteGames: [],
      });

      alert('Registration successful! Welcome to RetroMZ!');
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
        setErrors((prev) => ({ ...prev, email: errorMessage }));
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        setErrors((prev) => ({ ...prev, password: errorMessage }));
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
        setErrors((prev) => ({ ...prev, email: errorMessage }));
      } else {
        setErrors((prev) => ({ ...prev, submit: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit(e);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>RetroMZ - Register</title>
        <meta name="description" content="Register for the RetroMZ retro gaming community" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar theme={theme} setTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

      <section className="hero">
        <div className="container">
          <h1 className="text-glitch">Create Account</h1>
          <p className="lead mb-4">Join RetroMZ and start your retro gaming adventure!</p>
        </div>
      </section>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <i className="fas fa-user-plus me-2 icon-glow"></i>Register
              </div>
              <div className="card-body p-4">
                {errors.submit && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text bg-dark border-secondary">
                        <i className="fas fa-user icon-glow"></i>
                      </span>
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        className={`form-control ${errors.username ? 'is-invalid' : errors.username === '' ? 'is-valid' : ''}`}
                        value={formData.username}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                        maxLength={20}
                      />
                      {isCheckingUsername && (
                        <span className="input-group-text bg-dark border-secondary">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Checking...</span>
                          </div>
                        </span>
                      )}
                      {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                      {errors.username === '' && formData.username.length >= 3 && !isCheckingUsername && (
                        <div className="valid-feedback">Username is available!</div>
                      )}
                    </div>
                    {(errors.username || !formData.username) && (
                      <small className="text-muted">3-20 characters, letters, numbers, and underscores only</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text bg-dark border-secondary">
                        <i className="fas fa-envelope icon-glow"></i>
                      </span>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className={`form-control ${errors.email ? 'is-invalid' : errors.email === '' ? 'is-valid' : ''}`}
                        value={formData.email}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text bg-dark border-secondary">
                        <i className="fas fa-lock icon-glow"></i>
                      </span>
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className={`form-control ${errors.password ? 'is-invalid' : errors.password === '' ? 'is-valid' : ''}`}
                        value={formData.password}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                      />
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>
                    {(errors.password || !formData.password) && (
                      <small className="text-muted">Minimum 6 characters</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text bg-dark border-secondary">
                        <i className="fas fa-lock icon-glow"></i>
                      </span>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : errors.confirmPassword === '' ? 'is-valid' : ''}`}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-register w-100"
                    disabled={isSubmitting || isCheckingUsername}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2 icon-glow"></i>Register
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <p className="text-muted small">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary-custom">
                      Login here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}