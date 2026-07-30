export const dynamic = 'force-dynamic'; // Force dynamic rendering

import { Metadata } from "next";
import { apiFetch, BASE_URL } from "@/lib/api";
import ProductDetailsClient from "./ProductDetailsClient";

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

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await apiFetch(`/api/products/${id}`, { cache: 'no-store' }) as { data: Product };
    return res.data;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | Ekmaa",
    };
  }

  const imageUrl = product.images?.[0]?.startsWith('http') 
    ? product.images[0] 
    : `${BASE_URL}${product.images?.[0]}`;

  return {
    title: `${product.name} | Ekmaa`,
    description: product.description || `Buy ${product.name} at Ekmaa. Authentic spiritual products.`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailsClient id={id} />;
}
