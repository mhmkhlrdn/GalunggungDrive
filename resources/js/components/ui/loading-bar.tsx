import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const start = () => {
      setProgress(0);
      setLoading(true);
      timeout = setTimeout(() => {
        setProgress(40);
      }, 100);
    };

    const finish = () => {
      setProgress(100);
      clearTimeout(timeout);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    const unsubscribeStart = router.on('start', start);
    const unsubscribeFinish = router.on('finish', finish);

    return () => {
      unsubscribeStart();
      unsubscribeFinish();
    };
  }, []);

  if (!loading) return null;

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="circular-loading-bar-container">
      <svg
        className="circular-loading-bar-svg"
        width="50"
        height="50"
        viewBox="0 0 50 50"
      >
        <circle
          className="circular-loading-bar-bg"
          cx="25"
          cy="25"
          r={radius}
        />
        <circle
          className="circular-loading-bar-progress"
          cx="25"
          cy="25"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    </div>
  );
}
