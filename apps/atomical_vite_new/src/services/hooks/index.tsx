import {
  useEffect,
  useState,
  useContext,
  createContext,
  FunctionComponent,
  ReactNode,
  useCallback,
} from "react";
import {
  IAtomicalItem,
  IMergedAtomicals,
  IWalletBalance,
} from "@/interfaces/api";
import { UTXO } from "@/interfaces/utxo";
import { AstroXWizzInhouseProvider } from "webf_wizz_inhouse";
import {
  detectAddressTypeToScripthash,
  fromPubToP2tr,
  toXOnly,
} from "@/clients/utils";
import { useAtomicalStore } from "@/store/app";
import { getAtomApi, mempoolService } from "../atomical";
import { Psbt } from "bitcoinjs-lib";
import * as bitcoin from "bitcoinjs-lib";
import {
  RawTxInfo,
  ToAddressInfo,
  TransferFtConfigInterface,
} from "@/utils/types";
import { isHexString } from "@/utils";
import { calculateFTFundsRequired } from "@/page/transaction/FTTx";

const provider = new AstroXWizzInhouseProvider();

export function useCreateARC20TxCallback() {
  const { address, xonlyPubHex, addressType } = useWizzProvider();
  return useCallback(
    async (
      transferOptions: TransferFtConfigInterface,
      toAddressInfo: ToAddressInfo,
      nonAtomUtxos: UTXO[],
      satsbyte: number
    ): Promise<RawTxInfo | undefined> => {
      if (transferOptions.type !== "FT") {
        throw "Atomical is not an FT. It is expected to be an FT type";
      }

      const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
      let tokenBalanceIn = 0;
      let tokenBalanceOut = 0;
      let tokenInputsLength = 0;
      let tokenOutputsLength = 0;
      let expectedFundinng = 0;
      for (const utxo of transferOptions.selectedUtxos) {
        // Add the atomical input, the value from the input counts towards the total satoshi amount required
        const { output } = detectAddressTypeToScripthash(address);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.index,
          witnessUtxo: {
            value: utxo.value,
            script: Buffer.from(output as string, "hex"),
          },
          tapInternalKey: Buffer.from(xonlyPubHex, "hex"),
        });
        tokenBalanceIn += utxo.value;
        tokenInputsLength++;
      }

      for (const output of transferOptions.outputs) {
        psbt.addOutput({
          value: output.value,
          address: output.address,
        });
        tokenBalanceOut += output.value;
        tokenOutputsLength++;
      }
      // TODO DETECT THAT THERE NEEDS TO BE CHANGE ADDED AND THEN
      if (tokenBalanceIn !== tokenBalanceOut) {
        console.log(
          "Invalid input and output does not match for token. Developer Error."
        );
        return {
          psbtHex: "",
          rawtx: "",
          toAddressInfo,
          err: "Invalid input and output does not match for token.",
        };
      }

      const { expectedSatoshisDeposit } = calculateFTFundsRequired(
        transferOptions.selectedUtxos.length,
        transferOptions.outputs.length,
        satsbyte,
        0
      );
      if (expectedSatoshisDeposit <= 546) {
        console.log("Invalid expectedSatoshisDeposit. Developer Error.");
        return {
          psbtHex: "",
          rawtx: "",
          toAddressInfo,
          err: "Invalid expectedSatoshisDeposit.",
        };
      }

      if (transferOptions.selectedUtxos.length === 0) {
        expectedFundinng = 0;
      } else {
        expectedFundinng = expectedSatoshisDeposit;
      }
      // add nonAtomUtxos least to expected deposit value
      let addedValue = 0;
      const addedInputs: UTXO[] = [];

      for (let i = 0; i < nonAtomUtxos.length; i++) {
        const utxo = nonAtomUtxos[i];

        if (addedValue >= expectedSatoshisDeposit) {
          break;
        } else {
          addedValue += utxo.value;
          addedInputs.push(utxo);
          const { output } = detectAddressTypeToScripthash(address);
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.index,
            witnessUtxo: {
              value: utxo.value,
              script: Buffer.from(output as string, "hex"),
            },
            tapInternalKey: Buffer.from(xonlyPubHex, "hex"),
          });
        }
      }

      if (addedValue - expectedSatoshisDeposit >= 546) {
        psbt.addOutput({
          value: addedValue - expectedSatoshisDeposit,
          address: address,
        });
      }
      const psbtHex = psbt.toHex();

      const s = await provider.signPsbt(toAddressInfo.address, psbtHex, {
        addressType: addressType === "p2pkh" ? "p2pkhtr" : "p2tr",
      });
      if (typeof s !== "string" || !isHexString(s)) {
        throw "User Cancel or Unable to sign";
      }
      const signedPsbt = bitcoin.Psbt.fromHex(s);
      // signedPsbt.finalizeAllInputs();
      const tx = signedPsbt.extractTransaction();
      console.log(tx.toHex());

      const api = getAtomApi();
      try {
        const validate = await api.validate(tx.toHex());
        if (validate) {
          const rawTxInfo: RawTxInfo = {
            psbtHex,
            rawtx: tx.toHex(),
            toAddressInfo,
            fee: expectedFundinng,
          };
          return rawTxInfo;
        } else {
          return {
            psbtHex: "",
            rawtx: "",
            toAddressInfo,
            err: validate.message,
          };
        }
      } catch (err) {
        return {
          psbtHex: "",
          rawtx: "",
          err: "unknown method blockchain.atomicals.validate",
        };
      }
    },
    [address]
  );
}

export function useAtomicalsCallback() {
  const { atomicals, setAtomical, setLoading } = useAtomicalStore(
    (state) => state
  );
  console.log("atomical", atomicals);
  return useCallback(async (address) => {
    setLoading(true);
    const api = getAtomApi();
    const { scripthash, output } = detectAddressTypeToScripthash(address);
    const res = await api.atomicalsByScripthash(scripthash, true);
    let cursor = 0;
    const size = 100;
    let hasMore = true;
    const oldOrdinals: any[] = [];
    try {
      while (hasMore) {
        const v = await provider.getInscriptions(address, cursor, size);
        oldOrdinals.push(...(v?.list || []));
        cursor += size;
        hasMore = oldOrdinals.length < v.total;
      }
    } catch (error) {
      console.log("error", error);
    }

    const txs = await mempoolService.txsMempool(address);
    const unconfirmedVinSet = new Set(
      txs!.map((e) => e.vin.map((e) => e.txid + ":" + e.vout)).flat()
    );
    const all = (res.utxos as UTXO[]).sort((a, b) => b.value - a.value);
    const confirmedUTXOs: UTXO[] = [];
    let confirmedValue = 0;
    const atomicalsUTXOs: UTXO[] = [];
    let atomicalsValue = 0;
    const ordinalsUTXOs: UTXO[] = [];
    let ordinalsValue = 0;
    const regularsUTXOs: UTXO[] = [];
    let regularsValue = 0;
    const unconfirmedUTXOs: UTXO[] = [];
    let unconfirmedValue = 0;
    const atomicalsWithOrdinalsUTXOs: UTXO[] = [];
    let atomicalsWithOrdinalsValue = 0;
    const mergedUTXOs: UTXO[] = [];
    for (const utxo of all) {
      if (unconfirmedVinSet.has(utxo.txid + ":" + utxo.vout)) {
        unconfirmedValue += utxo.value;
        unconfirmedUTXOs.push(utxo);
      } else {
        confirmedValue += utxo.value;
        confirmedUTXOs.push(utxo);

        const isAtomical = utxo.atomicals && utxo.atomicals.length;
        if (isAtomical) {
          atomicalsValue += utxo.value;
          atomicalsUTXOs.push(utxo);
          if (utxo.atomicals!.length > 1) {
            mergedUTXOs.push(utxo);
          }
        }

        const find = oldOrdinals.find((item) => {
          const split = item.output.split(":");
          return split[0] === utxo.txid && parseInt(split[1], 10) === utxo.vout;
        });

        if (find) {
          ordinalsUTXOs.push(utxo);
          ordinalsValue += utxo.value;
        }

        if (find && isAtomical) {
          atomicalsWithOrdinalsUTXOs.push(utxo);
          atomicalsWithOrdinalsValue += utxo.value;
        }

        if (!isAtomical && !find) {
          regularsUTXOs.push(utxo);
          regularsValue += utxo.value;
        }
      }
    }
    const atomicalFTs: (IAtomicalItem & { utxos: UTXO[] })[] = [];
    const atomicalNFTs: IAtomicalItem[] = [];
    const atomicalMerged: IMergedAtomicals[] = [];
    for (const key in res.atomicals) {
      const atomical = res.atomicals[key] as any;
      const data = atomical.data;
      const item = {
        ...data,
        value: atomical.confirmed,
      };
      const find = mergedUTXOs.find((e) =>
        e.atomicals?.includes(atomical.atomical_id)
      );
      if (find) {
        const v = atomicalMerged.find(
          (e) => e.txid === find!.txid && e.vout === find!.vout
        );
        if (v) {
          v.atomicals.push(item);
        } else {
          atomicalMerged.push({ ...find, atomicals: [item] });
        }
      } else if (atomical.type === "FT") {
        const v = atomicalFTs.find((e) => e.$ticker === atomical.ticker);
        const utxos = atomicalsUTXOs.filter((e) =>
          e.atomicals?.includes(atomical.atomical_id)
        )!;
        if (v) {
          v.utxos.push(...utxos);
          v.value += atomical.confirmed;
        } else {
          atomicalFTs.push({ ...item, utxos: utxos });
        }
      } else if (atomical.type === "NFT") {
        atomicalNFTs.push(item);
      }
    }
    const balance: IWalletBalance = {
      address,
      output,
      scripthash,
      atomicalFTs,
      atomicalNFTs,
      atomicalMerged,
      confirmedUTXOs,
      confirmedValue,
      atomicalsUTXOs,
      atomicalsValue,
      ordinalsUTXOs,
      ordinalsValue,
      regularsUTXOs,
      regularsValue,
      unconfirmedUTXOs,
      unconfirmedValue,
      atomicalsWithOrdinalsUTXOs,
      atomicalsWithOrdinalsValue,
    };
    setAtomical(balance);
    setLoading(false);
    return balance;
  }, []);
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
  const atomicalCallback = useAtomicalsCallback();
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
          "bc1pzxmvax02krvgw0tc06v7dz34zdvz9zynehcsfxky32h9zwg4nz4sjlq3qc"; //fromPubToP2tr(p2trPub);
        setAddress(p2trAddress);
        setIsAllowedAddressType(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (address) {
      atomicalCallback(address);
    }
  }, [address]);

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
