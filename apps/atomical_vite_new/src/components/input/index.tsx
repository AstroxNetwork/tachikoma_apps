import { CSSProperties, useEffect, useState } from "react";
import Input from "../components/input";

type Presets = keyof typeof $inputPresets;
const $inputPresets = {
  password: {},
  amount: {},
  address: {},
  text: {},
};
export interface InputProps {
  preset?: Presets;
  placeholder?: string;
  children?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  defaultValue?: string;
  value?: string;
  style?: CSSProperties;
  containerStyle?: CSSProperties;
  addressInputData?: { address: string; domain: string };
  onAddressInputChange?: (params: { address: string; domain: string }) => void;
  onAmountInputChange?: (amount: string) => void;
  disabled?: boolean;
  disableDecimal?: boolean;
}

function AmountInput(props: InputProps) {
  const {
    placeholder,
    onAmountInputChange,
    disabled,
    style: $inputStyleOverride,
    disableDecimal,
    ...rest
  } = props;
  const $style = Object.assign({}, $inputStyleOverride);

  if (!onAmountInputChange) {
    return <div />;
  }
  console.log("AmontInput");
  const [inputValue, setInputValue] = useState("");
  const [validAmount, setValidAmount] = useState("");
  useEffect(() => {
    onAmountInputChange(validAmount);
  }, [validAmount]);

  const handleInputAmount = (e) => {
    const value = e.target.value;
    if (disableDecimal) {
      if (/^[1-9]\d*$/.test(value) || value === "") {
        setValidAmount(value);
        setInputValue(value);
      }
    } else {
      if (/^\d*\.?\d*$/.test(value) || value === "") {
        setValidAmount(value);
        setInputValue(value);
      }
    }
  };
  return (
    <div className="flex">
      <Input
        className="text-base leading-9"
        value={inputValue}
        placeholder={placeholder ?? "Amount"}
        onChange={handleInputAmount}
      />
    </div>
  );
}

export { AmountInput };
