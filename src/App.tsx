import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './components/LoginPage';
import { CallbackPage } from './components/CallbackPage';
import { BracketPage } from './components/BracketPage';

function getPath() {
  return window.location.pathname;
}

export default function App() {
  const [path, setPath] = useState(getPath);
  const isAuthenticated = useAuthStore((s) => s.token !== null && s.isTokenValid());

  useEffect(() => {
    const onPopState = () => setPath(getPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {path === '/callback' ? (
        <CallbackPage key="callback" />
      ) : isAuthenticated && path === '/bracket' ? (
        <BracketPage key="bracket" />
      ) : (
        <LoginPage key="login" />
      )}
    </AnimatePresence>
  );
}
