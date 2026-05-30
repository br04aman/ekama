"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { ShoppingBag, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const data = await apiFetch(`/api/payments/user-orders/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders((data as any).orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-teal-100 text-teal-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status?: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
        <Header />
        <main className="flex-1 max-w-[1100px] mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 max-w-lg mx-auto">
            <ShoppingBag className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Your Orders</h1>
            <p className="text-slate-500 mb-8">Please login to view your order history.</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Login to View Orders
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-8 px-1">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
            <ShoppingBag className="mx-auto h-16 w-16 text-slate-100 mb-6" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-500 mb-10">You haven't placed any orders yet. Explore our collection!</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Order Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order ID</p>
                    <p className="text-sm font-bold text-slate-900">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Placed On</p>
                    <p className="text-sm font-semibold text-slate-600">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${getPaymentStatusColor(order.paymentStatus)}`}>
                      Payment: {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                          <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-orange-50/30 flex justify-between items-center border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-600">Total Amount</p>
                  <p className="text-lg font-bold text-orange-700">₹{order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
