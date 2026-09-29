import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Trash2,
  Search,
  ClipboardList,
  Clock,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";

// ---------- helpers ----------
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toMillis = (ts) => (ts?.toMillis ? ts.toMillis() : 0);

// Cart item shape may vary, so read fields defensively
const itemLabel = (it) =>
  it.catNo ? `#${it.catNo}` : it.name || it.productName || "Item";
const itemQty = (it) => Number(it.qty ?? it.quantity ?? it.pieces ?? 1);
const itemRate = (it) => Number(it.catRate ?? it.rate ?? it.price ?? 0);

const ViewOrder = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [completing, setCompleting] = useState(false);

  // State for the View Modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const data = querySnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)); // newest first
      setRecords(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "orders", id));
      setRecords((prev) => prev.filter((item) => item.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const handleComplete = async (record) => {
    if (!window.confirm(`Mark ${record.customerName}'s order as completed?`))
      return;
    setCompleting(true);
    try {
      await updateDoc(doc(db, "orders", record.id), {
        isCompleted: true,
        completedAt: serverTimestamp(),
      });
      // update UI without refetching
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, isCompleted: true } : r))
      );
      setSelectedRecord((prev) => (prev ? { ...prev, isCompleted: true } : prev));
    } catch (error) {
      console.error("Complete Error:", error);
      alert("Could not complete the order. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const filteredRecords = records.filter((item) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && !item.isCompleted) ||
      (statusFilter === "COMPLETED" && item.isCompleted);
    const matchesSearch = item.customerName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = records.filter((r) => !r.isCompleted).length;
  const completedCount = records.length - pendingCount;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 relative">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Patrika Orders
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total"
            value={records.length}
            icon={<ClipboardList size={20} className="text-indigo-600" />}
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<Clock size={20} className="text-amber-600" />}
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          />
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search customer name..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm overflow-x-auto">
            {["ALL", "PENDING", "COMPLETED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 hidden md:table-cell">
                  Items
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 hidden sm:table-cell">
                  Balance
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center animate-pulse text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {item.customerName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">
                            {item.customerName}
                          </div>
                          <div className="text-xs text-indigo-500 font-medium">
                            {money(item.finalAmount)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm font-medium text-slate-600">
                        {item.items?.length || 0} Items
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-sm font-semibold text-slate-700">
                      {money(item.balance)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge completed={item.isCompleted} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">
                  Order Details
                </h2>
                <StatusBadge completed={selectedRecord.isCompleted} />
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto">
              <div className="p-6 grid grid-cols-2 gap-6">
                <DetailBox label="Customer" value={selectedRecord.customerName} />
                <DetailBox
                  label="Order Date"
                  value={formatDate(selectedRecord.createdAt)}
                />
                <DetailBox
                  label="Calculated Total"
                  value={money(selectedRecord.calculatedTotal)}
                />
                <DetailBox
                  label="Final Amount"
                  value={money(selectedRecord.finalAmount)}
                />
                <DetailBox
                  label="Advance Paid"
                  value={money(selectedRecord.advancePayment)}
                />
                <DetailBox label="Balance" value={money(selectedRecord.balance)} />

                {/* ITEMS */}
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Items ({selectedRecord.items?.length || 0})
                  </p>
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
                    {selectedRecord.items?.length ? (
                      selectedRecord.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-800">
                              {itemLabel(it)}
                              {it.catname ? ` · ${it.catname}` : ""}
                            </div>
                            <div className="text-xs text-slate-400">
                              {[it.printType, it.designSlab]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-700">
                              {itemQty(it)} × {money(itemRate(it))}
                            </div>
                            <div className="text-xs text-indigo-500 font-medium">
                              {money(itemQty(it) * itemRate(it))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-400">
                        No items
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <DetailBox label="Document ID" value={selectedRecord.id} isMono />
                </div>
              </div>
            </div>

            {/* FOOTER / MAIN ACTION */}
            <div className="p-6 bg-slate-50 flex flex-col gap-3">
              {selectedRecord.isCompleted ? (
                <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-lg font-bold">
                  <CheckCircle2 size={24} /> Order Completed
                </div>
              ) : (
                <button
                  onClick={() => handleComplete(selectedRecord)}
                  disabled={completing}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-lg font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99]"
                >
                  <CheckCircle2 size={24} />
                  {completing ? "Completing..." : "Complete Order"}
                </button>
              )}
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
        {title}
      </p>
      <p className="text-xl font-extrabold text-slate-800">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ completed }) =>
  completed ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={12} /> Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock size={12} /> Pending
    </span>
  );

const DetailBox = ({ label, value, isMono = false }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
    <p
      className={`text-slate-800 font-semibold ${
        isMono ? "font-mono text-xs break-all" : "text-sm"
      }`}
    >
      {value}
    </p>
  </div>
);

export default ViewOrder;