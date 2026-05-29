import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ekama - Authentic Spiritual Products & Energy Stones",
  description: "Discover ekama's exclusive collection of lab-certified spiritual items, handcrafted prayer beads, energy stones, and meditation essentials for your spiritual journey.",
  openGraph: {
    title: "Ekama - Authentic Spiritual Products",
    description: "Lab-certified spiritual items, prayer beads, and energy stones",
    type: "website",
    images: ["/images/banner.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ekama",
    images: ["/images/banner.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100`}>
        <Providers>
          <div className="w-full min-h-screen bg-[#f1f3f6] relative overflow-x-hidden flex flex-col pb-16">
            {children}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
