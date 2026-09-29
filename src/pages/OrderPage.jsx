import React, { useMemo, useState } from "react";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { Trash2 } from "lucide-react";
import { db } from "../firebase";
import { useCart } from "../context/cartStore";

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const OrderPage = () => {
  const { cart, removeFromCart, clearCart, calculatedTotal } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [saving, setSaving] = useState(false);

  const balance = useMemo(
    () => Math.max(0, Number(finalAmount || 0) - Number(advancePayment || 0)),
    [finalAmount, advancePayment],
  );

  const placeOrder = async (event) => {
    event.preventDefault();
    const amount = Number(finalAmount);
    const advance = Number(advancePayment || 0);

    if (!cart.length) return;
    if (!customerName.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(advance) || advance < 0) {
      alert("Enter the customer name, final amount, and a valid advance payment.");
      return;
    }
    if (advance > amount) {
      alert("Advance payment cannot be more than the final amount.");
      return;
    }

    setSaving(true);
    try {
      const quantitiesByPatrika = cart.reduce((quantities, item) => {
        quantities[item.patrikaId] = (quantities[item.patrikaId] || 0) + Number(item.qty);
        return quantities;
      }, {});

      const orderRef = doc(collection(db, "orders"));
      await runTransaction(db, async (transaction) => {
        const stockSnapshots = await Promise.all(
          Object.entries(quantitiesByPatrika).map(async ([patrikaId, quantity]) => {
            const patrikaRef = doc(db, "patrika", patrikaId);
            const snapshot = await transaction.get(patrikaRef);
            return { patrikaId, patrikaRef, quantity, snapshot };
          }),
        );

        stockSnapshots.forEach(({ patrikaId, quantity, snapshot }) => {
          if (!snapshot.exists()) throw new Error(`${patrikaId} no longer exists.`);
          const stock = Number(snapshot.data().stock);
          if (!Number.isFinite(stock) || stock < quantity) {
            throw new Error(`${patrikaId} has only ${stock} in stock (you need ${quantity}).`);
          }
        });

        stockSnapshots.forEach(({ patrikaRef, quantity, snapshot }) => {
          transaction.update(patrikaRef, { stock: Number(snapshot.data().stock) - quantity });
        });

        transaction.set(orderRef, {
          customerName: customerName.trim(),
          finalAmount: amount,
          advancePayment: advance,
          balance,
          calculatedTotal,
          items: cart,
          isCompleted: false,
          createdAt: serverTimestamp(),
        });
      });

      clearCart();
      setCustomerName("");
      setFinalAmount("");
      setAdvancePayment("");
      alert("Order placed and stock updated.");
    } catch (error) {
      console.error("Unable to place order", error);
      alert(error.message || "Unable to place the order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-bold">Order Cart</h1>
        <p className="text-sm text-slate-500 mt-1">Review the calculated items, then enter the amount agreed with the customer.</p>

        {cart.length === 0 ? (
          <p className="py-10 text-center text-slate-500">Your cart is empty. Add a patrika from the Fetch page.</p>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 flex gap-3 items-start justify-between">
                  <div>
                    <p className="font-bold">{item.catname}{item.catNo} <span className="font-normal text-slate-500">× {item.qty}</span></p>
                    <p className="text-sm text-slate-600">{item.printType} · Margin {item.margin}% · {item.packing ? "Packing included" : "No packing"}</p>
                    <p className="text-sm text-slate-600">Calculated: {money(item.finalCost)} ({money(item.perCost)} each)</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Remove item">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-5 text-right font-semibold">Calculated cart total: {money(calculatedTotal)}</p>

            <form onSubmit={placeOrder} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6">
              <label className="flex flex-col gap-1 sm:col-span-2 text-sm font-semibold">Customer name
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border p-3 rounded-lg font-normal" required />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">Final total amount
                <input type="number" min="0" step="0.01" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} className="border p-3 rounded-lg font-normal" required />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">Advance payment
                <input type="number" min="0" step="0.01" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} className="border p-3 rounded-lg font-normal" />
              </label>
              <p className="sm:col-span-2 text-sm text-slate-600">Balance due: <span className="font-bold">{money(balance)}</span></p>
              <button disabled={saving} className="sm:col-span-2 bg-pink-800 disabled:bg-slate-400 text-white py-3 rounded-lg hover:bg-pink-700">
                {saving ? "Placing order..." : "Place Order & Update Stock"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
