## Tujuan
Geser brand dari "SawahVerse" ke tema laut/voyages dengan estetika playful-pixel yang terinspirasi voxelfishing.com — tapi komposisi, copy, dan detail tetap orisinal. Bersamaan: audit bug dan rapikan teks.

## Arah desain (locked)
- **Palet "Langit Voxel"**: sky `#bfe3ff`, ocean `#7fc7ff`, sunset orange `#ffb05a`, ink-navy `#1b2240`. Tulis ke `src/styles.css` lewat `@theme` + tokens (`--sky`, `--ocean`, `--sunset`, `--ink`).
- **Tipografi**: heading pakai pixel font (Press Start 2P) untuk wordmark + section title pendek; body pakai sans humanis (Nunito/Inter) supaya readable & "human". Load via `<link>` di `__root.tsx` (bukan `@import` di CSS).
- **Vibe**: langit cerah dengan awan pixel mengambang, perahu kecil, kartu rounded tebal dengan border ink 2px + shadow soft. Tombol besar berwarna oranye sunset bergaya pixel-chunky. Bukan glassmorphism.
- **Bukan jiplak**: layout, ikon, micro-copy, dan ilustrasi berbeda. Tema kita = "voyages + chill village di laut", bukan fishing-only.

## Brand baru
- Nama: **Sawah Voyages** (jembatan dari brand lama "SawahVerse" — tetap khas, bukan klon "Voxel Voyages"). Tagline: "Sail, Cast, Chill on Solana."
- Hapus copy "Farm, Fish, Chill" lama; ganti dengan narasi pelayaran + memancing + desa terapung.

## Halaman Landing (`src/routes/index.tsx`)
Susun ulang section:
1. **Sticky top bar**: kiri wordmark pixel "SAWAH VOYAGES"; kanan: Stats · Wiki · X · Buy Token · Connect Wallet (pakai komponen `WalletButton` existing).
2. **Live ticker pill** ("X captains sailing right now" — angka statis dulu, atau dummy dari hook).
3. **Hero**: ilustrasi perahu pixel (emoji ⛵ besar atau SVG sederhana), wordmark dua baris, sub-tagline, 4 chip fitur (Open Beta · No Download · Multiplayer · Voice Chat), tombol **Connect Wallet** chunky.
4. **Marquee species**: pita berjalan berisi ikon/emoji ikan + rarity (Common → Mythical) — copy & list ikan dibuat sendiri.
5. **Section "The Hunt is Real"** versi kita: 3 kartu (Sail, Cast, Upgrade) menjelaskan loop game; ilustrasi pakai emoji + token CSS.
6. **Section Token-Gate**: jelaskan minimal token balance (`MIN_TOKEN_BALANCE`) + link `PUMP_FUN_URL` + status wallet realtime dari `useTokenGate`.
7. **Roadmap ringkas** (3-4 milestone, copy ditulis ulang biar terdengar manusiawi, bukan corporate AI).
8. **Footer** baru: nama brand, social, disclaimer "Open Beta · Play at your own pace".

## Halaman Game (`src/routes/game.tsx`)
- Sesuaikan judul & meta: "Play Sawah Voyages — Set Sail".
- Ganti label "SawahVerse village" → "the harbor", "Farm" tab → "Harbor", "Fish" → "Cast", tetap pertahankan logika hook `useGame` (tidak diubah).
- Gate screens: rapikan copy (jelas, ramah, tanpa jargon AI). Tombol CTA chunky oranye sunset, border ink.
- Pastikan tab list tetap accessible (aria-label), warna konsisten palet baru.

## Komponen
- `Navbar.tsx`: ulang jadi pill-style buttons (mirip ref, tapi rounded-2xl, border ink, bukan replika persis). Tambah ikon emoji kecil di tiap tombol.
- `Footer.tsx`: minimalis, 1 baris brand + 1 baris link + disclaimer.
- Tambah komponen kecil: `Marquee.tsx`, `PixelCloud.tsx`, `ChunkyButton.tsx` (variant button pixel).
- `WalletButton.tsx`: style chunky sunset agar nyambung.

## Audit bug & polish
- `Route.useRouter()` / forward-reference: cek route files patuh aturan TanStack (errorComponent/notFoundComponent untuk `/game` yang punya loader — saat ini belum ada loader, jadi cukup tambahkan `notFoundComponent` di `__root`).
- Verifikasi import ikon lucide yang dipakai sudah valid; hapus yang tidak terpakai (`Sprout`, `MapPin` jika tidak lagi relevan).
- `useTokenGate` & `solana-config.ts` tidak diubah logikanya (hanya copy/teks).
- Cek `head()` setiap route: title <60 char, description <160 char, og:title/og:description, twitter:card, satu H1 per halaman.
- Pastikan `__root.tsx` masih punya `<Outlet />`, link Google Font `<link>` ditambahkan di head root (bukan `@import` URL di CSS — melanggar aturan stack).
- Jalankan visual check di preview setelah build untuk memastikan tidak ada teks overflow / kontras buruk.

## Hal yang TIDAK diubah
- `src/hooks/useGame.ts`, `useTokenGate.ts`, `src/lib/solana-config.ts`, `SolanaProvider.tsx` — logika tetap.
- Tidak menambah dependensi baru selain Google Font via `<link>`.

## Catatan copy (contoh nada baru, lebih "manusia")
- Hero sub: "Naik perahu kecil, lempar pancingmu, dan biarkan ombak yang menentukan tangkapan hari ini. Semua langsung dari browser — tanpa download, tanpa drama."
- Roadmap item: "Q2 — Pelabuhan pertama dibuka. Kapal masih oleng, tapi ikannya sudah menggigit."
(ditulis manual, bukan bullet generik)

## Verifikasi akhir
- Build pass, tidak ada runtime error baru.
- Bandingkan screenshot landing baru vs voxelfishing.com → komposisi & detail jelas berbeda (palet boleh mirip, layout/section/copy berbeda).
- /game tetap fungsional di semua status gate (disconnected, loading, insufficient, granted, error).
