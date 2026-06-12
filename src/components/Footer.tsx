import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="pixel text-xs text-ink">AGRI&nbsp;LAND</span>
        </div>

        <p className="max-w-md text-sm text-muted-foreground">
          A tiny farming world on Solana. Built slowly, played calmly.&nbsp;
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <a
            href="https://x.com/agrilandcc"
            target="_blank"
            rel="noreferrer"
            className="pill text-xs"
          >
            <span>𝕏</span> X
          </a>
          <Link to="/how-to-play" className="pill text-xs">
            <span>📖</span> How to Play
          </Link>
          <Link to="/leaderboard" className="pill text-xs">
            <span>🏆</span> Leaderboard
          </Link>
          <Link to="/docs" className="pill text-xs">
            <span>📚</span> Docs
          </Link>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Agri Land · Open Beta on Solana
        </div>
      </div>
    </footer>
  );
}
