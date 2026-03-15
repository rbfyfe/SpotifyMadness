import { useEffect, useState } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';

export function CallbackPage() {
  const { handleCallback } = useSpotifyAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    handleCallback().then((success) => {
      if (success) {
        window.history.pushState({}, '', '/bracket');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        setError(true);
      }
    });
  }, [handleCallback]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <p className="text-red-400 text-xl mb-4 font-body">Authentication failed</p>
        <a
          href="/"
          className="text-spotify-green hover:text-spotify-green-bright font-body"
        >
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary font-body">Connecting to Spotify...</p>
      </div>
    </div>
  );
}
