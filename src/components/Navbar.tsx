import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { WalletButton } from "./WalletButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-foam/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-ocean)] text-white shadow-soft">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Sawah<span className="text-ocean">Verse</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <Link to="/game" className="text-sm font-medium text-muted-foreground transition hover:text-ocean">Play</Link>
          <a href="#features" className="text-sm font-medium text-muted-foreground transition hover:text-ocean">Features</a>
          <a href="#token" className="text-sm font-medium text-muted-foreground transition hover:text-ocean">Token</a>
          <a href="#roadmap" className="text-sm font-medium text-muted-foreground transition hover:text-ocean">Roadmap</a>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
