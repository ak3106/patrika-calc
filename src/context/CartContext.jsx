import React, { useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartStore";
const STORAGE_KEY = "patrika-cart";

const loadCart = () => {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((currentCart) => [...currentCart, { ...item, id: crypto.randomUUID() }]);
  };

  const removeFromCart = (id) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const calculatedTotal = useMemo(
    () => cart.reduce((total, item) => total + Number(item.finalCost || 0), 0),
    [cart],
  );

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, calculatedTotal }}>
      {children}
    </CartContext.Provider>
  );
};
