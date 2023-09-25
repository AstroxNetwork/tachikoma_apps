import { CheckCircleFill, CheckCircleOutline } from "antd-mobile-icons";
import { useState } from "react";

type Item = {
  value: string;
  label: string;
};
type SelectorProps = {
  options: Item[];
  value: string[];
  disabled?: boolean;
  onChange: (value, valueItem) => void;
};
const Selector: React.FC<SelectorProps> = (props) => {
  const { options, value, disabled, onChange } = props;
  const [selected, setSelected] = useState<string[]>(value);
  const [selectItems, setSelectItems] = useState<Item[]>([]);
  console.log("selected", selected);
  console.log("selected", selected.includes("#1031"));
  return (
    <div className="flex justify-between flex-wrap">
      {options.map((item) => {
        return (
          <div
            key={item.value}
            className="flex flex-col p-2 bg-card-bg rounded-lg basis-[48%] mt-4"
            onClick={() => {
              console.log("onTouchEnd");
              if (disabled) return;
              let value;
              let valueItem;
              if (selected.includes(item.value)) {
                value = selected.filter((v) => v !== item.value);
                valueItem = selectItems.filter((v) => v.value !== item.value);
              } else {
                value = [...selected, item.value];
                valueItem = [...selectItems, item];
              }
              setSelected(value);
              setSelectItems(valueItem);
              onChange(value, valueItem);
            }}
          >
            <p>{item.value}</p>
            <h1 className="text-center font-bold text-strong-color text-xl w-full">
              {item.label}
            </h1>
            {!disabled && (
              <div className="flex justify-end">
                {selected.includes(item.value) ? (
                  <CheckCircleFill className={`text-primary text-xl`} />
                ) : (
                  <CheckCircleOutline className="text-xl" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Selector;
