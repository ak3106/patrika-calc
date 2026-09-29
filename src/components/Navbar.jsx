import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useCart } from "../context/cartStore";
import {
  Plus,
  Download,
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  Menu,
  X,
  Printer,
} from "lucide-react";

const links = [
  { to: "/add", label: "Add", icon: Plus },
  { to: "/fetch", label: "Fetch", icon: Download },
  { to: "/view", label: "View", icon: LayoutGrid },
  { to: "/orders", label: "Cart", icon: ShoppingCart, isCart: true },
  { to: "/order-list", label: "View Orders", icon: ClipboardList },
];

const CartBadge = ({ count }) =>
  count > 0 ? (
    <span className="ml-1 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-pink-500 text-white text-xs font-bold">
      {count}
    </span>
  ) : null;

const Navbar = () => {
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close the mobile menu when the route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-indigo-600 text-white shadow-md"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* BRAND */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Printer size={20} />
          </span>
          <span className="text-lg md:text-xl font-bold tracking-tight">
            PRAGYAPRINT
          </span>
        </Link>

        {/* DESKTOP LINKS */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, isCart }) => (
            <li key={to}>
              <NavLink to={to} className={linkClass}>
                <Icon size={18} />
                {label}
                {isCart && <CartBadge count={cart.length} />}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* MOBILE: cart shortcut + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <NavLink
            to="/orders"
            aria-label="Cart"
            className="relative p-2 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold">
                {cart.length}
              </span>
            )}
          </NavLink>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-800 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        <ul className="px-4 py-3 flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, isCart }) => (
            <li key={to}>
              <NavLink to={to} className={linkClass}>
                <Icon size={18} />
                {label}
                {isCart && <CartBadge count={cart.length} />}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;