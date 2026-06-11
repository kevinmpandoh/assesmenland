import { Link } from "@tanstack/react-router";
import { WalletButton } from "./WalletButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl boat-bob" aria-hidden>
            ⛵
          </span>
          <span className="pixel text-sm text-ink sm:text-base">
            SAWAH<span className="text-sunset-deep">VOY</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <a href="/#species" className="pill">
            <span>📊</span> Species
          </a>
          <Link to="/how-to-play" className="pill">
            <span>📖</span> How to Play
          </Link>
          <Link to="/leaderboard" className="pill">
            <span>🏆</span> Leaderboard
          </Link>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="pill"
            aria-label="Follow on X"
          >
            <span>𝕏</span>
          </a>
          <Link to="/game" className="pill">
            <span>🎣</span> Play
          </Link>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
