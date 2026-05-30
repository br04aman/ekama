import AdminClient from "../../dashboard/AdminClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Collection | Ekama Admin",
};

export default function AdminCategoryPage() {
  return <AdminClient />;
}
