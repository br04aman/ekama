"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Skip auth check for admin login page
    if (pathname === "/admin") {
      setIsAuthorized(true);
      return;
    }

    if (!isAuthenticated) {
      router.push("/admin");
      return;
    }

    if (user?.role !== "admin") {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, user, router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-slate-500 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
