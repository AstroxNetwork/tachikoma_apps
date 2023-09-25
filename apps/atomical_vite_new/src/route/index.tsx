import { BrowserRouter, Routes, Route } from "react-router-dom";
import IndexPage from "../page";
import { Layout } from "../layout";
import Transaction from "../page/transaction";
// import App from '../App';
// import IndexPage from '../pages';

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexPage />}></Route>
          <Route path="/transation" element={<Transaction />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
