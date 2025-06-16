import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';
import PacmanLoader from '../../../components/PacmanLoader';

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<PacmanLoader message="Loading Search Page" />}>
      <SearchPageClient />
    </Suspense>
  );
}