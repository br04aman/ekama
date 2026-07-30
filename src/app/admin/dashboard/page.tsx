import AdminClient from "./AdminClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Ekmaa",
  description: "Manage your sacred items, orders, and customers.",
};

export default function AdminDashboardPage() {
  return <AdminClient />;
}
