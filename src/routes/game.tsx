import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletButton } from "@/components/WalletButton";
import { useTokenGate } from "@/hooks/useTokenGate";
import {
  useGame,
  GROW_MS,
  SEED_PRICE,
  SELL_PRICE,
  UPGRADE_COST,
  HARVEST_COINS,
  RARITY_ODDS,
  rarityColor,
  xpForLevel,
} from "@/hooks/useGame";
import { useLeaderboard, useChat, useRecentCatches } from "@/hooks/useVillage";
import { MIN_TOKEN_BALANCE, PUMP_FUN_URL, shortAddress } from "@/lib/solana-config";
import { toast } from "sonner";
import {
  Coins,
  Sprout,
  Fish,
  Zap,
  Trophy,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  ArrowUpCircle,
  Wallet,
  Lock,
  AlertCircle,
  Pencil,
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type GameApi = ReturnType<typeof useGame>;

export const Route = createFileRoute("/game")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Play Sawah Voyages — Set Sail" },
      {
        name: "description",
        content:
          "Enter the Sawah Voyages harbor. Hop on a boat, cast your line, and chill — wallet required.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const gate = useTokenGate();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!gate.connected && <ConnectGate />}
        {gate.connected && gate.status === "loading" && <LoadingGate />}
        {gate.connected && gate.status === "insufficient" && (
          <InsufficientGate balance={gate.balance} />
        )}
        {gate.connected && gate.status === "error" && <ErrorGate onRetry={gate.refresh} />}
        {gate.connected && gate.status === "granted" && (
          <Dashboard address={gate.address!} balance={gate.balance} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function GateShell({
  icon: Icon,
  title,
  children,
  tone = "ocean",
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  tone?: "ocean" | "gold";
}) {
  return (
    <div className="mx-auto mt-8 max-w-xl card-pop p-10 text-center">
      <div
        className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ink-border ${tone === "ocean" ? "bg-sky-deep text-ink" : "bg-sunset text-ink"}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="pixel mt-5 text-xl text-ink">{title}</h2>
      {children}
      <div className="mt-6 flex justify-center">
        <Link to="/" className="pill text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </div>
  );
}

function ConnectGate() {
  return (
    <GateShell icon={Wallet} title="Connect wallet to come aboard">
      <p className="mt-3 text-ink/70">
        Hold at least {MIN_TOKEN_BALANCE} Sawah Voyages token to enter the harbor.
      </p>
      <div className="mt-6 flex justify-center">
        <WalletButton />
      </div>
    </GateShell>
  );
}

function LoadingGate() {
  return (
    <GateShell icon={Sparkles} title="Checking your wallet…">
      <p className="mt-3 text-ink/70">Hang on, reading your token balance on Solana.</p>
    </GateShell>
  );
}

function InsufficientGate({ balance }: { balance: number }) {
  return (
    <GateShell icon={Lock} title="At least 1 token needed" tone="gold">
      <p className="mt-3 text-ink/70">
        Current balance: <span className="font-semibold text-ink">{balance.toLocaleString()}</span>.
        Grab 1 token first to unlock the harbor.
      </p>
      <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer">
        <Button size="lg" className="mt-6 chunky-btn">
          🪙 Get Token
        </Button>
      </a>
    </GateShell>
  );
}

function ErrorGate({ onRetry }: { onRetry: () => void }) {
  return (
    <GateShell icon={AlertCircle} title="Network is choppy" tone="gold">
      <p className="mt-3 text-ink/70">
        We couldn't reach the Solana RPC. Give it another try in a moment.
      </p>
      <Button onClick={onRetry} size="lg" className="mt-6 chunky-btn">
        <RefreshCw className="mr-1.5 h-4 w-4" /> Retry balance check
      </Button>
    </GateShell>
  );
}

function Dashboard({ address, balance }: { address: string; balance: number }) {
  const game = useGame(address);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <ProfileCard address={address} balance={balance} game={game} />
        <Tabs defaultValue="farm" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-foam p-1 ink-border">
            <TabsTrigger value="farm" className="rounded-lg">
              <Sprout className="mr-1.5 h-4 w-4" />
              Dock
            </TabsTrigger>
            <TabsTrigger value="fish" className="rounded-lg">
              <Fish className="mr-1.5 h-4 w-4" />
              Fishing
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg">
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              Bag
            </TabsTrigger>
            <TabsTrigger value="shop" className="rounded-lg">
              <Coins className="mr-1.5 h-4 w-4" />
              Shop
            </TabsTrigger>
          </TabsList>
          <TabsContent value="farm" className="mt-4">
            <FarmPanel game={game} />
          </TabsContent>
          <TabsContent value="fish" className="mt-4">
            <FishingPanel game={game} />
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
            <InventoryPanel game={game} />
          </TabsContent>
          <TabsContent value="shop" className="mt-4">
            <ShopPanel game={game} />
          </TabsContent>
        </Tabs>
      </div>
      <aside className="space-y-6">
        <Leaderboard meAddress={address} />
        <ActivityFeed />
        <ChatPanel address={address} />
      </aside>
    </div>
  );
}

function SyncBadge({ syncState }: { syncState: string }) {
  if (syncState === "error") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-sunset/30 px-2 py-0.5 text-[10px] font-medium text-ink"
        title="Progress is saved locally; cloud sync will retry."
      >
        <CloudOff className="h-3 w-3" /> offline
      </span>
    );
  }
  if (syncState === "synced" || syncState === "syncing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-soft px-2 py-0.5 text-[10px] font-medium text-ocean">
        <Cloud className="h-3 w-3" /> {syncState === "syncing" ? "saving…" : "saved"}
      </span>
    );
  }
  return null;
}

function ProfileCard({
  address,
  balance,
  game,
}: {
  address: string;
  balance: number;
  game: GameApi;
}) {
  const { state, setUsername, syncState } = game;
  const xpNeeded = xpForLevel(state.level);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setDraft(state.username);
    setEditing(true);
  };
  const commit = () => {
    setUsername(draft);
    setEditing(false);
    if (draft.trim()) toast.success("Name updated");
  };

  return (
    <div className="card-pop p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-sky-deep text-2xl text-ink ink-border">
          ⛵
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  commit();
                }}
                className="flex items-center gap-1"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={20}
                  autoFocus
                  placeholder="Your captain name"
                  className="h-8 w-40 rounded-lg border-2 border-ink bg-foam px-2 text-sm outline-none focus:border-sunset-deep"
                />
                <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <button onClick={startEdit} className="group flex items-center gap-1.5">
                <h3 className="pixel text-base text-ink">{state.username || "Captain"}</h3>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </button>
            )}
            <Badge className="bg-leaf/20 text-ink hover:bg-leaf/30">
              <Sparkles className="mr-1 h-3 w-3" /> Access granted
            </Badge>
            <SyncBadge syncState={syncState} />
          </div>
          <p className="text-xs text-muted-foreground">
            {shortAddress(address)} · {balance.toLocaleString()} token
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Stat label="Level" value={state.level} icon={Trophy} />
          <Stat label="Coins" value={state.coins} icon={Coins} />
          <Stat label="Bait" value={state.seeds} icon={Sprout} />
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>XP</span>
            <span>
              {state.xp} / {xpNeeded}
            </span>
          </div>
          <Progress value={(state.xp / xpNeeded) * 100} className="h-2" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Energy
            </span>
            <span>{state.energy} / 100</span>
          </div>
          <Progress value={state.energy} className="h-2" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-xl bg-cyan-soft px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-bold text-foreground">{value.toLocaleString()}</div>
    </div>
  );
}

function FarmPanel({ game }: { game: GameApi }) {
  const { state, plant, harvest, upgradeFarm } = game;
  const cols = Math.ceil(Math.sqrt(state.farmSize));
  return (
    <div className="card-pop p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="pixel text-sm text-ink">Dock</h3>
          <p className="text-xs text-muted-foreground">
            Click an empty slot to drop a net. Pull it up when it's full.
          </p>
        </div>
        <Button
          onClick={() => {
            upgradeFarm();
            toast.success("Dock expanded!");
          }}
          disabled={state.coins < UPGRADE_COST || state.farmSize >= 25}
          variant="outline"
          className="rounded-lg ink-border"
        >
          <ArrowUpCircle className="mr-1 h-4 w-4" /> Expand ({UPGRADE_COST} coins)
        </Button>
      </div>
      <div
        className="grid gap-2 mx-auto max-w-md"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {state.tiles.map((t) => {
          const ready = t.state === "ready";
          const growing = t.state === "growing";
          const progress =
            growing && t.plantedAt ? Math.min(1, (Date.now() - t.plantedAt) / GROW_MS) : 0;
          return (
            <button
              key={t.id}
              onClick={() =>
                ready
                  ? (harvest(t.id), toast.success(`+1 catch +${HARVEST_COINS} coins +10 XP`))
                  : plant(t.id)
              }
              className={`relative aspect-square rounded-xl border-2 transition active:scale-95 ${
                ready
                  ? "border-sunset bg-sunset/40 hover:bg-sunset/60"
                  : growing
                    ? "border-leaf bg-leaf/20"
                    : "border-dashed border-ink/40 bg-foam hover:bg-sky"
              }`}
            >
              <span className="text-2xl">{ready ? "🐟" : growing ? "🪝" : ""}</span>
              {growing && (
                <div className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-foam">
                  <div
                    className="h-full rounded-full bg-leaf transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FishingPanel({ game }: { game: GameApi }) {
  const [casting, setCasting] = useState(false);
  const cooldownLeft = game.fishCooldownRemaining;
  const onCooldown = cooldownLeft > 0;
  const cast = () => {
    if (game.state.energy < 5) {
      toast.error("Not enough energy");
      return;
    }
    if (onCooldown) return;
    setCasting(true);
    setTimeout(() => {
      const caught = game.fish();
      setCasting(false);
      if (caught) toast.success(`Caught a ${caught.rarity} ${caught.name}!`);
    }, 1200);
  };
  return (
    <div className="card-pop overflow-hidden">
      <div className="relative h-56 bg-[image:var(--gradient-ocean)] p-6 text-white">
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-xs water-tile"
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 31) % 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              ~
            </span>
          ))}
        </div>
        <div className="relative">
          <h3 className="pixel text-base text-white">Open Water</h3>
          <p className="text-sm text-white/85">Cast your line. Costs 5 energy.</p>
          <Button
            onClick={cast}
            disabled={casting || onCooldown}
            size="lg"
            className="mt-6 chunky-btn"
          >
            {casting
              ? "Reeling in…"
              : onCooldown
                ? `Wait ${Math.ceil(cooldownLeft / 1000)}s…`
                : "🎣 Cast Line"}
          </Button>
        </div>
        {casting && <div className="absolute bottom-4 right-4 text-3xl animate-bounce">🎣</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 text-xs sm:grid-cols-5">
        {RARITY_ODDS.map(({ rarity, chance }) => (
          <div key={rarity} className="rounded-lg bg-foam p-2 text-center ink-border">
            <div className={`font-bold ${rarityColor[rarity]}`}>{rarity}</div>
            <div className="text-muted-foreground">{(chance * 100).toLocaleString()}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryPanel({ game }: { game: GameApi }) {
  const { state, sellRice, sellFish } = game;
  return (
    <div className="card-pop p-6">
      <h3 className="pixel text-sm text-ink">Bag</h3>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-foam p-4 ink-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐟</span>
          <div>
            <div className="font-semibold">Net Catch</div>
            <div className="text-xs text-muted-foreground">Sells for {SELL_PRICE} coins each</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{state.inventory.rice}</span>
          <Button
            size="sm"
            disabled={state.inventory.rice === 0}
            onClick={() => {
              const q = state.inventory.rice;
              sellRice(q);
              toast.success(`+${q * SELL_PRICE} coins`);
            }}
            className="rounded-lg"
          >
            Sell all
          </Button>
        </div>
      </div>
      <h4 className="mt-6 mb-2 text-sm font-semibold">Rare fish ({state.inventory.fish.length})</h4>
      {state.inventory.fish.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet. Try the open water!</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {state.inventory.fish.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-xl bg-foam p-3 ink-border"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{f.emoji}</span>
                <div>
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className={`text-xs ${rarityColor[f.rarity]}`}>{f.rarity}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  sellFish(f.id);
                  toast.success(`+${f.value} coins`);
                }}
              >
                Sell {f.value}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShopPanel({ game }: { game: GameApi }) {
  const { state, buySeeds } = game;
  return (
    <div className="card-pop p-6">
      <h3 className="pixel text-sm text-ink">Harbor Shop</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-foam p-4 ink-border">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-leaf" />
            <span className="font-semibold">Bait</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{SEED_PRICE} coins each</p>
          <div className="mt-3 flex gap-2">
            {[5, 10, 25].map((q) => (
              <Button
                key={q}
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={state.coins < q * SEED_PRICE}
                onClick={() => {
                  buySeeds(q);
                  toast.success(`+${q} bait`);
                }}
              >
                Buy {q}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-cyan-soft p-4 ink-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ocean" />
            <span className="font-semibold">Coming soon</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cosmetics, new boats, and crafting are still being assembled.
          </p>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ meAddress }: { meAddress: string }) {
  const { data, isLoading, isError, refetch } = useLeaderboard(8);
  return (
    <div className="card-pop p-5">
      <h4 className="pixel flex items-center gap-2 text-xs text-ink">
        <Trophy className="h-4 w-4 text-sunset-deep" /> Leaderboard
      </h4>
      {isLoading && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-lg" />
          ))}
        </div>
      )}
      {isError && (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Couldn't load the leaderboard.
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-6 rounded-lg text-xs"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      )}
      {data && data.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          No captains ranked yet — keep playing, your progress syncs automatically.
        </p>
      )}
      {data && data.length > 0 && (
        <ol className="mt-3 space-y-1.5 text-sm">
          {data.map((r) => {
            const isMe = r.wallet === meAddress;
            return (
              <li
                key={r.wallet}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${isMe ? "bg-sunset text-ink" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-xs opacity-70">#{r.rank}</span>
                  <span className="truncate font-medium">{isMe ? "You" : r.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">lv {r.level}</span>
                </div>
                <span className="shrink-0 text-xs">{r.coins.toLocaleString()} 🪙</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function ActivityFeed() {
  const { data, isLoading } = useRecentCatches();
  return (
    <div className="card-pop p-5">
      <h4 className="pixel flex items-center gap-2 text-xs text-ink">
        <Fish className="h-4 w-4 text-ocean" /> Recent Catches
      </h4>
      {isLoading && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      )}
      {data && data.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          The water is calm… be the first to catch something!
        </p>
      )}
      {data && data.length > 0 && (
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          {data.map((c) => (
            <li key={c.id} className="rounded-lg bg-foam px-3 py-2">
              <span className="font-semibold text-foreground">{c.display_name}</span> caught a{" "}
              <span className={`font-semibold ${rarityColor[c.rarity]}`}>
                {c.rarity} {c.fish_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChatPanel({ address }: { address: string }) {
  const { messages, send } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const count = messages.data?.length ?? 0;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [count]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body) return;
    setInput("");
    send.mutate(
      { wallet: address, body },
      {
        onError: (err) => {
          setInput(body);
          toast.error(err instanceof Error ? err.message : "Message failed to send");
        },
      },
    );
  };

  return (
    <div className="card-pop p-5">
      <h4 className="pixel flex items-center gap-2 text-xs text-ink">
        <MessageCircle className="h-4 w-4 text-ocean" /> Harbor Chat
      </h4>
      <div ref={scrollRef} className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1 text-sm">
        {messages.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-lg" />
            ))}
          </div>
        )}
        {messages.isError && (
          <p className="text-xs text-muted-foreground">Chat is unreachable right now.</p>
        )}
        {messages.data && messages.data.length === 0 && (
          <p className="text-xs text-muted-foreground">No messages yet — say hi, captain! 👋</p>
        )}
        {messages.data?.map((m) => (
          <div key={m.id} className="rounded-lg bg-foam px-3 py-1.5">
            <span className="font-semibold text-ocean">
              {m.wallet_address === address ? "You" : m.display_name}:{" "}
            </span>
            <span className="break-words">{m.body}</span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say hi to other captains…"
          maxLength={280}
          className="flex-1 rounded-lg border-2 border-ink bg-foam px-3 py-1.5 text-sm outline-none focus:border-sunset-deep"
          aria-label="Chat message"
        />
        <Button type="submit" size="sm" disabled={send.isPending} className="rounded-lg">
          {send.isPending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
