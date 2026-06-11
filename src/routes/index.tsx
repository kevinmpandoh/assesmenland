import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { useTokenGate } from "@/hooks/useTokenGate";
import { MIN_TOKEN_BALANCE, PUMP_FUN_URL, shortAddress } from "@/lib/solana-config";
import {
  Sprout,
  Fish,
  Users,
  Sparkles,
  Coins,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SawahVerse — Farm, Fish, Chill on Solana" },
      {
        name: "description",
        content:
          "A relaxing multiplayer Solana village game. Hold the token to unlock farming, fishing, and the village.",
      },
      { property: "og:title", content: "SawahVerse — Farm, Fish, Chill on Solana" },
      {
        property: "og:description",
        content:
          "Connect your wallet, hold the token, and enter a peaceful Indonesian-inspired Web3 village.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <TokenSection />
      <Roadmap />
      <Footer />
    </div>
  );
}

function Hero() {
  const { status, balance, address, connected } = useTokenGate();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-hero)]" />
      <Clouds />
      <FloatingIslands />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ocean/20 bg-foam/60 px-3 py-1 text-xs font-medium text-ocean backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Built on Solana · Token Gated
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Farm, Fish,
            <br />
            <span className="bg-[image:var(--gradient-ocean)] bg-clip-text text-transparent">
              Chill on Solana
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            A relaxing multiplayer village game where your wallet unlocks the world. Tend rice
            fields, cast your line into glowing rivers, and meet friends from across the chain.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <WalletButton />
            <Link to="/game">
              <Button size="lg" className="h-10 rounded-xl btn-glossy">
                Enter Game <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <GateBanner status={status} balance={balance} address={address} connected={connected} />
        </div>

        <div className="relative">
          <VillageScene />
        </div>
      </div>
    </section>
  );
}

function GateBanner({
  status,
  balance,
  address,
  connected,
}: {
  status: string;
  balance: number;
  address: string | null;
  connected: boolean;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-ocean/15 bg-white/70 p-4 backdrop-blur shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-soft text-ocean">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm">
        {!connected && (
          <p className="text-muted-foreground">
            Hold at least{" "}
            <span className="font-semibold text-foreground">{MIN_TOKEN_BALANCE} token</span> to
            play. Connect a wallet to check.
          </p>
        )}
        {connected && status === "loading" && (
          <p className="text-muted-foreground">Checking your balance…</p>
        )}
        {connected && status === "granted" && (
          <p className="flex items-center gap-1.5 font-medium text-leaf">
            <CheckCircle2 className="h-4 w-4" /> Access granted — balance {balance.toLocaleString()}{" "}
            · {shortAddress(address)}
          </p>
        )}
        {connected && status === "insufficient" && (
          <p className="flex items-center gap-1.5 text-foreground">
            <AlertCircle className="h-4 w-4 text-gold" /> You need at least 1 token to enter
            SawahVerse. Current: {balance.toLocaleString()}.
          </p>
        )}
        {connected && status === "error" && (
          <p className="text-destructive">Couldn't reach the network. Try again.</p>
        )}
      </div>
      <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="rounded-lg">
          Get Token
        </Button>
      </a>
    </div>
  );
}

function Clouds() {
  return (
    <>
      <div className="cloud-float absolute left-[8%] top-16 h-16 w-32 rounded-full bg-white/70 blur-xl" />
      <div
        className="cloud-float absolute right-[12%] top-28 h-12 w-24 rounded-full bg-white/60 blur-xl"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="cloud-float absolute left-[40%] top-10 h-10 w-20 rounded-full bg-white/50 blur-lg"
        style={{ animationDelay: "-12s" }}
      />
    </>
  );
}

function FloatingIslands() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-sky/20 blur-3xl" />
      <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-cyan-soft blur-3xl" />
    </div>
  );
}

function VillageScene() {
  // CSS isometric village illustration
  return (
    <div className="relative aspect-square w-full max-w-lg mx-auto">
      <div className="absolute inset-0 rounded-[2rem] bg-[image:var(--gradient-ocean)] opacity-10 blur-2xl" />
      <div className="relative h-full w-full rounded-[2rem] glass-card p-6">
        <div className="grid h-full grid-cols-4 grid-rows-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => {
            const isWater = [3, 6, 7, 11].includes(i);
            const isField = [0, 1, 4, 5, 8, 9].includes(i);
            const isHouse = i === 10;
            const isBoat = i === 7;
            return (
              <div
                key={i}
                className={`relative rounded-xl ${
                  isWater
                    ? "water-tile bg-[image:var(--gradient-ocean)]"
                    : isField
                      ? "bg-leaf/60"
                      : isHouse
                        ? "bg-sand"
                        : "bg-leaf/40"
                }`}
              >
                {isField && <div className="absolute inset-1 rounded bg-leaf/80" />}
                {isHouse && (
                  <div className="absolute inset-x-2 bottom-2 h-1/2 rounded-t-md bg-gold/80" />
                )}
                {isBoat && (
                  <div className="absolute left-1/2 top-1/2 h-2 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sand shadow" />
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foam px-3 py-1 text-xs font-medium text-ocean shadow-soft">
          Welcome to your village
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Sprout,
      title: "Rice Farming",
      desc: "Plant, water, and harvest rice on your own paddy. Earn coins, level up your farm.",
    },
    {
      icon: Fish,
      title: "Voxel Fishing",
      desc: "Cast into rivers and oceans. Hunt for Common to Legendary fish.",
    },
    {
      icon: Users,
      title: "Village Multiplayer",
      desc: "Visit friends, chat in the global village square, climb the leaderboard.",
    },
    {
      icon: Sparkles,
      title: "Cozy Vibes",
      desc: "Soft pastel art, gentle sounds. A game you can play while you sip kopi.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          A peaceful village. Powered by Solana.
        </h2>
        <p className="mt-3 text-muted-foreground">Everything you need to slow down and play.</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group rounded-2xl glass-card p-6 transition hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-soft text-ocean">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TokenSection() {
  const utilities = [
    { icon: CheckCircle2, title: "Token-gated access", desc: "Hold 1 token to enter the village." },
    { icon: Sparkles, title: "Future cosmetics", desc: "Skins for your avatar, boat, and house." },
    { icon: MapPin, title: "Land upgrades", desc: "Bigger paddies, more fishing spots." },
    { icon: Coins, title: "Seasonal events", desc: "Limited-time festivals and rewards." },
  ];
  return (
    <section id="token" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="rounded-3xl bg-[image:var(--gradient-ocean)] p-10 text-white shadow-glow sm:p-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Coins className="h-3.5 w-3.5" /> Token Utility
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Your key to the village.</h2>
            <p className="mt-4 max-w-md text-white/85">
              The SawahVerse token unlocks gameplay and shapes future content. We're building this
              for fun — nothing here is a financial promise or guarantee of profit.
            </p>
            <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer">
              <Button size="lg" className="mt-6 rounded-xl bg-white text-ocean hover:bg-white/90">
                View Token
              </Button>
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {utilities.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <Icon className="h-5 w-5 text-white" />
                <h4 className="mt-2 font-semibold">{title}</h4>
                <p className="mt-1 text-sm text-white/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const phases = [
    { p: "Phase 1", t: "Token-gated browser MVP", d: "Wallet connect, farming and fishing loop." },
    { p: "Phase 2", t: "Multiplayer village & chat", d: "Real-time presence and global chat." },
    { p: "Phase 3", t: "Farming, fishing, crafting", d: "Deeper progression and recipes." },
    { p: "Phase 4", t: "Marketplace & cosmetics", d: "Trade items and customize your farm." },
    { p: "Phase 5", t: "Mobile PWA", d: "Take the village with you anywhere." },
  ];
  return (
    <section id="roadmap" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Roadmap</h2>
        <p className="mt-3 text-muted-foreground">
          The path from cozy MVP to full multiplayer village.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-5">
        {phases.map((ph, i) => (
          <div key={ph.p} className="relative rounded-2xl glass-card p-5">
            <div className="text-xs font-semibold text-ocean">{ph.p}</div>
            <h3 className="mt-2 font-semibold">{ph.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{ph.d}</p>
            <div className="absolute -top-2 right-3 grid h-6 w-6 place-items-center rounded-full bg-[image:var(--gradient-ocean)] text-[10px] font-bold text-white shadow-soft">
              {i + 1}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
