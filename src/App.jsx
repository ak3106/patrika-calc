import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import RecordPage from "./pages/RecordPage";
import FetchPage from "./pages/FetchPage";
import ViewPage from "./pages/ViewPage";
import OrderPage from "./pages/OrderPage";
import { CartProvider } from "./context/CartContext";
import ViewOrder from "./pages/ViewOrder";

const App = () => {
  return (
    <BrowserRouter>
      <CartProvider>

      <Navbar />

      <Routes>

        <Route path="/" element={<FetchPage />} />

        <Route path="/add" element={<RecordPage />} />

        <Route path="/fetch" element={<FetchPage />} />

        <Route path="/view" element={<ViewPage />} />

        <Route path="/orders" element={<OrderPage />} />
        <Route path="/order-list" element={<ViewOrder />} />

      </Routes>
      </CartProvider>

    </BrowserRouter>
  );
};

export default App;
