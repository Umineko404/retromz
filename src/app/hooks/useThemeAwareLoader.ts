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

  const progressTexts = [
    'Initializing...',
    'Loading assets...',
    'Applying theme...',
    'Preparing interface...',
    'Almost ready...',
    'Complete!',
  ];

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
      setLoadingTitle(title);
      setLoadingText(text);
      setProgress(0);
      setIsLoading(true);

      if (showProgress) {
        animateProgress(duration);
      }

      await new Promise((resolve) => setTimeout(resolve, duration));
      setIsLoading(false);
    },
    [animateProgress]
  );

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onDataLoad = useCallback(
    (dataType = 'Data') => {
      return showLoading({
        title: `Loading ${dataType}`,
        text: 'Fetching from server...',
        duration: 2000,
        showProgress: true,
      });
    },
    [showLoading]
  );

  return {
    isLoading,
    progress,
    loadingTitle,
    loadingText,
    showLoading,
    hideLoading,
    onDataLoad,
  };
};