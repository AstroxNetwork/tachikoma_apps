import { List, Mask, Modal, Toast } from "@/components";
import { useNavigate } from "react-router-dom";
import { useAddress, useAtomicalWalletInfo } from "@/services/hooks";
import QrCode from "qrcode.react";
import { IAtomicalBalanceItem } from "@/interfaces/api";
import { ICON_COPY } from "@/utils/resource";
import { useEffect, useState } from "react";

const IndexPage = () => {
  const navigate = useNavigate();
  const {
    address,
    addressType,
    // isAllowedAddressType,
    // xonlyPubHex,
  } = useAddress();
  const [visible, setVisible] = useState<boolean>(false);
  const {
    balance,
    atomUtxos,
    fundingBalance,
    nonAtomUtxos,
    balanceMap,
    allUtxos,
  } = useAtomicalWalletInfo(address);

  useEffect(() => {
    (async () => {
      // const addressType = "p2wpkh";
      if (addressType !== "p2pkh") {
        setVisible(true);
      }
    })();
  }, [addressType]);
  console.log("addressType", addressType);

  const modal = () => {
    Modal.show({
      closeOnMaskClick: true,
      title: <span className="text-strong-color">Receive</span>,
      content: (
        <div className="flex flex-col items-center">
          <QrCode value={address} size={150} includeMargin />
          <p className="text-center mt-2 break-all">{address}</p>
          <button
            className="w-24 mt-4 bg-primary text-white py-2 px-4 text-center rounded-full"
            onClick={() => {
              navigator.clipboard.writeText(address);
              Toast.show("Copied!");
            }}
          >
            Copy
          </button>
        </div>
      ),
    });
  };

  const sendModal = () => {
    const alert = Modal.show({
      closeOnMaskClick: true,
      title: <span className="text-strong-color">Send Token</span>,
      content: (
        <>
          <List>
            {balanceMap &&
              Object.keys(balanceMap ?? [])
                .map((k) => balanceMap[k])
                .filter((v: IAtomicalBalanceItem) => {
                  return v.type === "FT";
                })
                .map((o: IAtomicalBalanceItem) => (
                  <List.Item
                    key={o.atomical_id}
                    onClick={(e) => {
                      alert.close();
                      e.stopPropagation();
                      navigate(`/transation?atomical_id=${o.atomical_id}`);
                    }}
                    title={
                      <div className="flex justify-between">
                        <span className="text-strong-color">{`${o.ticker.toLocaleUpperCase()}(${
                          atomUtxos?.filter(
                            (utxo) => utxo.atomicals[0] === o.atomical_id
                          ).length
                        })`}</span>
                        <span className="text-strong-color">{o.confirmed}</span>
                      </div>
                    }
                    arrow={<div className="h-5"></div>}
                  ></List.Item>
                ))}
          </List>
        </>
      ),
    });
  };

  console.log("balance", balance);
  console.log("atomUtxos", atomUtxos);
  console.log("fundingBalance", fundingBalance);
  console.log("nonAtomUtxos", nonAtomUtxos);
  console.log("balanceMap", balanceMap);
  console.log("allUtxos", allUtxos);
  return (
    <>
      <div className="app-container">
        <div className="app-header">
          <div className="bg-card-bg w-full p-4 rounded-md mt-4">
            <div className="flex items-center text-base">
              {address?.slice(0, 6)}...{address?.slice(-4)}
              <img
                src={ICON_COPY}
                className="w-4 cursor-pointer"
                alt=""
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  Toast.show("Copied!");
                }}
              />
            </div>
            <div className="text-center py-10">
              <h1 className="text-3xl font-bold">
                {balanceMap && fundingBalance
                  ? Object.keys(balanceMap)
                      .map((key) => balanceMap[key])
                      .map((o) => o.confirmed)
                      .reduce((pre, cur) => pre + cur, fundingBalance)
                  : "--"}{" "}
                sats
              </h1>
            </div>
            <div className="flex justify-between px-5">
              <button
                className="w-5/12 bg-primary text-white py-2 px-4 text-center rounded-full"
                onClick={modal}
              >
                Receive
              </button>
              <button
                className="w-5/12 bg-primary text-white py-2 px-4 text-center rounded-full"
                onClick={sendModal}
              >
                Send
              </button>
            </div>
          </div>
        </div>
        <div className="app-body">
          <>
            <h1 className="text-base mt-5 mb-2">Tokens</h1>
            <List>
              <List.Item
                key="1"
                title={
                  <div className="flex justify-between text-strong-color">
                    BTC
                    <p className="text-strong-color">{fundingBalance} sats</p>
                  </div>
                }
                arrow={<div className="h-5"></div>}
              ></List.Item>
              {balanceMap &&
                Object.keys(balanceMap ?? [])
                  .map((k) => balanceMap[k])
                  .filter((v: IAtomicalBalanceItem) => {
                    return v.type === "FT";
                  })
                  .map((o: IAtomicalBalanceItem) => {
                    console.log("o", o);
                    return (
                      <List.Item
                        key={o.atomical_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/transation?atomical_id=${o.atomical_id}`);
                        }}
                        title={
                          <div className="flex justify-between">
                            <span className="text-strong-color">{`${o.ticker.toLocaleUpperCase()}(${
                              atomUtxos?.filter(
                                (utxo) => utxo.atomicals[0] === o.atomical_id
                              ).length
                            })`}</span>
                            <span className="text-strong-color">
                              {o.confirmed} sats
                            </span>
                          </div>
                        }
                        arrow={<div className="h-5"></div>}
                      ></List.Item>
                    );
                  })}
            </List>
            <div className="h-10"></div>
          </>
        </div>
      </div>
      <Mask visible={visible}>
        <div className="bg-card-bg w-full p-4 mt-4 absolute bottom-0 left-0">
          {addressType === "p2wpkh" || addressType === "p2sh" ? (
            <>
              <p>
                Please aware this address you use to login is{" "}
                <span className="text-red-500">NOT supported</span> Please use
              </p>
              <p>
                <span className="text-orange-400">Legacy or P2TR</span>
              </p>
              <p>
                Meanwhile,<span className="text-red-500"> DO NOT </span>mix
                other assets in your wallet.
              </p>
            </>
          ) : (
            <>
              <p>
                Please ensure that this address is used{" "}
                <span className="text-red-500">EXCLUSIVELY FOR ARC-20</span>{" "}
                assets and is not mixed with other assets such as
              </p>
              <p className="text-orange-400">BRC20 or Inscriptions.</p>
              <p style={{ textAlign: "left" }}>
                Otherwise, there is a risk of your assets being
                <span className="text-red-500"> LOST </span>
                during the transfer.
              </p>
            </>
          )}
          <button
            className="w-full mt-10 bg-primary text-white py-2 px-4 text-center rounded-full"
            onClick={() => setVisible(false)}
          >
            I Understand
          </button>
        </div>
      </Mask>
    </>
  );
};

export default IndexPage;
