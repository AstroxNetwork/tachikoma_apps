import { mempoolService } from "@/services/atomical";
import { ICON_OK_ACTIVE } from "@/utils/resource";
import { useEffect, useState } from "react";

enum FeeRateType {
  SLOW,
  AVG,
  FAST,
  CUSTOM,
}

type FeeRateOption = {
  title: string;
  desc?: string;
  feeRate: number;
};

const options = [
  {
    title: "Slow",
    desc: "About 1 hour",
    key: "hourFee",
    feeRate: 0,
  },
  {
    title: "Avg",
    desc: "About 30 minutes",
    key: "halfHourFee",
    feeRate: 0,
  },
  {
    title: "Fast",
    desc: "About 10 minutes",
    key: "fastestFee",
    feeRate: 0,
  },
  {
    title: "Custom",
    key: "",
    feeRate: 0,
  },
];

type FeeRateProps = {
  onChange: (feeRate: number) => void;
};

const FeeRate: React.FC<FeeRateProps> = (props) => {
  const { onChange } = props;
  const [feeOptions, setFeeOptions] = useState<FeeRateOption[]>([]);

  useEffect(() => {
    const fetchFeeOptions = async () => {
      const feeOptions = await mempoolService.getFee();
      console.log("feeOptions", feeOptions);
      setFeeOptions(
        options.map((o) => {
          return {
            ...o,
            feeRate: feeOptions[o.key],
          };
        })
      );
    };
    fetchFeeOptions();
  }, []);

  const [feeOptionIndex, setFeeOptionIndex] = useState(FeeRateType.AVG);
  const [feeRateInputVal, setFeeRateInputVal] = useState("");

  useEffect(() => {
    const defaultOption = feeOptions[1];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;

    let val = defaultVal;
    if (feeOptionIndex === FeeRateType.CUSTOM) {
      val = parseInt(feeRateInputVal) || 0;
    } else if (feeOptions.length > 0) {
      val = feeOptions[feeOptionIndex].feeRate;
    }
    onChange(val);
  }, [feeOptions, feeOptionIndex, feeRateInputVal]);
  console.log("feeOptions", feeOptions, feeOptionIndex, feeRateInputVal);

  const adjustFeeRateInput = (inputVal: string) => {
    let val = parseInt(inputVal);
    if (!val) {
      setFeeRateInputVal("");
      return;
    }
    const defaultOption = feeOptions[1];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;
    if (val <= 0) {
      val = defaultVal;
    }
    setFeeRateInputVal(val.toString());
  };
  return (
    <>
      <h1 className="mb-1 text-base">Real-time Fee Rate</h1>
      <div className="flex justify-around gap-2">
        {feeOptions.map((option, index) => {
          return (
            <div
              key={index}
              className={`flex relative flex-col p-1 items-center justify-center rounded-lg basis-[48%] mb-4 bg-card-bg `}
              onClick={() => {
                setFeeOptionIndex(index);
              }}
            >
              <h1 className="text-center font-bold text-strong-color text-base w-full">
                {option.title}
              </h1>
              {option.title !== "Custom" && (
                <p className="text-xs">{option.feeRate} sats/vB</p>
              )}
              <p className="text-[10px] text-center">{option.desc}</p>
              {feeOptionIndex === index && (
                <div className="absolute top-1 right-1 flex justify-end">
                  <img src={ICON_OK_ACTIVE} className="h-3" alt="" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FeeRate;
