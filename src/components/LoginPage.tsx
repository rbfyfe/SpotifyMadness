import { motion } from 'framer-motion';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const { login } = useSpotifyAuth();
  const setDemo = useAuthStore((s) => s.setDemo);

  const handleDemo = () => {
    setDemo();
    window.history.pushState({}, '', '/bracket');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="animated-gradient min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-7xl mb-6"
        >
          🏆
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-black font-heading text-glow mb-4 tracking-tight">
          Music Madness
        </h1>

        <p className="text-text-secondary text-lg md:text-xl mb-12 max-w-md mx-auto font-body">
          Your top artists. One champion. Let the madness begin.
        </p>

        <div className="flex flex-col items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="bg-spotify-green hover:bg-spotify-green-bright text-black font-bold text-lg px-10 py-4 rounded-full transition-colors duration-200 font-body cursor-pointer"
          >
            Connect with Spotify
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDemo}
            className="border-2 border-text-secondary/50 hover:border-text-primary text-text-secondary hover:text-text-primary font-semibold text-base px-8 py-3 rounded-full transition-colors duration-200 font-body cursor-pointer"
          >
            Try Demo
          </motion.button>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 text-text-secondary text-sm font-body"
      >
        Powered by the Spotify API
      </motion.p>
    </div>
  );
}
