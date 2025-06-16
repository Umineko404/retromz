'use client';
import dynamic from 'next/dynamic';

// Dynamically import AdminComponent with SSR disabled
const AdminComponent = dynamic(() => import('./AdminComponent'), {
  ssr: false,
  loading: () => <div>Loading admin panel...</div>,
});

export default function AdminWrapper() {
  return <AdminComponent />;
}