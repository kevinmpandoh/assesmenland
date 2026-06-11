export function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>⛵</span>
          <span className="pixel text-xs text-ink">SAWAHVOY</span>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          A tiny world out at sea. Built slowly, played calmly.
          Not financial advice — the token is just a key to the harbor.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <a href="https://x.com" target="_blank" rel="noreferrer" className="pill text-xs"><span>𝕏</span> X</a>
          <a href="#how" className="pill text-xs"><span>📖</span> Wiki</a>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sawah Voyages · Open Beta on Solana
        </div>
      </div>
    </footer>
  );
}
