import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CROPS, EQUIPMENT, MAX_LEVEL, xpForLevel } from "@/lib/game-logic";
import { MIN_TOKEN_BALANCE, PUMP_FUN_URL, TOKEN_MINT } from "@/lib/solana-config";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Agri Land" },
      {
        name: "description",
        content:
          "Everything about Agri Land: token access, crops, prices, grow times, equipment, levels, the shared town, and the roadmap.",
      },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "token", label: "Token Access" },
  { id: "crops", label: "Crops & Prices" },
  { id: "levels", label: "Levels & XP" },
  { id: "equipment", label: "Equipment" },
  { id: "town", label: "The Town" },
  { id: "faq", label: "FAQ" },
  { id: "roadmap", label: "Roadmap" },
];

function fmtTime(ms: number) {
  const s = ms / 1000;
  return s < 60 ? `${s}s` : `${Math.round(s / 60)}m`;
}

function DocsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="pixel text-2xl text-ink sm:text-3xl">Agri Land Docs</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Everything in the game, with exact numbers. Updated with every release.
          </p>
        </div>

        {/* TOC */}
        <nav className="mt-8 flex flex-wrap justify-center gap-2">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="pill text-xs">
              {s.label}
            </a>
          ))}
        </nav>

        {/* Getting started */}
        <Section id="getting-started" title="🚜 Getting Started">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/80">
            <li>
              Install <span className="font-semibold">Phantom</span> or{" "}
              <span className="font-semibold">Solflare</span> and click{" "}
              <span className="font-semibold">Connect Wallet</span>.
            </li>
            <li>
              Hold at least{" "}
              <span className="font-semibold">{MIN_TOKEN_BALANCE} Agri Land token</span> — the gate
              check is read-only; the game never asks you to sign a transaction.
            </li>
            <li>
              Open{" "}
              <Link to="/game" className="font-semibold text-ocean hover:underline">
                My Farm
              </Link>{" "}
              — you start with 25 gold, 100 energy, and a 9-plot field.
            </li>
            <li>
              Plant tomatoes, harvest, sell, and repeat. Visit the{" "}
              <Link to="/world" className="font-semibold text-ocean hover:underline">
                Town
              </Link>{" "}
              to meet everyone else.
            </li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            Progress saves automatically — locally in your browser instantly, and to the cloud every
            few seconds (the badge on your profile card shows the sync status).
          </p>
        </Section>

        {/* Token */}
        <Section id="token" title="🪙 Token Access">
          <p className="text-sm text-ink/80">
            Access to Agri Land is gated by holding at least {MIN_TOKEN_BALANCE} token of this mint
            on Solana mainnet:
          </p>
          <code className="mt-3 block overflow-x-auto rounded-xl bg-foam p-3 text-xs ink-border">
            {TOKEN_MINT}
          </code>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-ink/80">
            <li>The balance check is a read-only RPC call — no signature, no transaction.</li>
            <li>The token is a game key for access and future cosmetics/events.</li>
            <li>
              <span className="font-semibold">It is not an investment.</span> Gold and crops are
              in-game items with no monetary value, and nothing here promises profit or returns.
            </li>
          </ul>
          <a
            href={PUMP_FUN_URL}
            target="_blank"
            rel="noreferrer"
            className="pill mt-4 inline-flex text-xs"
          >
            🪙 View token
          </a>
        </Section>

        {/* Crops */}
        <Section id="crops" title="🌱 Crops & Prices">
          <p className="mb-4 text-sm text-ink/80">
            One crop unlocks per level. Planting buys the seed automatically and costs 2 energy.
            Base values below — equipment can shorten grow times and raise sell prices.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="pixel text-left text-[10px] text-ink/60">
                  <th className="pb-2">Crop</th>
                  <th className="pb-2">Unlocks</th>
                  <th className="pb-2">Seed</th>
                  <th className="pb-2">Sells</th>
                  <th className="pb-2">Profit</th>
                  <th className="pb-2">Grow time</th>
                  <th className="pb-2">XP</th>
                </tr>
              </thead>
              <tbody>
                {CROPS.map((c) => (
                  <tr key={c.id} className="border-t border-ink/10">
                    <td className="py-2 font-semibold text-ink">
                      {c.emoji} {c.name}
                    </td>
                    <td className="py-2">Level {c.unlockLevel}</td>
                    <td className="py-2">{c.seedCost}g</td>
                    <td className="py-2">{c.sellPrice}g</td>
                    <td className="py-2 text-leaf">+{c.sellPrice - c.seedCost}g</td>
                    <td className="py-2">{fmtTime(c.growMs)}</td>
                    <td className="py-2">+{c.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Levels */}
        <Section id="levels" title="🏆 Levels & XP">
          <p className="mb-4 text-sm text-ink/80">
            XP comes from harvesting. Each level needs <code>level × 100</code> XP. There are{" "}
            {MAX_LEVEL} levels right now — level 10 is the cap, with more planned (see roadmap).
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lvl) => {
              const crop = CROPS.find((c) => c.unlockLevel === lvl);
              return (
                <div key={lvl} className="rounded-xl bg-foam p-3 text-center ink-border">
                  <div className="pixel text-[10px] text-sunset-deep">LV {lvl}</div>
                  <div className="mt-1 text-xl">{crop?.emoji}</div>
                  <div className="text-xs font-semibold text-ink">{crop?.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {lvl < MAX_LEVEL ? `${xpForLevel(lvl)} XP to next` : "MAX"}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Equipment */}
        <Section id="equipment" title="🛠️ Equipment">
          <p className="mb-4 text-sm text-ink/80">
            Permanent, one-time purchases. Growth bonuses stack up to{" "}
            <span className="font-semibold">55% faster</span>; market bonuses up to{" "}
            <span className="font-semibold">+15% sell price</span>. Buying gear mid-growth applies
            from the next planting.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="pixel text-left text-[10px] text-ink/60">
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Cost</th>
                  <th className="pb-2">Effect</th>
                </tr>
              </thead>
              <tbody>
                {EQUIPMENT.map((e) => (
                  <tr key={e.id} className="border-t border-ink/10">
                    <td className="py-2 font-semibold text-ink">
                      {e.emoji} {e.name}
                    </td>
                    <td className="py-2">{e.cost.toLocaleString()}g</td>
                    <td className="py-2">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink/80">
            You can also <span className="font-semibold">expand your field</span> from 9 up to 25
            plots, +4 plots per expansion at 250g each.
          </p>
        </Section>

        {/* Town */}
        <Section id="town" title="🌍 The Town (shared multiplayer map)">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/80">
            <li>
              Every player who connects is on{" "}
              <span className="font-semibold">one shared live map</span> — there are no separate
              rooms or servers.
            </li>
            <li>Walk with WASD / arrow keys, or click/tap where you want to go.</li>
            <li>
              Every farmer appears with their name and{" "}
              <span className="font-semibold">Lvl badge</span> above their head; positions update in
              near real time.
            </li>
            <li>Chat messages appear as speech bubbles above heads for everyone to see.</li>
            <li>
              <span className="font-semibold">Shared fields:</span> the fenced soil plots are
              plantable by everyone — pick a seed from the bar that appears near the field and click
              a free soil tile. Up to ~100 plots, first come first served.
            </li>
            <li>
              <span className="font-semibold">Only the planter can harvest</span> their crop (a
              colored dot marks the owner). Ready crops sparkle ✨ — and{" "}
              <span className="font-semibold">wither 2 hours after ripening</span> if left
              unharvested, freeing the plot.
            </li>
            <li>
              The 🛒 Shop opens as a window inside the town — sell your harvest and buy equipment
              without ever leaving the map.
            </li>
          </ul>
        </Section>

        {/* FAQ */}
        <Section id="faq" title="❓ FAQ">
          <div className="space-y-4">
            {[
              [
                "Do I need to sign transactions to play?",
                "No. The token gate is a read-only balance check. The game never asks for a signature or moves your funds.",
              ],
              [
                "Is gold worth real money?",
                "No. Gold, crops, and equipment are in-game items with no monetary value and no withdrawal mechanism. Agri Land promises no profit or returns.",
              ],
              [
                "Where is my progress stored?",
                "Locally in your browser (instant) and synced to the game server every few seconds, so the leaderboard and town stay live. Clearing browser data resets local progress.",
              ],
              [
                "What happens if I sell my token?",
                "The gate re-checks your balance when you connect. Below 1 token, the farm locks until you hold again — progress is kept.",
              ],
              [
                "How does the shared field work?",
                "Anyone can plant on a free soil tile in the fenced fields. Only you can harvest what you planted — others see a colored owner dot. A ready crop withers 2 hours after ripening, the plot opens up again, and the seed is lost, so come back in time!",
              ],
              [
                "Why don't I see other players?",
                "Players idle for 12+ seconds disappear from the map. If the town looks empty, you might just be early — invite a friend!",
              ],
              [
                "Is there a wiki / can I suggest features?",
                "This page is the living wiki. Suggestions are welcome in the village chat — the roadmap below shows what's coming.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="card-pop p-4">
                <h3 className="text-sm font-bold text-ink">{q}</h3>
                <p className="mt-1.5 text-sm text-ink/75">{a}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Roadmap */}
        <Section id="roadmap" title="🗺️ Roadmap">
          <ol className="space-y-3">
            {[
              {
                phase: "Phase 1 — First seeds",
                status: "LIVE",
                items:
                  "Token-gated access · 10 crops & 10 levels · equipment shop · field expansion · live leaderboard · global chat · one shared multiplayer town",
              },
              {
                phase: "Phase 2 — Personal plots",
                status: "NEXT",
                items:
                  "Your farm visible on the town map · visit friends' fields · watering favors · sign-in-with-Solana account security",
              },
              {
                phase: "Phase 3 — Seasons & festivals",
                status: "PLANNED",
                items:
                  "Weather affecting growth · limited seasonal crops · harvest festival events with town prizes · levels beyond 10",
              },
              {
                phase: "Phase 4 — Marketplace & cosmetics",
                status: "PLANNED",
                items: "Player-to-player crop market · farmhouse skins · pets · custom farmer hats",
              },
            ].map((p) => (
              <li key={p.phase} className="card-pop p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="pixel text-xs text-ink">{p.phase}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.status === "LIVE"
                        ? "bg-leaf/30 text-ink"
                        : p.status === "NEXT"
                          ? "bg-sunset/40 text-ink"
                          : "bg-foam text-ink/60"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/75">{p.items}</p>
              </li>
            ))}
          </ol>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="pixel mb-4 text-lg text-ink">{title}</h2>
      {children}
    </section>
  );
}
