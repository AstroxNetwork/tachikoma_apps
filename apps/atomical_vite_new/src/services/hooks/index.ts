import { ElectrumApi } from "@/clients/eletrum";
import { AtomicalService } from "../atomical";
import { useEffect, useRef, useState } from "react";
import { IAtomicalBalances, ISelectedUtxo } from "@/interfaces/api";
import { UTXO } from "@/interfaces/utxo";

const ELECTRUMX_WSS = "wss://electrumx.atomicals.xyz:50012";
const api = ElectrumApi.createClient(ELECTRUMX_WSS);
const atomicalService = new AtomicalService(api);
export function useAtomicalService() {
  const [service, setService] = useState<AtomicalService | undefined>();
  // const connectRef = useRef<boolean>();
  useEffect(() => {
    (async () => {
      if (!atomicalService.isOpen) {
        await atomicalService.electrumApi.resetConnection();
      }
      setService(atomicalService);
    })();
  }, []);
  return atomicalService.isOpen && service;
}

export function useAtomicalWalletInfo(address: string) {
  const service = useAtomicalService();
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [fundingBalance, setFundingBalance] = useState<number | undefined>(
    undefined
  );
  const [nonAtomUtxos, setNonAtomUtxos] = useState<UTXO[]>([]);
  const [balanceMap, setBalanceMap] = useState<IAtomicalBalances | undefined>(
    undefined
  );
  const [allUtxos, setAllUxtos] = useState<UTXO[]>([]);
  const [atomUtxos, setAtomUtxos] = useState<ISelectedUtxo[]>([]);

  useEffect(() => {
    console.log("1", service);
    if (address && service) {
      console.log("2", service);
      init();
    }
  }, [address, service]);

  const init = async () => {
    try {
      const walletInfo = await service.walletInfo(address, false);
      const { data } = walletInfo;
      const { atomicals_confirmed, atomicals_balances, atomicals_utxos } = data;
      setBalance(atomicals_confirmed);
      setBalanceMap(atomicals_balances as IAtomicalBalances);
      const allUtxos = await service.electrumApi.getUnspentAddress(address);
      if (atomicals_utxos.length > 0) {
        setAtomUtxos(atomicals_utxos);
      }
      if (allUtxos.utxos.length > 0) {
        setAllUxtos(allUtxos.utxos);
      }
      const nonAtomUtxos: UTXO[] = [];
      let nonAtomUtxosValue = 0;
      for (let i = 0; i < allUtxos.utxos.length; i++) {
        const utxo = allUtxos.utxos[i];
        if (atomicals_utxos.findIndex((item) => item.txid === utxo.txid) < 0) {
          nonAtomUtxos.push(utxo);
          nonAtomUtxosValue += utxo.value;
        }
      }
      setNonAtomUtxos(nonAtomUtxos.sort((a, b) => b.value - a.value));
      setFundingBalance(nonAtomUtxosValue);
    } catch (err) {
      console.log(err);
    }
  };

  return {
    balance,
    atomUtxos,
    fundingBalance,
    nonAtomUtxos,
    balanceMap,
    allUtxos,
  };
}
