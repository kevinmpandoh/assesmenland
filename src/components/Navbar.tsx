import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sprout, Menu, X } from "lucide-react";
import { WalletButton } from "./WalletButton";

const LINKS = [
  { to: "/game", label: "Play" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/how-to-play", label: "How to Play" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-foam/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-ocean)] text-white shadow-soft">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Sawah<span className="text-ocean">Verse</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition hover:text-ocean"
              activeProps={{ className: "text-sm font-medium text-ocean" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <WalletButton />
          <button
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-cyan-soft md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border/40 bg-foam/95 px-4 py-3 backdrop-blur-xl md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-cyan-soft hover:text-ocean"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
