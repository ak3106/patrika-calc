import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center px-14 py-4 text-xl bg-slate-900 text-white">

      <h1 className="font-bold">PRAGYAPRINT</h1>

      <ul className="flex gap-10">
        <li>
          <Link to="/add" className="hover:text-pink-400">Add</Link>
        </li>

        <li>
          <Link to="/fetch" className="hover:text-pink-400">Fetch</Link>
        </li>

        <li>
          <Link to="/view" className="hover:text-pink-400">View</Link>
        </li>
      </ul>

    </div>
  );
};

export default Navbar;