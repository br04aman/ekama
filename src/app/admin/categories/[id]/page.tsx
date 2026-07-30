import AdminClient from "../../dashboard/AdminClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Collection | Ekmaa Admin",
};

export default function AdminCategoryPage() {
  return <AdminClient />;
}
