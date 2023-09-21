import { CSSProperties, HTMLAttributes, MutableRefObject, ReactElement, RefAttributes } from 'react';

export interface ModalProps extends RefAttributes<HTMLDivElement>, HTMLAttributes<HTMLDivElement> {
  visible: boolean;
  children?: ReactElement;
  onMaskClick?: () => void;
  maskCanBeClick?: boolean;
  maskStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  delay?: number;
  animation?: boolean;
  duration?: number | [number] | [number, number]; // [number, number?] not work
  onShow?: () => void;
  onHide?: () => void;
}

export interface MaskRef extends MutableRefObject<HTMLDivElement> {
  __animationValid: boolean;
  __timer: ReturnType<typeof setTimeout>;
  __pendingShow: boolean;
  __pendingHide: boolean;
}
