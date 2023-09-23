export interface InscriptionItem {
  inscriptionId: string;
  inscriptionNumber: number;
  address: string;
  outputValue: number;
  preview: string;
  content: string;
  contentLength: number;
  contentType: string;
  timestamp: number;
  genesisTransaction: string;
  location: string;
  output: string;
  offset: 0;
}

export interface SendBitcoinOption {
  feeRate?: number;
}

export interface SendInscriptionOption {
  feeRate?: number;
}

export interface SignOptions {
  autoFinalized?: boolean;
  addressType?: 'p2tr' | 'p2wpkh' | 'p2sh' | 'p2pkh' | 'p2pkhtr';
}

export interface InscriptionsResponse {
  total: number;
  list: InscriptionItem[];
}

export interface PushTxRequest {
  rawtx: string;
}

export type SignMessageType = 'ecdsa' | 'bip322-simple';

export interface BalanceObject {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface FeeResponse {
  success: boolean;
  fee?: number;
  error?: FeeError;
}

export interface InscribeFeeResponse {
  networkFee: number;
  serviceFee: number;
  preservationFee: number;
  totalFee: number;
}

export type FeeError =
  | 'invalidAddress'
  | 'invalidAmount'
  | 'invalidInscriptions'
  | 'amountTooSmall'
  | 'invalidCustomFeeRate'
  | 'insufficientBalance'
  | 'insufficientFee'
  | 'unknownError';

export interface FeeRateResponse {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface InscribeRequest {
  userAddress: string;
  loginAddress: string;
  inscribeType: 'file' | 'text' | 'sats' | 'repeat_text' | null;
  count?: number;
  feeRate: number;
  inscribeContent: string;
}

export interface InscribeResponse {
  orderNo: string;
  address: string;
  lightningAddress?: string;
  amount: number;
}
