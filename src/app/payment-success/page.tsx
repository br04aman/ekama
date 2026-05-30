"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Thank you for your purchase! 🙏</h1>
          <p className="text-lg text-slate-600 mb-8">Your payment was successful.</p>
          
          {orderId && (
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Order Details</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 font-medium">Order ID:</span>
                  <span className="text-sm font-bold text-slate-900">#{orderId.slice(-8).toUpperCase()}</span>
                </div>
                {paymentId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 font-medium">Payment ID:</span>
                    <span className="text-sm font-bold text-slate-900">{paymentId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Link 
            href="/" 
            className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
