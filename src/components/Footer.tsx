import { Sprout } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/40 bg-foam/60 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-ocean)] text-white">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="font-bold">SawahVerse</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            A relaxing Web3 village. Farm, fish, and chill with friends on Solana.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Game</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-ocean">Features</a></li>
            <li><a href="#token" className="hover:text-ocean">Token Utility</a></li>
            <li><a href="#roadmap" className="hover:text-ocean">Roadmap</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Disclaimer</h4>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            SawahVerse is an entertainment experience. Nothing here is investment advice.
            Token holding only unlocks gameplay; we make no promise of profit or returns.
          </p>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SawahVerse — Built on Solana
      </div>
    </footer>
  );
}
