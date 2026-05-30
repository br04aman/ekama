import Categories from "@/components/Categories";
import Collections from "@/components/Collections";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductShowcase from "@/components/ProductShowcase";
import PromoBanner from "@/components/PromoBanner";
import Testimonials from "@/components/Testimonials";
import TrustBadges from "@/components/TrustBadges";
import VideoPromoBanner from "@/components/VideoPromoBanner";
import { apiFetch } from "@/lib/api";

type StoreSettingsDoc = {
  heroTitle: string;
  heroVisible: boolean;
  trendingTitle: string;
  trendingVisible: boolean;
  newArrivalsTitle: string;
  newArrivalsVisible: boolean;
  collectionsTitle: string;
  collectionsVisible: boolean;
  reviewsTitle: string;
  reviewsVisible: boolean;
  featuresTitle: string;
  featuresVisible: boolean;
  trendingProductIds: string[];
  newArrivalsProductIds: string[];
  promoBannerTitle: string;
  promoBannerVisible: boolean;
  promoBannerImages: string[];
  videoPromoTitle: string;
  videoPromoVisible: boolean;
  videoPromoUrls: string[];
  testimonials?: {
    id: string;
    name: string;
    location: string;
    rating: number;
    text: string;
    image: string;
    verified: boolean;
  }[];
  heroCollectionIds?: string[];
};

async function getSettings(): Promise<StoreSettingsDoc | null> {
  try {
    const res = await apiFetch("/api/settings/home_page_layout", {
      next: { revalidate: 3600 }
    });
    return res as StoreSettingsDoc;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

async function getInitialData(settings: StoreSettingsDoc | null) {
  const trendingProductIds = settings?.trendingProductIds || [];
  const newArrivalsProductIds = settings?.newArrivalsProductIds || [];
  
  const [collectionsRes, trendingRes, newArrivalsRes] = await Promise.all([
    apiFetch('/api/collections?limit=100', { next: { revalidate: 3600 } }),
    trendingProductIds.length > 0 
      ? apiFetch(`/api/products?ids=${trendingProductIds.join(',')}&limit=${trendingProductIds.length}`, { next: { revalidate: 3600 } })
      : apiFetch("/api/products?limit=6&sortBy=rating&sortOrder=DESC", { next: { revalidate: 3600 } }),
    newArrivalsProductIds.length > 0
      ? apiFetch(`/api/products?ids=${newArrivalsProductIds.join(',')}&limit=${newArrivalsProductIds.length}`, { next: { revalidate: 3600 } })
      : apiFetch("/api/products?limit=6&sortBy=createdAt&sortOrder=DESC", { next: { revalidate: 3600 } })
  ]);

  return {
    initialCollections: collectionsRes?.data || [],
    initialTrending: trendingRes?.data || [],
    initialNewArrivals: newArrivalsRes?.data || []
  };
}

export default async function Home() {
  const settings = await getSettings();
  const { initialCollections, initialTrending, initialNewArrivals } = await getInitialData(settings);

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <div className="max-w-[1100px] mx-auto w-full flex-1">
        <main className="flex flex-col gap-1 pt-1 pb-4">
          {(!settings || settings.heroVisible) && (
            <Categories 
              heroCollectionIds={settings?.heroCollectionIds} 
              initialData={initialCollections}
            />
          )}
          {(!settings || settings.promoBannerVisible) && (
            <PromoBanner imageUrls={settings?.promoBannerImages} />
          )}
          {(!settings || settings.collectionsVisible) && (
            <Collections title={settings?.collectionsTitle} />
          )}
          <ProductShowcase
            trendingTitle={settings?.trendingTitle}
            newArrivalsTitle={settings?.newArrivalsTitle}
            trendingVisible={settings ? settings.trendingVisible : true}
            newArrivalsVisible={settings ? settings.newArrivalsVisible : true}
            trendingProductIds={settings?.trendingProductIds}
            newArrivalsProductIds={settings?.newArrivalsProductIds}
            initialTrending={initialTrending}
            initialNewArrivals={initialNewArrivals}
          />
          {(!settings || settings.videoPromoVisible !== false) && (
            <VideoPromoBanner
              title={settings?.videoPromoTitle || "Experience the Divine"}
              videoUrls={settings?.videoPromoUrls || ["https://www.w3schools.com/html/mov_bbb.mp4"]}
            />
          )}
          <TrustBadges />
          {settings?.reviewsVisible && (
            <Testimonials title={settings?.reviewsTitle} testimonials={settings?.testimonials} />
          )}
          {(!settings || settings.featuresVisible) && (
            <Features title={settings?.featuresTitle} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
