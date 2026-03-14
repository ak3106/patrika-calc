import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
// Using Lucide icons for that premium look
import { Trash2, Search, Plus, Database, Package, IndianRupee, Eye, X } from "lucide-react";

const ViewPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCategory, setSortCategory] = useState("ALL");
  
  // State for the View Modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "patrika"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Move this record to trash?")) return;
    try {
      await deleteDoc(doc(db, "patrika", id));
      setRecords(records.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const filteredRecords = records.filter((item) => {
    const matchesCategory = sortCategory === "ALL" || item.catname === sortCategory;
    const matchesSearch = item.catNo?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.printType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 relative">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Patrika Inventory</h1>
            {/* <p className="text-sm text-slate-500">Overview of all printed records</p> */}
          </div>
          {/* <button  
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm">
            <Plus size={18} /> Add New
          </button> */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Total" value={records.length} icon={<Database size={20} className="text-indigo-600" />} />
          <StatCard title="Category" value={sortCategory} icon={<Package size={20} className="text-amber-600" />} />
          {/* <StatCard title="Revenue" value="Live" icon={<IndianRupee size={20} className="text-emerald-600" />} /> */}
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search Cat No..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm overflow-x-auto">
            {["ALL", "A", "V", "J", "S"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSortCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortCategory === cat ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Record</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 hidden md:table-cell">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 <tr><td colSpan="3" className="p-10 text-center animate-pulse text-slate-400">Loading...</td></tr>
              ) : filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {item.catname}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">#{item.catNo}</div>
                        <div className="text-xs text-indigo-500 font-medium">₹{item.catRate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-sm font-medium text-slate-600">{item.printType}</div>
                    <div className="text-xs text-slate-400">{item.noPrints} Prints</div>
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
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Record Details</h2>
              <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <DetailBox label="Category Name" value={selectedRecord.catname} />
              <DetailBox label="Catalog No" value={selectedRecord.catNo} />
              <DetailBox label="Rate (per piece)" value={`₹${selectedRecord.catRate}`} />
              <DetailBox label="Total Prints" value={selectedRecord.noPrints} />
              <DetailBox label="Print Type" value={selectedRecord.printType} />
              <DetailBox label="Design Slab" value={selectedRecord.designSlab} />
              <div className="col-span-2">
                <DetailBox label="Accessories" value={selectedRecord.accessories || "None"} />
              </div>
              <div className="col-span-2">
                <DetailBox label="Document ID" value={selectedRecord.id} isMono />
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
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
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{title}</p>
      <p className="text-xl font-extrabold text-slate-800">{value}</p>
    </div>
  </div>
);

const DetailBox = ({ label, value, isMono = false }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
    <p className={`text-slate-800 font-semibold ${isMono ? 'font-mono text-xs break-all' : 'text-sm'}`}>
      {value}
    </p>
  </div>
);

export default ViewPage;