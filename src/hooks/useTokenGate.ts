import { createContext, useContext } from "react";

export type GateStatus = "idle" | "loading" | "granted" | "insufficient" | "error";

export type GateState = {
  balance: number;
  status: GateStatus;
  address: string | null;
  connected: boolean;
};

export const defaultGateState: GateState = {
  balance: 0,
  status: "idle",
  address: null,
  connected: false,
};

export const TokenGateContext = createContext<GateState>(defaultGateState);

export function useTokenGate(): GateState {
  return useContext(TokenGateContext);
}
