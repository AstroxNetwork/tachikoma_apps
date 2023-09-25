import { Mask } from "@/components";
import Selector from "@/components/components/selector";
import { useAtomicalWalletInfo } from "@/services/hooks";
import { LeftOutline } from "antd-mobile-icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Transaction = () => {
  const [checkeds, setCheckeds] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const address =
    "bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv";
  const {
    // balance,
    atomUtxos,
    // fundingBalance,
    // nonAtomUtxos,
    // balanceMap,
    // allUtxos,
  } = useAtomicalWalletInfo(address);
  const navigate = useNavigate();
  return (
    <>
      <div
        className="app-container"
        style={{
          minHeight: "calc(100vh - 90px)",
        }}
      >
        <div className="app-header">
          <div className="pt-4">
            <LeftOutline className="text-2xl" onClick={() => navigate(-1)} />
          </div>
          <div className="text-center">
            <h1 className="pt-20 text-3xl font-bold">2000</h1>
            <p>ATOM</p>
          </div>
        </div>
        <div className="app-body">
          <div className="mt-10">
            <p className="text-base">Address</p>
            <input className="w-full h-9 border border-zinc-500 focus:border-black outline-none px-4" />
            {/* <Form>
              <Form.Item>
                <Input />
              </Form.Item>
            </Form> */}
            <h2 className="text-base mt-3 mb-3">Select token</h2>
            <p>Note: #207, #5439 will be merged into ATOM.</p>
            {/* <Checkbox.Group
              value={checkeds}
              onChange={(v) => {
                setCheckeds(v as string[]);
              }}
            >
              <Space direction="vertical">
                {items.map((item) => (
                  <Checkbox key={item} value={item}>
                    {item}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group> */}
            <div
              className="pb-5 overflow-scroll"
              style={{
                maxHeight: "calc(100vh - 560px)",
              }}
            >
              <Selector
                ellipsis
                options={atomUtxos.map((o) => ({
                  label: o.value.toString(),
                  value: o.txid,
                }))}
                value={checkeds}
                onChange={(value, valueItem) => {
                  console.log("valueItem", valueItem);
                  setCheckeds(value);
                }}
              />
            </div>
          </div>
        </div>
        <div className="app-bottom">
          <button
            className="w-full bg-primary text-white py-2 px-4 text-center rounded-full"
            onClick={() => setVisible(true)}
          >
            Send
          </button>
        </div>
      </div>
      <Mask
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
        }}
      >
        <div className="p-4 bg-card-bg absolute bottom-24 w-full left-0">
          <h1 className="text-strong-color text-xl font-bold mb-2">
            Confirm transaction
          </h1>
          <div className="bg-body-bg rounded-md p-2 break-all">
            From
            <p>
              bc1pabcd8vvj2s95pdzeax4x9tkuawr5um49n9er6gd2wf6wthwrh6yshm1234
            </p>
          </div>
          <div className="flex justify-center py-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 84 84"
              fill="none"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M0 42C0 18.8412 18.8433 0 42 0C65.1588 0 84 18.8412 84 42C84 65.1588 65.1588 84 42 84C18.8433 84 0 65.1588 0 42ZM45.1017 60.4737L58.2876 49.2765C60.3036 47.5608 60.5514 44.5389 58.8399 42.5208C57.1242 40.5075 54.1031 40.2614 52.0842 41.9706L46.7901 46.4667V27.1761C46.7901 24.53 44.645 22.385 41.9989 22.385C39.3529 22.385 37.2078 24.53 37.2078 27.1761V46.4667L31.9137 41.9706C29.8886 40.3532 26.9447 40.638 25.2671 42.6136C23.5896 44.5893 23.7859 47.5404 25.7103 49.2765L38.8962 60.4737C40.6848 61.9955 43.3131 61.9955 45.1017 60.4737Z"
                fill="black"
              />
            </svg>
          </div>
          <div className="bg-body-bg rounded-md p-2 break-all">
            To
            <p>
              bc1pabcd8vvj2s95pdzeax4x9tkuawr5um49n9er6gd2wf6wthwrh6yshm1234
            </p>
          </div>
          <div className="flex justify-between text-lg mt-8 mb-2">
            <p>Amount</p>
            <p className="text-strong-color text-right">2000 ATOM</p>
          </div>
          <p className="text-strong-color">
            Note: #207, #5439 will be merged into 2,000 ATOM.
          </p>
          <button
            className="w-full mt-20  bg-primary text-white py-2 px-4 text-center rounded-full"
            onClick={() => setVisible(true)}
          >
            Confirm to send
          </button>
        </div>
      </Mask>
    </>
  );
};

export default Transaction;
