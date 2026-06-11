import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WalletButton } from "@/components/WalletButton";
import { useTokenGate } from "@/hooks/useTokenGate";
import { MIN_TOKEN_BALANCE, PUMP_FUN_URL, shortAddress } from "@/lib/solana-config";
import { CheckCircle2, AlertCircle, Wallet, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sawah Voyages — Sail, Cast, Chill on Solana" },
      {
        name: "description",
        content:
          "Hop on a tiny boat, cast your line, and reel in rare fish. A chill Solana game that runs right in your browser. Open beta.",
      },
      { property: "og:title", content: "Sawah Voyages — Sail, Cast, Chill" },
      {
        property: "og:description",
        content:
          "A cozy sea-life game on Solana. Connect your wallet, set sail, and start fishing — all in the browser.",
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
      <SpeciesMarquee />
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
          <span className="h-2 w-2 rounded-full bg-destructive" />
          12 CAPTAINS AT SEA
        </div>

        <div className="text-6xl boat-bob" aria-hidden>
          ⛵
        </div>

        <h1 className="pixel mt-6 text-4xl text-ink sm:text-5xl md:text-6xl">
          SAWAH
          <br />
          <span className="text-sunset-deep">VOYAGES</span>
        </h1>
        <p className="pixel mt-3 text-sm text-ocean sm:text-base">Sail · Cast · Chill</p>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
          Hop on your little boat, cast your line, and let the waves decide today's catch. There are
          common fish, weird ones, and a few that will make you yell. It all runs{" "}
          <span className="font-bold text-ocean">right in your browser</span> — no downloads, no
          drama.
        </p>

        <p className="mt-6 text-xs uppercase tracking-widest text-ink/60">
          Canoe · Sailboat · Fishing Skiff · Bagan · Speedboat · Cargo Hauler
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            ["🧪", "OPEN BETA"],
            ["✅", "NO DOWNLOAD"],
            ["🌐", "MULTIPLAYER"],
            ["🎙️", "VOICE CHAT"],
          ].map(([emo, label]) => (
            <span key={label} className="pill text-xs">
              <span>{emo}</span> {label}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <WalletButton />
          <Link to="/game" className="chunky-btn chunky-btn-sky text-ink">
            ENTER HARBOR →
          </Link>
          <p className="mt-1 text-sm text-ink/70">Connect your Solana wallet to set sail</p>
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
            Hold at least <span className="font-bold text-ink">{MIN_TOKEN_BALANCE} token</span> to
            come aboard. Connect your wallet first.
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

/* ---------- Species marquee ---------- */

const SPECIES = [
  { e: "🐟", n: "Coastal Sardine", r: "Common" },
  { e: "🐠", n: "Reef Snapper", r: "Uncommon" },
  { e: "🦀", n: "Mangrove Crab", r: "Uncommon" },
  { e: "🦈", n: "Blue Shark", r: "Rare" },
  { e: "🐡", n: "Moon Pufferfish", r: "Rare" },
  { e: "🐙", n: "Dusk Octopus", r: "Epic" },
  { e: "✨", n: "Mythic Eel Dragon", r: "MYTHICAL" },
  { e: "🌊", n: "Valley Leviathan", r: "MYTHICAL" },
  { e: "💜", n: "Sea Phoenix", r: "Epic" },
  { e: "⚡", n: "Thunder Fin", r: "MYTHICAL" },
];

function SpeciesMarquee() {
  const row = [...SPECIES, ...SPECIES];
  return (
    <section
      id="species"
      className="relative my-8 overflow-hidden border-y-2 border-ink bg-foam py-4"
    >
      <div className="marquee gap-8 whitespace-nowrap pixel text-xs text-ink">
        {row.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="text-lg">{s.e}</span>
            {s.n}
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
      emo: "⛵",
      title: "SAIL",
      desc: "Pick your boat — from a beat-up canoe to a cargo hauler. Each one has its own range and feel.",
    },
    {
      emo: "🎣",
      title: "CAST",
      desc: "Drop your line, wait a beat, then reel it in. Some fish only bite after dark — don't be surprised if you go home empty-handed.",
    },
    {
      emo: "🛠️",
      title: "UPGRADE",
      desc: "Sell your catch, buy bait, level up your boat. Your tiny dock slowly grows into a busy harbor.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="pixel text-xs text-ocean">The hunt is real</p>
        <h2 className="pixel mt-3 text-2xl text-ink sm:text-3xl">
          26 SPECIES.
          <br />
          ONE LEGENDARY PRIZE.
        </h2>
        <p className="mt-4 text-ink/80">
          From sardines you can pull all day to Mythical creatures that make global chat lose its
          mind. Eight fish only bite after sunset, and the rarest ones — honestly — are brutally
          hard. But when you finally land one? It feels really good.
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
        {["Common 100%", "Uncommon 60%", "Rare 20%", "Epic 6%", "Mythical <1%"].map((r) => (
          <span key={r} className="pill text-xs">
            {r}
          </span>
        ))}
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
            <h2 className="pixel mt-4 text-2xl text-ink sm:text-3xl">YOUR KEY TO THE HARBOR</h2>
            <p className="mt-4 max-w-md text-ink/80">
              Hold at least {MIN_TOKEN_BALANCE} Sawah Voyages token to enter the harbor and set
              sail. The token is just a key — for access, cosmetics, and seasonal events. Not a
              promise of returns, not an investment pitch. Play slowly, enjoy the sea.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer" className="chunky-btn">
                🪙 VIEW TOKEN
              </a>
              <Link to="/game" className="chunky-btn chunky-btn-sky">
                🎣 TRY THE GAME
              </Link>
            </div>
          </div>
          <div className="relative grid place-items-center bg-sky p-8 ink-border md:border-l-2 md:border-t-0 border-t-2">
            <div className="text-7xl boat-bob" aria-hidden>
              🏝️
            </div>
            <p className="pixel mt-4 text-xs text-ink/70">HARBOR #1</p>
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
      q: "Q1",
      t: "First boat afloat",
      d: "Open beta, one fish per rarity, a tiny dock tucked in the corner of the map.",
    },
    {
      q: "Q2",
      t: "First harbor opens",
      d: "Boats still wobble, but the fish are biting. Global chat goes live.",
    },
    {
      q: "Q3",
      t: "Voice chat & nighttime",
      d: "Chat with other captains. The rare fish start showing up after sundown.",
    },
    {
      q: "Q4",
      t: "Marketplace & cosmetics",
      d: "Sell sails, repaint your hull, hang lanterns. Mythical prizes get hunted for real.",
    },
  ];
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="pixel text-xs text-ocean">ROADMAP</p>
        <h2 className="pixel mt-3 text-2xl text-ink sm:text-3xl">FROM CANOE TO ARMADA</h2>
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
