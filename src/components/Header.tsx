"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";

const HeaderContent = () => {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") ?? "");
  }, [searchParams]);

  const shouldShowWhiteBg = isScrolled;
  const isAdminRoute = pathname && pathname.startsWith("/admin");
  const isAdminHeader = isAdminRoute && isAuthenticated && user?.role === "admin";

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length === 0) {
      router.push("/collections/all");
      return;
    }

    const nextParams = new URLSearchParams();
    nextParams.set("q", trimmedSearch);
    router.push(`/collections/all?${nextParams.toString()}`);
  };

  if (isAdminHeader) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="border-b border-orange-200">
          <div className="max-w-[1100px] mx-auto flex h-24 items-center justify-end px-4">
            <Button asChild variant="ghost" size="icon" className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300">
              <Link href="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-50 w-full shadow-sm transition-all duration-300 ${shouldShowWhiteBg ? 'bg-white' : 'bg-transparent'
      }`}>
      <div className={`border-b transition-colors duration-300 ${shouldShowWhiteBg ? 'border-orange-200' : 'border-orange-200/30'
        }`}>
        <div className="max-w-[1100px] mx-auto flex h-24 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex flex-col">
                <div className="relative h-10 flex items-center">
                  <span className="text-3xl font-bold bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent animate-flash-hindi">
                    एकमा
                  </span>
                  <span className="absolute text-3xl font-bold bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent animate-flash-english">
                    ekmaa
                  </span>
                </div>
                <span className="text-sm text-orange-600 font-medium tracking-wide">
                  यद् भावं तद् भवति
                </span>
              </div>
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden flex-1 md:flex md:max-w-[520px] lg:max-w-[560px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products"
                className="h-12 w-full rounded-full border border-orange-200 bg-white pl-11 pr-28 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <Button
                type="submit"
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild variant="ghost" size="icon" className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300">
                <Link href="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="icon" className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300">
                <Link href="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 md:hidden">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products"
                className="h-12 w-full rounded-full border border-orange-200 bg-white pl-11 pr-28 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <Button
                type="submit"
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-[1100px] mx-auto flex h-24 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3">
            <span className="text-3xl font-bold bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent">
              एकमा
            </span>
          </Link>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}
