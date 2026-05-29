"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useCart } from "@/hooks/use-cart";
import { apiFetch, getImageUrl } from "@/lib/api";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  adminProductId?: string;
}

const normalizeImage = (image?: string) => {
  return getImageUrl(image);
};

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pathname = usePathname();

  // Determine if we are in a virtual category based on path
  const isTrending = pathname?.includes("/trending");
  const isNewArrivals = pathname?.includes("/new-arrivals");

  const collectionId = resolvedParams.id || (isTrending ? "trending" : isNewArrivals ? "new-arrivals" : "rudraksha-bracelets");
  const { addItem, decrementItem, items } = useCart();
  const [heroIdx, setHeroIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Sacred Collection");

  useEffect(() => {
    if (!hovering) {
      setHeroIdx(0);
      return;
    }
    const t = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(t);
  }, [hovering]);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let fetched: Product[] = [];

        if (isTrending) {
          setTitle("Trending Now");
          const settings = await apiFetch("/api/settings/home_page_layout") as any;
          const ids = settings?.trendingProductIds || [];
          if (ids.length > 0) {
            const res = await apiFetch(`/api/products?ids=${ids.join(",")}&limit=${ids.length}`) as { data?: Product[] };
            fetched = res.data || [];
          } else {
            const res = await apiFetch("/api/products?limit=20&sortBy=rating&sortOrder=DESC") as { data?: Product[] };
            fetched = res.data || [];
          }
        } else if (isNewArrivals) {
          setTitle("New Arrivals");
          const settings = await apiFetch("/api/settings/home_page_layout") as any;
          const ids = settings?.newArrivalsProductIds || [];
          if (ids.length > 0) {
            const res = await apiFetch(`/api/products?ids=${ids.join(",")}&limit=${ids.length}`) as { data?: Product[] };
            fetched = res.data || [];
          } else {
            const res = await apiFetch("/api/products?limit=20&sortBy=createdAt&sortOrder=DESC") as { data?: Product[] };
            fetched = res.data || [];
          }
        } else if (collectionId === "all") {
          setTitle("All Products");
          const res = await apiFetch("/api/products?limit=100") as { data?: Product[] };
          fetched = res.data || [];
        } else {
          const res = await apiFetch(`/api/collections/${collectionId}/products?limit=50`) as { data?: Product[] };
          fetched = res.data || [];
          setTitle(collectionId.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "));
        }

        if (!active) return;
        const mapped = fetched.map((item) => ({
          ...item,
          images: Array.isArray(item.images) ? item.images.map(normalizeImage) : [],
        }));
        setProducts(mapped);
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load products");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => { active = false; };
  }, [collectionId, isTrending, isNewArrivals]);

  const getItemCount = (productId: string) => {
    return items.find((i) => i.id === productId)?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-[1100px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">{title}</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-orange-600 font-semibold hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-slate-500">No products found in this collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const count = getItemCount(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden border border-orange-50 group"
                >
                  <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-slate-50">
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </Link>
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-orange-600 font-bold">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="mt-auto">
                      {count > 0 ? (
                        <div className="flex items-center justify-between bg-orange-50 rounded-lg p-1">
                          <button
                            onClick={() => decrementItem(product.id)}
                            className="w-8 h-8 flex items-center justify-center text-orange-600 font-bold hover:bg-orange-100 rounded-md transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-orange-900">{count}</span>
                          <button
                            onClick={() => addItem({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.images[0] || "/placeholder.svg"
                            })}
                            className="w-8 h-8 flex items-center justify-center text-orange-600 font-bold hover:bg-orange-100 rounded-md transition-colors"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.images[0] || "/placeholder.svg"
                          })}
                          className="w-full py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
