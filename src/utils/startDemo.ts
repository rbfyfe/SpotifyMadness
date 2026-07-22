import { useAuthStore } from '../stores/authStore';

/**
 * Enter demo mode and navigate to the bracket.
 * Shared by LoginPage and LandingPage so the two cannot drift.
 */
export function startDemo(): void {
  useAuthStore.getState().setDemo();
  window.history.pushState({}, '', '/bracket');
  window.dispatchEvent(new PopStateEvent('popstate'));
}
