import { detectAddressTypeToScripthash } from "@/clients/utils";
import { Mask } from "@/components";
import Selector from "@/components/components/selector";
import { AmountToSend, IAtomicalsInfo, ISelectedUtxo } from "@/interfaces/api";
import {
  useAddress,
  useAtomicalService,
  useAtomicalWalletInfo,
} from "@/services/hooks";
import { LeftOutline } from "antd-mobile-icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { UTXO } from "@/interfaces/utxo";
import { AstroXWizzInhouseProvider } from "webf_wizz_inhouse";
import { ICON_ARROW } from "@/utils/resource";
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
  const [checkeds, setCheckeds] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const {
    address,
    originAddress,
    // isAllowedAddressType,
    xonlyPubHex,
  } = useAddress();
  // const address =
  //   "bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv";
  const {
    // balance,
    atomUtxos,
    // fundingBalance,
    nonAtomUtxos,
    // balanceMap,
    // allUtxos,
  } = useAtomicalWalletInfo(address);
  const service = useAtomicalService();
  const [sendAddressError, setSendAddressError] = useState<string | undefined>(
    undefined
  );
  const navigate = useNavigate();

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
    // const obj: TransferFtConfigInterface = {
    //   atomicalsInfo: {
    //     confirmed: relatedConfirmed,
    //     type: relatedType,
    //     utxos: relatedUtxos,
    //   },
    //   selectedUtxos,
    //   outputs: amountToSendNext,
    // };
    // const { txHex, unsendId } = await buildAndSignTx(
    //   obj,
    //   address,
    //   xonlyPubHex,
    //   20,
    //   false
    // );
    // if (txHex) {
    //   try {
    //     const txId = await service.electrumApi.broadcast(txHex);
    //     if (typeof txId !== "string") {
    //       throw new Error("txId is not string");
    //     }
    //     if (txId !== unsendId) {
    //       console.log("txId is not same");
    //     }
    //     console.log({ txId });
    //   } catch (error) {
    //     //
    //   }
    //   // signed success, continue sending
    // } else {
    //   console.log("dispatch signing error");
    // }
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
    // add nonAtomUtxos least to expected deposit value

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
      console.log(printedPsbt);

      try {
        const s = await provider.signPsbt(originAddress, printedPsbt, {
          addressType: "p2pkhtr",
        });
        console.log({ s });
        const signedPsbt = bitcoin.Psbt.fromHex(s);
        // signedPsbt.finalizeAllInputs();
        const tx = signedPsbt.extractTransaction();
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

  return (
    <>
      <div
        className="app-container"
        style={{
          minHeight: "calc(100vh - 90px)",
        }}
      >
        <div className="app-header">
          <div className="pt-4">
            <LeftOutline className="text-2xl" onClick={() => navigate(-1)} />
          </div>
          <div className="text-center">
            <h1 className="pt-20 text-3xl font-bold">2000</h1>
            <p>ATOM</p>
          </div>
        </div>
        <div className="app-body">
          <div className="mt-10">
            <p className="text-base">Address</p>
            <input className="w-full h-9 border border-zinc-500 focus:border-black outline-none px-4" />
            {/* <Form>
              <Form.Item>
                <Input />
              </Form.Item>
            </Form> */}
            <h2 className="text-base mt-3 mb-3">Select token</h2>
            <p>Note: #207, #5439 will be merged into ATOM.</p>
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
            <div
              className="pb-5 overflow-scroll"
              style={{
                maxHeight: "calc(100vh - 560px)",
              }}
            >
              <Selector
                ellipsis
                options={atomUtxos.map((o) => ({
                  label: o.value.toString(),
                  value: o.txid,
                }))}
                value={checkeds}
                onChange={(value, valueItem) => {
                  console.log("valueItem", valueItem);
                  setCheckeds(value);
                }}
              />
            </div>
          </div>
        </div>
        <div className="app-bottom">
          <button
            className="w-full bg-primary text-white py-2 px-4 text-center rounded-full"
            onClick={() => setVisible(true)}
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
            <p>
              bc1pabcd8vvj2s95pdzeax4x9tkuawr5um49n9er6gd2wf6wthwrh6yshm1234
            </p>
          </div>
          <div className="flex justify-center py-1">
            <img src={ICON_ARROW} className="w-8 h-8" alt="" />
          </div>
          <div className="bg-body-bg rounded-md p-2 break-all">
            To
            <p>
              bc1pabcd8vvj2s95pdzeax4x9tkuawr5um49n9er6gd2wf6wthwrh6yshm1234
            </p>
          </div>
          <div className="flex justify-between text-lg mt-8 mb-2">
            <p>Amount</p>
            <p className="text-strong-color text-right">2000 ATOM</p>
          </div>
          <p className="text-strong-color">
            Note: #207, #5439 will be merged into 2,000 ATOM.
          </p>
          <button
            className="w-full mt-20  bg-primary text-white py-2 px-4 text-center rounded-full"
            onClick={handleSubmit}
          >
            Confirm to send
          </button>
        </div>
      </Mask>
    </>
  );
};

export default Transaction;
