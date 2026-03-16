import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import RecordPage from "./pages/RecordPage";
import FetchPage from "./pages/FetchPage";
import ViewPage from "./pages/ViewPage";

const App = () => {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<FetchPage />} />

        <Route path="/add" element={<RecordPage />} />

        <Route path="/fetch" element={<FetchPage />} />

        <Route path="/view" element={<ViewPage />} />

      </Routes>

    </BrowserRouter>
  );
};

export default App;