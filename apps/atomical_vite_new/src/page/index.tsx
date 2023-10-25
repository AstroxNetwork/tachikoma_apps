import { List, Mask, Modal, Toast, DotLoading } from "@/components";
import { useNavigate } from "react-router-dom";
import { useWizzProvider } from "@/services/hooks";
import QrCode from "qrcode.react";
import { ICON_BTC, ICON_COPY } from "@/utils/resource";
import { useEffect, useState, useRef } from "react";
import { findValueInDeepObject } from "@/utils";
import { useAtomicalStore } from "@/store/app";
import NFTCard from "@/components/nftCard";

const IndexPage = () => {
  const navigate = useNavigate();
  const { address, addressType } = useWizzProvider();
  const [visible, setVisible] = useState<boolean>(false);
  const { atomicals, loading } = useAtomicalStore((state) => state);
  const [curTab, setCurTab] = useState<string>("1");
  console.log("atomical", atomicals);

  useEffect(() => {
    (async () => {
      // const addressType = "p2wpkh";
      if (addressType && addressType !== "p2pkh") {
        setVisible(true);
      }
    })();
  }, [addressType]);
  const canvasRef = useRef(null);
  console.log("addressType", addressType);

  useEffect(() => {}, []);

  // useEffect(() => {
  //   (async () => {
  //     const img1 = await svgBase64ToPngBase64(
  //       generateAvatarURL(
  //         balanceMap?.[Object.keys(balanceMap ?? [])[0]]?.atomical_id
  //       )
  //     );
  //     //@ts-ignore
  //     setImg(img1);
  //   })();
  // }, [balanceMap]);

  const modal = () => {
    Modal.show({
      closeOnMaskClick: true,
      title: <span className="text-strong-color">Receive</span>,
      content: (
        <div className="flex flex-col items-center">
          <QrCode value={address} size={150} includeMargin />
          <p className="text-center mt-2 break-all">{address}</p>
          <button
            className="w-24 mt-4 bg-primary text-black font-bold py-2 px-4 text-center rounded-full"
            onTouchEnd={() => {
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
            {atomicals.atomicalFTs.map((o) => {
              const data = findValueInDeepObject(o.mint_data?.fields, "$d");
              const b64String = Buffer.from(data, "hex").toString("base64");
              return (
                <List.Item
                  key={o.atomical_id}
                  title={
                    <div
                      className="flex justify-between"
                      onTouchEnd={(e) => {
                        alert.close();
                        e.stopPropagation();
                        navigate(`/transation/ft?ticker=${o.$ticker}`);
                      }}
                    >
                      <div className="flex items-center">
                        <img
                          src={`data:image/png;base64,${b64String}`}
                          className="mr-2 h-5 overflow-hidden rounded-full"
                          alt=""
                        />
                        <span className="text-strong-color">{`${o.$ticker}(${o.utxos.length})`}</span>
                      </div>
                      <span className="text-strong-color">{o.value}</span>
                    </div>
                  }
                  arrow={<div className="h-5"></div>}
                ></List.Item>
              );
            })}
          </List>
        </>
      ),
    });
  };
  console.log("atomical", atomicals);

  const tabs = [
    {
      title: "FT",
      key: "1",
      children: (
        <>
          <List>
            <List.Item
              key="1"
              title={
                <div className="flex justify-between text-strong-color">
                  <div className="flex items-center">
                    <img
                      src={ICON_BTC}
                      className="h-5 mr-2 rounded-full overflow-hidden"
                      alt=""
                    />
                    BTC
                  </div>
                  <p className="text-strong-color flex items-center justify-center">
                    {loading ? <DotLoading /> : <>{atomicals.regularsValue}</>}{" "}
                    sats
                  </p>
                </div>
              }
              arrow={<div className="h-5"></div>}
            ></List.Item>
            {atomicals.atomicalFTs.map((o) => {
              const data = findValueInDeepObject(o.mint_data?.fields, "$d");
              const b64String = Buffer.from(data, "hex").toString("base64");
              return (
                <List.Item
                  key={o.atomical_id}
                  title={
                    <div
                      className="flex justify-between"
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        navigate(`/transation/ft?ticker=${o.$ticker}`);
                      }}
                    >
                      <div className="flex items-center">
                        <img
                          src={`data:image/png;base64,${b64String}`}
                          className="mr-2 h-5 rounded-full overflow-hidden"
                          alt=""
                        />
                        <span className="text-strong-color">{`${o.$ticker}(${o.utxos.length})`}</span>
                      </div>
                      <span className="text-strong-color">{o.value} sats</span>
                    </div>
                  }
                  arrow={<div className="h-5"></div>}
                ></List.Item>
              );
            })}
          </List>
        </>
      ),
    },
    {
      title: "NFT",
      key: "2",
      children: (
        <div>
          <div className="flex flex-wrap gap-2">
            {atomicals.atomicalNFTs.map((o, index) => {
              console.log("NFT item");
              return (
                <NFTCard
                  onClick={() => {
                    navigate(`/transation/nft?ticker=${o.$ticker}`);
                  }}
                  key={index}
                  data={o}
                />
              );
            })}
          </div>
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="app-container">
        <div className="app-header">
          <div ref={canvasRef} className="z-30"></div>
          <div className="bg-card-bg w-full p-4 rounded-md mt-4">
            <div className="flex items-center text-base">
              {address?.slice(0, 6)}...{address?.slice(-4)}
              <img
                src={ICON_COPY}
                className="w-4 cursor-pointer"
                alt=""
                onTouchEnd={() => {
                  navigator.clipboard.writeText(address);
                  Toast.show("Copied!");
                }}
              />
            </div>
            <div className="text-center py-10">
              <h1 className="text-3xl font-bold flex items-center justify-center">
                {loading ? (
                  <DotLoading />
                ) : (
                  <>
                    {atomicals.confirmedValue ? atomicals.confirmedValue : "--"}{" "}
                  </>
                )}
                sats
              </h1>
            </div>
            <div className="flex justify-between px-5">
              <button
                className="w-5/12 bg-primary text-black font-bold py-2 px-4 text-center rounded-full"
                onTouchEnd={modal}
              >
                Receive
              </button>
              <button
                className="w-5/12 bg-primary text-black font-bold py-2 px-4 text-center rounded-full"
                onTouchEnd={sendModal}
              >
                Send
              </button>
            </div>
          </div>
        </div>
        <div className="app-body">
          <>
            <div className="flex py-2">
              {tabs.map((tab) => {
                return (
                  <div
                    className={`px-2 border-b-2 ${
                      tab.key === curTab
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    key={tab.key}
                    onClick={() => {
                      setCurTab(tab.key);
                    }}
                  >
                    {tab.title}
                  </div>
                );
              })}
            </div>
            {tabs.find((o) => o.key === curTab)?.children}
          </>
        </div>
      </div>
      <Mask visible={visible}>
        <div className="bg-card-bg w-full p-4 mt-4 absolute bottom-24 left-0">
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
            onTouchEnd={() => setVisible(false)}
          >
            I Understand
          </button>
        </div>
      </Mask>
    </>
  );
};

export default IndexPage;
