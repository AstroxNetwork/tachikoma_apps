import classNames from "classnames";
import React, { FC, ReactNode, useState } from "react";
import { NativeProps, withNativeProps } from "../utils/native-props";
import { usePropsValue } from "../utils/use-props-value";
import { SpinIcon } from "./spin-icon";
import { isPromise } from "../utils/validate";
import { mergeProps } from "@/components/components/utils/merge-props";
import { useSpring, animated } from "react-spring";

const classPrefix = `adm-switch`;

export type SwitchProps = {
  loading?: boolean;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  /** @deprecated use `onChange` instead */
  beforeChange?: (val: boolean) => Promise<void>;
  onChange?: (checked: boolean) => void | Promise<void>;
  checkedText?: ReactNode;
  uncheckedText?: ReactNode;
} & NativeProps<"--checked-color" | "--width" | "--height" | "--border-width">;

const defaultProps = {
  defaultChecked: false,
};

export const Switch: FC<SwitchProps> = (p) => {
  const props = mergeProps(defaultProps, p);
  const disabled = props.disabled || props.loading || false;
  const [changing, setChanging] = useState(false);

  const [checked, setChecked] = usePropsValue({
    value: props.checked,
    defaultValue: props.defaultChecked,
    onChange: props.onChange,
  });

  const styles = useSpring({
    from: { left: checked ? 0 : 22 },
    to: { left: checked ? 22 : 0 },
    config: { duration: 200 },
  });

  async function onClick() {
    if (disabled || props.loading || changing) {
      return;
    }
    const nextChecked = !checked;
    if (props.beforeChange) {
      setChanging(true);
      try {
        await props.beforeChange(nextChecked);
        setChanging(false);
      } catch (e) {
        setChanging(false);
        throw e;
      }
    }
    const result = setChecked(nextChecked);
    if (isPromise(result)) {
      setChanging(true);
      try {
        await result;
        setChanging(false);
      } catch (e) {
        setChanging(false);
        throw e;
      }
    }
  }

  return withNativeProps(
    props,
    <div
      onClick={onClick}
      className={classNames(classPrefix, {
        [`${classPrefix}-checked`]: checked,
        [`${classPrefix}-disabled`]: disabled || changing,
      })}
      role="switch"
      aria-label=""
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <div className={`${classPrefix}-checkbox`}>
        <animated.div className={`${classPrefix}-handle`} style={styles}>
          {(props.loading || changing) && (
            <SpinIcon className={`${classPrefix}-spin-icon`} />
          )}
        </animated.div>
        <div className={`${classPrefix}-inner`}>
          {checked ? props.checkedText : props.uncheckedText}
        </div>
      </div>
    </div>
  );
};
