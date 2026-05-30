"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FormValues = {
  email: string;
  password: string;
};

export default function AdminLoginPage() {
  const { login, user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const { register, handleSubmit } = useForm<FormValues>();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    if (!roleChecked) {
      toast({ title: "Admin access required", description: "This account is not an admin." });
      setRoleChecked(true);
      logout();
    }
  }, [isAuthenticated, user, router, toast, logout, roleChecked]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      toast({ title: "Signed in", description: "Checking admin access..." });
    } catch (e) {
      toast({ title: "Login failed", description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme min-h-screen flex flex-col bg-[#f9f4e5] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      </div>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-md relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/20 via-slate-900/10 to-slate-900/5 border border-white/20 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] backdrop-blur-2xl ring-1 ring-white/10 p-8">
          <h1 className="text-2xl font-bold mb-6 text-orange-900">Admin Login</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Email</label>
            <Input type="email" placeholder="admin@example.com" {...register("email", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Password</label>
            <Input type="password" placeholder="••••••••" {...register("password", { required: true })} />
          </div>
          <Button type="submit" disabled={loading} className="bg-orange-700 hover:bg-orange-800 text-white font-bold h-12 rounded-xl transition-all active:scale-95">
            {loading ? "Signing in..." : "Login as Admin"}
          </Button>
          </form>
          <p className="text-sm mt-6 text-slate-500 text-center">
            Not an admin? <Link href="/login" className="text-orange-700 underline font-semibold">User login</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
