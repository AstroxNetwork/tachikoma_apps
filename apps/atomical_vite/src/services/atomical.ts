// import { ElectrumApi } from '@/clients/eletrum';
import { detectAddressTypeToScripthash } from '../clients/utils';
import { ElectrumApiInterface, IAtomicalBalanceSummary } from '../interfaces/api';

export class AtomicalService {
  constructor(public electrumApi: ElectrumApiInterface) {}

  async ensureService() {
    try {
      if (!this.electrumApi.isOpen()) {
        await this.electrumApi.open();
      } else {
        await this.electrumApi.resetConnection();
      }
    } catch (error) {
      console.log('test error 2');
      throw error;
    }
  }

  async open() {
    try {
      return await this.electrumApi.open();
    } catch (error) {
      throw 'socket open error';
    }
  }

  async walletInfo(address: string, verbose: boolean): Promise<any> {
    try {
      await this.open();
      const { scripthash } = detectAddressTypeToScripthash(address);
      let res = await this.electrumApi.atomicalsByScripthash(scripthash, true);
      let history = undefined;
      if (verbose) {
        history = await this.electrumApi.history(scripthash);
      }
      const plainUtxos: any[] = [];
      let total_confirmed = 0;
      let total_unconfirmed = 0;
      let regular_confirmed = 0;
      let regular_unconfirmed = 0;
      let atomicals_confirmed = 0;
      let atomicals_unconfirmed = 0;
      const atomicalsUtxos: any[] = [];

      for (const utxo of res.utxos) {
        if (utxo.height <= 0) {
          total_unconfirmed += utxo.value;
        } else {
          total_confirmed += utxo.value;
        }

        if (utxo.atomicals && utxo.atomicals.length) {
          if (utxo.height <= 0) {
            atomicals_unconfirmed += utxo.value;
          } else {
            atomicals_confirmed += utxo.value;
          }
          atomicalsUtxos.push(utxo);
          continue;
        }

        if (utxo.height <= 0) {
          regular_unconfirmed += utxo.value;
        } else {
          regular_confirmed += utxo.value;
        }

        plainUtxos.push(utxo);
      }

      return {
        success: true,
        data: {
          address: address,
          scripthash: scripthash,
          atomicals_count: Object.keys(res.atomicals).length,
          atomicals_utxos: atomicalsUtxos,
          atomicals_balances: res.atomicals,
          total_confirmed,
          total_unconfirmed,
          atomicals_confirmed,
          atomicals_unconfirmed,
          regular_confirmed,
          regular_unconfirmed,
          regular_utxos: plainUtxos,
          regular_utxo_count: plainUtxos.length,
          history,
        },
      };
    } catch (error) {
      // if ((error.message as string).toLowerCase().includes('socket')) {
      //   throw 'Network Connection Error';
      // } else {
      //   throw error;
      // }
      throw 'Network Connection Error';
    }
  }

  async getBalanceSummary(atomicalId: string, address: string): Promise<IAtomicalBalanceSummary> {
    const res = await this.electrumApi.atomicalsByAddress(address);
    if (!res.atomicals[atomicalId]) {
      throw 'No Atomicals found for ' + atomicalId;
    }
    // console.log(JSON.stringify(res.atomicals[atomicalId], null, 2))
    // console.log(JSON.stringify(res.utxos, null, 2))
    const filteredUtxosByAtomical: any = [];
    for (const utxo of res.utxos) {
      if (utxo.atomicals.find((item: any) => item === atomicalId)) {
        filteredUtxosByAtomical.push({
          txid: utxo.txid,
          index: utxo.index,
          value: utxo.value,
          height: utxo.height,
          atomicals: utxo.atomicals,
        });
      }
    }
    return {
      confirmed: res.atomicals[atomicalId].confirmed,
      type: res.atomicals[atomicalId].type,
      utxos: filteredUtxosByAtomical,
    };
  }
}
