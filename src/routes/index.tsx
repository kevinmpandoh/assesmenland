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
      { name: "description", content: "Naik perahu kecil, lempar pancing, dan tangkap ikan langka. Game santai berbasis Solana, jalan langsung di browser. Open beta." },
      { property: "og:title", content: "Sawah Voyages — Sail, Cast, Chill" },
      { property: "og:description", content: "Game santai laut di Solana. Connect wallet, naik perahu, dan mancing — semua di browser." },
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
      <div className="pixel-cloud cloud-float left-[68%] top-16" style={{ animationDelay: "-6s" }} />
      <div className="pixel-cloud cloud-float left-[35%] top-44" style={{ animationDelay: "-12s", transform: "scale(0.8)" }} />
      <div className="pixel-cloud cloud-float left-[82%] top-72" style={{ animationDelay: "-3s", transform: "scale(0.7)" }} />
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
          12 KAPTEN SEDANG BERLAYAR
        </div>

        <div className="text-6xl boat-bob" aria-hidden>⛵</div>

        <h1 className="pixel mt-6 text-4xl text-ink sm:text-5xl md:text-6xl">
          SAWAH
          <br />
          <span className="text-sunset-deep">VOYAGES</span>
        </h1>
        <p className="pixel mt-3 text-sm text-ocean sm:text-base">Sail · Cast · Chill</p>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
          Naik perahu kecilmu, lempar pancing, dan biarkan ombak yang menentukan tangkapan hari ini.
          Ada ikan biasa, ada yang aneh, dan ada satu-dua yang bikin teriak. Semua jalan{" "}
          <span className="font-bold text-ocean">langsung di browser</span> — tanpa download, tanpa drama.
        </p>

        <p className="mt-6 text-xs uppercase tracking-widest text-ink/60">
          Sampan · Sailboat · Kapal Pancing · Bagan · Speedboat · Cargo Hauler
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            ["🧪", "OPEN BETA"],
            ["✅", "NO DOWNLOAD"],
            ["🌐", "MULTIPLAYER"],
            ["🎙️", "VOICE CHAT"],
          ].map(([emo, label]) => (
            <span key={label} className="pill text-xs"><span>{emo}</span> {label}</span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <WalletButton />
          <Link to="/game" className="chunky-btn chunky-btn-sky text-ink">
            ENTER HARBOR →
          </Link>
          <p className="mt-1 text-sm text-ink/70">Connect wallet Solana-mu untuk berlayar</p>
          <ArrowDown className="mt-2 h-5 w-5 animate-bounce text-ink/50" />
        </div>

        <GateBanner status={status} balance={balance} address={address} connected={connected} />
      </div>
    </section>
  );
}

function GateBanner({ status, balance, address, connected }: { status: string; balance: number; address: string | null; connected: boolean }) {
  return (
    <div className="mt-8 flex w-full max-w-xl flex-wrap items-center gap-3 card-pop p-4 text-left">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-deep text-ink ink-border">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm">
        {!connected && (
          <p className="text-ink/70">
            Pegang minimal <span className="font-bold text-ink">{MIN_TOKEN_BALANCE} token</span> buat ikut berlayar. Connect wallet dulu ya.
          </p>
        )}
        {connected && status === "loading" && <p className="text-ink/70">Lagi ngecek saldo kamu…</p>}
        {connected && status === "granted" && (
          <p className="flex items-center gap-1.5 font-semibold text-leaf">
            <CheckCircle2 className="h-4 w-4" /> Akses terbuka — saldo {balance.toLocaleString()} · {shortAddress(address)}
          </p>
        )}
        {connected && status === "insufficient" && (
          <p className="flex items-center gap-1.5 text-ink">
            <AlertCircle className="h-4 w-4 text-sunset-deep" /> Butuh minimal 1 token. Saldomu sekarang: {balance.toLocaleString()}.
          </p>
        )}
        {connected && status === "error" && (
          <p className="text-destructive">Sambungan RPC putus. Coba refresh sebentar.</p>
        )}
      </div>
      <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer" className="pill text-xs">
        🪙 Beli Token
      </a>
    </div>
  );
}

/* ---------- Species marquee ---------- */

const SPECIES = [
  { e: "🐟", n: "Sardin Pesisir", r: "Common" },
  { e: "🐠", n: "Kakap Karang", r: "Uncommon" },
  { e: "🦀", n: "Kepiting Bakau", r: "Uncommon" },
  { e: "🦈", n: "Hiu Biru", r: "Rare" },
  { e: "🐡", n: "Buntal Bulan", r: "Rare" },
  { e: "🐙", n: "Gurita Senja", r: "Epic" },
  { e: "✨", n: "Naga Belut Mitos", r: "MYTHICAL" },
  { e: "🌊", n: "Leviathan Lembah", r: "MYTHICAL" },
  { e: "💜", n: "Phoenix Laut", r: "Epic" },
  { e: "⚡", n: "Petir Sirip", r: "MYTHICAL" },
];

function SpeciesMarquee() {
  const row = [...SPECIES, ...SPECIES];
  return (
    <section id="species" className="relative my-8 overflow-hidden border-y-2 border-ink bg-foam py-4">
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
      title: "BERLAYAR",
      desc: "Pilih kapalmu dari sampan butut sampai cargo hauler. Tiap kapal punya jangkauan dan gaya sendiri.",
    },
    {
      emo: "🎣",
      title: "MEMANCING",
      desc: "Lempar pancing, tunggu sebentar, lalu tarik. Beberapa ikan cuma keluar pas malam — jangan kaget kalau seharian zonk.",
    },
    {
      emo: "🛠️",
      title: "UPGRADE",
      desc: "Jual hasil tangkapanmu, beli umpan, naikkan level kapal. Dermaga kecilmu lama-lama jadi pelabuhan ramai.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="pixel text-xs text-ocean">The hunt is real</p>
        <h2 className="pixel mt-3 text-2xl text-ink sm:text-3xl">
          26 SPESIES.
          <br />
          SATU HADIAH LEGENDARIS.
        </h2>
        <p className="mt-4 text-ink/80">
          Dari sardin yang gampang banget sampai makhluk Mythical yang bikin chat ribut.
          Delapan ikan cuma menggigit setelah matahari turun, dan yang paling langka — jujur — susah parah.
          Tapi pas akhirnya dapat satu? Enak banget rasanya.
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
          <span key={r} className="pill text-xs">{r}</span>
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
            <span className="pill text-xs"><span>🪙</span> TOKEN</span>
            <h2 className="pixel mt-4 text-2xl text-ink sm:text-3xl">KUNCI MASUK DERMAGA</h2>
            <p className="mt-4 max-w-md text-ink/80">
              Pegang minimal {MIN_TOKEN_BALANCE} token Sawah Voyages buat masuk pelabuhan dan ikut berlayar.
              Token ini fungsinya cuma kunci — buat akses, kosmetik, dan event musiman.
              Bukan janji untung, bukan ajakan invest. Mainnya pelan, nikmatin laut.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer" className="chunky-btn">
                🪙 LIHAT TOKEN
              </a>
              <Link to="/game" className="chunky-btn chunky-btn-sky">
                🎣 COBA MAIN
              </Link>
            </div>
          </div>
          <div className="relative grid place-items-center bg-sky p-8 ink-border md:border-l-2 md:border-t-0 border-t-2">
            <div className="text-7xl boat-bob" aria-hidden>🏝️</div>
            <p className="pixel mt-4 text-xs text-ink/70">PELABUHAN #1</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Roadmap ---------- */

function Roadmap() {
  const phases = [
    { q: "Q1", t: "Perahu pertama mengambang", d: "Open beta, satu jenis ikan tiap rarity, dermaga kecil di pojok peta." },
    { q: "Q2", t: "Pelabuhan pertama buka", d: "Kapal masih oleng, tapi ikannya sudah menggigit. Chat global aktif." },
    { q: "Q3", t: "Voice chat & malam hari", d: "Bisa ngobrol bareng kapten lain. Ikan-ikan langka mulai nongol setelah matahari turun." },
    { q: "Q4", t: "Marketplace & kosmetik", d: "Jual layar, ganti cat kapal, pasang lentera. Hadiah Mythical mulai diburu serius." },
  ];
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="pixel text-xs text-ocean">PETA PERJALANAN</p>
        <h2 className="pixel mt-3 text-2xl text-ink sm:text-3xl">DARI SAMPAN KE ARMADA</h2>
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
