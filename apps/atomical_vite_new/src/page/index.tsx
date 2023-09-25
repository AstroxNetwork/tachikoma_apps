import { Collapse, Modal } from "@/components";
import { useNavigate } from "react-router-dom";
import { EditSOutline } from "antd-mobile-icons";
import { useAtomicalWalletInfo } from "@/services/hooks";
import Selector from "@/components/components/selector";
const IndexPage = () => {
  const navigate = useNavigate();
  const address =
    "bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv";
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
      title: "test",
      content: "asfdafafadfsadf",
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
                  ATOM({atomUtxos.length})<span>{balance}</span>
                </div>
              }
            >
              <Selector
                ellipsis={true}
                options={atomUtxos.map((o) => ({
                  label: o.value.toString(),
                  value: o.txid,
                }))}
                className="bg-body-bg"
                disabled
              />
            </Collapse.Panel>
          </Collapse>
          <div className="h-10"></div>
        </>
      </div>
    </div>
  );
};

export default IndexPage;
