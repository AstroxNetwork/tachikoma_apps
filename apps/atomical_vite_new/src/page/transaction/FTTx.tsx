import { detectAddressTypeToScripthash } from "@/clients/utils";
import { Mask, Toast } from "@/components";
import { useCreateARC20TxCallback, useWizzProvider } from "@/services/hooks";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { UTXO } from "@/interfaces/utxo";
import { AstroXWizzInhouseProvider } from "webf_wizz_inhouse";
import { ICON_ARROW, ICON_BACK, ICON_OK_ACTIVE } from "@/utils/resource";
import Input from "@/components/components/input";
// import DotLoading from "@/components/components/dotLoading";
import FeeRate from "@/components/feeRate";
import { AmountInput } from "@/components/input";
import { useAtomicalStore } from "@/store/app";
import { mempoolService } from "@/services/atomical";
import { TransferFtConfigInterface } from "@/utils/types";
import { DUST_AMOUNT } from "@/constans";
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

const Transaction = () => {
  const query = new URLSearchParams(`?${window.location.hash.split("?")[1]}`);
  console.log(query);
  const ticker = query.get("ticker");

  // const [checkeds, setCheckeds] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
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

  const [sendAddressError, setSendAddressError] = useState<string | undefined>(
    undefined
  );
  const [error, setError] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<string>();
  const navigate = useNavigate();
  const { atomicals } = useAtomicalStore((state) => state);
  const createARC20Tx = useCreateARC20TxCallback();
  const relatedAtomUtxos =
    atomicals.atomicalFTs.find((o) => o.$ticker === ticker)?.utxos || [];
  const item = atomicals.atomicalFTs.find((o) => o.$ticker === ticker);

  console.log("sendAddress", sendAddress);
  const {
    error: error2,
    utxos,
    outputs,
    remaining_utxos,
    remaining,
    remaining_min,
    totalAmount,
  } = useMemo(() => {
    const currentOutputValue = Number(amount);
    if (currentOutputValue < DUST_AMOUNT) {
      return {
        utxos: [],
        outputs: [],
        remaining_utxos: [],
        remaining: 0,
        remaining_min: 0,
        totalAmount: 0,
      };
    }
    const sorted = Array.from(relatedAtomUtxos).sort(
      (a, b) => b.value - a.value
    );
    const outputs = [
      {
        value: currentOutputValue as number,
        address: sendAddress,
      },
    ];
    let _selectedValue = 0;
    const _selectedUtxos: UTXO[] = [];
    let _break_i: number | undefined = undefined;
    const select = sorted.find((o) => o.value === currentOutputValue);
    if (select) {
      _selectedValue += select.value;
      _selectedUtxos.push(select);
    } else {
      for (let i = 0; i < sorted.length; i++) {
        _selectedValue += sorted[i].value;
        _selectedUtxos.push(sorted[i]);
        if (
          _selectedValue === currentOutputValue ||
          _selectedValue >= currentOutputValue + DUST_AMOUNT
        ) {
          _break_i = i;
          break;
        }
      }
    }

    const _remaining_utxos: UTXO[] = [];
    let _remaining_balances = 0;
    if (_break_i !== undefined) {
      for (let i = _break_i + 1; i < sorted.length; i += 1) {
        _remaining_utxos.push(sorted[i]);
        _remaining_balances += sorted[i].value;
      }
    }

    let remaining_min: number | undefined;
    const diff = _selectedValue - currentOutputValue;
    if (diff === 0) {
      remaining_min = 0;
    } else if (diff >= 2 * DUST_AMOUNT) {
      remaining_min = diff - DUST_AMOUNT;
    } else if (diff >= DUST_AMOUNT && diff < 2 * DUST_AMOUNT) {
      remaining_min = diff;
    } else {
      remaining_min = undefined;
    }
    let finalTokenOutputs: {
      value: number;
      address: string;
      ticker: string;
      change: boolean;
    }[] = [];
    const changeAmount = _selectedValue - (currentOutputValue ?? 0);

    finalTokenOutputs = outputs.map((f) => {
      return {
        value: f.value,
        address: sendAddress,
        ticker: item.$ticker as string,
        change: false,
      };
    });
    if (changeAmount > 0) {
      if (_selectedValue - changeAmount !== currentOutputValue) {
        return {
          error: `Remaining Balance less than ${DUST_AMOUNT}`,
        };
      }
      if (changeAmount < DUST_AMOUNT) {
        return {
          error: `Remaining Balance less than ${DUST_AMOUNT}`,
          outputs: finalTokenOutputs,
          atomicalsId: item.atomical_id,
          totalAmount: currentOutputValue || 0,
          utxos: _selectedUtxos.length > 0 ? _selectedUtxos : [],
          remaining: _remaining_balances,
          remaining_min,
          remaining_utxos: _remaining_utxos,
        };
      }
      finalTokenOutputs.push({
        value: changeAmount,
        address: address,
        ticker: item.$ticker!,
        change: true,
      });
    } else {
      if (!error && _selectedValue < currentOutputValue) {
        return {
          error: "The FT is unconfirmed.",
        };
      }
    }
    finalTokenOutputs = [...finalTokenOutputs];
    return {
      outputs: finalTokenOutputs,
      atomicalsId: item.atomical_id,
      confirmed: item.value,
      totalAmount: currentOutputValue || 0,
      utxos: _selectedUtxos.length > 0 ? _selectedUtxos : [],
      remaining: _remaining_balances,
      remaining_min,
      remaining_utxos: _remaining_utxos,
    };
  }, [item, amount, sendAddress, fee]);

  const onClickNext = async () => {
    if (error || error2) return;
    const obj: TransferFtConfigInterface = {
      selectedUtxos: utxos ?? [],
      type: item.type,
      outputs: outputs ?? [],
    };
    const rawTxInfo = await createARC20Tx(
      obj,
      {
        address: sendAddress,
      },
      atomicals.regularsUTXOs,
      fee
    );
    if (rawTxInfo && rawTxInfo.err) {
      return setError(rawTxInfo.err);
    }
    if (rawTxInfo && rawTxInfo.fee) {
      if (rawTxInfo.fee > atomicals.regularsValue) {
        setError(`Fee ${rawTxInfo.fee} sats Insufficient BTC balance`);
        return;
      }
      setVisible(true);
      // navigate('ARC20ConfirmScreen', { rawTxInfo });
    }
  };

  console.log(
    "send disabled",
    amount,
    sendAddress,
    sendAddressError,
    !sendAddress || (sendAddress && sendAddressError),
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
    //   const obj: TransferFtConfigInterface = {
    //     selectedUtxos: selectedUtxos || [],
    //     type: "FT",
    //     outputs: amountToSend,
    //   };
    //   if (sendLoading) return;
    //   const { txHex, unsendId } = await buildAndSignTx(
    //     obj,
    //     address,
    //     xonlyPubHex,
    //     20,
    //     false
    //   );
    //   console.log("send", txHex);
    //   if (txHex) {
    //     try {
    //       setSendLoading(true);
    //       const txId = await mempoolService.broadCast(txHex);
    //       console.log("send end", txId);
    //       if (typeof txId !== "string") {
    //         throw new Error("txId is not string");
    //       }
    //       if (txId !== unsendId) {
    //         console.log("txId is not same");
    //       }
    //       console.log({ txId });
    //       setTxid(txId);
    //     } catch (error) {
    //       //
    //     } finally {
    //       setSendLoading(false);
    //     }
    //     setViewType("sended");
    //     // signed success, continue sending
    //   } else {
    //     console.log("dispatch signing error");
    //   }
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
                {amount} {item?.$ticker}
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
              Transfer {item?.$ticker}
            </h1>
          </div>
          <div className="text-center">
            <p className="pt-14 ">{item?.$ticker} Balance</p>
            <h1 className="text-3xl font-bold">
              {item.value} {item?.$ticker}
            </h1>
          </div>
        </div>
        <div className="app-body">
          <div className="mt-10">
            <p className="text-base mb-1">Recipient</p>
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
            <div className="mt-4">
              <AmountInput
                value={amount}
                onAmountInputChange={(value) => {
                  setAmount(value);
                }}
                placeholder="Amount"
              />
            </div>

            <p className="text-red-500 h-7">{sendAddressError}</p>
            <div className="flex items-center justify-between mt-1 mb-1">
              Available (safe for fee):
              <p className="text-right">{atomicals.regularsValue} sats</p>
            </div>

            <FeeRate
              onChange={(value) => {
                setFee(value);
              }}
            />
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
          </div>
        </div>
        <div className="app-bottom">
          <button
            className={`w-full ${
              !amount || !sendAddress || (sendAddress && sendAddressError)
                ? "bg-gray-400"
                : "bg-primary"
            } text-black font-bold py-2 mb-5 px-4 text-center rounded-full`}
            onClick={() => {
              onClickNext();
            }}
            disabled={
              !amount || !sendAddress || (sendAddress && !!sendAddressError)
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
              {amount} {item?.$ticker}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 mb-2">
            Fee:
            <p className="text-right">{fee} sats</p>
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
