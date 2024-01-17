import { Psbt } from 'bitcoinjs-lib';
import { useCallback, useMemo } from 'react';
import { useTools } from '@/ui/components/ActionComponent';
import { calcFee, satoshisToBTC, sleep, useWallet } from '@/ui/utils';

import { AppState } from '..';
import { useAccountAddress, useAtomicals, useCurrentAccount } from '../accounts/hooks';
import { accountActions } from '../accounts/reducer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { transactionsActions } from './reducer';
import { detectAddressTypeToScripthash } from '@/background/service/utils';
import { UTXO } from '@/background/service/interfaces/utxo';
import { DUST_AMOUNT } from '@/shared/constant';
import { getAddressType, utxoToInput } from '@/ui/utils/local_wallet';
import { useNetworkType } from '../settings/hooks';
import { toPsbtNetwork } from '@/background/utils/tx-utils';

export interface BuildTxOptions {
  inputs: UTXO[];
  balances: UTXO[];
  outputs: { address: string; value: number }[];
  feeRate: number;
  address: string;
  amount: number;
  network: NetworkType;
  autoFinalized?: boolean;
}

export type TxOk = {
  inputs: UTXO[];
  outputs: { address: string; value: number }[];
  fee: number;
  feeRate: number;
  address: string;
  addressType: AddressType;
  network: NetworkType;
};

export type TxResult = {
  ok?: TxOk;
  error?: string;
};

export function buildTx({
  inputs,
  outputs,
  balances,
  feeRate,
  network,
  amount,
  address,
  autoFinalized
}: BuildTxOptions): TxResult {
  const newInputs = [...inputs];
  const addressType = getAddressType(address)!;
  let value = 0;
  const checkRemainder = (remainder: number) => {
    if (remainder >= 0) {
      const newOutputs = [...outputs];
      if (remainder >= DUST_AMOUNT) {
        newOutputs.push({
          address: address,
          value: remainder,
        });
      }
      const retFee = calcFee({
        inputs: newInputs,
        outputs: newOutputs,
        feeRate,
        addressType,
        network,
        autoFinalized,
      });
      const v = remainder - retFee;
      if (v >= 0) {
        if (v >= DUST_AMOUNT) {
          return {
            ok: {
              fee: retFee,
              inputs: newInputs,
              feeRate,
              network,
              address,
              addressType,
              outputs: [...outputs, {
                address: address,
                value: v,
              }],
            },
          };
        } else {
          return {
            ok: {
              feeRate,
              network,
              address,
              addressType,
              fee: retFee + v,
              inputs: newInputs,
              outputs: outputs,
            },
          };
        }
      }
    }
  };
  let v = checkRemainder(value - amount);
  if (v) {
    return v;
  }
  for (const utxo of balances) {
    value += utxo.value;
    newInputs.push(utxo);
    v = checkRemainder(value - amount);
    if (v) {
      return v;
    }
  }
  return {
    error: 'Insufficient balance',
  };
}

export function toPsbt({ tx, pubkey }: { tx: TxOk; pubkey: string }) {
  const psbt = new Psbt({ network: toPsbtNetwork(tx.network) });
  const { output } = detectAddressTypeToScripthash(tx.address, tx.network);
  for (const utxo of tx.inputs) {
    const utxoInput = utxoToInput({
      utxo,
      pubkey,
      addressType: tx.addressType,
      script: output
    });
    if (utxoInput) {
      psbt.addInput(utxoInput.data);
    }
  }
  psbt.addOutputs(tx.outputs);
  return psbt;
}

export function useTransactionsState(): AppState['transactions'] {
  return useAppSelector((state) => state.transactions);
}

export function useBitcoinTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.bitcoinTx;
}

export function useCreateBitcoinTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const account = useCurrentAccount();
  // const utxos = useUtxos();
  // const fetchUtxos = useFetchUtxosCallback();
  const atomicals = useAtomicals();
  const networkType = useNetworkType();

  return useCallback(
    async (toAddressInfo: ToAddressInfo, toAmount: number, feeRate?: number, receiverToPayFee = false) => {
      let regularsUTXOs = atomicals.regularsUTXOs;
      const safeBalance = atomicals.regularsValue;
      if (safeBalance < toAmount) {
        throw new Error('Insufficient balance ');
      }
      const autoAdjust = receiverToPayFee || toAmount === safeBalance;
      if (autoAdjust) {
        toAmount = safeBalance;
      }

      try {
        detectAddressTypeToScripthash(toAddressInfo.address, networkType);
      } catch (e) {
        return {
          psbtHex: '',
          rawtx: '',
          toAddressInfo,
          err: 'Please ensure all addresses have been entered correctly.'
        };
      }

      if (!feeRate) {
        const summary = await wallet.getFeeSummary();
        feeRate = summary.list[1].feeRate;
      }

      const txResult = buildTx({
        inputs: [],
        outputs: [
          {
            address: toAddressInfo.address,
            value: toAmount
          }
        ],
        feeRate: feeRate,
        address: fromAddress,
        network: networkType,
        balances: regularsUTXOs,
        amount: toAmount
      });
      if (txResult.error) {
        return {
          psbtHex: '',
          rawtx: '',
          toAddressInfo,
          err: txResult.error
        };
      }
      const psbt = toPsbt({
        tx: txResult.ok as TxOk,
        pubkey: account.pubkey
      });
     
      const psbtHex = psbt.toHex();
      const s = await wallet.signPsbtReturnHex(psbtHex, { autoFinalized: true });
      const signPsbt = Psbt.fromHex(s);
      const tx = signPsbt.extractTransaction();
      const rawtx = tx.toHex();

      dispatch(
        transactionsActions.updateBitcoinTx({
          rawtx,
          psbtHex,
          fromAddress,
          feeRate: (txResult.ok as TxOk).feeRate,
          // fee,
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        // fee,
        fee: (txResult.ok as TxOk).feeRate
      };
      return rawTxInfo;
    },
    [atomicals.regularsUTXOs, atomicals.regularsValue, fromAddress, networkType, account.pubkey, wallet, dispatch]
  );
}

export function useCreateARC20TxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const account = useCurrentAccount();
  const fromAddress = useAccountAddress();
  const atomicals = useAtomicals();
  const networkType = useNetworkType();
  return useCallback(
    async (
      transferOptions: TransferFtConfigInterface,
      toAddressInfo: ToAddressInfo,
      // nonAtomUtxos: UTXO[],
      satsbyte: number
    ): Promise<RawTxInfo | undefined> => {
      if (transferOptions.type !== 'FT') {
        throw 'Atomical is not an FT. It is expected to be an FT type';
      }
      const txResult = buildTx({
        inputs: transferOptions.selectedUtxos,
        outputs: transferOptions.outputs,
        feeRate: satsbyte,
        address: fromAddress,
        network: networkType,
        balances: atomicals.regularsUTXOs,
        amount: 0
      });
      if (txResult.error) {
        return {
          psbtHex: '',
          rawtx: '',
          toAddressInfo,
          err: txResult.error
        };
      }
      const psbt = toPsbt({
        tx: txResult.ok as TxOk,
        pubkey: account.pubkey
      });
      const psbtHex = psbt.toHex();

      const s = await wallet.signPsbtReturnHex(psbtHex, { autoFinalized: true });

      const signPsbt = Psbt.fromHex(s);
      const tx = signPsbt.extractTransaction();
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx: tx.toHex(),
        toAddressInfo,
        fee: (txResult.ok as TxOk).fee
      };
      return rawTxInfo;
    },
    [wallet, account, fromAddress, atomicals, networkType]
  );
}

export function useCreateARCNFTTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const account = useCurrentAccount();
  const fromAddress = useAccountAddress();
  const atomicals = useAtomicals();
  const networkType = useNetworkType();
  return useCallback(
    async (
      transferOptions: {
        selectedUtxos: UTXO[];
        outputs: { address: string; value: number }[];
      },
      toAddressInfo: ToAddressInfo,
      satsbyte: number
    ): Promise<RawTxInfo | undefined> => {
      const result = buildTx({
        inputs: transferOptions.selectedUtxos,
        outputs: transferOptions.outputs,
        balances: atomicals.regularsUTXOs,
        feeRate: satsbyte,
        address: fromAddress,
        network: networkType,
        amount: 0
      });
      if (result.error) {
        return {
          err: result.error,
          psbtHex: '',
          rawtx: ''
        };
      }
      const psbt = toPsbt({
        tx: result.ok as TxOk,
        pubkey: account.pubkey
      });
      const psbtHex = psbt.toHex();

      const s = await wallet.signPsbtReturnHex(psbtHex, { autoFinalized: true });

      const signPsbt = Psbt.fromHex(s);
      const tx = signPsbt.extractTransaction();
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx: tx.toHex(),
        toAddressInfo,
        fee: (result.ok as TxOk).fee
      };
      return rawTxInfo;
    },
    [dispatch, wallet, account, fromAddress, atomicals, networkType]
  );
}

export function usePushBitcoinTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const tools = useTools();
  return useCallback(
    async (rawtx: string) => {
      const ret = {
        success: false,
        txid: '',
        error: ''
      };
      try {
        tools.showLoading(true);
        const txid = await wallet.pushTx(rawtx);
        await sleep(3); // Wait for transaction synchronization
        tools.showLoading(false);
        dispatch(transactionsActions.updateBitcoinTx({ txid }));
        dispatch(accountActions.expireBalance());
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 5000);
        // dispatch(accountActions.f());
        ret.success = true;
        ret.txid = txid;
      } catch (e) {
        ret.error = (e as Error).message;
        tools.showLoading(false);
      }

      return ret;
    },
    [dispatch, wallet]
  );
}

export function useOrdinalsTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.ordinalsTx;
}

export function useCreateOrdinalsTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  return useCallback(
    async (toAddressInfo: ToAddressInfo, inscriptionId: string, feeRate: number, outputValue: number) => {
      const psbtHex = await wallet.sendInscription({
        to: toAddressInfo.address,
        inscriptionId,
        feeRate,
        outputValue
      });
      const psbt = Psbt.fromHex(psbtHex);
      const rawtx = psbt.extractTransaction().toHex();
      dispatch(
        transactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fromAddress,
          // inscription,
          feeRate,
          outputValue
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo
      };
      return rawTxInfo;
    },
    [dispatch, wallet, fromAddress, utxos]
  );
}

export function useCreateMultiOrdinalsTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  return useCallback(
    async (toAddressInfo: ToAddressInfo, inscriptionIds: string[], feeRate?: number) => {
      if (!feeRate) {
        const summary = await wallet.getFeeSummary();
        feeRate = summary.list[1].feeRate;
      }
      const psbtHex = await wallet.sendInscriptions({
        to: toAddressInfo.address,
        inscriptionIds,
        feeRate
      });
      const psbt = Psbt.fromHex(psbtHex);
      const rawtx = psbt.extractTransaction().toHex();
      dispatch(
        transactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fromAddress,
          feeRate
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo
      };
      return rawTxInfo;
    },
    [dispatch, wallet, fromAddress, utxos]
  );
}

export function useCreateSplitTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  return useCallback(
    async (inscriptionId: string, feeRate: number, outputValue: number) => {
      const { psbtHex, splitedCount } = await wallet.splitInscription({
        inscriptionId,
        feeRate,
        outputValue
      });
      const psbt = Psbt.fromHex(psbtHex);
      const rawtx = psbt.extractTransaction().toHex();
      dispatch(
        transactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fromAddress,
          // inscription,
          feeRate,
          outputValue
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo: {
          address: fromAddress
        }
      };
      return { rawTxInfo, splitedCount };
    },
    [dispatch, wallet, fromAddress]
  );
}

export function usePushOrdinalsTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const tools = useTools();
  return useCallback(
    async (rawtx: string) => {
      const ret = {
        success: false,
        txid: '',
        error: ''
      };
      try {
        tools.showLoading(true);
        const txid = await wallet.pushTx(rawtx);
        await sleep(3); // Wait for transaction synchronization
        tools.showLoading(false);
        dispatch(transactionsActions.updateOrdinalsTx({ txid }));

        dispatch(accountActions.expireBalance());
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 5000);

        ret.success = true;
        ret.txid = txid;
      } catch (e) {
        console.log(e);
        ret.error = (e as Error).message;
        tools.showLoading(false);
      }

      return ret;
    },
    [dispatch, tools, wallet]
  );
}

export function useUtxos() {
  const transactionsState = useTransactionsState();
  return transactionsState.utxos;
}

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const account = useCurrentAccount();
  return useCallback(async () => {
    const data = await wallet.getAddressUtxo(account.address);
    dispatch(transactionsActions.setUtxos(data));
    return data;
  }, [wallet, account.address, dispatch]);
}

export function useSafeBalance() {
  const utxos = useUtxos();
  return useMemo(() => {
    const satoshis = utxos.filter((v) => v.inscriptions.length === 0).reduce((pre, cur) => pre + cur.satoshis, 0);
    return satoshisToBTC(satoshis);
  }, [utxos]);
}
