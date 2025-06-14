'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <Image
              src="/retromz-logo.png"
              alt="RETROMZ Logo"
              width={120}
              height={40}
              style={{ objectFit: 'contain' }}
            />
            <p className="text-muted">
              The ultimate retro gaming community. Play games, join discussions, and connect with fellow gamers.
            </p>
            <div className="d-flex gap-3">
              <a href="https://facebook.com/retromz" className="nav-link" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com/retromz" className="nav-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://discord.gg/retromz" className="nav-link" aria-label="Discord">
                <i className="fab fa-discord"></i>
              </a>
              <a href="https://youtube.com/retromz" className="nav-link" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          <div className="col-md-2 mb-4 mb-md-0">
            <h6>Quick Links</h6>
            <ul className="list-unstyled">
              <li><Link href="/" className="nav-link">Home</Link></li>
              <li><Link href="/games" className="nav-link">Games</Link></li>
              <li><Link href="/forum" className="nav-link">Forum</Link></li>
              <li><Link href="/about" className="nav-link">About</Link></li>
            </ul>
          </div>
          <div className="col-md-2 mb-4 mb-md-0">
            <h6>Game Systems</h6>
            <ul className="list-unstyled">
              <li><Link href="/games/nes" className="nav-link">NES</Link></li>
              <li><Link href="/games/snes" className="nav-link">SNES</Link></li>
              <li><Link href="/games/n64" className="nav-link">N64</Link></li>
              <li><Link href="/games/gba" className="nav-link">GBA</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6>Newsletter</h6>
            <p className="text-muted small">
              Subscribe to our newsletter for the latest updates.
            </p>
            <div className="d-flex">
              <input
                type="email"
                placeholder="Your email"
                className="form-control form-control-sm bg-dark border-secondary rounded-start me-2"
              />
              <button className="btn btn-sm btn-primary btn-subscribe rounded-end">Subscribe</button>
            </div>
          </div>
        </div>
        <hr className="mt-4" />
        <div className="text-center">
          <p className="mb-0 small">
            © 2025 RETROMZ.com | All rights reserved |{' '}
            <Link href="/privacy" className="nav-link d-inline">Privacy Policy</Link> |{' '}
            <Link href="/terms" className="nav-link d-inline">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
