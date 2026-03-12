import React, { useState } from "react";
import { db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";

const RecordPage = () => {
  const [formData, setFormData] = useState({
    accessories: "",
    catNo: "",
    catRate: "",
    designSlab: "",
    printType: "riso",
    catname: "A"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const docId = `${formData.catname}${formData.catNo}`;
      const printCost = formData.printType === "riso" ? 1 : 1.5;

      const data = {
        accessories: Number(formData.accessories),
        catNo: Number(formData.catNo),
        catRate: Number(formData.catRate),
        designSlab: Number(formData.designSlab),
        printCost: printCost,
        printType: formData.printType,
        catname: formData.catname
      };

      await setDoc(doc(db, "patrika", docId), data);

      alert("Data added successfully");

      setFormData({
        accessories: "",
        catNo: "",
        catRate: "",
        designSlab: "",
        printType: "riso",
        catname: "A"
      });

    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const previewId = `${formData.catname}${formData.catNo}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Add Patrika Design
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            name="catNo"
            placeholder="Category No"
            value={formData.catNo}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="accessories"
            placeholder="Accessories"
            value={formData.accessories}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="catRate"
            placeholder="Category Rate"
            value={formData.catRate}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="designSlab"
            placeholder="Design Slab"
            value={formData.designSlab}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            name="catname"
            value={formData.catname}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">A</option>
            <option value="V">V</option>
            <option value="J">J</option>
            <option value="S">S</option>
          </select>

          <select
            name="printType"
            value={formData.printType}
            onChange={handleChange}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="riso">Riso</option>
            <option value="screen">Screen</option>
          </select>

          {/* Document ID Preview */}

          <div className="md:col-span-2 bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
            Document ID: <span className="font-semibold">{previewId}</span>
          </div>

          <button
            type="submit"
            className="md:col-span-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Save Patrika Record
          </button>

        </form>
      </div>
    </div>
  );
};

export default RecordPage;