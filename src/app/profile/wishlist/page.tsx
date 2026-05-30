"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/hooks/use-wishlist";
import { apiFetch, BASE_URL } from "@/lib/api";
import { ChevronLeft, Heart, ShoppingBag } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MyWishlist() {
    const { wishlistItems, toggleWishlist } = useWishlist();
    const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (!wishlistItems || wishlistItems.length === 0) {
                setWishlistProducts([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const queryParams = wishlistItems.map(id => `ids=${id}`).join("&");
                const res = await apiFetch(`/api/products/batch?${queryParams}`);
                if ((res as any)?.data) {
                    setWishlistProducts((res as any).data);
                }
            } catch (err: any) {
                console.error("Batch fetch failed, trying individual fetches...", err);
                
                // Fallback: Fetch items individually if batch fails (e.g., due to one stale ID)
                const individualResults = await Promise.allSettled(
                    wishlistItems.map(id => apiFetch(`/api/products/${id}`))
                );
                
                const validProducts = individualResults
                    .filter(result => result.status === 'fulfilled')
                    .map(result => (result as PromiseFulfilledResult<any>).value.data);
                
                setWishlistProducts(validProducts);
            } finally {
                setLoading(false);
            }
        };
        fetchWishlistProducts();
    }, [wishlistItems]);

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

                <h1 className="text-2xl font-bold text-slate-900 mb-8 px-1">My Wishlist</h1>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl h-64 shadow-sm p-3 space-y-3">
                                <Skeleton className="aspect-square w-full rounded-lg" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : wishlistProducts.length === 0 ? (
                    <Card className="bg-white rounded-2xl p-16 text-center shadow-sm border-none">
                        <Heart className="mx-auto h-16 w-16 text-slate-100 mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-slate-500 mb-8">Save items you love to find them later!</p>
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg active:scale-95 transition-all"
                        >
                            Start Exploring
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {wishlistProducts.map((product) => {
                            const image = Array.isArray(product.images) && product.images[0]
                                ? (product.images[0].startsWith("http") || product.images[0].startsWith("data:")
                                    ? product.images[0]
                                    : `${BASE_URL}${product.images[0]}`)
                                : "/placeholder.svg";

                            return (
                                <Card key={product.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 relative overflow-hidden flex flex-col">
                                    <div className="aspect-square bg-slate-50/50 p-2 relative">
                                        <NextImage
                                            src={image}
                                            alt={product.name}
                                            fill
                                            className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                        <button
                                            onClick={() => toggleWishlist(product.id)}
                                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-red-500 shadow-md transition-all active:scale-90 z-10"
                                        >
                                            <Heart className="w-4 h-4 fill-red-500" />
                                        </button>
                                    </div>
                                    <CardContent className="p-3 flex flex-col flex-1">
                                        <h4 className="text-[10px] md:text-sm font-bold text-slate-800 line-clamp-2 mb-2 min-h-[30px] md:min-h-[40px] uppercase tracking-tighter sm:tracking-normal">
                                            {product.name}
                                        </h4>
                                        <div className="mt-auto flex items-center justify-between">
                                            <p className="text-xs md:text-base font-bold text-orange-700">₹ {product.price}/-</p>
                                            <button
                                                onClick={() => router.push(`/products/${product.id}`)}
                                                className="p-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                                            >
                                                <ShoppingBag className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
