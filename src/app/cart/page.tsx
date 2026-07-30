"use client";

import Header from "@/components/Header";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, ChevronLeft, Ticket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function CartPage() {
  const { items, addItem, decrementItem, removeItem, totalItems, clearCart } = useCart();
  const router = useRouter();
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    try {
      setIsApplying(true);
      setCouponError(null);

      const response = await apiFetch('/api/customer/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });

      let calculatedDiscount = 0;
      if (response.discountType === 'percentage') {
        calculatedDiscount = Math.round(subtotal * (response.discountValue / 100));
      } else {
        calculatedDiscount = response.discountValue;
      }

      setDiscountAmount(calculatedDiscount);
      setAppliedCoupon(code);
      setCouponCode("");
    } catch (error: any) {
      setCouponError(error.message || "Invalid coupon code.");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError(null);
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-2 md:px-4 py-6 md:py-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        <h1 className="text-xl md:text-2xl font-bold mb-6 text-slate-900 px-2">Your Cart ({totalItems} items)</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm mx-2">
            <div className="mb-4 flex justify-center text-slate-300">
              <ShoppingCart className="h-16 w-16" />
            </div>
            <p className="mb-6 text-lg text-slate-600">Your cart is empty.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 relative">
            <div className="lg:col-span-2 space-y-3 px-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 md:gap-6 bg-white rounded-xl p-3 md:p-4 shadow-sm border border-slate-100 hover:border-orange-200 transition-all duration-300">
                  <div className="h-20 w-20 md:h-24 md:w-24 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-50">
                    <img src={it.image || "/placeholder.svg"} alt={it.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <h2 className="text-sm md:text-base font-semibold text-slate-900 line-clamp-1 mb-1">{it.name}</h2>
                    <p className="text-xs md:text-sm font-bold text-orange-700">₹ {it.price}/-</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => decrementItem(it.id)}
                          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 md:w-10 text-center font-bold text-slate-700 text-sm">{it.quantity}</span>
                        <button
                          onClick={() => addItem(it)}
                          disabled={it.quantity >= 10}
                          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="text-xs md:text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1 px-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
                <h2 className="text-lg font-bold mb-4 text-slate-900 border-b pb-3">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Price ({totalItems} items)</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 text-sm font-semibold">
                      <span>Discount ({appliedCoupon})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Delivery Charges</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="pt-3 border-t flex justify-between font-bold text-lg text-slate-900">
                    <span>Total Amount</span>
                    <span>₹{finalTotal}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-all uppercase"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplying || !couponCode}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                      {isApplying ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-2 ml-1">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-3">
                      <span className="text-xs text-green-700 font-bold uppercase">{appliedCoupon} Applied!</span>
                      <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:font-bold">Remove</button>
                    </div>
                  )}
                </div>

                <Link
                  href="/payment"
                  className="w-full inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Place Order
                </Link>
                <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                  Safe and Secure Payments. 100% Authentic Products.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
