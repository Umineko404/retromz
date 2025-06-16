'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import Footer from '../../../components/Footer';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import PacmanLoader from '../../../components/PacmanLoader';
import ScrollProgressBar from '../../../components/ScrollProgressBar';
import { useThemeAwareLoader } from '../hooks/useThemeAwareLoader';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'game' | 'forum' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  image?: string;
  link: string;
}

export default function RecentActivityPage() {
  const { isLoading, progress, loadingTitle, loadingText, theme, toggleTheme, onDataLoad } = useThemeAwareLoader();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const fetchActivities = async () => {
      if (!user) {
        setActivities([]);
        return;
      }

      try {
        await onDataLoad('Recent Activity Data');

        // Fetch recently played games
        const gamesQuery = query(
          collection(db, 'user_games'),
          where('userId', '==', user.uid),
          orderBy('lastPlayed', 'desc'),
          limit(5)
        );
        const gamesSnapshot = await getDocs(gamesQuery);
        const gameActivities: Activity[] = gamesSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'game',
          title: doc.data().gameTitle,
          description: `Played on ${formatDistanceToNow(new Date(doc.data().lastPlayed), { addSuffix: true })}`,
          timestamp: doc.data().lastPlayed,
          image: doc.data().coverImageUrl || 'https://via.placeholder.com/100',
          link: `/games/${encodeURIComponent(doc.data().gameTitle.toLowerCase().replace(/\s+/g, '-'))}`,
        }));

        // Fetch recent forum posts
        const postsQuery = query(
          collection(db, 'forum_posts'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postActivities: Activity[] = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'forum',
          title: doc.data().postTitle,
          description: `Posted ${formatDistanceToNow(new Date(doc.data().createdAt), { addSuffix: true })}`,
          timestamp: doc.data().createdAt,
          link: `/forum/post/${doc.id}`,
        }));

        // Fetch recent achievements
        const achievementsQuery = query(
          collection(db, 'user_achievements'),
          where('userId', '==', user.uid),
          orderBy('unlockedAt', 'desc'),
          limit(5)
        );
        const achievementsSnapshot = await getDocs(achievementsQuery);
        const achievementActivities: Activity[] = achievementsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'achievement',
          title: doc.data().achievementName,
          description: `Unlocked ${formatDistanceToNow(new Date(doc.data().unlockedAt), { addSuffix: true })}`,
          timestamp: doc.data().unlockedAt,
          image: doc.data().iconUrl || 'https://via.placeholder.com/100',
          link: `/profile/achievements/${doc.id}`,
        }));

        // Combine and sort activities by timestamp
        const allActivities = [...gameActivities, ...postActivities, ...achievementActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        setActivities(allActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };

    fetchActivities();
    return () => unsubscribe();
  }, [user, onDataLoad]);

  if (isLoading) {
    return <PacmanLoader message={loadingText || 'Loading Recent Activity'} />;
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={toggleTheme} user={user} />
      <section className="hero">
        <div className="container">
          {user ? (
            <>
              <h1>Your Recent Activity, {user.displayName || user.email}</h1>
              <p className="lead mb-4">See what you've been up to in the retro gaming community</p>
              <Link href="/profile" className="btn btn-primary me-2">
                <i className="fas fa-user me-2"></i>View Profile
              </Link>
              <Link href="/games" className="btn btn-outline-secondary">
                <i className="fas fa-gamepad me-2"></i>Play Games
              </Link>
            </>
          ) : (
            <>
              <h1>Recent Activity</h1>
              <p className="lead mb-4">Sign in to see your personalized activity feed</p>
              <Link href="/login" className="btn btn-primary me-2">
                <i className="fas fa-sign-in-alt me-2"></i>Sign In
              </Link>
              <Link href="/games" className="btn btn-outline-secondary">
                <i className="fas fa-gamepad me-2"></i>Explore Games
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <h3 className="mb-4">
              <i className="fas fa-history me-2 text-primary-custom"></i>
              Your Activity Feed
            </h3>
            {user ? (
              activities.length > 0 ? (
                <div className="activity-feed">
                  {activities.map((activity) => (
                    <Link key={activity.id} href={activity.link} passHref className="text-decoration-none">
                      <div className="card mb-3 activity-card">
                        <div className="card-body d-flex align-items-center">
                          {activity.image && (
                            <img
                              src={activity.image}
                              alt={`${activity.title} icon`}
                              className="me-3"
                              width="60"
                              height="60"
                              style={{ objectFit: 'cover', borderRadius: '4px' }}
                            />
                          )}
                          <div>
                            <h5 className="mb-1">
                              {activity.type === 'game' && <i className="fas fa-gamepad me-2 text-primary-custom"></i>}
                              {activity.type === 'forum' && <i className="fas fa-comments me-2 text-primary-custom"></i>}
                              {activity.type === 'achievement' && <i className="fas fa-trophy me-2 text-primary-custom"></i>}
                              {activity.title}
                            </h5>
                            <p className="mb-0 text-muted">{activity.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  No recent activity found. Start playing games, posting in the forum, or earning achievements!
                </div>
              )
            ) : (
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Please sign in to view your recent activity.
              </div>
            )}
          </div>
          <Sidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}