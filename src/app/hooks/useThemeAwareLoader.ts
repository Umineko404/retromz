
import { useState, useEffect, useCallback } from 'react';

interface LoadingOptions {
  title?: string;
  text?: string;
  duration?: number;
  showProgress?: boolean;
}

export const useThemeAwareLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingTitle, setLoadingTitle] = useState('Loading');
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);

  const progressTexts = [
    'Initializing...',
    'Loading assets...',
    'Applying theme...',
    'Preparing interface...',
    'Almost ready...',
    'Complete!',
  ];

  // Check if we've loaded before on component mount
  useEffect(() => {
    const hasLoaded = localStorage.getItem('retromz-has-loaded');
    if (hasLoaded === 'true') {
      setHasLoadedBefore(true);
    }
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-bs-theme', initialTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const animateProgress = useCallback((duration: number) => {
    const steps = 10;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progressValue = (currentStep / steps) * 100;
      setProgress(progressValue);

      const textIndex = Math.floor((currentStep / steps) * progressTexts.length);
      if (textIndex < progressTexts.length) {
        setLoadingText(progressTexts[textIndex]);
      }

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  const showLoading = useCallback(
    async ({ title = 'Loading', text = 'Please wait...', duration = 2000, showProgress = true }: LoadingOptions = {}) => {
      // Don't show loading if we've already loaded before
      if (hasLoadedBefore) {
        return;
      }

      setLoadingTitle(title);
      setLoadingText(text);
      setProgress(0);
      setIsLoading(true);

      if (showProgress) {
        animateProgress(duration);
      }

      await new Promise((resolve) => setTimeout(resolve, duration));
      setIsLoading(false);
      
      // Mark as loaded in localStorage
      localStorage.setItem('retromz-has-loaded', 'true');
      setHasLoadedBefore(true);
    },
    [animateProgress, hasLoadedBefore]
  );

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onDataLoad = async (title: string = 'Data', options: LoadingOptions = {}) => {
    // Don't show loading if we've already loaded before
    if (hasLoadedBefore) {
      return Promise.resolve();
    }

    const { duration = 2000, showProgress = true } = options;

    setLoadingTitle(`Loading ${title}`);
    setIsLoading(true);
    setProgress(0);

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          const textIndex = Math.floor((newProgress / 100) * (progressTexts.length - 1));
          setLoadingText(progressTexts[textIndex] || progressTexts[progressTexts.length - 1]);

          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsLoading(false);
              // Mark as loaded in localStorage
              localStorage.setItem('retromz-has-loaded', 'true');
              setHasLoadedBefore(true);
              resolve();
            }, 500);
          }
          return Math.min(newProgress, 100);
        });
      }, duration / 10);
    });
  };

  return {
    isLoading,
    progress,
    loadingTitle,
    loadingText,
    showLoading,
    hideLoading,
    onDataLoad,
    hasLoadedBefore,
  };
};
