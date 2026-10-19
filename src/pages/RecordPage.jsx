import React, { useEffect, useState } from "react";
import { db } from "../firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchPricingParameters } from "../utils/FetchParameters.jsx";

const initialFormData = {
  accessories: "",
  catNo: "",
  catRate: "",
  printType: "riso",
  catname: "B",
  noPrints: "",
  stock: "10000",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const RecordPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [pricingParameters, setPricingParameters] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    fetchPricingParameters()
      .then((params) => {
        if (active) setPricingParameters(params);
      })
      .catch(() => {
        if (active) toast.error("Failed to load pricing parameters");
      })
      .finally(() => {
        if (active) setLoadingPricing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getDesignSlab = (rate) => {
    const r = Number(rate);

    if (rate === "" || !Number.isFinite(r)) return 200;
    if (r <= 3) return 200;
    if (r <= 5) return 250;
    if (r <= 10) return 300;
    if (r <= 20) return 400;
    if (r <= 25) return 450;
    if (r <= 30) return 500;
    if (r <= 35) return 600;
    if (r <= 45) return 700;
    if (r <= 50) return 800;
    if (r <= 70) return 900;

    return 1000;
  };

  const previewId = `${formData.catname}${formData.catNo}`;
  const previewSlab = getDesignSlab(formData.catRate);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { accessories, catNo, catRate, noPrints, stock } = formData;

    if (
      [accessories, catNo, catRate, noPrints, stock].some(
        (value) => String(value).trim() === "",
      )
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const numericFields = {
      accessories: Number(accessories),
      catNo: Number(catNo),
      catRate: Number(catRate),
      noPrints: Number(noPrints),
      stock: Number(stock),
    };

    if (
      Object.values(numericFields).some(
        (value) => !Number.isFinite(value) || value < 0,
      ) ||
      numericFields.catNo <= 0 ||
      numericFields.catRate <= 0
    ) {
      toast.error("Enter valid, non-negative values");
      return;
    }

    if (!pricingParameters) {
      toast.error("Pricing parameters are not available");
      return;
    }

    setSaving(true);

    try {
      const docId = `${formData.catname}${formData.catNo}`;
      const docRef = doc(db, "patrika", docId);
      const existingDoc = await getDoc(docRef);

      if (existingDoc.exists()) {
        toast.error("This record already exists");
        return;
      }

      const printCost =
        formData.printType === "riso"
          ? pricingParameters.riso
          : pricingParameters.screen;

      const data = {
        accessories: numericFields.accessories,
        catNo: numericFields.catNo,
        catRate: numericFields.catRate / 2,
        designSlab: getDesignSlab(numericFields.catRate),
        printCost,
        printType: formData.printType,
        noPrints: numericFields.noPrints,
        catname: formData.catname,
        stock: numericFields.stock,
      };

      await setDoc(docRef, data);

      toast.success("Patrika record saved successfully!");
      setFormData({ ...initialFormData });
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        {/* Page heading */}
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-700">
            <span className="h-2 w-2 rounded-full bg-violet-600" />
            PRAGYAPRINT
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Add Patrika Design
          </h1>

          {/* <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
            Create a new design record with catalog details, printing
            information, and stock quantities.
          </p> */}
        </header>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Section 1 */}
          <section className="p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 7h8M8 11h8M8 15h5" />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Design information
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the catalog identification and pricing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="catname" className={labelClass}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="catname"
                  name="catname"
                  value={formData.catname}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="A">A</option>
                  <option value="V">V</option>
                  <option value="J">J</option>
                  <option value="B">B</option>
                  <option value="S">S</option>
                </select>
              </div>

              <div>
                <label htmlFor="catNo" className={labelClass}>
                  Patrika number <span className="text-red-500">*</span>
                </label>
                <input
                  id="catNo"
                  name="catNo"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formData.catNo}
                  onChange={handleChange}
                  placeholder="e.g. 101"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="catRate" className={labelClass}>
                  Catalog rate (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="catRate"
                  name="catRate"
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={formData.catRate}
                  onChange={handleChange}
                  placeholder="Enter catalog rate"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-gray-400">
                  The saved catalog rate is divided by 2.
                </p>
              </div>

              <div>
                <label htmlFor="accessories" className={labelClass}>
                  Accessories cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="accessories"
                  name="accessories"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formData.accessories}
                  onChange={handleChange}
                  placeholder="Enter accessories cost"
                  className={inputClass}
                />
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p>Murti, NameTag, Dori — ₹0.75</p>
                  <p>Box — ₹4.00 · Packing — ₹2.00</p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* Section 2 */}
          <section className="p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                  <circle cx="8" cy="7" r="2" fill="white" />
                  <circle cx="15" cy="12" r="2" fill="white" />
                  <circle cx="10" cy="17" r="2" fill="white" />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Production details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure printing and available stock.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="printType" className={labelClass}>
                  Print type <span className="text-red-500">*</span>
                </label>
                <select
                  id="printType"
                  name="printType"
                  value={formData.printType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="riso">Riso</option>
                  <option value="screen">Screen</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              <div>
                <label htmlFor="noPrints" className={labelClass}>
                  Number of prints <span className="text-red-500">*</span>
                </label>
                <input
                  id="noPrints"
                  name="noPrints"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.noPrints}
                  onChange={handleChange}
                  placeholder="Enter number of prints"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="stock" className={labelClass}>
                  Available stock <span className="text-red-500">*</span>
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Enter stock quantity"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Print cost</label>
                <div className="flex min-h-[46px] items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {formData.printType === "riso"
                      ? "Riso printing"
                      : formData.printType === "screen"
                        ? "Screen printing"
                        : "Digital printing"}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {loadingPricing
                      ? "Loading..."
                      : pricingParameters
                        ? `₹${
                            formData.printType === "riso"
                              ? pricingParameters.riso
                              : formData.printType === "screen"
                                ? pricingParameters.screen
                                : pricingParameters.digital
                          }`
                        : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* Live preview */}
          <section className="bg-gray-50/80 p-5 sm:p-8">
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900">Record preview</h2>
              <p className="mt-1 text-sm text-gray-500">
                Review the generated details before saving.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Document ID
                </p>
                <p className="mt-2 break-all text-xl font-semibold tracking-tight text-gray-900">
                  {previewId}
                </p>
                <p className="mt-1 text-xs text-gray-500"></p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Design slab
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tracking-tight text-gray-900">
                    ₹{previewSlab}
                  </span>
                  <span className="text-xs text-gray-500">Calculated</span>
                </div>
                <p className="mt-1 text-xs text-gray-500"></p>
              </div>
            </div>
          </section>

          {/* Form actions */}
          <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <p className="text-xs leading-5 text-gray-400">
              <span className="text-red-500">*</span> Required fields
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setFormData({ ...initialFormData })}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset form
              </button>

              <button
                type="submit"
                disabled={saving || loadingPricing || !pricingParameters}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Save Patrika Record
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>

        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </div>
    </main>
  );
};

export default RecordPage;
