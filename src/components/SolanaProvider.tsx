import { useEffect, useState, type ReactNode, type ComponentType } from "react";
import { TokenGateContext, defaultGateState, type GateState } from "@/hooks/useTokenGate";

if (typeof window !== "undefined") {
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
        reactMod,
        uiMod,
        phantomMod,
        solflareMod,
        web3Mod,
        cfg,
      ] = await Promise.all([
        import("@solana/wallet-adapter-react"),
        import("@solana/wallet-adapter-react-ui"),
        import("@solana/wallet-adapter-phantom"),
        import("@solana/wallet-adapter-solflare"),
        import("@solana/web3.js"),
        import("@/lib/solana-config"),
      ]);
      if (cancelled) return;

      const { ConnectionProvider, WalletProvider, useConnection, useWallet } = reactMod;
      const { WalletModalProvider } = uiMod;
      const { PublicKey } = web3Mod;
      const wallets = [new phantomMod.PhantomWalletAdapter(), new solflareMod.SolflareWalletAdapter()];

      function GateBridge({ children }: { children: ReactNode }) {
        const { connection } = useConnection();
        const { publicKey, connected } = useWallet();
        const [state, setState] = useState<GateState>(defaultGateState);

        useEffect(() => {
          if (!connected || !publicKey) {
            setState({ balance: 0, status: "idle", address: null, connected: false });
            return;
          }
          let cancel = false;
          setState((s) => ({ ...s, status: "loading", connected: true, address: publicKey.toBase58() }));
          (async () => {
            try {
              const mint = new PublicKey(cfg.TOKEN_MINT);
              const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
              let total = 0;
              for (const acc of resp.value) {
                const info: any = acc.account.data.parsed.info;
                total += Number(info.tokenAmount?.uiAmount ?? 0);
              }
              if (cancel) return;
              setState({
                balance: total,
                status: total >= cfg.MIN_TOKEN_BALANCE ? "granted" : "insufficient",
                address: publicKey.toBase58(),
                connected: true,
              });
            } catch (e) {
              console.error("token gate error", e);
              if (!cancel) setState((s) => ({ ...s, status: "error" }));
            }
          })();
          return () => {
            cancel = true;
          };
        }, [connection, publicKey, connected]);

        return <TokenGateContext.Provider value={state}>{children}</TokenGateContext.Provider>;
      }

      const Comp: ComponentType<{ children: ReactNode }> = ({ children }) => (
        <ConnectionProvider endpoint={cfg.RPC_ENDPOINT}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <GateBridge>{children}</GateBridge>
            </WalletModalProvider>
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
