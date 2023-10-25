import { detectAddressTypeToScripthash } from "@/clients/utils";
import { Checkbox } from "@/components";
import Input from "@/components/components/input";
import FeeRate from "@/components/feeRate";
import NFTCard from "@/components/nftCard";
import { IAtomicalItem } from "@/interfaces/api";
import { UTXO } from "@/interfaces/utxo";
import { useAtomicalStore } from "@/store/app";
import { returnImageType } from "@/utils";
import { ICON_BACK } from "@/utils/resource";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

enum Step {
  SelectNFTs = "1",
  SelectAddress = "2",
}

type Step2Props = {
  selectValues: string[];
  back: () => void;
};
const Step2: React.FC<Step2Props> = (props) => {
  const { selectValues, back } = props;
  const [feeRate, setFeeRate] = useState(5);
  const [atomicalsWithLocation, setAtomicalsWithLocation] = useState<
    (IAtomicalItem & {
      location: UTXO;
    })[]
  >([]);
  const [toAddress, setToAddress] = useState<string>("");
  const { atomicals } = useAtomicalStore((state) => state);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const [disabled, setDisabled] = useState(true);
  // const createARC20NFTTx = useCreateARCNFTTxCallback();

  const selectAtomcalsNFTs = useMemo(() => {
    if (!atomicals.atomicalNFTs) return [];
    return atomicals.atomicalNFTs.filter((o) =>
      selectValues.includes(o.atomical_id)
    );
  }, [atomicals]);

  // // const utxos = atomicals.atomicalsUTXOs.filter((o) => selectValues.includes(`${o.atomicals?.[0]}`));

  // const loadAtomicalsWithLocation = useCallback(async () => {
  //   if (wallet && toInfo.address && selectValues) {
  //     try {
  //       setLoading(true)
  //       const api = ElectrumApi.createClient(ELECTRUMX_HTTP_PROXY)
  //       const list = await Promise.all(
  //         selectValues.map((atomical_id) => api.atomicalsGetLocation(atomical_id))
  //       );
  //       const atomicalsWithLocation = selectAtomcalsNFTs.map((e, i) => {
  //         const location = list[i].result.location_info_obj.locations[0];
  //         return {
  //           ...e,
  //           location: location
  //         };
  //       });
  //       setAtomicalsWithLocation(atomicalsWithLocation);
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  // }, [wallet, toInfo, selectValues]);

  // useEffect(() => {
  //   setError('');
  //   setDisabled(true);

  //   if (!isValidAddress(toInfo.address)) {
  //     return;
  //   }
  //   if(wallet) {
  //     loadAtomicalsWithLocation();
  //   }

  //   setDisabled(false);
  // }, [toInfo, wallet, feeRate, loadAtomicalsWithLocation]);

  // const outputs = useMemo(() => {
  //   const outputs = atomicalsWithLocation.map((item) => ({
  //     value: item.location.value,
  //     address: toInfo.address
  //   }));
  //   return outputs;
  // }, [toInfo, atomicalsWithLocation]);

  // const includeOrdinals = atomicalsWithLocation.filter((e) => {
  //   const find = atomicals.ordinalsUTXOs.find((u) => u.txid === e.location.txid && u.index === e.location.index);
  //   return !!find;
  // });

  // const onClickNext = async () => {
  //   if(atomicalsWithLocation.length === 0) return;
  //   const obj = {
  //     selectedUtxos: atomicalsWithLocation.map(o => o.location),
  //     outputs: outputs ?? []
  //   };
  //   const rawTxInfo = await createARC20NFTTx(obj, toInfo, atomicals.regularsUTXOs, feeRate);
  //   if (rawTxInfo && rawTxInfo.err) {
  //     return setError(rawTxInfo.err);
  //   }
  //   if (rawTxInfo && rawTxInfo.fee) {
  //     if (rawTxInfo.fee > atomicals.regularsValue) {
  //       setError(`Fee ${rawTxInfo.fee} sats Insufficient BTC balance`);
  //       return;
  //     }
  //     navigate('ARC20ConfirmScreen', { rawTxInfo });
  //   }
  // };

  const validateAddress = (address: string): boolean => {
    try {
      detectAddressTypeToScripthash(address);
      setError(undefined);
      return true;
    } catch (error) {
      setError(`Address is not correct`);
      return false;
    }
  };

  return (
    <>
      <div className="app-container min-h-screen">
        <div className="app-header">
          <div className="pt-4 flex items-center">
            <img className="text-2xl w-6" src={ICON_BACK} onTouchEnd={back} />
            <h1 className="text-xl ml-4 text-strong-color">
              Transfer
              {/* {item?.$ticker} */}
            </h1>
          </div>
        </div>
        <div className="app-body">
          <div className="mt-10">
            <p className="text-base mb-1">Recipient</p>
            <div className="flex items-center justify-between gap-2">
              <Input
                className="text-base leading-9"
                value={toAddress}
                placeholder="Address"
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("change value", value);
                  setToAddress(e.target.value);
                  validateAddress(e.target.value);
                }}
              />
              <a
                className="w-14"
                onTouchEnd={async () => {
                  const text = await window.navigator.clipboard.readText();
                  console.log(text);
                  if (text && text.length > 0) {
                    setToAddress(text);
                    validateAddress(text);
                  }
                }}
              >
                Paste
              </a>
            </div>
            <div className="mt-6">
              <p>NFTs</p>
              <p className="text-xs">{`All Include: ${selectAtomcalsNFTs
                .map((o) => o.value)
                .reduce((pre, cur) => pre + cur, 0)
                .toLocaleString()} sats`}</p>
            </div>
            <div className="grid grid-cols-3 text-white text-sm">
              <div className="col-span-1">Preview</div>
              <div className="col-span-1">AtomicalNumber</div>
              <div className="col-span-1">Value</div>
            </div>
            {selectAtomcalsNFTs.map((data, index) => {
              const { type, content } = returnImageType(data);
              return (
                <div className="grid grid-cols-3 text-sm" key={index}>
                  <div className="col-span-1">
                    {type === "realm" ? (
                      <p className="text-xl">{content}</p>
                    ) : (
                      <img
                        src={content}
                        className="h-7 rounded-xl overflow-hidden"
                        // style={{ objectFit: "cover" }}
                        alt=""
                      />
                    )}
                  </div>
                  <div className="col-span-1">
                    {`# ${data.atomical_number}`}
                  </div>
                  <div className="col-span-1">
                    {data.value.toLocaleString()} sats
                  </div>
                </div>
              );
            })}
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex items-center justify-between mt-5 mb-1">
              Available (safe for fee):
              <p className="text-right">{atomicals.regularsValue} sats</p>
            </div>
            <FeeRate
              onChange={(value) => {
                setFeeRate(value);
              }}
            />
          </div>
        </div>
        <div className="app-bottom">
          <button
            className={`w-full ${
              loading ? "bg-gray-400" : "bg-primary"
            } text-black font-bold py-2 mb-5 px-4 text-center rounded-full`}
            onClick={() => {
              // setStep(Step.SelectAddress);
            }}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

const NFTTransaction = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(Step.SelectNFTs);

  const [checkedList, setCheckedList] = useState<string[]>([]);
  const { atomicals } = useAtomicalStore((state) => state);

  console.log("checkedList", checkedList);
  const onChange = (list: string[]) => {
    setCheckedList(list);
  };

  if (step === Step.SelectAddress) {
    return (
      <Step2 selectValues={checkedList} back={() => setStep(Step.SelectNFTs)} />
    );
  }
  return (
    <>
      <div className="app-container min-h-screen">
        <div className="app-header">
          <div className="pt-4 flex items-center">
            <img
              className="text-2xl w-6"
              src={ICON_BACK}
              onTouchEnd={() => navigate("/")}
            />
            <h1 className="text-xl ml-4 text-strong-color">
              Transfer
              {/* {item?.$ticker} */}
            </h1>
          </div>
          <div className="flex flex-col"></div>
        </div>
        <div className="app-body">
          <div className="flex flex-wrap gap-2 mt-4">
            <Checkbox.Group onChange={onChange} value={checkedList}>
              {atomicals.atomicalNFTs.map((o, index) => {
                console.log("NFT item");
                return (
                  <NFTCard
                    onClick={() => {
                      navigate(`/transation/nft?ticker=${o.$ticker}`);
                    }}
                    checkbox
                    selectvalues={checkedList}
                    key={index}
                    data={o}
                  />
                );
              })}
            </Checkbox.Group>
          </div>
        </div>
        <div className="app-bottom">
          <button
            className={`w-full ${
              checkedList.length === 0 ? "bg-gray-400" : "bg-primary"
            } text-black font-bold py-2 mb-5 px-4 text-center rounded-full`}
            onClick={() => {
              setStep(Step.SelectAddress);
            }}
            disabled={checkedList.length === 0}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default NFTTransaction;
