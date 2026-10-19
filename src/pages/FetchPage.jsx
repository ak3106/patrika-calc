import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCart } from "../context/cartStore";
import { fetchPricingParameters } from "../utils/FetchParameters";

const initialForm = {
  catname: "J",
  catNo: "",
  qty: 100,
  margin: 20,
  packing: false,
  color: false,
  plasticWrap: false,
  stickerCommon: false,
  stickerCustom: false,
  nameSlip: false,
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const quantities = Array.from({ length: 19 }, (_, i) => 100 + i * 50);

const additionalOptions = [
  { key: "packing", label: "Packing" },
  { key: "color", label: "Digital Color printing" },
  { key: "nameSlip", label: "Name Slip" },
  { key: "plasticWrap", label: "Plastic Wrap" },
  { key: "stickerCommon", label: "Sticker Common" },
  { key: "stickerCustom", label: "Sticker Custom" },
];

const formatCurrency = (value) =>
  Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

const FetchPage = () => {
  const { addToCart, cart } = useCart();

  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [pricingParameters, setPricingParameters] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    let active = true;

    fetchPricingParameters()
      .then((params) => {
        if (active) setPricingParameters(params);
      })
      .catch(() => {
        if (active) {
          alert("Unable to load pricing parameters. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoadingPricing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setResult(null);
  };

  const getOptionRate = (key) =>
    Number(pricingParameters?.additional?.[key]);

  const hasOptionRate = (key) => Number.isFinite(getOptionRate(key));

  const calculateRate = async (e) => {
    e.preventDefault();

    if (!form.catNo.trim()) {
      alert("Please enter a Patrika number.");
      return;
    }

    const qty = Number(form.qty);
    const marginPercent = Number(form.margin);

    if (
      !Number.isFinite(qty) ||
      qty <= 0 ||
      !Number.isFinite(marginPercent) ||
      marginPercent < 0 ||
      marginPercent > 100
    ) {
      alert("Enter a valid quantity and margin between 0 and 100.");
      return;
    }

    const selectedOptionWithoutRate = additionalOptions.find(
      ({ key }) => form[key] && !hasOptionRate(key),
    );

    if (loadingPricing || !pricingParameters || selectedOptionWithoutRate) {
      alert("Pricing parameters are unavailable. Please try again.");
      return;
    }

    setCalculating(true);
    setResult(null);

    try {
      const docId = `${form.catname}${form.catNo.trim()}`;
      const ref = doc(db, "patrika", docId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Patrika not found.");
        return;
      }

      const data = snap.data();

      const margin = marginPercent / 100;

      const base =
        Number(data.catRate) +
        Number(data.noPrints) * Number(data.printCost) +
        Number(data.accessories);

      const total = qty * base + Number(data.designSlab);
      const marginAmount = margin * total;
      const accessoryMarginRemove = margin * (Number(data.accessories) * qty);

      const additionalCost = additionalOptions.reduce(
        (sum, { key }) => (form[key] ? sum + qty * getOptionRate(key) : sum),
        0,
      );

      const finalCost =
        total +
        marginAmount -
        accessoryMarginRemove +
        additionalCost;

      const profit = marginAmount - accessoryMarginRemove;

      setResult({
        patrikaId: docId,
        catname: data.catname ?? form.catname,
        catNo: data.catNo ?? form.catNo,
        qty,
        margin: marginPercent,
        packing: form.packing,
        color: form.color,
        nameSlip: form.nameSlip,
        plasticWrap: form.plasticWrap,
        stickerCommon: form.stickerCommon,
        stickerCustom: form.stickerCustom,
        additionalCost,
        finalCost: Math.round(finalCost),
        base,
        total,
        perCost: finalCost / qty,
        marginAmount,
        profit: Math.round(profit),
        printType: data.printType,
        catRate: data.catRate,
        stock: Number(data.stock ?? 0),
      });

    } catch (error) {
      console.error("Error calculating Patrika rate:", error);
      alert("Unable to calculate the rate. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleAddToCart = () => {
    if (!result) return;

    const quantityAlreadyInCart = cart
      .filter((item) => item.patrikaId === result.patrikaId)
      .reduce((total, item) => total + Number(item.qty), 0);

    if (result.qty + quantityAlreadyInCart > result.stock) {
      alert(`Only ${result.stock} units of ${result.patrikaId} are in stock.`);
      return;
    }

    addToCart(result);
    alert(`${result.patrikaId} added to cart.`);
  };

  const availableStock = result
    ? Math.max(
        0,
        result.stock -
          cart
            .filter((item) => item.patrikaId === result.patrikaId)
            .reduce((total, item) => total + Number(item.qty), 0),
      )
    : 0;

  const insufficientStock = result && result.qty > availableStock;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Page heading */}
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-700">
            <span className="h-2 w-2 rounded-full bg-violet-600" />
            PRAGYAPRINT
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Rate Calculator
          </h1>

          {/* <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
            Calculate production costs, review your margin, and add Patrika
            designs to your cart.
          </p> */}
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_0.9fr]">
          {/* Calculator form */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h8" />
                  </svg>
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Calculate pricing
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure your design and order.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={calculateRate} className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="catname" className={labelClass}>
                    Category
                  </label>
                  <select
                    id="catname"
                    name="catname"
                    value={form.catname}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="A">A</option>
                    <option value="V">V</option>
                    <option value="B" >B</option>
                    <option value="J">J</option>
                    <option value="S">S</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="catNo" className={labelClass}>
                    Patrika number
                  </label>
                  <input
                    id="catNo"
                    name="catNo"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    required
                    placeholder="e.g. 101"
                    value={form.catNo}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="qty" className={labelClass}>
                    Order quantity
                  </label>
                  <select
                    id="qty"
                    name="qty"
                    value={form.qty}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {quantities.map((q) => (
                      <option key={q} value={q}>
                        {q.toLocaleString("en-IN")} cards
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="margin" className={labelClass}>
                    Margin (%)
                  </label>
                  <div className="relative">
                    <input
                      id="margin"
                      name="margin"
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      required
                      value={form.margin}
                      onChange={handleChange}
                      className={`${inputClass} pr-10`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      %
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Applied to the calculated base total.
                  </p>
                </div>
              </div>

              {/* Optional costs */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900">
                  Additional options
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Include any extra production costs.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      name="packing"
                      checked={form.packing}
                      onChange={handleChange}
                      disabled={loadingPricing || !hasOptionRate("packing")}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">
                        Packing
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {loadingPricing
                          ? "Loading packing rate..."
                          : hasOptionRate("packing")
                            ? `₹${formatCurrency(getOptionRate("packing"))} per card`
                            : "Rate unavailable"}
                      </span>
                      <span className="hidden mt-1 block text-xs text-gray-500">
                        ₹3 per card
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {form.packing && hasOptionRate("packing")
                        ? `₹${(Number(form.qty) * getOptionRate("packing")).toLocaleString("en-IN")}`
                        : "Optional"}
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      name="color"
                      checked={form.color}
                      onChange={handleChange}
                      disabled={
                        loadingPricing ||
                        !Number.isFinite(
                          Number(pricingParameters?.additional?.color),
                        )
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">
                        Digital Color
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {loadingPricing
                          ? "Loading digital printing rate..."
                          : `₹${pricingParameters?.additional?.color ?? "—"} per card`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {form.color && hasOptionRate("color")
                        ? `₹${(Number(form.qty) * getOptionRate("color")).toLocaleString("en-IN")}`
                        : "Optional"}
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      name="nameSlip"
                      checked={form.nameSlip}
                      onChange={handleChange}
                      disabled={
                        loadingPricing ||
                        !Number.isFinite(
                          Number(pricingParameters?.additional?.nameSlip),
                        )
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">
                        Name Slip
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {loadingPricing
                          ? "Loading name slip rate..."
                          : `₹${pricingParameters?.additional?.nameSlip ?? "—"} per card`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {form.nameSlip && pricingParameters
                        ? `₹${(Number(form.qty) * Number(pricingParameters?.additional?.nameSlip)).toLocaleString("en-IN")}`
                        : "Optional"}
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      name="plasticWrap"
                      checked={form.plasticWrap}
                      onChange={handleChange}
                      disabled={
                        loadingPricing ||
                        !Number.isFinite(
                          Number(pricingParameters?.additional?.plasticWrap),
                        )
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">
                        Plastic Wrap
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {loadingPricing
                          ? "Loading plastic wrap rate..."
                          : `₹${pricingParameters?.additional?.plasticWrap ?? "—"} per card`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {form.plasticWrap && pricingParameters
                        ? `₹${(Number(form.qty) * Number(pricingParameters?.additional?.plasticWrap)).toLocaleString("en-IN")}`
                        : "Optional"}
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      name="stickerCommon"
                      checked={form.stickerCommon}
                      onChange={handleChange}
                      disabled={
                        loadingPricing ||
                        !Number.isFinite(
                          Number(pricingParameters?.additional?.stickerCommon),
                        )
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">
                        Sticker Common
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {loadingPricing
                          ? "Loading sticker common rate..."
                          : `₹${pricingParameters?.additional?.stickerCommon ?? "—"} per card`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {form.stickerCommon && pricingParameters
                        ? `₹${(Number(form.qty) * Number(pricingParameters?.additional?.stickerCommon)).toLocaleString("en-IN")}`
                        : "Optional"}
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      name="stickerCustom"
                      checked={form.stickerCustom}
                      onChange={handleChange}
                      disabled={loadingPricing || !hasOptionRate("stickerCustom")}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">
                        Sticker Custom
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {loadingPricing
                          ? "Loading sticker custom rate..."
                          : hasOptionRate("stickerCustom")
                            ? `₹${formatCurrency(getOptionRate("stickerCustom"))} per card`
                            : "Rate unavailable"}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {form.stickerCustom && hasOptionRate("stickerCustom")
                        ? `₹${(Number(form.qty) * getOptionRate("stickerCustom")).toLocaleString("en-IN")}`
                        : "Optional"}
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={calculating || loadingPricing || !pricingParameters}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {calculating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                    Calculate Rate
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Results panel */}
          <section
            aria-live="polite"
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-6"
          >
            <div className="border-b border-gray-100 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Calculation result
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Your estimated order pricing.
                  </p>
                </div>
              </div>
            </div>

            {result ? (
              <div className="p-5 sm:p-7">
                <div className="rounded-2xl bg-violet-50 p-5 sm:p-6">
                  <p className="text-sm font-medium text-violet-700">
                    Total order cost
                  </p>
                  <p className="mt-2 break-words text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                    ₹{result.finalCost.toLocaleString("en-IN")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                      {result.patrikaId}
                    </span>
                    <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                      {result.qty.toLocaleString("en-IN")} cards
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Cost per card</p>
                    <p className="mt-2 break-words text-lg font-semibold text-gray-900">
                      ₹{formatCurrency(result.perCost)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Base catalog rate</p>
                    <p className="mt-2 break-words text-lg font-semibold text-gray-900">
                      ₹{formatCurrency(result.catRate)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Print type</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-gray-900">
                      {result.printType}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Available stock</p>
                    <p
                      className={`mt-2 text-lg font-semibold ${
                        availableStock < result.qty
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {availableStock.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-gray-100">
                  {/* <button
                    type="button"
                    onClick={() => setShowProfit((prev) => !prev)}
                    aria-expanded={showProfit}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <span>Profit breakdown</span>
                    <span className="flex items-center gap-2 text-violet-700">
                      {showProfit ? "Hide" : "Show"}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`h-4 w-4 transition-transform ${
                          showProfit ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button> */}

                  {/* {showProfit && (
                    <div className="space-y-3 border-t border-gray-100 p-4">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-gray-500">Calculated margin</span>
                        <span className="font-medium text-gray-900">
                          ₹{Math.round(result.marginAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-gray-500">
                          Accessory margin deduction
                        </span>
                        <span className="font-medium text-gray-900">
                          −₹
                          {Math.round(
                            result.marginAmount -
                              result.profit +
                              (result.profit - result.profit)
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-gray-100 pt-3 text-sm">
                        <span className="font-medium text-gray-700">
                          Estimated profit
                        </span>
                        <span className="font-semibold text-emerald-700">
                          ₹{result.profit.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )} */}
                </div>

                {insufficientStock && (
                  <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    Insufficient stock. Only {availableStock} cards remain
                    available after accounting for your cart.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={Boolean(insufficientStock)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M3 3h2l2.4 12.2a2 2 0 002 1.6h7.8a2 2 0 002-1.6L21 8H6" />
                    <circle cx="10" cy="20" r="1" />
                    <circle cx="18" cy="20" r="1" />
                  </svg>
                  {insufficientStock ? "Insufficient Stock" : "Add to Cart"}
                </button>

                <p className="mt-3 text-center text-xs text-gray-400">
                  Check the quantity and pricing before adding to your cart.
                </p>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M8 8h8M8 12h8M8 16h4" />
                  </svg>
                </div>

                <h3 className="mt-5 font-semibold text-gray-900">
                  Your results will appear here
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                  Select a category, enter the Patrika number, configure your
                  order, and calculate the rate to see a detailed breakdown.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default FetchPage;
