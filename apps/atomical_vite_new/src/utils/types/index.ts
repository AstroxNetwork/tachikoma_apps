import { UTXO } from "@/interfaces/utxo";

export interface AmountToSend {
  address: string;
  value: number;
}

export interface TransferFtConfigInterface {
  selectedUtxos: UTXO[];
  type: "FT" | "NFT";
  outputs: Array<AmountToSend>;
}

export interface ToAddressInfo {
  address: string;
  domain?: string;
  // inscription?: Inscription;
}

export interface RawTxInfo {
  psbtHex: string;
  rawtx: string;
  toAddressInfo?: ToAddressInfo;
  fee?: number;
  err?: string;
}
