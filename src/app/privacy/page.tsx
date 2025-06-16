'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import PacmanLoader from '../../../components/PacmanLoader';
import ScrollProgressBar from '../../../components/ScrollProgressBar';

export default function PrivacyPage() {
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-bs-theme', initialTheme);

        await import('bootstrap/dist/js/bootstrap.bundle.min.js');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    return <PacmanLoader message="Loading Privacy Policy" />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      <div className="container-fluid py-0 px-0">
        <div className="hero text-center mb-5">
          <h1><i className="fas fa-shield-alt me-2"></i>Privacy Policy</h1>
          <p className="lead">How we protect and handle your information</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="card">
                <div className="card-body">
                  <h3>Information We Collect</h3>
                  <p>
                    RETROMZ collects information you provide directly to us, such as when you create an account, 
                    write reviews, or contact us. This may include your email address, username, and any content 
                    you submit to our platform.
                  </p>

                  <h3 className="mt-4">How We Use Your Information</h3>
                  <ul>
                    <li>To provide, maintain, and improve our services</li>
                    <li>To process transactions and send related information</li>
                    <li>To send technical notices and security alerts</li>
                    <li>To respond to your comments and questions</li>
                    <li>To communicate with you about products, services, and events</li>
                  </ul>

                  <h3 className="mt-4">Information Sharing</h3>
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties 
                    without your consent, except as described in this policy. We may share your information 
                    in the following circumstances:
                  </p>
                  <ul>
                    <li>With your consent</li>
                    <li>To comply with laws or legal processes</li>
                    <li>To protect the rights and safety of RETROMZ and our users</li>
                  </ul>

                  <h3 className="mt-4">Data Security</h3>
                  <p>
                    We implement appropriate security measures to protect your personal information against 
                    unauthorized access, alteration, disclosure, or destruction. However, no method of 
                    transmission over the Internet is 100% secure.
                  </p>

                  <h3 className="mt-4">Cookies and Tracking</h3>
                  <p>
                    We use cookies and similar technologies to enhance your experience on our platform. 
                    You can control cookie settings through your browser preferences.
                  </p>

                  <h3 className="mt-4">Your Rights</h3>
                  <p>
                    You have the right to access, update, or delete your personal information. You can 
                    do this by logging into your account or contacting us directly.
                  </p>

                  <h3 className="mt-4">Children's Privacy</h3>
                  <p>
                    Our service is not intended for children under 13 years of age. We do not knowingly 
                    collect personal information from children under 13.
                  </p>

                  <h3 className="mt-4">Changes to This Policy</h3>
                  <p>
                    We may update this privacy policy from time to time. We will notify you of any 
                    changes by posting the new policy on this page and updating the effective date.
                  </p>

                  <h3 className="mt-4">Contact Us</h3>
                  <p>
                    If you have any questions about this privacy policy, please contact us at 
                    privacy@retromz.com or through our contact form.
                  </p>

                  <div className="text-muted mt-4">
                    <small>Last updated: {new Date().toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            </div>
            <Sidebar />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}