"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch, BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Star, ChevronLeft, ChevronRight, Check, ChevronDown, ShieldCheck, Truck, RotateCcw, ShoppingCart, Percent, Sparkles, Tag, FileText } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  images: string[];
  specifications?: Record<string, string>;
  tags?: string[];
  collection?: string;
  adminProductId?: string;
  siddhAvailable?: boolean;
};

export default function ProductDetailsClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isEnergized, setIsEnergized] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = id || "rudraksha-bracelet-sample-1";
        const res = await apiFetch(`/api/products/${productId}`) as { data: Product };
        if (!active) return;
        const raw = res.data;
        const images = Array.isArray(raw.images)
          ? raw.images.map((image) => {
            if (!image) return "";
            if (image.startsWith("data:") || image.startsWith("http")) return image;
            if (image.startsWith("/uploads")) return `${BASE_URL}${image}`;
            return image;
          })
          : [];
        setProduct({ ...raw, images: images.filter(Boolean) });
      } catch (e) {
        if (!active) return;
        const message = e instanceof Error ? e.message : "Failed to load product";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      active = false;
    };
  }, [id]);

  const mainImage = useMemo(() => {
    const imgs = product?.images || [];
    return imgs[selectedImageIdx] || imgs[0] || "/placeholder.svg";
  }, [product, selectedImageIdx]);

  const images = useMemo(() => product?.images || [], [product]);

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentPrice = product?.price || 0;
  const oldPrice = product?.originalPrice || currentPrice;
  const energizedPrice = isEnergized ? 49 : 0;
  const finalPrice = currentPrice + energizedPrice;
  const finalOldPrice = oldPrice + energizedPrice;
  const discountPercent = oldPrice > currentPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;

  const handleAddToCart = (directBuy = false) => {
    if (!product) return;
    setAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images[0] || "/placeholder.svg",
      quantity: qty,
      energized: isEnergized
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`
    });
    
    setAdding(false);
    if (directBuy) {
      router.push("/cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1100px] mx-auto px-4 py-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-100 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-6 bg-slate-100 rounded w-1/4" />
              <div className="h-24 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-red-500 mb-4">{error || "Product not found"}</p>
          <Link href="/" className="text-orange-600 font-bold hover:underline">
            Go back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header />
      <main className="max-w-[1100px] mx-auto px-4 py-4 md:py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 mb-4 md:mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/collections/all" className="hover:text-orange-600">Collections</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Left Column - Images */}
          <div className="space-y-3 md:space-y-4">
            <div className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-3 md:top-4 right-3 md:right-4 p-2.5 md:p-3 bg-white/90 rounded-full shadow-md text-orange-600 transition-all hover:scale-110 active:scale-95"
              >
                <Heart className={`h-5 w-5 md:h-6 md:w-6 ${isInWishlist(product.id) ? "fill-orange-600" : ""}`} />
              </button>
              
              {images.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImageIdx === idx ? "border-orange-500 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="flex flex-col">
            <div className="mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold gap-0.5">
                  <span>{product.rating || 4.5}</span>
                  <Star className="h-3 w-3 fill-white" />
                </div>
                <span className="text-xs md:text-sm text-slate-500 font-medium">
                  {product.reviewCount || 128} Reviews
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Lab Certified</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-bold text-orange-600">₹{finalPrice}</span>
                {finalOldPrice > finalPrice && (
                  <>
                    <span className="text-base md:text-lg text-slate-400 line-through">₹{finalOldPrice}</span>
                    <span className="text-sm md:text-base font-bold text-green-600">{discountPercent}% OFF</span>
                  </>
                )}
              </div>
            </div>

            {/* Product description could go here */}
            {product.description && (
              <p className="text-sm md:text-base text-slate-600 mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex gap-3 md:gap-4">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={adding}
                  className="flex-1 h-12 md:h-14 bg-orange-100 text-orange-600 font-bold rounded-xl hover:bg-orange-200 transition-all flex items-center justify-center gap-2 border border-orange-200"
                >
                  <ShoppingCart className="h-5 w-5" />
                  ADD TO CART
                </button>
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={adding}
                  className="flex-[1.5] h-12 md:h-14 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                  BUY NOW
                </button>
              </div>

              {/* Shipping info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-600">Free Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-600">7-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
