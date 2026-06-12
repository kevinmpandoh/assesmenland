import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard } from "@/hooks/useVillage";
import { Trophy, Sprout, ArrowRight, RefreshCw } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/leaderboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leaderboard — Agri Land" },
      {
        name: "description",
        content: "The richest farmers in Agri Land. Plant and sell your way to the top.",
      },
    ],
  }),
  component: LeaderboardPage,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  const { data, isLoading, isError, refetch } = useLeaderboard(50);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sunset text-ink ink-border">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="pixel mt-4 text-2xl text-ink sm:text-3xl">Leaderboard</h1>
          <p className="mt-3 text-muted-foreground">
            The hardest-working farmers in town, ranked by gold.
          </p>
        </div>

        <div className="mt-10 card-pop p-4 sm:p-6">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          )}

          {isError && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Couldn't load the leaderboard.</p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-4 rounded-xl ink-border"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
              </Button>
            </div>
          )}

          {data && data.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">No farmers ranked yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Play the game and your progress will appear here automatically.
              </p>
              <Link to="/game">
                <Button className="mt-5 chunky-btn">
                  Claim your field <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {data && data.length > 0 && (
            <ol className="divide-y divide-border/60">
              {data.map((r) => (
                <li key={r.wallet} className="flex items-center gap-3 px-2 py-3 sm:gap-4 sm:px-3">
                  <span className="w-9 shrink-0 text-center text-sm font-bold text-muted-foreground">
                    {MEDALS[r.rank - 1] ?? `#${r.rank}`}
                  </span>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-soft ink-border overflow-hidden">
                    <Logo className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">Level {r.level}</div>
                  </div>
                  <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <Sprout className="h-3.5 w-3.5" /> {r.harvests.toLocaleString()}
                  </div>
                  <div className="shrink-0 rounded-lg bg-foam px-2.5 py-1 text-sm font-bold ink-border">
                    {r.coins.toLocaleString()}g
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
