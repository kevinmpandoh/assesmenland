import { useEffect, useState, type ReactNode, type ComponentType } from "react";

if (typeof window !== "undefined") {
  // Lazy buffer polyfill for solana adapters
  import("buffer").then(({ Buffer }) => {
    if (!(window as any).Buffer) (window as any).Buffer = Buffer;
  });
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [Inner, setInner] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    if (import.meta.env.SSR) return;
    let cancelled = false;
    (async () => {
      const [
        { ConnectionProvider, WalletProvider },
        { WalletModalProvider },
        { PhantomWalletAdapter },
        { SolflareWalletAdapter },
        { RPC_ENDPOINT },
      ] = await Promise.all([
        import("@solana/wallet-adapter-react"),
        import("@solana/wallet-adapter-react-ui"),
        import("@solana/wallet-adapter-phantom"),
        import("@solana/wallet-adapter-solflare"),
        import("@/lib/solana-config"),
      ]);
      if (cancelled) return;
      const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
      const Comp: ComponentType<{ children: ReactNode }> = ({ children }) => (
        <ConnectionProvider endpoint={RPC_ENDPOINT}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      );
      setInner(() => Comp);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Inner) return <>{children}</>;
  return <Inner>{children}</Inner>;
}
