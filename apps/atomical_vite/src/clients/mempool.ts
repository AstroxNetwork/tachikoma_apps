import { MEMPOOL_URL } from '../shared/constant';

export interface MempoolUtxo {
  txid: string;
  vout: number;
  status: {
    confirmed: true;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export class MempoolService {
  constructor(public host: string = MEMPOOL_URL) {}
  public getHost() {
    return this.host;
  }

  public setHost(host: string) {
    this.host = host;
  }

  async getFee() {
    return this.httpGet('/api/v1/fees/recommended', {});
  }

  async getPrice() {
    return this.httpGet('/api/v1/historical-price', { timestamp: Date.now() });
  }

  async getUtxo(address: string) {
    return this.httpGet(`/api/address/${address}/utxo`, {});
  }

  httpGet = async (route: string, params: any) => {
    try {
      let url = this.getHost() + route;
      let c = 0;
      for (const id in params) {
        if (c == 0) {
          url += '?';
        } else {
          url += '&';
        }
        url += `${id}=${params[id]}`;
        c++;
      }
      const headers = new Headers();
      headers.append('X-Client', 'Wizz Wallet');
      const res = await (window as any).fetch(new Request(url), { method: 'GET', headers, mode: 'cors', cache: 'default' });
      const data = await res.json();
      return data;
    } catch (error) {
      throw `http get error: ${error}`;
    }
  };
}

export const mempoolService = new MempoolService(MEMPOOL_URL);
