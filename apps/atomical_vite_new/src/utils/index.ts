//字符串千分号
export function toThousands(num: number | string) {
  let numStr = num.toString();
  let result = "";
  while (numStr.length > 3) {
    result = "," + numStr.slice(-3) + result;
    numStr = numStr.slice(0, numStr.length - 3);
  }
  if (numStr) {
    result = numStr + result;
  }
  return result;
}
