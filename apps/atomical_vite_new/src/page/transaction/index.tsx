import { detectAddressTypeToScripthash } from "@/clients/utils";
import { Mask, Toast } from "@/components";
import Selector from "@/components/components/selector";
import { AmountToSend, IAtomicalsInfo, ISelectedUtxo } from "@/interfaces/api";
import { useWizzProvider, useAtomicalWalletInfo } from "@/services/hooks";
import { Input as AntInput } from "antd-mobile";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { UTXO } from "@/interfaces/utxo";
import { AstroXWizzInhouseProvider } from "webf_wizz_inhouse";
import { ICON_ARROW, ICON_BACK, ICON_OK_ACTIVE } from "@/utils/resource";
import Input from "@/components/components/input";
import DotLoading from "@/components/components/dotLoading";
import Switch from "@/components/components/switch";
import { mempoolService } from "@/clients/mempool";
const provider = new AstroXWizzInhouseProvider();
bitcoin.initEccLib(ecc);

export const calculateFTFundsRequired = (
  numberOfInputs: number,
  numberOfOutputs: number,
  satsByte: number,
  mintDataLength = 0,
  baseTxByteLength = 300
) => {
  // The default base includes assumes 1 input and 1 output with room to spare
  const estimatedTxSizeBytes = baseTxByteLength + mintDataLength;
  const baseInputSize = 36 + 4 + 64;
  const baseOutputSize = 8 + 20 + 4;

  let expectedSatoshisDeposit =
    (estimatedTxSizeBytes +
      numberOfInputs * baseInputSize +
      numberOfOutputs * baseOutputSize) *
    satsByte;
  if (expectedSatoshisDeposit > 0 && expectedSatoshisDeposit < 546) {
    expectedSatoshisDeposit = 546;
  }
  return {
    expectedSatoshisDeposit,
  };
};
export interface TransferFtConfigInterface {
  atomicalsInfo: IAtomicalsInfo;
  selectedUtxos: ISelectedUtxo[];
  outputs: Array<AmountToSend>;
}

const Transaction = () => {
  const query = new URLSearchParams(`?${window.location.hash.split("?")[1]}`);
  console.log(query);
  const atomical_id = query.get("atomical_id");

  const [checkeds, setCheckeds] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [isMerge, setIsMerge] = useState(false);
  const [sendAddress, setSendAddress] = useState("");
  const [fee, setFee] = useState<number>();
  const {
    address,
    originAddress,
    // isAllowedAddressType,
    xonlyPubHex,
  } = useWizzProvider();
  const [viewType, setViewType] = useState<"main" | "sended">("main");
  const [txid, setTxid] = useState<string | undefined>(undefined);
  const [sendLoading, setSendLoading] = useState(false);
  // const address =
  //   "bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv";
  const {
    atomUtxos,
    fundingBalance,
    nonAtomUtxos,
    balanceMap,
    loading: dataLoading,
    // allUtxos,
  } = useAtomicalWalletInfo(address);
  const [sendAddressError, setSendAddressError] = useState<string | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const item = balanceMap.find((o) => o.atomical_id === atomical_id);
  const relatedAtomUtxos = atomUtxos
    ? atomUtxos.filter((o) => o.atomicals[0] === atomical_id)
    : [];

  console.log("sendAddress", sendAddress);
  const { selectedAmount, selectedUtxos, amountToSend } = useMemo(() => {
    let selectedAmount = 0;
    let _amountsToSend: AmountToSend[] = [];
    const selectedUtxos: ISelectedUtxo[] = [];
    for (const utxo of atomUtxos) {
      if (checkeds.includes(`${utxo.txid}i${utxo.index}`)) {
        selectedAmount += utxo.value;
        selectedUtxos.push(utxo);
        if (!isMerge) {
          _amountsToSend.push({
            address: sendAddress,
            value: utxo.value,
          });
        }
      }
    }
    if (isMerge) {
      _amountsToSend = [];
      _amountsToSend.push({
        address: sendAddress,
        value: selectedAmount,
      });
    }

    const obj: TransferFtConfigInterface = {
      atomicalsInfo: {
        confirmed: item?.confirmed,
        type: item?.type,
        utxos: relatedAtomUtxos,
      },
      selectedUtxos,
      outputs: _amountsToSend,
    };
    buildAndSignTx(obj, address, xonlyPubHex, 20, true);
    return { selectedAmount, selectedUtxos, amountToSend: _amountsToSend };
  }, [checkeds, isMerge]);

  console.log(
    "send disabled",
    selectedAmount,
    sendAddress,
    sendAddressError,
    !selectedAmount || !sendAddress || (sendAddress && sendAddressError),
    sendAddress && sendAddressError
  );

  const validateAddress = (address: string): boolean => {
    try {
      detectAddressTypeToScripthash(address);
      setSendAddressError(undefined);
      return true;
    } catch (error) {
      setSendAddressError(`Address is not correct`);
      return false;
    }
  };

  async function handleSubmit() {
    const obj: TransferFtConfigInterface = {
      atomicalsInfo: {
        confirmed: item.confirmed,
        type: item.type,
        utxos: relatedAtomUtxos,
      },
      selectedUtxos,
      outputs: amountToSend,
    };
    if (sendLoading) return;
    const { txHex, unsendId } = await buildAndSignTx(
      obj,
      address,
      xonlyPubHex,
      20,
      false
    );
    console.log("send", txHex);
    if (txHex) {
      try {
        setSendLoading(true);
        const txId = await mempoolService.broadCast(txHex);
        console.log("send end", txId);
        if (typeof txId !== "string") {
          throw new Error("txId is not string");
        }
        if (txId !== unsendId) {
          console.log("txId is not same");
        }
        console.log({ txId });
        setTxid(txId);
      } catch (error) {
        //
      } finally {
        setSendLoading(false);
      }
      setViewType("sended");
      // signed success, continue sending
    } else {
      console.log("dispatch signing error");
    }
  }

  async function buildAndSignTx(
    transferOptions: TransferFtConfigInterface,
    address: string,
    xonlyPubkey: string,
    satsbyte: number,
    preload: boolean
  ): Promise<
    | {
        txHex: string;
        tokenInputsLength: number;
        tokenOutputsLength: number;
        expectedFundinng: number;
        unsendId: string;
      }
    | undefined
  > {
    if (transferOptions.atomicalsInfo.type !== "FT") {
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
      if (!preload) {
        const { output } = detectAddressTypeToScripthash(address);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.index,
          witnessUtxo: {
            value: utxo.value,
            script: Buffer.from(output as string, "hex"),
          },
          tapInternalKey: Buffer.from(xonlyPubkey, "hex"),
        });
      }

      tokenBalanceIn += utxo.value;
      tokenInputsLength++;
    }

    for (const output of transferOptions.outputs) {
      if (!preload) {
        psbt.addOutput({
          value: output.value,
          address: output.address,
        });
      }
      tokenBalanceOut += output.value;
      tokenOutputsLength++;
    }
    console.log({ tokenBalanceIn });
    console.log({ tokenBalanceOut });
    // TODO DETECT THAT THERE NEEDS TO BE CHANGE ADDED AND THEN
    if (tokenBalanceIn !== tokenBalanceOut) {
      console.log(
        "Invalid input and output does not match for token. Developer Error."
      );
    }

    const { expectedSatoshisDeposit } = calculateFTFundsRequired(
      transferOptions.selectedUtxos.length,
      transferOptions.outputs.length,
      satsbyte,
      0
    );
    if (expectedSatoshisDeposit <= 546) {
      console.log("Invalid expectedSatoshisDeposit. Developer Error.");
      return undefined;
    }

    if (preload) {
      if (transferOptions.selectedUtxos.length === 0) {
        expectedFundinng = 0;
      } else {
        expectedFundinng = expectedSatoshisDeposit;
      }
    }
    setFee(expectedFundinng);
    // add nonAtomUtxos least to expected deposit value
    console.log("expectedFundinng", expectedFundinng);
    if (!preload) {
      let addedValue = 0;
      const addedInputs: UTXO[] = [];

      for (let i = 0; i <= nonAtomUtxos.length; i += 1) {
        const utxo = nonAtomUtxos[i];

        if (addedValue >= expectedSatoshisDeposit) {
          break;
        } else {
          addedValue += utxo.value;
          addedInputs.push(utxo);
          const { output } = detectAddressTypeToScripthash(address);
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.outputIndex,
            witnessUtxo: {
              value: utxo.value,
              script: Buffer.from(output as string, "hex"),
            },
            tapInternalKey: Buffer.from(xonlyPubkey, "hex"),
          });
        }
      }
      console.log(addedValue);
      console.log(addedInputs);

      if (addedValue - expectedSatoshisDeposit >= 546) {
        psbt.addOutput({
          value: addedValue - expectedSatoshisDeposit,
          address: address,
        });
      }
      const printedPsbt = psbt.toHex();
      console.log("signPsbt start", printedPsbt);
      try {
        const s = await provider.signPsbt(originAddress, printedPsbt, {
          addressType: "p2pkhtr",
        });
        console.log("signPsbt end", s);
        const signedPsbt = bitcoin.Psbt.fromHex(s);
        // signedPsbt.finalizeAllInputs();
        console.log("signedPsbt", signedPsbt);
        const tx = signedPsbt.extractTransaction();
        console.log("transationend", tx);
        console.log(tx.toHex());
        return {
          txHex: tx.toHex(),
          tokenInputsLength,
          tokenOutputsLength,
          expectedFundinng,
          unsendId: tx.getId(),
        };
      } catch (error) {
        console.log(error);
        return undefined;
      }
    }
  }

  if (viewType === "sended") {
    return (
      <>
        <div className="app-container">
          <div className="app-body">
            <div className="mt-20">
              <div className="flex flex-col justify-center items-center text-center py-8">
                <img src={ICON_OK_ACTIVE} className="w-16 mb-3" alt="" />
                <h1 className="text-3xl font-bold">Transaction Submitted!</h1>
              </div>
            </div>
            <div className="flex justify-between text-lg mt-8 mb-2">
              <p>Amount</p>
              <p className="text-strong-color text-right">
                {selectedAmount} {item?.ticker?.toLocaleUpperCase()}
              </p>
            </div>
            <div className="flex justify-between mt-8 mb-2">
              <p>Address</p>
              <p className="text-strong-color text-right">
                {sendAddress?.slice(0, 6)}...{sendAddress?.slice(-4)}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2 mb-2">
              Fee:
              <p className="text-right">{fee} sats</p>
            </div>
            <div className="flex items-center justify-between mt-2 mb-2">
              Txid:
              <a
                className="text-right"
                onTouchEnd={() => {
                  navigator.clipboard.writeText(txid);
                  Toast.show("Copied");
                }}
              >
                {txid?.slice(0, 6)}...{txid?.slice(-4)}
              </a>
            </div>
          </div>
          <div className="app-bottom">
            <button
              className="bg-primary text-black font-bold py-2 mb-5 px-4 text-center rounded-full"
              onTouchEnd={() => {
                navigate(-1);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="app-container"
        style={{
          minHeight: "calc(100vh - 80px)",
        }}
      >
        <div className="app-header">
          <div className="pt-4 flex items-center">
            <img
              className="text-2xl w-6"
              src={ICON_BACK}
              onTouchEnd={() => navigate(-1)}
            />
            <h1 className="text-xl ml-4 text-strong-color">
              Transfer {item?.ticker.toLocaleUpperCase()}
            </h1>
          </div>
          <div className="text-center">
            <p className="pt-14 ">Selected Amount</p>
            <h1 className="text-3xl font-bold">
              {selectedAmount} {item?.ticker.toLocaleUpperCase()}
            </h1>
          </div>
        </div>
        <div className="app-body">
          <div className="mt-10">
            <p className="text-base">Address</p>
            {/* <AntInput
              onChange={(value) => {
                console.log("change value", value);
                setSendAddress(value);
                validateAddress(value);
              }}
            /> */}
            <div className="flex items-center justify-between gap-2">
              <Input
                className="text-base leading-9"
                value={sendAddress}
                placeholder="Address"
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("change value", value);
                  setSendAddress(e.target.value);
                  validateAddress(e.target.value);
                }}
              />
              <a
                className="w-14"
                onTouchEnd={async () => {
                  const text = await window.navigator.clipboard.readText();
                  console.log(text);
                  if (text && text.length > 0) {
                    setSendAddress(text);
                    validateAddress(text);
                  }
                }}
              >
                Paste
              </a>
            </div>

            <p className="text-red-500 h-7">{sendAddressError}</p>
            <div className="flex items-center justify-between mt-1 mb-1">
              BTC Balance:
              <p className="text-right">{fundingBalance} sats</p>
            </div>
            <div className="flex items-center justify-between mt-1 mb-1">
              Fee:
              <p className="text-right">{fee} sats</p>
            </div>
            <div className="flex items-center justify-between mt-1 mb-1">
              Merge Value:
              <Switch
                checked={isMerge}
                onChange={(checked) => setIsMerge(checked)}
              />
            </div>
            {isMerge && (
              <p>
                Note: The multiple ARC-20 token will be merged into one token.
              </p>
            )}
            <h2 className="text-base mt-2 mb-1">Select token</h2>
            {/* <Checkbox.Group
              value={checkeds}
              onChange={(v) => {
                setCheckeds(v as string[]);
              }}
            >
              <Space direction="vertical">
                {items.map((item) => (
                  <Checkbox key={item} value={item}>
                    {item}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group> */}
            {dataLoading ? (
              <DotLoading />
            ) : (
              <div
                className="pb-5 overflow-scroll"
                style={{
                  maxHeight: "calc(100vh - 590px)",
                }}
              >
                <Selector
                  ellipsis
                  options={relatedAtomUtxos.map((o) => ({
                    label: o.value.toString(),
                    value: `${o.txid}i${o.index}`,
                  }))}
                  value={checkeds}
                  onChange={(value, valueItem) => {
                    console.log("valueItem", valueItem);
                    setCheckeds(value);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="app-bottom">
          <button
            className={`w-full ${
              !selectedAmount ||
              !sendAddress ||
              (sendAddress && sendAddressError)
                ? "bg-gray-400"
                : "bg-primary"
            } text-black font-bold py-2 mb-5 px-4 text-center rounded-full`}
            onClick={() => {
              setVisible(true);
            }}
            disabled={
              !selectedAmount ||
              !sendAddress ||
              (sendAddress && !!sendAddressError)
            }
          >
            Send
          </button>
        </div>
      </div>
      <Mask
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
        }}
      >
        <div className="p-4 bg-card-bg absolute bottom-24 w-full left-0">
          <h1 className="text-strong-color text-xl font-bold mb-2">
            Confirm transaction
          </h1>
          <div className="bg-body-bg rounded-md p-2 break-all">
            From
            <p>{address}</p>
          </div>
          <div className="flex justify-center py-1">
            <img src={ICON_ARROW} className="w-8 h-8" alt="" />
          </div>
          <div className="bg-body-bg rounded-md p-2 break-all">
            To
            <p>{sendAddress}</p>
          </div>
          <div className="flex justify-between text-lg mt-8 mb-2">
            <p>Amount</p>
            <p className="text-strong-color text-right">
              {selectedAmount} {item?.ticker?.toLocaleUpperCase()}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 mb-2">
            Fee:
            <p className="text-right">{fee} sats</p>
          </div>
          <div className="flex items-center justify-between mt-2 mb-2">
            Merge Value:
            <p className="text-right">{isMerge.toString()}</p>
          </div>
          <button
            className={`w-full mt-20  ${
              sendLoading || !sendAddress || (sendAddress && sendAddressError)
                ? "bg-gray-500"
                : "bg-primary"
            } text-black font-bold py-2 px-4 text-center rounded-full`}
            onClick={handleSubmit}
            disabled={
              sendLoading || !sendAddress || !!(sendAddress && sendAddressError)
            }
          >
            {sendLoading ? "Sending" : "Confirm to send"}
          </button>
        </div>
      </Mask>
    </>
  );
};

export default Transaction;
