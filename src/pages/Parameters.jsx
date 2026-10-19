import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./../firebase";

export default function Parameters() {
  const [formData, setFormData] = useState({
    riso: "",
    screen: "",
    digital: "",
    additional: {
      color: "",
      nameSlip: "",
      packing: "",
      plasticWrap: "",
      stickerCommon: "",
      stickerCustom: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    async function fetchPricingParameters() {
      try {
        // Read from the same document that the form saves to.
        const docRef = doc(db, "parameters", "pricing");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setFormData({
            riso: data.riso ?? "",
            screen: data.screen ?? "",
            digital: data.digital ?? "",
            additional: {
              color: data.additional?.color ?? "",
              nameSlip: data.additional?.nameSlip ?? "",
              packing: data.additional?.packing ?? "",
              plasticWrap: data.additional?.plasticWrap ?? "",
              stickerCommon: data.additional?.stickerCommon ?? "",
              stickerCustom: data.additional?.stickerCustom ?? "",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching parameters:", error);
        setMessage({
          text: "Failed to load parameters. Please refresh the page.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPricingParameters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const handleAdditionalChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      additional: {
        ...prev.additional,
        [name]: value === "" ? "" : Number(value),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      // Keep the document path consistent with the data being fetched.
      const docRef = doc(db, "parameters", "pricing");

      await setDoc(docRef, formData, { merge: true });

      setMessage({
        text: "Parameters updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating parameters:", error);

      setMessage({
        text: "Failed to update parameters. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200";

  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-medium">Loading parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 py-8 sm:px-6 md:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 mb-2">
            PARAMETERS / PRICING
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Calculation Parameters
          </h1>

            {/* <p className="mt-2 text-sm text-gray-500">
                Manage pricing multipliers and additional product costs.
            </p> */}
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
          {/* Status Message */}
          {message.text && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Parameters */}
            <section>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-gray-900">
                  Main Parameters
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set the primary calculation values.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="riso" className={labelClass}>
                    Riso
                  </label>
                  <input
                    id="riso"
                    type="number"
                    step="any"
                    name="riso"
                    value={formData.riso}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter Riso value"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="screen" className={labelClass}>
                    Screen
                  </label>
                  <input
                    id="screen"
                    type="number"
                    step="any"
                    name="screen"
                    value={formData.screen}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter Screen value"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="digital" className={labelClass}>
                    digital
                  </label>
                  <input
                    id="digital"
                    type="number"
                    step="any"
                    name="digital"
                    value={formData.digital}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter Digital value"
                    required
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200" />

            {/* Additional Costs */}
            <section>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-gray-900">
                  Additional Costs
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure the extra costs applied during pricing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Object.keys(formData.additional).map((key) => (
                  <div key={key}>
                    <label htmlFor={key} className={labelClass}>
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>

                    <input
                      id={key}
                      type="number"
                      step="any"
                      name={key}
                      value={formData.additional[key]}
                      onChange={handleAdditionalChange}
                      className={inputClass}
                      placeholder={`Enter ${key.replace(
                        /([A-Z])/g,
                        " $1"
                      )} cost`}
                      required
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-gray-500">
                Changes are saved to your pricing settings.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {saving && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}

                {saving ? "Saving Changes..." : "Save Parameters"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pricing Configuration
        </p>
      </div>
    </div>
  );
}
