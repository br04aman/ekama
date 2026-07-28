"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CreditCard, ShoppingBag, Sparkles, Heart, ChevronLeft, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
        <Header />
        <main className="flex-1 max-w-[1100px] mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 max-w-lg mx-auto">
            <User className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Your Account</h1>
            <p className="text-slate-500 mb-8">Please login to manage your sacred items and orders.</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Login to Profile
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const menuItems = [
    {
      label: "My Orders",
      icon: ShoppingBag,
      path: "/profile/orders",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Profile Information",
      icon: User,
      path: "/profile/info",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      label: "Manage Addresses",
      icon: CreditCard,
      path: "/profile/addresses",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "My Wishlist",
      icon: Heart,
      path: "/profile/wishlist",
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      label: "Support",
      icon: Sparkles,
      path: "/#support",
      color: "text-teal-600",
      bg: "bg-teal-50"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">

        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
        >
          <ChevronLeft className="h-6 w-6 pr-0.5" />
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-20 w-20 ring-4 ring-orange-50">
            <AvatarFallback className="text-xl bg-orange-100 text-orange-700 font-bold">
              {user?.firstName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Guest"}
            </h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:border-orange-200 hover:shadow-md transition-all duration-300"
            >
              <div className={`${item.bg} ${item.color} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{item.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage your {item.label.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
