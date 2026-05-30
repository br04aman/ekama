"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { AlertCircle, ChevronLeft, MapPin, Plus, CreditCard, Banknote, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  modal?: {
    ondismiss: () => void;
  };
  theme?: {
    color: string;
  };
};

type RazorpayConstructor = new (options: RazorpayOptions) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
};

export default function PaymentPage() {
  const { items, totalItems, clearCart } = useCart();
  const { user, token } = useAuth();
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const { toast } = useToast();
  const router = useRouter();

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState(true);

  // If cart is empty, redirect back to cart page
  useEffect(() => {
    if (totalItems === 0) {
      router.push("/cart");
    }
  }, [totalItems, router]);

  // Fetch user addresses
  useEffect(() => {
    if (!user || !token) {
      setAddressLoading(false);
      return;
    }
    const fetchAddresses = async () => {
      setAddressLoading(true);
      try {
        const res = await apiFetch('/api/users/addresses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetched: Address[] = res?.data?.addresses || [];
        setAddresses(fetched);
        if (fetched.length > 0) {
          setSelectedAddressId(fetched[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setAddressLoading(false);
      }
    };
    fetchAddresses();
  }, [user, token]);

  const loadScript = (src: string) => {
    return new Promise<boolean>((resolve) => {
      if (typeof document === 'undefined') return resolve(false);
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const formatAddress = (addr: Address) =>
    [addr.addressLine, addr.locality, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(', ');

  const handlePay = async () => {
    if (loading) return;

    if (addresses.length === 0) {
      toast({
        title: "Delivery address required",
        description: "Please add a delivery address in your profile before placing an order.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedAddressId) {
      toast({
        title: "Select a delivery address",
        description: "Please select one of your saved addresses to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        toast({ title: "Authentication required", description: "Please login to complete your purchase" });
        router.push("/login");
        return;
      }

      const shippingAddress = selectedAddress ? formatAddress(selectedAddress) : '';
      const shippingDetails = selectedAddress
        ? {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          addressLine: selectedAddress.addressLine,
          locality: selectedAddress.locality,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode
        }
        : null;

      const orderResponse = await apiFetch("/api/payments/create-order-with-items", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            adminProductId: item.adminProductId,
            image: item.image
          })),
          totalAmount: subtotal,
          userId: user.id,
          customerEmail: user.email,
          customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          paymentMethod: paymentMethod,
          shippingAddress,
          shippingDetails
        }),
      }) as { orderId: string; status: string };

      if (paymentMethod === 'cod') {
        await apiFetch("/api/payments/update-order-status", {
          method: "POST",
          body: JSON.stringify({
            orderId: orderResponse.orderId,
            status: 'Processing',
            paymentStatus: 'pending'
          }),
        });

        toast({ title: "Order placed successfully", description: "You have chosen Pay on Delivery." });
        clearCart();
        router.push(`/payment-success?orderId=${orderResponse.orderId}&paymentId=COD`);
        return;
      }

      const currency = "INR";
      const { orderId, amount } = await apiFetch("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: subtotal, currency }),
      }) as { orderId: string; amount: number; currency: string };

      if (!window.Razorpay) {
        const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!ok) {
          toast({ title: "Payment failed", description: "Unable to load Razorpay SDK" });
          return;
        }
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: amount.toString(),
        currency,
        name: "Ekama",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response: RazorpayHandlerResponse) {
          try {
            const verifyRes = await apiFetch("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!verifyRes || verifyRes.status !== "ok") {
              throw new Error("Signature verification failed");
            }

            await apiFetch("/api/payments/update-order-status", {
              method: "POST",
              body: JSON.stringify({
                orderId: orderResponse.orderId,
                status: 'completed',
                paymentStatus: 'paid',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id
              }),
            });

            toast({ title: "Payment successful" });
            clearCart();
            router.push(`/payment-success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}`);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({ title: "Payment failed", description: "Verification failed. Please contact support." });
          }
        },
        modal: {
          ondismiss: function () {
            toast({ title: "Payment cancelled" });
          },
        },
        theme: { color: "#ff6600" },
      };

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        toast({ title: "Payment failed", description: "Unable to load Razorpay SDK" });
        return;
      }
      const rzpay = new RazorpayCtor(options);
      rzpay.open();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: "Payment error", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        <h1 className="text-2xl font-bold mb-8 text-slate-900">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Address & Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Selection */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-slate-900">Delivery Address</h2>
                </div>
                <Link href="/profile/addresses" className="text-xs font-bold text-orange-600 hover:underline">
                  MANAGE
                </Link>
              </div>

              {addressLoading ? (
                <div className="py-10 text-center text-slate-400">Loading your addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 mb-4">No addresses found in your account.</p>
                  <Link
                    href="/profile/addresses"
                    className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-2 rounded-lg font-bold text-sm"
                  >
                    <Plus className="h-4 w-4" /> ADD NEW ADDRESS
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedAddressId === addr.id 
                          ? "border-orange-500 bg-orange-50/30" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedAddressId === addr.id ? "border-orange-500" : "border-slate-300"
                        }`}>
                          {selectedAddressId === addr.id && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-100 rounded text-slate-500">
                          {addr.label}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{addr.name}</span>
                        <span className="text-slate-500 text-sm font-medium">{addr.phone}</span>
                      </div>
                      <p className="text-xs text-slate-600 ml-7 leading-relaxed">
                        {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-bold text-slate-900">Payment Method</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    paymentMethod === 'razorpay' 
                      ? "border-orange-500 bg-orange-50/30" 
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'razorpay' ? "border-orange-500" : "border-slate-300"
                  }`}>
                    {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">Online Payment</p>
                    <p className="text-[10px] text-slate-500 font-medium">Cards, UPI, Netbanking</p>
                  </div>
                  <CreditCard className="h-5 w-5 text-slate-400" />
                </div>

                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    paymentMethod === 'cod' 
                      ? "border-orange-500 bg-orange-50/30" 
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'cod' ? "border-orange-500" : "border-slate-300"
                  }`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">Pay on Delivery</p>
                    <p className="text-[10px] text-slate-500 font-medium">Cash or QR at delivery</p>
                  </div>
                  <Banknote className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-lg font-bold mb-4 text-slate-900 border-b pb-3">Price Details</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Price ({totalItems} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="pt-4 border-t flex justify-between font-bold text-xl text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-orange-700">₹{subtotal}</span>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 mb-6">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <p className="text-[10px] font-bold text-green-700 uppercase">100% Safe and Secure Payment</p>
              </div>

              <button
                onClick={handlePay}
                disabled={loading || addressLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "PROCESSING..." : "CONFIRM ORDER"}
              </button>
              
              <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                By placing the order, you agree to Ekama's Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
