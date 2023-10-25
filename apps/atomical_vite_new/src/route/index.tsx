import { HashRouter, Routes, Route } from "react-router-dom";
import IndexPage from "../page";
import { Layout } from "../layout";
import FTTx from "../page/transaction/FTTx";
import NFTTx from "@/page/transaction/NFTTx";
// import App from '../App';
// import IndexPage from '../pages';

export const Router = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexPage />}></Route>
          <Route path="/transation/ft" element={<FTTx />}></Route>
          <Route path="/transation/nft" element={<NFTTx />}></Route>
        </Route>
      </Routes>
    </HashRouter>
  );
};
