import AdminClient from "./AdminClient";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin Dashboard | Ekmaa",
  description: "Manage your sacred items, orders, and customers.",
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading admin dashboard...</div>}>
      <AdminClient />
    </Suspense>
  );
}
