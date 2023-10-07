import { ElectrumApi } from "@/clients/eletrum";
import { AtomicalService } from "../atomical";
import { useEffect, useState } from "react";
import { IAtomicalBalances, ISelectedUtxo } from "@/interfaces/api";
import { UTXO } from "@/interfaces/utxo";
import { AstroXWizzInhouseProvider } from "webf_wizz_inhouse";
import { fromPubToP2tr, toXOnly } from "@/clients/utils";
const provider = new AstroXWizzInhouseProvider();

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
    if (address && service) {
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

export function useAddress() {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [originAddress, setOriginAddress] = useState<string | undefined>(
    undefined
  );
  const [xonlyPubHex, setXonlyPubHex] = useState<string | undefined>(undefined);
  const [isAllowedAddressType, setIsAllowedAddressType] = useState<
    boolean | undefined
  >(undefined);
  useEffect(() => {
    (async () => {
      const accs = await provider.requestAccounts();
      const p2trPub = await provider.getPublicKey(accs[0]);
      setOriginAddress(accs[0]);
      const xpub = (toXOnly(Buffer.from(p2trPub, "hex")) as Buffer).toString(
        "hex"
      );
      setXonlyPubHex(xpub);
      // setXonlyPubHex('133c85d348d6c0796382966380719397453592e706cd3329119a2d2cb8d2ff7b');
      const p2trAddress = fromPubToP2tr(p2trPub);
      // const p2trAddress = 'bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv'; //fromPubToP2tr(p2trPub);
      setAddress(p2trAddress);
      if ((await provider.getAddressType(accs[0])) === "p2pkh") {
        setIsAllowedAddressType(true);
      } else {
        setIsAllowedAddressType(false);
      }
      // setXonlyPubHex(
      //   "133c85d348d6c0796382966380719397453592e706cd3329119a2d2cb8d2ff7b"
      // );
      // const p2trAddress =
      //   "bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv"; //fromPubToP2tr(p2trPub);
      setAddress(p2trAddress);
      setIsAllowedAddressType(true);
    })();
  }, []);
  return {
    address,
    xonlyPubHex,
    originAddress,
    isAllowedAddressType,
  };
}
