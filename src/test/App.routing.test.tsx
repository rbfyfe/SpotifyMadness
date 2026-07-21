import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { useAuthStore } from '../stores/authStore';
import { startDemo } from '../utils/startDemo';

// CallbackPage calls handleCallback() from this hook on mount. None of the tests
// below simulate a real Spotify redirect (no `code` query param), so the real
// implementation would log `console.error('Auth error:', null)` on every /callback
// render. Mock at the hook boundary so /callback resolves deterministically and
// silently instead of depending on that console.error path.
vi.mock('../hooks/useSpotifyAuth', () => ({
  useSpotifyAuth: () => ({
    login: vi.fn(),
    handleCallback: vi.fn().mockResolvedValue(false),
  }),
}));

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

  // /login has no other inbound links anywhere in the app (see the five
  // window.location.href = '/' call sites in authStore.logout, CallbackPage,
  // ErrorBoundary, BracketPage, and SharedBracketPage) — this footer link is the
  // only way an allowlisted user can get from the landing page back to sign-in.
  it('renders a link to /login on the landing page', () => {
    render(<App />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
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

  // Safety-critical: /shared/:id serves visitors with no Spotify account at all.
  // It is matched before the auth check in App.tsx on purpose. If a future edit
  // moved that check ahead of it, an unauthenticated visitor would silently get
  // the landing page instead of the bracket they were sent — this locks the
  // ordering in.
  it('renders the shared bracket route, not the landing page, for an unauthenticated visitor', async () => {
    goTo('/shared/some-bracket-id');

    render(<App />);

    // supabase is unconfigured in this test environment (src/lib/supabase.ts
    // returns null without env vars), so loadBracket() resolves to null and
    // SharedBracketPage settles into its own "not found" state — one of its
    // real, hardcoded render states, not fetched data. Waiting for it (instead
    // of asserting synchronously) keeps the loadBracket().then() state update
    // inside act().
    expect(await screen.findByRole('heading', { name: /bracket not found/i })).toBeInTheDocument();

    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.queryByRole('heading', { name: /music madness/i, level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy the prompt/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play the demo/i })).not.toBeInTheDocument();
  });

  it('renders the callback route, not the landing page', async () => {
    goTo('/callback');

    render(<App />);

    // The mocked handleCallback() resolves false (no `code` in the URL), which
    // is CallbackPage's genuine behavior for a bare /callback hit — no real
    // Spotify exchange is needed to observe the routing decision.
    expect(await screen.findByText(/authentication failed/i)).toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: /music madness/i, level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy the prompt/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play the demo/i })).not.toBeInTheDocument();
  });
});

describe('startDemo', () => {
  it('enters demo mode and navigates to the bracket', () => {
    startDemo();

    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
  });
});

describe('demo entry points route through the shared startDemo() helper', () => {
  it('enters demo mode from the login page Try Demo button', () => {
    goTo('/login');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));

    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
  });

  it('enters demo mode from the landing page hero "Play the demo" button', () => {
    goTo('/');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /play the demo/i }));

    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
  });

  // A third entry point exists: MiniBracket's "Play the full demo" button, shown
  // in its champion banner only after all seven picks in the mini bracket are
  // made. Not covered here — reaching it requires playing the mini bracket to
  // completion first (see src/test/MiniBracket.test.tsx for that playthrough),
  // and doing that just to click a button that invokes the exact same startDemo
  // prop already proven above adds test fragility without covering new risk.
});
