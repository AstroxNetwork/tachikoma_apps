import { List, Modal, Toast } from "@/components";
import { useNavigate } from "react-router-dom";
import { EditSOutline } from "antd-mobile-icons";
import { useAddress, useAtomicalWalletInfo } from "@/services/hooks";
import QrCode from "qrcode.react";
import { IAtomicalBalanceItem } from "@/interfaces/api";
import { ICON_COPY } from "@/utils/resource";

const IndexPage = () => {
  const navigate = useNavigate();
  const {
    address,
    // isAllowedAddressType,
    // xonlyPubHex,
  } = useAddress();
  const {
    balance,
    atomUtxos,
    fundingBalance,
    nonAtomUtxos,
    balanceMap,
    allUtxos,
  } = useAtomicalWalletInfo(address);

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
  );
};

export default IndexPage;
