'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { auth } from '../../firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [theme, setTheme] = useState('dark');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    if (typeof window !== 'undefined') {
      (async () => {
        await import('bootstrap/dist/js/bootstrap.bundle.min.js');
      })();
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('User logged in:', userCredential.user);
      alert('Login successful!');
      router.push('/');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <>
      <Head>
        <title>RETROMZ - Login</title>
        <meta name="description" content="Login to the RETROMZ retro gaming community" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <section className="hero">
        <div className="container">
          <h1 className="text-glitch">Welcome Back</h1>
          <p className="lead mb-4">Login to access your retro gaming profile</p>
        </div>
      </section>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <i className="fas fa-sign-in-alt me-2 icon-glow"></i>Login
              </div>
              <div className="card-body p-4">
                {errors.submit && (
                  <div className="alert alert-danger" role="alert">
                    {errors.submit}
                  </div>
                )}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary">
                      <i className="fas fa-envelope icon-glow"></i>
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
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
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={formData.password}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="d-flex align-items-center text-muted">
                    <input
                      type="checkbox"
                      name="remember"
                      className="me-2"
                      checked={formData.remember}
                      onChange={handleInputChange}
                    />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-primary-custom small">
                    Forgot Password?
                  </Link>
                </div>
                <button
                  className="btn btn-primary btn-login w-100"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2 icon-glow"></i>Login
                    </>
                  )}
                </button>
                <div className="text-center mt-3">
                  <p className="text-muted small">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-primary-custom">Register</Link>
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
