import { create } from "zustand";

interface TransactionState {
  completed: { amount: string; address: string; txid: string } | null;
  bears: number;
  increase: (by: number) => void;
}

export const useTransactionStore = create<TransactionState>()((set) => ({
  completed: null,
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}));

interface AtomicalState {
  data: any;
}

export const useAtomicalStore = create<AtomicalState>()((set) => ({
  data: null,
  setAtomical: (payload) => set(() => ({ data: payload })),
}));
