import { CheckCircleFill } from "antd-mobile-icons";
import { useState } from "react";

type Item = {
  value: string;
  label: string;
};
type SelectorProps = {
  items: Item[];
  value: string[];
  disabled?: boolean;
};
const Selector: React.FC<SelectorProps> = (props) => {
  const { items, value, disabled } = props;
  const [selected, setSelected] = useState<string[]>(value);
  return (
    <div className="flex justify-between flex-wrap">
      {items.map((item) => {
        return (
          <div
            className="flex flex-col p-2 bg-card-bg rounded-lg basis-[48%] mt-4"
            onClick={() => {
              // if (disabled) return;
              if (selected.includes(item.value)) {
                setSelected(selected.filter((v) => v !== item.value));
              } else {
                setSelected([...selected, item.value]);
              }
            }}
          >
            <p>{item.value}</p>
            <h1 className="text-center font-bold text-strong-color text-xl w-full">
              {item.label}
            </h1>
            {!disabled && (
              <div className="flex justify-end w-full">
                <CheckCircleFill
                  className={`${
                    selected.includes(item.value) ? "text-primary" : ""
                  } text-xl`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Selector;
