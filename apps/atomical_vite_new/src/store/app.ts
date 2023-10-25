import { IWalletBalance } from "@/interfaces/api";
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
interface AccountState {
  account: any;
  setAccount: (payload: any) => void;
}

export const useAccountStore = create<AccountState>()((set) => ({
  account: null,
  setAccount: (payload) => set(() => ({ account: payload })),
}));

interface AtomicalState {
  atomicals: IWalletBalance;
  loading: boolean;
  setLoading: (payload: boolean) => void;
  setAtomical: (payload: IWalletBalance) => void;
}

export const useAtomicalStore = create<AtomicalState>()((set) => ({
  atomicals: {
    atomicalMerged: [],
    atomicalNFTs: [],
    scripthash: "",
    output: "",
    address: "",
    atomicalsUTXOs: [],
    atomicalsValue: undefined,
    regularsUTXOs: [],
    atomicalFTs: [],
    ordinalsValue: 0,
    confirmedUTXOs: [],
    unconfirmedUTXOs: [],
    ordinalsUTXOs: [],
    atomicalsWithOrdinalsValue: 0,
    confirmedValue: 0,
    regularsValue: 0,
    unconfirmedValue: 0,
    atomicalsWithOrdinalsUTXOs: [],
  },
  loading: false,
  setLoading: (payload: boolean) =>
    set((state) => ({ ...state, loading: payload })),
  setAtomical: (payload) =>
    set((state) => ({
      ...state,
      atomicals: payload,
    })),
}));

interface FeeState {
  fee: {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
  };
  setFee: (payload: any) => void;
}

export const useFeeStore = create<FeeState>()((set) => ({
  fee: {
    fastestFee: 0,
    halfHourFee: 0,
    hourFee: 0,
    economyFee: 0,
    minimumFee: 0,
  },
  setFee: (payload) => set(() => ({ fee: payload })),
}));
