import { IAtomicalItem } from "@/interfaces/api";
import punycode from "punycode";

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

export function isHexString(str: string) {
  const hexRegex = /^0x[0-9a-fA-F]+$/;
  // 检查是否包含 0x/0X 前缀，如果有，忽略它
  const normalizedStr =
    str.startsWith("0x") || str.startsWith("0X") ? str.slice(2) : str;
  return hexRegex.test("0x" + normalizedStr);
}

export function flattenObject(ob: any = {}) {
  const toReturn: { [key: string]: any } = {};

  for (const i in ob) {
    if (Object.prototype.hasOwnProperty.call(ob, i)) {
      if (typeof ob[i] == "object" && ob[i] !== null) {
        const flatObject = flattenObject(ob[i]);
        for (const x in flatObject) {
          if (Object.prototype.hasOwnProperty.call(flatObject, x)) {
            toReturn[i + "." + x] = flatObject[x];
          }
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
  }
  return toReturn;
}

export function findValueInDeepObject(obj: any, key: string): any | undefined {
  const flattened = flattenObject(obj);
  const found = Object.keys(flattened).find((_key) => _key.includes(key));
  if (found) {
    return flattened[found];
  } else {
    return undefined;
  }
}

// const ct = findValueInDeepObject(item.data.mint_data?.fields!, '$ct');

export async function svgBase64ToPngBase64(imageBase64) {
  const img = new Image(); // 创建图片容器
  img.src = imageBase64; //imageBase64 为svg+xml的Base64 文件流
  console.log("svgimg", img);
  return new Promise((reslove) => {
    img.addEventListener("load", () => {
      console.log("svgimg11", img);
      // 图片创建后再执行，转Base64过程
      const canvas = document.createElement("canvas");
      canvas.width = 300; //设置好 宽高  不然图片 不完整
      canvas.height = 300;
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0);
      console.log("svgimg1122", img);
      const pngBase64 = canvas.toDataURL("image/png");
      console.log("svgimg1122333", img);
      reslove(pngBase64);
    });
    // img.onload = function () {

    // };
  });
}

export function returnImageType(item: IAtomicalItem): {
  type: string;
  content: string;
  tag: string;
} {
  let ct, content, type, tag;
  if (item.$realm) {
    type = "realm";
    tag = "Realm";
    content = item.$full_realm_name!.toLowerCase().startsWith("xn--")
      ? punycode.decode(item.$full_realm_name!)
      : item.$full_realm_name;
  } else {
    type = "nft";
    ct = findValueInDeepObject(item.mint_data?.fields, "$ct");
    if (ct) {
      if (ct.endsWith("webp")) {
        ct = "image/webp";
      } else if (ct.endsWith("svg")) {
        ct = "image/svg+xml";
      } else if (ct.endsWith("png")) {
        ct = "image/png";
      } else if (ct.endsWith("jpg") || ct.endsWith("jpeg")) {
        ct = "image/jpeg";
      } else if (ct.endsWith("gif")) {
        ct = "image/gif";
      }
      const data = findValueInDeepObject(item.mint_data?.fields, "$d");
      const b64String = Buffer.from(data, "hex").toString("base64");
      content = `data:${ct};base64,${b64String}`;
      tag = ct;
    }
  }
  return { type, content, tag };
}
