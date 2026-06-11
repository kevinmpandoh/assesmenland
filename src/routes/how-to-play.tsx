import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { RARITY_ODDS } from "@/lib/game-logic";
import { rarityColor } from "@/hooks/useGame";
import { Wallet, Sprout, Fish, Trophy, ArrowRight, Zap, Coins } from "lucide-react";

export const Route = createFileRoute("/how-to-play")({
  head: () => ({
    meta: [
      { title: "How to Play — Sawah Voyages" },
      {
        name: "description",
        content:
          "Connect a wallet, hold 1 token, then drop nets at the dock, fish open water, and level up your cozy Solana voyage.",
      },
    ],
  }),
  component: HowToPlayPage,
});

const STEPS = [
  {
    icon: Wallet,
    title: "1 · Connect & hold the token",
    body: "Connect Phantom or Solflare. The game checks (read-only, no signing) that your wallet holds at least 1 Sawah Voyages token. That's your harbor key.",
  },
  {
    icon: Sprout,
    title: "2 · Work the dock",
    body: "Click an empty slot to drop a net (1 bait + 2 energy). After 15 seconds it fills up — pull it in for +1 catch, +2 coins, and +10 XP. Catches sell for 8 coins each and bait costs 3 at the shop.",
  },
  {
    icon: Fish,
    title: "3 · Fish the open water",
    body: "Cast your line once every 5 seconds for 5 energy. Most catches are Common — but legends swim out there. Rarer fish sell for far more coins and give big XP.",
  },
  {
    icon: Trophy,
    title: "4 · Level up & climb",
    body: "XP fills your level bar (each level needs level × 100 XP). Energy refills 1 point every 8 seconds, so take it slow. Your coins rank you on the leaderboard — progress syncs automatically.",
  },
];

function HowToPlayPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="pixel text-2xl text-ink sm:text-3xl">How to Play</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sawah Voyages is meant to be slow and cozy. Here's everything you need to know — it fits
            on one page.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card-pop p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-soft text-ocean ink-border">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 card-pop p-6">
          <h2 className="pixel flex items-center gap-2 text-sm text-ink">
            <Fish className="h-4 w-4 text-ocean" /> Fish rarity odds
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            {RARITY_ODDS.map(({ rarity, chance }) => (
              <div key={rarity} className="rounded-xl bg-foam p-3 text-center ink-border">
                <div className={`font-bold ${rarityColor[rarity]}`}>{rarity}</div>
                <div className="text-muted-foreground">{(chance * 100).toLocaleString()}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card-pop p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Zap className="h-4 w-4 text-sunset-deep" /> Energy
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Dropping a net costs 2, fishing costs 5, and you regain 1 every 8 seconds (max 100).
              Energy is the pace of the game — no rush.
            </p>
          </div>
          <div className="card-pop p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Coins className="h-4 w-4 text-sunset-deep" /> A note on the token
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The token is a game key, nothing more. Sawah Voyages makes no promise of profit,
              yield, or returns — it's here so you can sail, cast, and chill.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/game">
            <Button size="lg" className="chunky-btn">
              Enter the harbor <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
