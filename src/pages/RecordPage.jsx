import React, { useState } from "react";
import { db } from "../firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RecordPage = () => {
  const [formData, setFormData] = useState({
    accessories: "",
    catNo: "",
    catRate: "",
    printType: "riso",
    catname: "J",
    noPrints: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getDesignSlab = (rate) => {
    const r = Number(rate);

    if (r <= 15) return 300;
    if (r <= 25) return 400;
    if (r <= 30) return 500;
    if (r <= 35) return 600;
    return 700;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { accessories, catNo, catRate, noPrints } = formData;

    // FIELD VALIDATION
    if (!accessories || !catNo || !catRate || !noPrints) {
      toast.error("Fill out all the fields");
      return;
    }

    try {
      const docId = `${formData.catname}${formData.catNo}`;

      // CHECK IF RECORD EXISTS
      const docRef = doc(db, "patrika", docId);
      const existingDoc = await getDoc(docRef);

      if (existingDoc.exists()) {
        toast.error("Record already exists");
        return;
      }

      const printCost = formData.printType === "riso" ? 1 : 1.5;
      const designSlab = getDesignSlab(formData.catRate);

      const data = {
        accessories: Number(formData.accessories),
        catNo: Number(formData.catNo),
        catRate: Number(formData.catRate) / 2,
        designSlab,
        printCost,
        printType: formData.printType,
        noPrints: Number(formData.noPrints),
        catname: formData.catname
      };

      await setDoc(docRef, data);

      toast.success("Recorded!");

      setFormData({
        accessories: "",
        catNo: "",
        catRate: "",
        printType: "riso",
        catname: "J",
        noPrints: ""
      });

    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Something went wrong");
    }
  };

  const previewId = `${formData.catname}${formData.catNo}`;
  const previewSlab = getDesignSlab(formData.catRate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-200 flex items-center justify-center p-6">

      <div className="w-full max-w-2xl bg-gradient-to-tr from-blue-50 to-white rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Add Patrika Design
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          <select
            name="catname"
            value={formData.catname}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">A</option>
            <option value="V">V</option>
            <option value="J">J</option>
            <option value="S">S</option>
          </select>

          <input
            name="catNo"
            placeholder="Patrika No"
            value={formData.catNo}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="catRate"
            placeholder="Catalog Rate"
            value={formData.catRate}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="accessories"
            placeholder="Accessories"
            value={formData.accessories}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="noPrints"
            placeholder="No. of Prints"
            value={formData.noPrints}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          />

          <select
            name="printType"
            value={formData.printType}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          >
            <option value="riso">Riso</option>
            <option value="screen">Screen</option>
          </select>

          <div className="bg-gray-100 p-3 rounded-lg text-sm">
            Design Slab: <span className="font-semibold">{previewSlab}</span>
          </div>

          <div className="md:col-span-2 bg-gray-100 p-3 rounded-lg text-sm">
            Document ID: <span className="font-semibold">{previewId}</span>
          </div>

          <button
            type="submit"
            className="md:col-span-2 bg-pink-800 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition"
          >
            Save Patrika Record
          </button>

        </form>

        <ToastContainer position="top-center" autoClose={3000} />

      </div>
    </div>
  );
};

export default RecordPage;