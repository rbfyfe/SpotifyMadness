import { motion } from 'framer-motion';
import { startDemo } from '../../utils/startDemo';
import { MiniBracket } from './MiniBracket';
import { PromptCard } from './PromptCard';

const FEATURES = [
  {
    title: 'Seeded from your listening',
    body: 'Your top 32 artists, ranked by popularity and spread across four regions by a serpentine draft.',
  },
  {
    title: 'Full playback for Premium listeners',
    body: 'Open a head-to-head and stream full tracks while you decide — needs Spotify Premium. No Premium? The bracket still runs, just muted.',
  },
  {
    title: 'A champion, properly crowned',
    body: 'Confetti, a spinning album, and the one artist who survived five rounds of your own second-guessing.',
  },
  {
    title: 'Shareable when it’s done',
    body: 'Export the bracket as an image on the spot. Add a free Supabase project and finished brackets become links anyone can open — no Spotify account required.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Paste the prompt into Claude Code',
    body: 'It clones the repo, installs dependencies, and walks you through the rest.',
  },
  {
    n: '02',
    title: 'Create a Spotify Developer App',
    body: 'Free, at developer.spotify.com. You need the Client ID and one redirect URI.',
  },
  {
    n: '03',
    title: 'Add yourself as a user, then run it',
    body: 'Developer Mode apps only admit accounts you list. Add your own, then npm run dev.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <main>
      <section className="animated-gradient px-4 py-20 text-center sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div aria-hidden="true" className="mb-6 text-6xl">🏆</div>
          <h1 className="font-heading text-5xl font-black tracking-tight text-glow sm:text-7xl">
            Music Madness
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-lg text-text-secondary">
            Your top artists, seeded into a March Madness bracket. You pick every matchup. One of
            them walks out a champion.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={startDemo}
              className="cursor-pointer rounded-full bg-spotify-green px-9 py-4 font-body text-lg font-bold text-black transition-colors duration-200 hover:bg-spotify-green-bright"
            >
              Play the demo
            </button>
            <a
              href="#build"
              className="cursor-pointer rounded-full border-2 border-text-secondary/50 px-7 py-3.5 font-body font-semibold text-text-secondary transition-colors duration-200 hover:border-text-primary hover:text-text-primary"
            >
              Get the prompt
            </a>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-heading text-3xl font-black text-text-primary">Try it right here</h2>
        <p className="mt-2 max-w-2xl font-body text-text-secondary">
          Eight artists, seven picks. This is the same bracket engine the full app runs — just the
          smallest size it supports.
        </p>
        <div className="mt-8">
          <MiniBracket onPlayDemo={startDemo} />
        </div>
      </section>

      <section className="border-y border-border-subtle bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl font-black text-text-primary">
            What you actually get
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border-subtle bg-bg-card p-6"
              >
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-heading text-3xl font-black text-text-primary">
          Why you need your own key
        </h2>
        <div className="mt-4 space-y-4 font-body leading-relaxed text-text-secondary">
          <p>
            Spotify caps apps in Developer Mode at 25 manually-listed users. That is the whole
            reason this page exists instead of a login button that works for everyone — if you are
            not on the list, Spotify turns you away before the app ever loads.
          </p>
          <p>
            So the app is yours to run, not mine to host. You make your own Spotify app, get your
            own Client ID, and point your own copy at it. It is free, it takes about ten minutes,
            and nothing you listen to ever passes through me.
          </p>
        </div>
      </section>

      <section id="build" className="mx-auto max-w-3xl scroll-mt-8 px-4 pb-8">
        <h2 className="font-heading text-3xl font-black text-text-primary">Build your own</h2>
        <p className="mt-2 font-body text-text-secondary">
          Hand this to Claude Code and answer its questions.
        </p>
        <div className="mt-6">
          <PromptCard />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n}>
              <div className="font-mono text-xs tracking-[0.14em] text-spotify-green">
                Step {step.n}
              </div>
              <h3 className="mt-2 font-heading text-base font-bold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>
      </main>

      <footer className="border-t border-border-subtle px-4 py-10 text-center font-body text-sm text-text-secondary">
        <a
          href="https://github.com/rbfyfe/SpotifyMadness"
          className="text-spotify-green hover:underline"
        >
          github.com/rbfyfe/SpotifyMadness
        </a>
        <span className="mx-3 opacity-40">·</span>
        <span>Powered by the Spotify API</span>
        <span className="mx-3 opacity-40">·</span>
        <a href="/login" className="text-text-secondary/70 hover:text-text-secondary hover:underline">
          On the allowlist? Sign in
        </a>
      </footer>
    </div>
  );
}
