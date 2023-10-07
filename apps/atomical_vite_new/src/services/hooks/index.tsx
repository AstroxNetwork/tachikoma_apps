import { ElectrumApi } from "@/clients/eletrum";
import { AtomicalService } from "../atomical";
import { useEffect, useRef, useState } from "react";
import { IAtomicalBalances, ISelectedUtxo } from "@/interfaces/api";
import { UTXO } from "@/interfaces/utxo";
import { AstroXWizzInhouseProvider } from "webf_wizz_inhouse";
import { fromPubToP2tr, toXOnly } from "@/clients/utils";
import { MempoolUtxo, mempoolService } from "@/clients/mempool";
const provider = new AstroXWizzInhouseProvider();

const ELECTRUMX_WSS = "ws://18.139.208.6:50001";
const api = ElectrumApi.createClient(ELECTRUMX_WSS);
const atomicalService = new AtomicalService(api);

interface UseAtomicalService {
  service: AtomicalService | undefined;
  // isTimeout: boolean;
}

export function useAtomicalService(): UseAtomicalService {
  const [service, setService] = useState<AtomicalService | undefined>();
  const connectRef = useRef<boolean>();
  useEffect(() => {
    (async () => {
      // setTimeout(() => {
      //   if (!connectRef.current) {
      //     setIsTimeout(true);
      //   }
      // }, timeout);
      await atomicalService.electrumApi.resetConnection();
      connectRef.current = true;
      setService(atomicalService);
    })();
  }, []);
  return {
    service,
  };
}

export function useAtomicalWalletInfo(address: string) {
  const { service } = useAtomicalService();
  const [loading, setLoading] = useState<boolean>(false);
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
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (address && service) {
      init();
    }
  }, [address, service]);

  const init = async () => {
    try {
      setLoading(true);
      const walletInfo = await service.walletInfo(address, false);
      const { data } = walletInfo;
      const { atomicals_confirmed, atomicals_balances, atomicals_utxos } = data;
      setBalance(atomicals_confirmed);
      setBalanceMap(atomicals_balances as IAtomicalBalances);
      const _allUtxos = await service.electrumApi.getUnspentAddress(address);
      console.log("mempoolService start");
      const mempoolUtxos: MempoolUtxo[] = await mempoolService.getUtxo(address);
      console.log("mempoolService end");
      const confirmedUtxos: UTXO[] = [];
      for (let i = 0; i < _allUtxos.utxos.length; i++) {
        const found = mempoolUtxos.findIndex(
          (item) =>
            item.txid === _allUtxos.utxos[i].txid &&
            item.status.confirmed === true
        );
        if (found > -1) {
          confirmedUtxos.push(_allUtxos.utxos[i]);
        }
      }
      let ordList, total;
      try {
        const ordUtxosResoponse = await provider.getInscriptions(address);
        const { list: ordList1, total: total1 } = ordUtxosResoponse;
        ordList = ordList1;
        total = total1;
      } catch {
        ordList = [];
        total = 0;
      }
      if (atomicals_utxos.length > 0) {
        setAtomUtxos(atomicals_utxos);
      }
      if (_allUtxos.utxos.length > 0) {
        setAllUxtos(confirmedUtxos);
      }

      const nonAtomUtxos: UTXO[] = [];
      const _nonAtomUtxos: UTXO[] = [];
      let nonAtomUtxosValue = 0;

      if (total === 0 || total === undefined) {
        for (let i = 0; i < confirmedUtxos.length; i++) {
          const utxo = confirmedUtxos[i];
          if (
            atomicals_utxos.findIndex((item) => item.txid === utxo.txid) < 0
          ) {
            nonAtomUtxos.push(utxo);
            nonAtomUtxosValue += utxo.value;
          }
        }
      } else {
        for (let i = 0; i < confirmedUtxos.length; i++) {
          const utxo = confirmedUtxos[i];
          if (
            atomicals_utxos.findIndex((item) => item.txid === utxo.txid) < 0
          ) {
            _nonAtomUtxos.push(utxo);
          }
        }

        for (let j = 0; j < _nonAtomUtxos.length; j++) {
          const utxo = _nonAtomUtxos[j];
          if (
            ordList.findIndex(
              (item) => item.output.split(":")[0] === utxo.txId
            ) < 0
          ) {
            nonAtomUtxos.push(utxo);
            nonAtomUtxosValue += utxo.value;
          }
        }
      }
      setNonAtomUtxos(nonAtomUtxos.sort((a, b) => b.value - a.value));
      setFundingBalance(nonAtomUtxosValue);
    } catch (err) {
      console.log("WalletInfo err======", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    atomUtxos,
    fundingBalance,
    nonAtomUtxos,
    balanceMap,
    allUtxos,
    error,
    loading,
  };
}

interface UseWizzProvider {
  address: string | undefined;
  accounts: string[];
  addressType: string | undefined;
  xonlyPubHex: string | undefined;
  originAddress: string | undefined;
  isAllowedAddressType: boolean | undefined;
}

interface WizzProviderProps {
  children?: ReactNode;
}

export const WizzProviderContent = createContext<UseWizzProvider>({
  address: undefined,
  accounts: [],
  addressType: undefined,
  xonlyPubHex: undefined,
  originAddress: undefined,
  isAllowedAddressType: false,
});

export function useWizzProvider(): UseWizzProvider {
  return useContext(WizzProviderContent);
}

export const WizzProvider: FunctionComponent<WizzProviderProps> = ({
  children,
}) => {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [originAddress, setOriginAddress] = useState<string | undefined>(
    undefined
  );
  const [addressType, setAddressType] = useState<string | undefined>(); // ['p2pkh', 'p2tr', 'p2wpkh']
  const [accs, setAccs] = useState<string[]>([]);
  const [xonlyPubHex, setXonlyPubHex] = useState<string | undefined>(undefined);
  const [isAllowedAddressType, setIsAllowedAddressType] = useState<
    boolean | undefined
  >(undefined);
  useEffect(() => {
    (async () => {
      try {
        const accs = await provider.requestAccounts();
        setAccs(accs);
        const p2trPub = await provider.getPublicKey(accs[0]);
        setOriginAddress(accs[0]);
        const currentAddressType = await provider.getAddressType(accs[0]);
        setAddressType(currentAddressType);
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
        setAddress(p2trAddress);
        setIsAllowedAddressType(true);
      } catch (err) {
        setXonlyPubHex(
          "133c85d348d6c0796382966380719397453592e706cd3329119a2d2cb8d2ff7b"
        );
        const p2trAddress =
          "bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv"; //fromPubToP2tr(p2trPub);
        setAddress(p2trAddress);
        setIsAllowedAddressType(true);
      }
    })();
  }, []);

  const contextProvider = {
    accounts: accs,
    addressType,
    address,
    xonlyPubHex,
    originAddress,
    isAllowedAddressType,
  };
  return (
    <WizzProviderContent.Provider value={contextProvider}>
      {children}
    </WizzProviderContent.Provider>
  );
};
