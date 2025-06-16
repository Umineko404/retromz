'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import PacmanLoader from '../../../components/PacmanLoader';
import ScrollProgressBar from '../../../components/ScrollProgressBar';

export default function TermsPage() {
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
    return <PacmanLoader message="Loading Terms of Service" />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} />
      <section className="hero">
        <div className="container-fluid">
          <div className="text-center mb-5">
            <h1><i className="fas fa-file-contract me-2"></i>Terms of Service</h1>
            <p className="lead">Rules and guidelines for using RETROMZ</p>
          </div>
        </div>
      </section>
      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <div className="card">
              <div className="card-body">
                <h3>Acceptance of Terms</h3>
                <p>
                  By accessing and using RETROMZ, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>

                <h3 className="mt-4">Use License</h3>
                <p>
                  Permission is granted to temporarily access RETROMZ for personal, 
                  non-commercial transitory viewing only. This is the grant of a license, 
                  not a transfer of title, and under this license you may not:
                </p>
                <ul>
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display</li>
                  <li>attempt to reverse engineer any software contained on the website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>

                <h3 className="mt-4">User Accounts</h3>
                <p>
                  When you create an account with us, you must provide information that is 
                  accurate, complete, and current at all times. You are responsible for 
                  safeguarding the password and for all activities that occur under your account.
                </p>

                <h3 className="mt-4">User Content</h3>
                <p>
                  Users may post reviews, comments, and other content. You retain ownership 
                  of your content, but grant RETROMZ a license to use, display, and distribute 
                  your content on our platform. You are responsible for ensuring your content 
                  does not violate any laws or third-party rights.
                </p>

                <h3 className="mt-4">Prohibited Uses</h3>
                <p>You may not use RETROMZ:</p>
                <ul>
                  <li>For any unlawful purpose or to solicit others to unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                  <li>To upload or transmit viruses or any other type of malicious code</li>
                </ul>

                <h3 className="mt-4">Intellectual Property</h3>
                <p>
                  The service and its original content, features, and functionality are and will 
                  remain the exclusive property of RETROMZ and its licensors. The service is 
                  protected by copyright, trademark, and other laws.
                </p>

                <h3 className="mt-4">Game Content</h3>
                <p>
                  RETROMZ provides access to retro games for educational and preservation purposes. 
                  Users are responsible for ensuring they have the legal right to access and play 
                  any games on our platform. We respect intellectual property rights and will 
                  remove content upon valid DMCA requests.
                </p>

                <h3 className="mt-4">Disclaimer</h3>
                <p>
                  The information on this website is provided on an "as is" basis. To the fullest 
                  extent permitted by law, RETROMZ excludes all representations, warranties, 
                  conditions, and terms relating to our website and the use of this website.
                </p>

                <h3 className="mt-4">Limitation of Liability</h3>
                <p>
                  In no event shall RETROMZ, nor its directors, employees, partners, agents, 
                  suppliers, or affiliates, be liable for any indirect, incidental, punitive, 
                  consequential, or special damages.
                </p>

                <h3 className="mt-4">Termination</h3>
                <p>
                  We may terminate or suspend your account and bar access to the service 
                  immediately, without prior notice or liability, under our sole discretion, 
                  for any reason whatsoever, including breach of the Terms.
                </p>

                <h3 className="mt-4">Changes to Terms</h3>
                <p>
                  We reserve the right to modify or replace these Terms at any time. If a 
                  revision is material, we will provide at least 30 days notice prior to 
                  any new terms taking effect.
                </p>

                <h3 className="mt-4">Contact Information</h3>
                <p>
                  If you have any questions about these Terms of Service, please contact us 
                  at terms@retromz.com.
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
      <Footer />
    </>
  );
}