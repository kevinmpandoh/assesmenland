import { useCallback, useEffect, useState, type ReactNode, type ComponentType } from "react";
import { TokenGateContext, defaultGateState, type GateState } from "@/hooks/useTokenGate";

// Buffer global is provided by vite-plugin-node-polyfills on the client.
// All wallet libraries are lazy-loaded client-side only so SSR never
// touches them.

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [Inner, setInner] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    if (import.meta.env.SSR) return;
    let cancelled = false;
    (async () => {
      const [reactMod, uiMod, phantomMod, solflareMod, web3Mod, cfg] = await Promise.all([
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
      const wallets = [
        new phantomMod.PhantomWalletAdapter(),
        new solflareMod.SolflareWalletAdapter(),
      ];

      function GateBridge({ children }: { children: ReactNode }) {
        const { connection } = useConnection();
        const { publicKey, connected } = useWallet();
        const [attempt, setAttempt] = useState(0);
        const refresh = useCallback(() => setAttempt((n) => n + 1), []);
        const [state, setState] = useState<GateState>({ ...defaultGateState, refresh });

        useEffect(() => {
          if (!connected || !publicKey) {
            setState({ balance: 0, status: "idle", address: null, connected: false, refresh });
            return;
          }
          let cancel = false;
          setState((s) => ({
            ...s,
            status: "loading",
            connected: true,
            address: publicKey.toBase58(),
            refresh,
          }));
          (async () => {
            try {
              const mint = new PublicKey(cfg.TOKEN_MINT);
              const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
              let total = 0;
              for (const acc of resp.value) {
                const info = acc.account.data.parsed.info as {
                  tokenAmount?: { uiAmount?: number | null };
                };
                total += Number(info.tokenAmount?.uiAmount ?? 0);
              }
              if (cancel) return;
              setState({
                balance: total,
                status: total >= cfg.MIN_TOKEN_BALANCE ? "granted" : "insufficient",
                address: publicKey.toBase58(),
                connected: true,
                refresh,
              });
            } catch (e) {
              console.error("token gate error", e);
              if (!cancel) setState((s) => ({ ...s, status: "error" }));
            }
          })();
          return () => {
            cancel = true;
          };
        }, [connection, publicKey, connected, attempt, refresh]);

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
