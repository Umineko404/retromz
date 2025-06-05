'use client';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import EmulatorPlayer from '@/components/EmulatorPlayer';

export default function PlayPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
  }, []);

  return (
    <>
      <Head>
        <title>RETROMZ - Play Pokemon Ruby</title>
        <meta name="description" content="Play Pokemon Ruby on RETROMZ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      {/* Hero Section (Full-Width) */}
      <section className="hero">
        <div className="full-width px-3">
          <h1 className="text-glitch">Playing: Pokemon Ruby</h1>
          <p className="lead mb-4">Enjoy this classic GBA adventure!</p>
          <Link href="/games" className="btn btn-primary me-2">
            <i className="fas fa-gamepad me-2"></i>Back to Games
          </Link>
        </div>
      </section>

      {/* Main Content (Containered) */}
      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <div className="card mt-4">
              <div className="card-body">
                <EmulatorPlayer romPath="/roms/pokemon-ruby.gba" />
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