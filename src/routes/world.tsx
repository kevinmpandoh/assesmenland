import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { useTokenGate } from "@/hooks/useTokenGate";
import { useGame } from "@/hooks/useGame";
import { useChat } from "@/hooks/useVillage";
import { pingWorld } from "@/lib/api/game.functions";
import {
  MAP_SIZE,
  SPAWN,
  buildMap,
  isWalkable,
  nearWater,
  type TileKind,
  type WorldObject,
} from "@/lib/world-map";
import { PUMP_FUN_URL, shortAddress } from "@/lib/solana-config";
import { toast } from "sonner";
import {
  Wallet,
  Lock,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Users,
  Zap,
  Coins,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/world")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "The Island — Sawah Voyages" },
      {
        name: "description",
        content:
          "Walk around the Sawah Voyages island, meet other captains, and fish from the shore.",
      },
    ],
  }),
  component: WorldPage,
});

function WorldPage() {
  const gate = useTokenGate();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {!gate.connected && <Gate icon={Wallet} title="Connect wallet to come ashore" connect />}
      {gate.connected && gate.status === "loading" && (
        <Gate icon={Sparkles} title="Checking your wallet…" />
      )}
      {gate.connected && gate.status === "insufficient" && (
        <Gate icon={Lock} title="At least 1 token needed" getToken />
      )}
      {gate.connected && gate.status === "error" && (
        <Gate icon={AlertCircle} title="Network is choppy" onRetry={gate.refresh} />
      )}
      {gate.connected && gate.status === "granted" && <World address={gate.address!} />}
    </div>
  );
}

function Gate({
  icon: Icon,
  title,
  connect,
  getToken,
  onRetry,
}: {
  icon: LucideIcon;
  title: string;
  connect?: boolean;
  getToken?: boolean;
  onRetry?: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="card-pop p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-deep text-ink ink-border">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="pixel mt-5 text-xl text-ink">{title}</h2>
        {connect && (
          <div className="mt-6 flex justify-center">
            <WalletButton />
          </div>
        )}
        {getToken && (
          <a href={PUMP_FUN_URL} target="_blank" rel="noreferrer">
            <Button size="lg" className="mt-6 chunky-btn">
              🪙 Get Token
            </Button>
          </a>
        )}
        {onRetry && (
          <Button onClick={onRetry} size="lg" className="mt-6 chunky-btn">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
          </Button>
        )}
        <div className="mt-6 flex justify-center">
          <Link to="/" className="pill text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------- world

const TILE_W = 64;
const TILE_H = 32;
const SPEED = 3.2; // tiles per second
const PING_MS = 1_500;
const BUBBLE_MS = 10_000;

type Mover = { x: number; y: number; tx: number; ty: number; name: string };

const TILE_COLORS: Record<TileKind, [string, string]> = {
  deep: ["#3a82d4", "#3576c2"],
  water: ["#5fb6e8", "#54aade"],
  sand: ["#f1dfa8", "#e8d394"],
  grass: ["#8fd17a", "#7fc46b"],
  paddy: ["#5fae54", "#549c4a"],
  path: ["#d9c08c", "#cfb37c"],
  dock: ["#b07c4f", "#a07045"],
};

function walletColor(wallet: string): string {
  let h = 0;
  for (let i = 0; i < wallet.length; i++) h = (h * 31 + wallet.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 55%)`;
}

function World({ address }: { address: string }) {
  const game = useGame(address);
  const { messages, send } = useChat();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable world state lives in refs so the rAF loop never depends on
  // React re-renders.
  const worldRef = useRef(buildMap());
  const meRef = useRef<Mover>({ ...SPAWN, tx: SPAWN.x, ty: SPAWN.y, name: "" });
  const othersRef = useRef<Map<string, Mover>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const camRef = useRef({ x: 0, y: 0, ready: false });
  const bubblesRef = useRef<Map<string, string>>(new Map());
  const splashesRef = useRef<{ x: number; y: number; t: number }[]>([]);

  const [onlineCount, setOnlineCount] = useState(1);
  const [canFish, setCanFish] = useState(false);
  const [casting, setCasting] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const myName = game.state.username || shortAddress(address);
  const nameRef = useRef(myName);
  nameRef.current = myName;

  // Chat bubbles: latest message per wallet, fresh ones only.
  useEffect(() => {
    if (!messages.data) return;
    const map = new Map<string, string>();
    const cutoff = Date.now() - BUBBLE_MS;
    for (const m of messages.data) {
      if (new Date(m.created_at).getTime() >= cutoff) map.set(m.wallet_address, m.body);
    }
    bubblesRef.current = map;
  }, [messages.data]);

  // Presence ping: send my position, receive everyone.
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      const me = meRef.current;
      try {
        const players = await pingWorld({
          data: { wallet: address, name: nameRef.current, x: me.x, y: me.y },
        });
        if (stopped) return;
        const seen = new Set<string>();
        for (const p of players) {
          if (p.wallet_address === address) continue;
          seen.add(p.wallet_address);
          const existing = othersRef.current.get(p.wallet_address);
          if (existing) {
            existing.tx = p.x;
            existing.ty = p.y;
            existing.name = p.name;
          } else {
            othersRef.current.set(p.wallet_address, {
              x: p.x,
              y: p.y,
              tx: p.x,
              ty: p.y,
              name: p.name,
            });
          }
        }
        for (const key of othersRef.current.keys()) {
          if (!seen.has(key)) othersRef.current.delete(key);
        }
        setOnlineCount(seen.size + 1);
      } catch (e) {
        console.warn("presence ping failed", e);
      }
    };
    tick();
    const t = setInterval(tick, PING_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [address]);

  // Keyboard movement.
  useEffect(() => {
    const MOVE_KEYS = new Set([
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ]);
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!MOVE_KEYS.has(k)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      e.preventDefault();
      keysRef.current.add(k);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Main loop: simulate + draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { tiles, objects } = worldRef.current;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const iso = (x: number, y: number): [number, number] => [
      ((x - y) * TILE_W) / 2,
      ((x + y) * TILE_H) / 2,
    ];

    const moveToward = (m: Mover, dt: number, speed: number, collide: boolean) => {
      const dx = m.tx - m.x;
      const dy = m.ty - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.02) return;
      const step = Math.min(dist, speed * dt);
      const nx = m.x + (dx / dist) * step;
      const ny = m.y + (dy / dist) * step;
      if (!collide || isWalkable(tiles, objects, nx, ny)) {
        m.x = nx;
        m.y = ny;
      } else if (!collide || isWalkable(tiles, objects, nx, m.y)) {
        m.x = nx;
        m.tx = nx;
      } else if (isWalkable(tiles, objects, m.x, ny)) {
        m.y = ny;
        m.ty = ny;
      } else {
        m.tx = m.x;
        m.ty = m.y;
      }
    };

    const update = (dt: number, now: number) => {
      const me = meRef.current;

      // keyboard: screen-relative directions mapped to iso axes
      const keys = keysRef.current;
      let kx = 0;
      let ky = 0;
      if (keys.has("w") || keys.has("arrowup")) {
        kx -= 1;
        ky -= 1;
      }
      if (keys.has("s") || keys.has("arrowdown")) {
        kx += 1;
        ky += 1;
      }
      if (keys.has("a") || keys.has("arrowleft")) {
        kx -= 1;
        ky += 1;
      }
      if (keys.has("d") || keys.has("arrowright")) {
        kx += 1;
        ky -= 1;
      }
      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        me.tx = me.x + (kx / len) * 0.6;
        me.ty = me.y + (ky / len) * 0.6;
      }
      moveToward(me, dt, SPEED, true);

      for (const other of othersRef.current.values()) {
        moveToward(other, dt, SPEED * 1.1, false);
      }

      // camera follows me
      const [px, py] = iso(me.x, me.y);
      const cam = camRef.current;
      if (!cam.ready) {
        cam.x = px;
        cam.y = py;
        cam.ready = true;
      } else {
        cam.x += (px - cam.x) * Math.min(1, dt * 4);
        cam.y += (py - cam.y) * Math.min(1, dt * 4);
      }

      // ambient splashes on water
      if (Math.random() < dt * 1.2) {
        const x = Math.random() * MAP_SIZE;
        const y = Math.random() * MAP_SIZE;
        const t = tiles[Math.round(y)]?.[Math.round(x)];
        if (t === "water" || t === "deep") splashesRef.current.push({ x, y, t: now });
      }
      splashesRef.current = splashesRef.current.filter((s) => now - s.t < 1500);

      setCanFish(nearWater(tiles, me.x, me.y));
    };

    const drawTile = (x: number, y: number, kind: TileKind, now: number) => {
      const [sx, sy] = iso(x, y);
      const [base, alt] = TILE_COLORS[kind];
      let fill = (x + y) % 2 === 0 ? base : alt;
      if (kind === "water" || kind === "deep") {
        const wave = Math.sin(now / 700 + x * 1.3 + y * 0.9) * 0.5 + 0.5;
        fill =
          kind === "deep" ? `hsl(212 65% ${44 + wave * 4}%)` : `hsl(203 72% ${60 + wave * 5}%)`;
      }
      ctx.beginPath();
      ctx.moveTo(sx, sy - TILE_H / 2);
      ctx.lineTo(sx + TILE_W / 2, sy);
      ctx.lineTo(sx, sy + TILE_H / 2);
      ctx.lineTo(sx - TILE_W / 2, sy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      if (kind === "paddy") {
        // planted rows running across the diamond
        ctx.strokeStyle = "rgba(27,34,64,0.3)";
        ctx.lineWidth = 1.5;
        for (let i = 1; i <= 3; i++) {
          const f = i / 4 - 0.5;
          const [ax, ay] = iso(x + f, y - 0.3);
          const [bx, by] = iso(x + f, y + 0.3);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
      if (kind === "dock") {
        ctx.strokeStyle = "rgba(27,34,64,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - TILE_W / 4, sy - TILE_H / 4 + TILE_H / 2);
        ctx.lineTo(sx + TILE_W / 4, sy + TILE_H / 4 - TILE_H / 2 + TILE_H / 2);
        ctx.stroke();
      }
    };

    const drawObject = (o: WorldObject) => {
      const [sx, sy] = iso(o.x, o.y);
      if (o.kind === "tree") {
        ctx.fillStyle = "#8a5a33";
        ctx.fillRect(sx - 3, sy - 22, 6, 22);
        ctx.fillStyle = "#4f9c4a";
        ctx.beginPath();
        ctx.arc(sx, sy - 30, 14, 0, Math.PI * 2);
        ctx.arc(sx - 10, sy - 22, 10, 0, Math.PI * 2);
        ctx.arc(sx + 10, sy - 22, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (o.kind === "rock") {
        ctx.fillStyle = "#9aa3b2";
        ctx.beginPath();
        ctx.ellipse(sx, sy - 4, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#b6bdc9";
        ctx.beginPath();
        ctx.ellipse(sx - 3, sy - 8, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (o.kind === "house") {
        ctx.fillStyle = "#f0e0c0";
        ctx.fillRect(sx - 18, sy - 26, 36, 24);
        ctx.strokeStyle = "#1b2240";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 18, sy - 26, 36, 24);
        ctx.fillStyle = "#f48b2a";
        ctx.beginPath();
        ctx.moveTo(sx - 24, sy - 26);
        ctx.lineTo(sx, sy - 44);
        ctx.lineTo(sx + 24, sy - 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#7fc7ff";
        ctx.fillRect(sx - 10, sy - 18, 8, 8);
        ctx.fillStyle = "#8a5a33";
        ctx.fillRect(sx + 4, sy - 16, 9, 14);
      } else if (o.kind === "stall") {
        ctx.fillStyle = "#c98c54";
        ctx.fillRect(sx - 16, sy - 18, 32, 16);
        ctx.strokeStyle = "#1b2240";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 16, sy - 18, 32, 16);
        ctx.fillStyle = "#f4f7fb";
        ctx.fillRect(sx - 20, sy - 26, 40, 8);
        ctx.fillStyle = "#f48b2a";
        for (let i = 0; i < 4; i++) ctx.fillRect(sx - 20 + i * 10 + 5, sy - 26, 5, 8);
        ctx.strokeRect(sx - 20, sy - 26, 40, 8);
      }
    };

    const drawAvatar = (m: Mover, wallet: string, isMe: boolean) => {
      const [sx, sy] = iso(m.x, m.y);
      // shadow
      ctx.fillStyle = "rgba(27,34,64,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = walletColor(wallet);
      ctx.strokeStyle = "#1b2240";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(sx - 8, sy - 22, 16, 20, 7);
      ctx.fill();
      ctx.stroke();
      // head
      ctx.fillStyle = "#ffe3c1";
      ctx.beginPath();
      ctx.arc(sx, sy - 28, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // sailor hat
      ctx.fillStyle = isMe ? "#f48b2a" : "#f4f7fb";
      ctx.beginPath();
      ctx.arc(sx, sy - 31, 8, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // name
      ctx.font = "bold 11px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#1b2240";
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 3;
      const label = isMe ? `⭐ ${m.name}` : m.name;
      ctx.strokeText(label, sx, sy - 44);
      ctx.fillText(label, sx, sy - 44);
      // chat bubble
      const bubble = bubblesRef.current.get(wallet);
      if (bubble) {
        const text = bubble.length > 28 ? `${bubble.slice(0, 28)}…` : bubble;
        ctx.font = "11px Nunito, sans-serif";
        const w = ctx.measureText(text).width + 14;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.strokeStyle = "#1b2240";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sx - w / 2, sy - 72, w, 20, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#1b2240";
        ctx.fillText(text, sx, sy - 58);
      }
    };

    const draw = (now: number) => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const cam = camRef.current;
      ctx.fillStyle = "#3a82d4";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.save();
      ctx.translate(rect.width / 2 - cam.x, rect.height / 2 - cam.y + 40);

      for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) drawTile(x, y, tiles[y][x], now);
      }

      // splashes
      for (const s of splashesRef.current) {
        const age = (now - s.t) / 1500;
        const [sx, sy] = iso(s.x, s.y);
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - age)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 4 + age * 14, 2 + age * 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // NPC boats drifting in a circle around the island
      for (let b = 0; b < 2; b++) {
        const angle = now / 14000 + b * Math.PI;
        const bx = MAP_SIZE / 2 + Math.cos(angle) * 11.6;
        const by = MAP_SIZE / 2 + Math.sin(angle) * 10.6;
        const [sx, sy] = iso(bx, by);
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.fillText("⛵", sx, sy + Math.sin(now / 900 + b) * 2);
      }

      // depth-sorted drawables: objects + players
      const me = meRef.current;
      const drawables: { depth: number; fn: () => void }[] = [
        ...objects.map((o) => ({ depth: o.x + o.y, fn: () => drawObject(o) })),
        { depth: me.x + me.y, fn: () => drawAvatar(me, address, true) },
        ...[...othersRef.current.entries()].map(([wallet, m]) => ({
          depth: m.x + m.y,
          fn: () => drawAvatar(m, wallet, false),
        })),
      ];
      drawables.sort((a, b) => a.depth - b.depth);
      for (const d of drawables) d.fn();

      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt, now);
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // click / tap to move
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cam = camRef.current;
      const px = e.clientX - rect.left - rect.width / 2 + cam.x;
      const py = e.clientY - rect.top - rect.height / 2 + cam.y - 40;
      const x = px / TILE_W + py / TILE_H;
      const y = py / TILE_H - px / TILE_W;
      if (isWalkable(tiles, objects, x, y)) {
        meRef.current.tx = x;
        meRef.current.ty = y;
      }
    };
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
    };
  }, [address]);

  const cast = () => {
    if (casting) return;
    if (game.fishCooldownRemaining > 0) return;
    if (game.state.energy < 5) {
      toast.error("Not enough energy");
      return;
    }
    setCasting(true);
    const me = meRef.current;
    splashesRef.current.push({ x: me.x + 0.8, y: me.y + 0.8, t: performance.now() });
    setTimeout(() => {
      const caught = game.fish();
      setCasting(false);
      if (caught) toast.success(`Caught a ${caught.rarity} ${caught.name}! 🎣`);
    }, 1200);
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const body = chatInput.trim();
    if (!body) return;
    setChatInput("");
    bubblesRef.current.set(address, body);
    send.mutate(
      { wallet: address, body },
      {
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Message failed to send"),
      },
    );
  };

  const cooldown = Math.ceil(game.fishCooldownRemaining / 1000);

  return (
    <main className="relative flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 72px)" }}>
      <canvas ref={canvasRef} className="absolute inset-0 cursor-pointer" />

      {/* HUD: stats */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
        <div className="pointer-events-auto card-pop flex items-center gap-3 px-3 py-2 text-xs">
          <span className="pixel text-[10px] text-ink">{myName}</span>
          <span className="flex items-center gap-1 text-ink/80">
            <Trophy className="h-3.5 w-3.5 text-sunset-deep" /> lv {game.state.level}
          </span>
          <span className="flex items-center gap-1 text-ink/80">
            <Coins className="h-3.5 w-3.5 text-sunset-deep" /> {game.state.coins.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-ink/80">
            <Zap className="h-3.5 w-3.5 text-sunset-deep" /> {game.state.energy}
          </span>
        </div>
      </div>

      {/* HUD: online + back */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <div className="card-pop flex items-center gap-1.5 px-3 py-2 text-xs text-ink">
          <Users className="h-3.5 w-3.5 text-ocean" /> {onlineCount} online
        </div>
        <Link to="/game" className="pill text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Harbor
        </Link>
      </div>

      {/* Fishing action */}
      {canFish && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 sm:bottom-20">
          <Button onClick={cast} disabled={casting || cooldown > 0} className="chunky-btn">
            {casting ? "Reeling in…" : cooldown > 0 ? `Wait ${cooldown}s…` : "🎣 Cast Line"}
          </Button>
        </div>
      )}

      {/* Chat bar */}
      <form
        onSubmit={sendChat}
        className="absolute inset-x-3 bottom-3 mx-auto flex max-w-md gap-2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2"
      >
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Say something — it appears above your head…"
          maxLength={280}
          className="ink-border flex-1 rounded-xl bg-foam/95 px-3 py-2 text-sm outline-none focus:border-sunset-deep"
          aria-label="World chat message"
        />
        <Button type="submit" size="sm" disabled={send.isPending} className="h-auto rounded-xl">
          Send
        </Button>
      </form>

      {/* Help hint */}
      <div className="pointer-events-none absolute bottom-16 left-3 hidden text-[11px] text-ink/60 sm:block">
        WASD / arrows / click to move · walk to the shore to fish
      </div>
    </main>
  );
}
