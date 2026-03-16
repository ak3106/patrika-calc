import React, { useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const FetchPage = () => {

  const [form, setForm] = useState({
    catname: "J",
    catNo: "",
    qty: 100,
    margin: 20,
    packing: false
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const calculateRate = async (e) => {

    e.preventDefault();

    const docId = `${form.catname}${form.catNo}`;

    const ref = doc(db, "patrika", docId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Patrika not found");
      return;
    }

    const data = snap.data();

    const qty = Number(form.qty);
    const margin = Number(form.margin) / 100;

    const base =
      data.catRate +
      data.noPrints * data.printCost +
      data.accessories;

    const total = qty * base;

    const marginAmount = margin * total;

    const accessoryMarginRemove =
      margin * (data.accessories * qty);

    const packingCost = form.packing ? qty * 3 : 0;

    const finalCost =
      total +
      marginAmount -
      accessoryMarginRemove +
      packingCost;

    const profit =
      marginAmount - accessoryMarginRemove;

    setResult({
      finalCost: Math.round(finalCost),
      profit: Math.round(profit),
      printType: data.printType
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">

      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-xl font-bold mb-4">
          Patrika Rate Calculator
        </h1>

        <form
          onSubmit={calculateRate}
          className="flex flex-col gap-3"
        >

          <select
            name="catname"
            value={form.catname}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            <option value="A">A</option>
            <option value="V">V</option>
            <option value="J">J</option>
            <option value="S">S</option>
          </select>

          <input
            name="catNo"
            placeholder="Patrika No"
            value={form.catNo}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          />

          <select
            name="qty"
            value={form.qty}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            {[100,150,200,250,300,350,400,450,500,550,600].map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          <select
            name="margin"
            value={form.margin}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="packing"
              checked={form.packing}
              onChange={handleChange}
            />
            Packing (₹3 per card)
          </label>

          <button
            type="submit"
            className="bg-pink-800 text-white py-3 rounded-lg hover:bg-pink-700"
          >
            Calculate
          </button>

        </form>

        {result && (

          <div className="mt-6 bg-slate-100 p-4 rounded-lg font-bold">

            <h2 className="font-semibold mb-2">
              Calculation Result
            </h2>

            <p className="text-xl">Final Cost: ₹{result.finalCost}</p>
            <p>Profit: ₹{result.profit}</p>
            <p>Print Type: {result.printType}</p>

          </div>

        )}

      </div>

    </div>
  );
};

export default FetchPage;