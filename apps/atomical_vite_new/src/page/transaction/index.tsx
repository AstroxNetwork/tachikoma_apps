import Selector from "@/components/components/selector";
import { Button, Checkbox, Form, Input, Space } from "antd-mobile";
import { useState } from "react";

const items = [
  {
    value: "#1019",
    label: "1000",
  },
  {
    value: "#1031",
    label: "1000",
  },
  {
    value: "#1023",
    label: "1000",
  },
  {
    value: "#1044",
    label: "1000",
  },
  {
    value: "#1012",
    label: "1000",
  },
  {
    value: "#1219",
    label: "1000",
  },
  {
    value: "#1119",
    label: "1000",
  },
];

const Transaction = () => {
  const [checkeds, setCheckeds] = useState<string[]>([]);
  return (
    <div
      className="app-container"
      style={{
        minHeight: "calc(100vh - 90px)",
      }}
    >
      <div className="app-header">
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
          <p>Note: #207, #5439 will be merged into 2,000 ATOM.</p>
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
              maxHeight: "calc(100vh - 480px)",
            }}
          >
            <Selector items={items} value={checkeds} />
          </div>
        </div>
      </div>
      <div className="app-bottom">
        <Button color="primary" className="w-full">
          Send
        </Button>
      </div>
    </div>
  );
};

export default Transaction;