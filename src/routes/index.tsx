import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WalletButton } from "@/components/WalletButton";
import { useTokenGate } from "@/hooks/useTokenGate";
import { CROPS } from "@/lib/game-logic";
import { MIN_TOKEN_BALANCE, PUMP_FUN_URL, shortAddress } from "@/lib/solana-config";
import { CheckCircle2, AlertCircle, Wallet, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agri Land — Plant, Grow, Prosper on Solana" },
      {
        name: "description",
        content:
          "Claim a field, plant your first tomato, and grow it into a farming empire. A chill multiplayer Solana game that runs right in your browser. Open beta.",
      },
      { property: "og:title", content: "Agri Land — Plant, Grow, Prosper" },
      {
        property: "og:description",
        content:
          "A cozy farming game on Solana. Connect your wallet, plant seeds, and watch your land grow — all in the browser, together with other farmers on one live map.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SkyBackdrop />
      <Navbar />
      <Hero />
      <CropsMarquee />
      <HowItWorks />
      <TokenSection />
      <Roadmap />
      <Footer />
    </div>
  );
}

/* ---------- Background ---------- */

function SkyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
      <div className="pixel-cloud cloud-float left-[6%] top-24" />
      <div
        className="pixel-cloud cloud-float left-[68%] top-16"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="pixel-cloud cloud-float left-[35%] top-44"
        style={{ animationDelay: "-12s", transform: "scale(0.8)" }}
      />
      <div
        className="pixel-cloud cloud-float left-[82%] top-72"
        style={{ animationDelay: "-3s", transform: "scale(0.7)" }}
      />
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  const { status, balance, address, connected } = useTokenGate();
  return (
    <section className="relative">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-10 pt-6 text-center sm:px-6">
        <div className="pill mb-6 text-xs">
          <span className="h-2 w-2 rounded-full bg-leaf" />
          OPEN BETA · LIVE TOWN
        </div>

        <div className="text-6xl boat-bob" aria-hidden>
          🧑‍🌾
        </div>

        <h1 className="pixel mt-6 text-4xl text-ink sm:text-5xl md:text-6xl">
          AGRI&nbsp;<span className="text-sunset-deep">LAND</span>
        </h1>
        <p className="pixel mt-3 text-sm text-ocean sm:text-base">Plant · Grow · Prosper</p>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
          Claim a field, plant a seed, and grow your farm.
        </p>


        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            ["🧪", "OPEN BETA"],
            ["✅", "NO DOWNLOAD"],
            ["🌐", "ONE SHARED MAP"],
            ["💬", "LIVE CHAT"],
          ].map(([emo, label]) => (
            <span key={label} className="pill text-xs">
              <span>{emo}</span> {label}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <WalletButton />
          <Link to="/game" className="chunky-btn chunky-btn-sky text-ink">
            START FARMING →
          </Link>
          <p className="mt-1 text-sm text-ink/70">Connect your Solana wallet to claim your field</p>
          <ArrowDown className="mt-2 h-5 w-5 animate-bounce text-ink/50" />
        </div>

        <GateBanner status={status} balance={balance} address={address} connected={connected} />
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
    <div className="mt-8 flex w-full max-w-xl flex-wrap items-center gap-3 card-pop p-4 text-left">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-deep text-ink ink-border">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm">
        {!connected && (
          <p className="text-ink/70">
            Hold&nbsp;<span className="font-bold text-ink">{MIN_TOKEN_BALANCE} token</span> to
            claim a field. Connect your wallet first.
          </p>
        )}
        {connected && status === "loading" && <p className="text-ink/70">Checking your balance…</p>}
        {connected && status === "granted" && (
          <p className="flex items-center gap-1.5 font-semibold text-leaf">
            <CheckCircle2 className="h-4 w-4" /> Access granted — balance {balance.toLocaleString()}{" "}
            · {shortAddress(address)}
          </p>
        )}
        {connected && status === "insufficient" && (
          <p className="flex items-center gap-1.5 text-ink">
            <AlertCircle className="h-4 w-4 text-sunset-deep" /> You need at least 1 token. Current
            balance: {balance.toLocaleString()}.
          </p>
        )}
        {connected && status === "error" && (
          <p className="text-destructive">RPC connection dropped. Try a quick refresh.</p>
        )}
      </div>
      <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer" className="pill text-xs">
        🪙 Get Token
      </a>
    </div>
  );
}

/* ---------- Crops marquee ---------- */

function CropsMarquee() {
  const row = [...CROPS, ...CROPS];
  return (
    <section
      id="species"
      className="relative my-8 overflow-hidden border-y-2 border-ink bg-foam py-4"
    >
      <div className="marquee gap-8 whitespace-nowrap pixel text-xs text-ink">
        {row.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="text-lg">{c.emoji}</span>
            {c.name} <span className="text-sunset-deep">Lv{c.unlockLevel}</span>
            <span className="text-ink/40">·</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */

function HowItWorks() {
  const steps = [
    {
      emo: "🌱",
      title: "PLANT",
      desc: "Pick a seed and click an empty plot, the seed is bought automatically. Start with tomatoes; every level unlocks a bigger, more valuable crop.",
    },
    {
      emo: "⏳",
      title: "GROW & HARVEST",
      desc: "Crops grow in real time, from 20 seconds for tomatoes to 10 minutes for Golden Rice. Harvest when they sparkle, stash everything in your barn.",
    },
    {
      emo: "💰",
      title: "SELL & UPGRADE",
      desc: "Sell the barn for gold. Spend it on sprinklers, fertilizer, and a greenhouse so crops grow up to 55% faster, then expand your field and repeat.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="pixel text-xs text-ocean">The loop is simple</p>
        <h2 className="pixel mt-3 text-2xl text-ink sm:text-3xl">
          ONE GOLDEN FIELD.
        </h2>
        <p className="mt-4 text-ink/80">
          From tomatoes you can flip in seconds to Golden Rice that takes patience and pays like a
          harvest festival. Level up to unlock bigger crops, invest your gold in equipment, and
          climb the town leaderboard.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.title} className="card-pop p-6">
            <div className="text-4xl">{s.emo}</div>
            <h3 className="pixel mt-4 text-base text-ink">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
        {[
          "🍅 Lv1 Tomato",
          "🌽 Lv3 Corn",
          "🍈 Lv6 Melon",
          "🍓 Lv8 Strawberry",
          "🌾 Lv10 Golden Rice",
        ].map((r) => (
          <span key={r} className="pill text-xs">
            {r}
          </span>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/docs" className="pill text-xs">
          📚 Read the full docs. Crops, prices, equipment, FAQ
        </Link>
      </div>
    </section>
  );
}

/* ---------- Token Section ---------- */

function TokenSection() {
  return (
    <section id="token" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="card-pop overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1fr_360px]">
          <div className="p-8 sm:p-10">
            <span className="pill text-xs">
              <span>🪙</span> TOKEN
            </span>
            <h2 className="pixel mt-4 text-2xl text-ink sm:text-3xl">YOUR KEY TO THE LAND</h2>
            <p className="mt-4 max-w-md text-ink/80">
              Hold {MIN_TOKEN_BALANCE} Agri Land token to claim a field and enter the town.
              The token is just a key for access, cosmetics, and seasonal events. Not a promise of
              returns, not an investment pitch. Farm slowly, enjoy the seasons.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer" className="chunky-btn">
                🪙 VIEW TOKEN
              </a>
              <Link to="/game" className="chunky-btn chunky-btn-sky">
                🌱 TRY THE GAME
              </Link>
            </div>
          </div>
          <div className="relative grid place-items-center bg-sky p-8 ink-border md:border-l-2 md:border-t-0 border-t-2">
            <div className="text-7xl boat-bob" aria-hidden>
              🏡
            </div>
            <p className="pixel mt-4 text-xs text-ink/70">FIELD #1</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Roadmap ---------- */

function Roadmap() {
  const phases = [
    {
      q: "PHASE 1",
      t: "First seeds LIVE",
      d: "Open beta: 10 crops, 10 levels, equipment shop, live leaderboard, global chat, and one shared multiplayer town.",
    },
    {
      q: "PHASE 2",
      t: "Personal plots in town",
      d: "Your farm appears on the world map, visit other farmers' fields, water their crops, leave a note.",
    },
    {
      q: "PHASE 3",
      t: "Seasons & festivals",
      d: "Weather that changes growth rates, limited seasonal crops, and a harvest festival with town-wide prizes.",
    },
    {
      q: "PHASE 4",
      t: "Marketplace & cosmetics",
      d: "Player-to-player crop trading, farmhouse skins, pets, and custom hats for your farmer.",
    },
  ];
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="pixel text-xs text-ocean">ROADMAP</p>
        <h2 className="pixel mt-3 text-2xl text-ink sm:text-3xl">FROM SEED TO EMPIRE</h2>
      </div>
      <ol className="mt-10 grid gap-4 md:grid-cols-4">
        {phases.map((p) => (
          <li key={p.q} className="card-pop p-5">
            <span className="pixel text-xs text-sunset-deep">{p.q}</span>
            <h3 className="pixel mt-2 text-sm text-ink">{p.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{p.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
