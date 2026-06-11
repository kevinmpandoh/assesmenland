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
      { title: "Play SawahVerse — The Village" },
      {
        name: "description",
        content: "Enter the SawahVerse village. Farm, fish, and chill — wallet required.",
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
    <div className="mx-auto mt-8 max-w-xl rounded-3xl glass-card p-10 text-center">
      <div
        className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${tone === "ocean" ? "bg-[image:var(--gradient-ocean)] text-white" : "bg-gold/20 text-gold"}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-2xl font-bold">{title}</h2>
      {children}
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to landing
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ConnectGate() {
  return (
    <GateShell icon={Wallet} title="Connect your wallet to enter">
      <p className="mt-3 text-muted-foreground">
        Hold at least {MIN_TOKEN_BALANCE} SawahVerse token to access the village.
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
      <p className="mt-3 text-muted-foreground">Reading your token balance on Solana.</p>
    </GateShell>
  );
}

function InsufficientGate({ balance }: { balance: number }) {
  return (
    <GateShell icon={Lock} title="You need at least 1 token to enter SawahVerse." tone="gold">
      <p className="mt-3 text-muted-foreground">
        Current balance:{" "}
        <span className="font-semibold text-foreground">{balance.toLocaleString()}</span>. Grab a
        token to unlock the village.
      </p>
      <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer">
        <Button size="lg" className="mt-6 btn-glossy rounded-xl">
          Get Token
        </Button>
      </a>
    </GateShell>
  );
}

function ErrorGate({ onRetry }: { onRetry: () => void }) {
  return (
    <GateShell icon={AlertCircle} title="Network hiccup" tone="gold">
      <p className="mt-3 text-muted-foreground">
        We couldn't reach Solana RPC. The public endpoint rate-limits sometimes — give it another
        try.
      </p>
      <Button onClick={onRetry} size="lg" className="mt-6 btn-glossy rounded-xl">
        <RefreshCw className="mr-1.5 h-4 w-4" /> Retry balance check
      </Button>
    </GateShell>
  );
}

function Dashboard({ address, balance }: { address: string; balance: number }) {
  const game = useGame(address);
  const { state } = game;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <ProfileCard address={address} balance={balance} game={game} />
        <Tabs defaultValue="farm" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-foam/70 p-1">
            <TabsTrigger value="farm" className="rounded-lg">
              <Sprout className="mr-1.5 h-4 w-4" />
              Farm
            </TabsTrigger>
            <TabsTrigger value="fish" className="rounded-lg">
              <Fish className="mr-1.5 h-4 w-4" />
              Fish
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg">
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              Inventory
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
        className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold"
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
    <div className="rounded-3xl glass-card p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[image:var(--gradient-ocean)] text-2xl text-white shadow-soft">
          🌾
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
                  placeholder="Your villager name"
                  className="h-8 w-40 rounded-lg border border-border bg-foam px-2 text-sm outline-none focus:border-ocean"
                />
                <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <button onClick={startEdit} className="group flex items-center gap-1.5">
                <h3 className="text-lg font-bold">{state.username || "Villager"}</h3>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </button>
            )}
            <Badge className="bg-leaf/15 text-leaf hover:bg-leaf/20">
              <Sparkles className="mr-1 h-3 w-3" /> Access Granted
            </Badge>
            <SyncBadge syncState={syncState} />
          </div>
          <p className="text-xs text-muted-foreground">
            {shortAddress(address)} · {balance.toLocaleString()} tokens
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Stat label="Level" value={state.level} icon={Trophy} />
          <Stat label="Coins" value={state.coins} icon={Coins} />
          <Stat label="Seeds" value={state.seeds} icon={Sprout} />
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
    <div className="rounded-3xl glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Rice Paddy</h3>
          <p className="text-xs text-muted-foreground">
            Click empty tiles to plant. Harvest when golden.
          </p>
        </div>
        <Button
          onClick={() => {
            upgradeFarm();
            toast.success("Farm expanded!");
          }}
          disabled={state.coins < UPGRADE_COST || state.farmSize >= 25}
          variant="outline"
          className="rounded-lg"
        >
          <ArrowUpCircle className="mr-1 h-4 w-4" /> Upgrade ({UPGRADE_COST} coins)
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
                  ? (harvest(t.id), toast.success(`+1 rice +${HARVEST_COINS} coins +10 XP`))
                  : plant(t.id)
              }
              className={`relative aspect-square rounded-xl border-2 transition active:scale-95 ${
                ready
                  ? "border-gold/40 bg-gold/30 hover:bg-gold/40"
                  : growing
                    ? "border-leaf/40 bg-leaf/20"
                    : "border-dashed border-ocean/30 bg-foam/50 hover:bg-cyan-soft"
              }`}
            >
              <span className="text-2xl">{ready ? "🌾" : growing ? "🌱" : ""}</span>
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
    <div className="rounded-3xl glass-card overflow-hidden">
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
          <h3 className="text-xl font-bold">Riverbank</h3>
          <p className="text-sm text-white/85">Cast your line. Costs 5 energy.</p>
          <Button
            onClick={cast}
            disabled={casting || onCooldown}
            size="lg"
            className="mt-6 rounded-xl bg-white text-ocean hover:bg-white/90"
          >
            {casting
              ? "Reeling…"
              : onCooldown
                ? `Wait ${Math.ceil(cooldownLeft / 1000)}s…`
                : "🎣 Cast Line"}
          </Button>
        </div>
        {casting && <div className="absolute bottom-4 right-4 text-3xl animate-bounce">🎣</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 text-xs sm:grid-cols-5">
        {RARITY_ODDS.map(({ rarity, chance }) => (
          <div key={rarity} className="rounded-lg bg-foam p-2 text-center">
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
    <div className="rounded-3xl glass-card p-6">
      <h3 className="font-bold">Inventory</h3>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-foam p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌾</span>
          <div>
            <div className="font-semibold">Rice</div>
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
      <h4 className="mt-6 mb-2 text-sm font-semibold">Fish ({state.inventory.fish.length})</h4>
      {state.inventory.fish.length === 0 ? (
        <p className="text-sm text-muted-foreground">No catch yet. Head to the river!</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {state.inventory.fish.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-xl bg-foam p-3">
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
    <div className="rounded-3xl glass-card p-6">
      <h3 className="font-bold">Village Shop</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-foam p-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-leaf" />
            <span className="font-semibold">Rice Seeds</span>
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
                  toast.success(`+${q} seeds`);
                }}
              >
                Buy {q}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-cyan-soft p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ocean" />
            <span className="font-semibold">More coming soon</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cosmetics, land plots, and crafting are on the roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ meAddress }: { meAddress: string }) {
  const { data, isLoading, isError, refetch } = useLeaderboard(8);
  return (
    <div className="rounded-3xl glass-card p-5">
      <h4 className="flex items-center gap-2 font-bold">
        <Trophy className="h-4 w-4 text-gold" /> Village Leaderboard
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
          No villagers ranked yet — keep playing, your progress syncs automatically.
        </p>
      )}
      {data && data.length > 0 && (
        <ol className="mt-3 space-y-1.5 text-sm">
          {data.map((r) => {
            const isMe = r.wallet === meAddress;
            return (
              <li
                key={r.wallet}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${isMe ? "bg-[image:var(--gradient-ocean)] text-white" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-xs opacity-70">#{r.rank}</span>
                  <span className="truncate font-medium">{isMe ? "You" : r.name}</span>
                  <span
                    className={`shrink-0 text-[10px] ${isMe ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    lv {r.level}
                  </span>
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
    <div className="rounded-3xl glass-card p-5">
      <h4 className="flex items-center gap-2 font-bold">
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
          The river is quiet… be the first to catch something!
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
    <div className="rounded-3xl glass-card p-5">
      <h4 className="flex items-center gap-2 font-bold">
        <MessageCircle className="h-4 w-4 text-ocean" /> Village Chat
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
          <p className="text-xs text-muted-foreground">No messages yet — say selamat pagi! 👋</p>
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
          placeholder="Say hi…"
          maxLength={280}
          className="flex-1 rounded-lg border border-border bg-foam px-3 py-1.5 text-sm outline-none focus:border-ocean"
        />
        <Button type="submit" size="sm" disabled={send.isPending} className="rounded-lg">
          {send.isPending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
