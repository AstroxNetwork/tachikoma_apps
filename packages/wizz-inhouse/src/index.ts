import {
  BalanceObject,
  FeeRateResponse,
  FeeResponse,
  InscribeFeeResponse,
  InscribeRequest,
  InscribeResponse,
  InscriptionsResponse,
  SendBitcoinOption,
  SendInscriptionOption,
  SignMessageType,
  SignOptions,
} from './types';

interface WizzInhouseProvider {
  // Connect the current account.
  requestAccounts(): Promise<string[]>;

  // Get current account PublicKey
  getPublicKey(address: string): Promise<string>;

  // Get BTC balance
  getBalance(address: string): Promise<BalanceObject>;

  // Get BTC inscriptions
  getInscriptions(address: string, cursor?: number, size?: number): Promise<InscriptionsResponse>;

  // Send BTC
  sendBitcoin(fromAddress: string, toAddress: string, satoshis: number, options: SendBitcoinOption): Promise<string>;

  // send inscription
  sendInscription(fromAddress: string, toAddress: string, inscriptionIds: string, options: SendInscriptionOption): Promise<string>;

  // Sign message
  signMessage(address: string, message: string, type?: string | SignMessageType): Promise<string>;

  // Sign Psbt(hex)
  signPsbt(address: string, psbtHex: string, options?: SignOptions): Promise<string>;

  // Sign Psbts(hexs)
  signPsbts(address: string, psbtHexs: string[], options?: SignOptions): Promise<string[]>;

  getAppVersion(): Promise<string>;

  getSupportedMethods(): Promise<string[]>;

  getFeeRate(): Promise<FeeRateResponse>;

  getSendBTCFee(fromAddress: string, toAddress: string, satoshis: number, feeRate: number): Promise<FeeResponse>;

  getSendInscriptionFee(fromAddress: string, toAddress: string, inscriptionIds: string, feeRate: number): Promise<FeeResponse>;

  getInscribeFee(feeRate: number, byteLength: number, count?: number): Promise<InscribeFeeResponse>;

  inscribe(payload: InscribeRequest): Promise<InscribeResponse>;

  getAddressFromDomain(domain: string): Promise<string | undefined>;
}

export class AstroXWizzInhouseProvider implements WizzInhouseProvider {
  getAddressFromDomain(domain: string): Promise<string | undefined> {
    return this.f('getAddressFromDomain', domain);
  }

  getAppVersion(): Promise<string> {
    return this.f('getAppVersion');
  }

  getSupportedMethods(): Promise<string[]> {
    return this.f('getSupportedMethods');
  }

  getFeeRate(): Promise<FeeRateResponse> {
    return this.f('getFeeRate');
  }

  getSendBTCFee(fromAddress: string, toAddress: string, satoshis: number, feeRate: number): Promise<FeeResponse> {
    return this.f('getSendBTCFee', { fromAddress, toAddress, satoshis, feeRate });
  }

  getSendInscriptionFee(fromAddress: string, toAddress: string, inscriptionIds: string, feeRate: number): Promise<FeeResponse> {
    return this.f('getSendInscriptionFee', { fromAddress, toAddress, inscriptionIds, feeRate });
  }

  getInscribeFee(feeRate: number, byteLength: number, count?: number): Promise<InscribeFeeResponse> {
    return this.f('getInscribeFee', { feeRate, byteLength, count });
  }

  inscribe(payload: InscribeRequest): Promise<InscribeResponse> {
    return this.f('inscribe', payload);
  }

  readonly #moduleName = 'wizz_inhouse';

  private f<T>(method: string, ...params: unknown[]): Promise<T> {
    return (globalThis as any).callf(this.#moduleName, method, ...params);
  }

  getBalance(address: string): Promise<BalanceObject> {
    return this.f('getBalance', address);
  }

  getInscriptions(address: string, cursor?: number, size?: number): Promise<InscriptionsResponse> {
    return this.f('getInscriptions', { cursor, size, address });
  }

  getPublicKey(address: string): Promise<string> {
    return this.f('getPublicKey', address);
  }

  requestAccounts(): Promise<string[]> {
    return this.f('requestAccounts');
  }

  sendBitcoin(fromAddress: string, toAddress: string, satoshis: number, options?: SendBitcoinOption): Promise<string> {
    return this.f('sendBitcoin', { fromAddress, toAddress, satoshis, options });
  }

  sendInscription(fromAddress: string, toAddress: string, inscriptionId: string, options?: SendInscriptionOption): Promise<string> {
    return this.f('sendInscription', { fromAddress, toAddress, inscriptionId, options });
  }

  signMessage(address: string, message: string, type?: string | SignMessageType): Promise<string> {
    return this.f('signMessage', { address, message, type });
  }

  signPsbt(address: string, psbtHex: string, options?: SignOptions): Promise<string> {
    return this.f('signPsbt', { address, psbtHex, options });
  }

  signPsbts(address: string, psbtHexs: string[], options?: SignOptions): Promise<string[]> {
    return this.f('signPsbts', { address, psbtHexs, options });
  }

  sendInscriptions(fromAddress: string, toAddress: string, inscriptionIds: string[], options?: SendInscriptionOption): Promise<string> {
    return this.f('sendInscriptions', { fromAddress, toAddress, inscriptionIds, options });
  }
}
