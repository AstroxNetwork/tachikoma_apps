import React, { useRef, useEffect } from "react";
import { NativeProps } from "@/components/utils/native-props";
import "./input.less";

type InputProps = {
  value?: string;

  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
} & NativeProps;

const Input: React.FC<InputProps> = (props) => {
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
      className={`w-full h-9 border relative bg-body-bg flex items-center overflow-hidden whitespace-nowrap ${
        isFocus ? "border-primary" : "border-zinc-500"
      } outline-none px-4 ${className}`}
      onClick={focus}
    >
      {/* {value}
      <span className="text-primary"> {isFocus && "|"}</span> */}

      <input
        ref={inputRef}
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
