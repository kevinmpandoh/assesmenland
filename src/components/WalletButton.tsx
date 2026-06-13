import { useEffect, useState, type ComponentType } from "react";
import { loadWalletModules } from "@/lib/wallet-loader";

// Wait for the SAME loader SolanaProvider uses, so WalletMultiButton is
// never rendered before WalletProvider is mounted. Rendering it earlier
// throws "WalletContext without provider" and trips the root error
// boundary ("This page didn't load").

export function WalletButton() {
  const [Btn, setBtn] = useState<ComponentType | null>(null);
  useEffect(() => {
    if (import.meta.env.SSR) return;
    let cancelled = false;
    loadWalletModules().then((m) => {
      if (cancelled) return;
      setBtn(() => m.WalletMultiButton as unknown as ComponentType);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!Btn) {
    return (
      <div
        className="h-[38px] w-28 animate-pulse rounded-xl bg-secondary sm:h-11 sm:w-36"
        aria-hidden
      />
    );
  }
  return <Btn />;
}
