import { useEffect, useState, type ComponentType } from "react";

export function WalletButton() {
  const [Btn, setBtn] = useState<ComponentType | null>(null);
  useEffect(() => {
    if (import.meta.env.SSR) return;
    import("@solana/wallet-adapter-react-ui").then((m) =>
      setBtn(() => m.WalletMultiButton as unknown as ComponentType),
    );
  }, []);
  if (!Btn) {
    return <div className="h-10 w-36 animate-pulse rounded-xl bg-secondary" aria-hidden />;
  }
  return <Btn />;
}
