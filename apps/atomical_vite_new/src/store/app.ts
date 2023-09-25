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
