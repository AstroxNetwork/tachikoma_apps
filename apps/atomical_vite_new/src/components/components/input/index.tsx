import React, { useRef, useEffect } from "react";
import { NativeProps } from "@/components/utils/native-props";
import "./input.less";
type NativeInputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

type InputMyProps = {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
} & Pick<
  NativeInputProps,
  | "maxLength"
  | "minLength"
  | "autoComplete"
  | "autoFocus"
  | "pattern"
  | "inputMode"
  | "type"
  | "name"
  | "onFocus"
  | "onBlur"
  | "autoCapitalize"
  | "autoCorrect"
  | "onKeyDown"
  | "onKeyUp"
  | "onCompositionStart"
  | "onCompositionEnd"
  | "onClick"
  | "step"
  | "id"
  | "placeholder"
  | "readOnly"
  | "disabled"
> &
  NativeProps<"input">;

const Input: React.FC<InputMyProps> = (props) => {
  const { value, onChange, className, ...rests } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocus, setIsFocus] = React.useState<boolean>(false);
  const focus = (e) => {
    e.stopPropagation();
    inputRef.current?.focus();
    setIsFocus(true);
  };

  const blur = () => {
    inputRef.current?.blur();
    setIsFocus(false);
  };
  console.log("isFocus", isFocus);

  useEffect(() => {
    document.addEventListener("click", () => {
      blur();
    });
    inputRef.current?.addEventListener("change", (e: any) => {
      console.log("listener change ", e);
      onChange && onChange(e);
    });
  }, []);

  return (
    <div
      className={`w-full relative flex items-center overflow-hidden ${className}`}
      onClick={focus}
    >
      {/* {value}
      <span className="text-primary"> {isFocus && "|"}</span> */}

      <input
        ref={inputRef}
        value={value}
        {...rests}
        onChange={(e) => {
          console.log("change ", e);
          onChange && onChange(e);
        }}
        onInput={(e) => {
          console.log("onInput ", e);
          onChange && onChange(e as any);
        }}
        // style={{ width: 0 }}
        className="w-full"
        // className="absolute -bottom-60"
        onBlur={() => {
          blur();
        }}
      />
    </div>
  );
};

export default Input;
