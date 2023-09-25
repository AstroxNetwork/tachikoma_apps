import { Button, Collapse } from "antd-mobile";
import { Modal, Toast } from "@/components";
import { useNavigate } from "react-router-dom";
import { EditSOutline } from "antd-mobile-icons";
const IndexPage = () => {
  const navigate = useNavigate();
  const modal = () => {
    Modal.show({
      closeOnMaskClick: true,
      title: "test",
      content: "asfdafafadfsadf",
    });
  };
  const toast = () => {
    Toast.show("ddddddd");
  };
  return (
    <div className="app-container">
      <div className="app-header">
        <div className="bg-card-bg w-full p-4 rounded-md mt-4">
          <div className="flex items-center">
            bc1pabcd…1234
            <EditSOutline />
          </div>
          <div className="text-center py-5">
            <h1 className="text-3xl font-bold">2000 BTC</h1>
          </div>
          <div className="flex justify-between px-5">
            <button
              className="w-2/5 bg-primary text-white py-2 px-4 text-center rounded-full"
              onClick={modal}
            >
              Receive
            </button>
            <button
              className="w-2/5 bg-primary text-white py-2 px-4 text-center rounded-full"
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
            <Collapse.Panel key="1" title="第一项">
              手风琴模式只能同时展开一个
            </Collapse.Panel>
            <Collapse.Panel key="2" title="第二项">
              手风琴模式只能同时展开一个
            </Collapse.Panel>
            <Collapse.Panel key="3" title="第三项">
              手风琴模式只能同时展开一个
            </Collapse.Panel>
          </Collapse>
          <button onClick={toast}>toast</button>
          <button onClick={modal}>modal</button>
          <h1 className="text-red-400 font-bold">indexPage</h1>
        </>
      </div>
      <div className="app-bottom">
        <Button color="primary" className="w-full">
          Send
        </Button>
      </div>
    </div>
  );
};

export default IndexPage;
