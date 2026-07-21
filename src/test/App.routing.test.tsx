import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { useAuthStore } from '../stores/authStore';
import { startDemo } from '../utils/startDemo';

function goTo(path: string) {
  window.history.pushState({}, '', path);
}

beforeEach(() => {
  // authStore hydrates from sessionStorage at module load, and setDemo writes to it.
  sessionStorage.clear();
  useAuthStore.setState({ token: null, tokenExpiry: null, user: null, isDemo: false });
  goTo('/');
});

describe('App routing', () => {
  it('renders the landing page at /', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /music madness/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy the prompt/i })).toBeInTheDocument();
  });

  it('renders the original login page at /login', () => {
    goTo('/login');

    render(<App />);

    expect(screen.getByRole('button', { name: /connect with spotify/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy the prompt/i })).not.toBeInTheDocument();
  });

  it('falls back to the landing page for an unknown path', () => {
    goTo('/nope');

    render(<App />);

    expect(screen.getByRole('button', { name: /copy the prompt/i })).toBeInTheDocument();
  });
});

describe('startDemo', () => {
  it('enters demo mode and navigates to the bracket', () => {
    startDemo();

    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
  });

  it('is the handler both entry points use', () => {
    // Guards against the two pages drifting apart: LoginPage and LandingPage
    // must route through the same helper, not their own copies.
    goTo('/login');
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
    unmount();
  });
});
