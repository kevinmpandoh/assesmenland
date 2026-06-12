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
    return <div className="h-[38px] w-28 animate-pulse rounded-xl bg-secondary sm:h-11 sm:w-36" aria-hidden />;
  }
  return <Btn />;
}
