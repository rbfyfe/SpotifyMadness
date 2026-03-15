import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiOverlay() {
  useEffect(() => {
    const colors = ['#1DB954', '#FFFFFF', '#FFD700'];

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // Second burst
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
    }, 500);

    // Third burst
    const timer2 = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 1000);

    // Finale
    const timer3 = setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors,
      });
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return null;
}
