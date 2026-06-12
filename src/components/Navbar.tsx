import { Link } from "@tanstack/react-router";
import { WalletButton } from "./WalletButton";
import { Logo } from "./Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Logo className="h-8 w-8 shrink-0 boat-bob sm:h-9 sm:w-9" />
          <span className="pixel truncate text-xs text-ink sm:text-base">
            AGRI&nbsp;<span className="text-sunset-deep">LAND</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <a href="/#species" className="pill">
            <span>🌽</span> Crops
          </a>
          <Link to="/docs" className="pill">
            <span>📚</span> Docs
          </Link>
          <Link to="/how-to-play" className="pill">
            <span>📖</span> How to Play
          </Link>
          <Link to="/leaderboard" className="pill">
            <span>🏆</span> Leaderboard
          </Link>
          <a
            href="https://x.com/agrilandcc"
            target="_blank"
            rel="noreferrer"
            className="pill"
            aria-label="Follow on X"
          >
            <span>𝕏</span>
          </a>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
