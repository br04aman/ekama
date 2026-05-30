"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, getImageUrl } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Settings, LayoutDashboard, ShoppingBag, Tags, Video } from "lucide-react";

export type StoreSettingsDoc = {
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
    heroCollectionIds: string[];
    trendingProductIds: string[];
    newArrivalsProductIds: string[];
    promoBannerTitle: string;
    promoBannerVisible: boolean;
    promoBannerImages: string[];
    videoPromoTitle: string;
    videoPromoVisible: boolean;
    videoPromoUrls: string[];
    testimonials: {
        id: string;
        name: string;
        location: string;
        rating: number;
        text: string;
        image: string;
        verified: boolean;
    }[];
};

const defaultSettings: StoreSettingsDoc = {
    heroTitle: "Hero Section",
    heroVisible: true,
    trendingTitle: "Trending Now",
    trendingVisible: true,
    newArrivalsTitle: "New Arrivals",
    newArrivalsVisible: true,
    collectionsTitle: "Shop Our Collections",
    collectionsVisible: true,
    reviewsTitle: "Customer Reviews",
    reviewsVisible: true,
    featuresTitle: "Why Choose Us",
    featuresVisible: true,
    heroCollectionIds: [],
    trendingProductIds: [],
    newArrivalsProductIds: [],
    promoBannerTitle: "Promotional Banner",
    promoBannerVisible: true,
    promoBannerImages: ["/images/banner.jpg"],
    videoPromoTitle: "Experience the Divine",
    videoPromoVisible: true,
    videoPromoUrls: [],
    testimonials: [
        {
            id: "1",
            name: "Priya Sharma",
            location: "Mumbai",
            rating: 5,
            text: "The quality of the rudraksha beads is exceptional. I can feel the positive energy every time I wear them.",
            image: "https://images.unsplash.com/photo-1605648813351-5b746813ac47?q=80&w=600&auto=format&fit=crop",
            verified: true,
        },
    ],
};

const StoreSettings = () => {
    const { token } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettingsDoc>(defaultSettings);
    const [products, setProducts] = useState<{ id: string, name: string, image: string }[]>([]);
    const [collections, setCollections] = useState<{ id: string, name: string, image: string }[]>([]);

    useEffect(() => {
        const fetchSettingsAndProducts = async () => {
            try {
                const [settingsRes, productsRes, collectionsRes] = await Promise.all([
                    apiFetch("/api/settings/home_page_layout"),
                    apiFetch("/api/products?limit=100"), 
                    apiFetch("/api/collections?limit=100") 
                ]);

                if (settingsRes && (settingsRes as StoreSettingsDoc).heroTitle !== undefined) {
                    setSettings({
                        ...defaultSettings,
                        ...(settingsRes as StoreSettingsDoc),
                    });
                }

                if (productsRes && (productsRes as any).data) {
                    const mapped = ((productsRes as any).data || []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        image: Array.isArray(p.images) ? p.images[0] : ""
                    }));
                    setProducts(mapped);
                }

                if (collectionsRes && (collectionsRes as any).data) {
                    const mapped = ((collectionsRes as any).data || []).map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        image: c.image || ""
                    }));
                    setCollections(mapped);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettingsAndProducts();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch("/api/settings/home_page_layout", {
                method: "POST",
                body: JSON.stringify(settings),
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({ title: "Settings saved", description: "Homepage layout updated successfully." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof StoreSettingsDoc, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="py-20 text-center">Loading settings...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Homepage Configuration</h1>
                <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Hero & Collections Section */}
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
                <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 text-orange-500" />
                    <h2 className="text-white font-bold">Hero & Collections Selection</h2>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700">Hero Section Visibility</label>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                                <Switch 
                                    checked={settings.heroVisible} 
                                    onCheckedChange={(val) => updateSetting("heroVisible", val)} 
                                />
                                <span className="text-sm font-medium">{settings.heroVisible ? "Visible" : "Hidden"}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700">Collections Title</label>
                            <Input 
                                value={settings.collectionsTitle} 
                                onChange={(e) => updateSetting("collectionsTitle", e.target.value)}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700">Select Collections for Hero (Top Slider)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {collections.map(c => (
                                <div 
                                    key={c.id}
                                    onClick={() => {
                                        const exists = settings.heroCollectionIds.includes(c.id);
                                        updateSetting("heroCollectionIds", exists 
                                            ? settings.heroCollectionIds.filter(id => id !== c.id)
                                            : [...settings.heroCollectionIds, c.id]
                                        );
                                    }}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                                        settings.heroCollectionIds.includes(c.id) 
                                            ? "border-orange-500 bg-orange-50" 
                                            : "border-slate-100 hover:border-slate-200 bg-white"
                                    }`}
                                >
                                    <p className="text-xs font-bold truncate">{c.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trending & New Arrivals */}
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
                <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                    <h2 className="text-white font-bold">Featured Products</h2>
                </div>
                <CardContent className="p-6 space-y-8">
                    {/* Trending */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700">Trending Section</label>
                            <Switch 
                                checked={settings.trendingVisible} 
                                onCheckedChange={(val) => updateSetting("trendingVisible", val)} 
                            />
                        </div>
                        <Input 
                            placeholder="Section Title"
                            value={settings.trendingTitle} 
                            onChange={(e) => updateSetting("trendingTitle", e.target.value)}
                            className="h-12 rounded-xl mb-4"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {products.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => {
                                        const exists = settings.trendingProductIds.includes(p.id);
                                        updateSetting("trendingProductIds", exists 
                                            ? settings.trendingProductIds.filter(id => id !== p.id)
                                            : [...settings.trendingProductIds, p.id]
                                        );
                                    }}
                                    className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer ${
                                        settings.trendingProductIds.includes(p.id) 
                                            ? "border-orange-500 bg-orange-50" 
                                            : "border-slate-100 hover:border-slate-200 bg-white"
                                    }`}
                                >
                                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden">
                                        <img src={getImageUrl(p.image)} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[10px] font-bold truncate">{p.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* New Arrivals */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700">New Arrivals Section</label>
                            <Switch 
                                checked={settings.newArrivalsVisible} 
                                onCheckedChange={(val) => updateSetting("newArrivalsVisible", val)} 
                            />
                        </div>
                        <Input 
                            placeholder="Section Title"
                            value={settings.newArrivalsTitle} 
                            onChange={(e) => updateSetting("newArrivalsTitle", e.target.value)}
                            className="h-12 rounded-xl mb-4"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {products.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => {
                                        const exists = settings.newArrivalsProductIds.includes(p.id);
                                        updateSetting("newArrivalsProductIds", exists 
                                            ? settings.newArrivalsProductIds.filter(id => id !== p.id)
                                            : [...settings.newArrivalsProductIds, p.id]
                                        );
                                    }}
                                    className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer ${
                                        settings.newArrivalsProductIds.includes(p.id) 
                                            ? "border-orange-500 bg-orange-50" 
                                            : "border-slate-100 hover:border-slate-200 bg-white"
                                    }`}
                                >
                                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden">
                                        <img src={getImageUrl(p.image)} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[10px] font-bold truncate">{p.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Banners */}
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
                <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
                    <Tags className="h-5 w-5 text-orange-500" />
                    <h2 className="text-white font-bold">Promotional Banners</h2>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Promo Banner Visibility</label>
                        <Switch 
                            checked={settings.promoBannerVisible} 
                            onCheckedChange={(val) => updateSetting("promoBannerVisible", val)} 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Banner Image URLs</label>
                        {settings.promoBannerImages.map((url, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Input 
                                    value={url} 
                                    onChange={(e) => {
                                        const newImages = [...settings.promoBannerImages];
                                        newImages[idx] = e.target.value;
                                        updateSetting("promoBannerImages", newImages);
                                    }}
                                    className="h-12 rounded-xl"
                                />
                                <Button 
                                    variant="destructive" 
                                    onClick={() => updateSetting("promoBannerImages", settings.promoBannerImages.filter((_, i) => i !== idx))}
                                    className="rounded-xl h-12 w-12 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button 
                            variant="outline" 
                            onClick={() => updateSetting("promoBannerImages", [...settings.promoBannerImages, ""])}
                            className="w-full h-12 rounded-xl border-dashed border-2 gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Banner URL
                        </Button>
                    </div>

                    <div className="h-px bg-slate-100 my-6" />

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Video Promo Visibility</label>
                        <Switch 
                            checked={settings.videoPromoVisible} 
                            onCheckedChange={(val) => updateSetting("videoPromoVisible", val)} 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700">Video Title</label>
                        <Input 
                            value={settings.videoPromoTitle} 
                            onChange={(e) => updateSetting("videoPromoTitle", e.target.value)}
                            className="h-12 rounded-xl"
                        />
                        <label className="text-sm font-bold text-slate-700">Video URLs (Direct MP4/WebM)</label>
                        {settings.videoPromoUrls.map((url, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Input 
                                    value={url} 
                                    onChange={(e) => {
                                        const newUrls = [...settings.videoPromoUrls];
                                        newUrls[idx] = e.target.value;
                                        updateSetting("videoPromoUrls", newUrls);
                                    }}
                                    className="h-12 rounded-xl"
                                />
                                <Button 
                                    variant="destructive" 
                                    onClick={() => updateSetting("videoPromoUrls", settings.videoPromoUrls.filter((_, i) => i !== idx))}
                                    className="rounded-xl h-12 w-12 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button 
                            variant="outline" 
                            onClick={() => updateSetting("videoPromoUrls", [...settings.videoPromoUrls, ""])}
                            className="w-full h-12 rounded-xl border-dashed border-2 gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Video URL
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-2xl font-bold shadow-lg shadow-orange-100">
                    {saving ? "Saving Settings..." : "Save All Changes"}
                </Button>
            </div>
        </div>
    );
};

export default StoreSettings;
