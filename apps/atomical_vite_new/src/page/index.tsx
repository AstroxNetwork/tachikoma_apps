import { Collapse, Modal, Toast } from "@/components";
import { useNavigate } from "react-router-dom";
import { EditSOutline } from "antd-mobile-icons";
import { useAddress, useAtomicalWalletInfo } from "@/services/hooks";
import Selector from "@/components/components/selector";
import QrCode from "qrcode.react";
import { useMemo } from "react";

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

  const size = useMemo(() => atomUtxos.length, [atomUtxos]);
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
            bc1pabcd…1234
            <EditSOutline />
          </div>
          <div className="text-center py-5">
            <h1 className="text-3xl font-bold">2000 BTC</h1>
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
              onClick={() => navigate("/transation")}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <div className="app-body">
        <>
          <h1 className="text-base mt-5 mb-2">Tokens</h1>
          <Collapse accordion>
            <Collapse.Panel
              key="1"
              title={
                <div className="flex justify-between">
                  BTC
                  <p>{fundingBalance}</p>
                </div>
              }
              arrow={<div className="h-5 w-5"></div>}
              disabled
            ></Collapse.Panel>
            <Collapse.Panel
              key="2"
              title={
                <div className="flex justify-between">
                  <span>{`ATOM(${size})`}</span>
                  <span>{balance}</span>
                </div>
              }
              arrow={<div className="h-5 w-5"></div>}
              disabled
            >
              {/* <div className="h-96"></div> */}
              <div>
                <Selector
                  ellipsis={true}
                  options={atomUtxos.map((o) => ({
                    label: o.value.toString(),
                    value: o.txid,
                  }))}
                  className="bg-body-bg"
                  disabled
                />
              </div>
            </Collapse.Panel>
          </Collapse>
          <div className="h-10"></div>
        </>
      </div>
    </div>
  );
};

export default IndexPage;
