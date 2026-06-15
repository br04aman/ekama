"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, getImageUrl } from "@/lib/api";
import { LayoutDashboard, Link as LinkIcon, Plus, ShoppingBag, Tags, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettingsDoc>(defaultSettings);
    const [products, setProducts] = useState<{ id: string, name: string, image: string }[]>([]);
    const [collections, setCollections] = useState<{ id: string, name: string, image: string }[]>([]);

    useEffect(() => {
        let active = true;

        const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
            return await Promise.race([
                promise,
                new Promise<T>((_resolve, reject) => {
                    setTimeout(() => reject(new Error("Request timed out")), ms);
                })
            ]);
        };

        const fetchSettingsAndProducts = async () => {
            try {
                setLoading(true);
                setLoadError(null);

                const [settingsRes, productsRes, collectionsRes] = await Promise.all([
                    withTimeout(apiFetch("/api/settings/home_page_layout"), 15000),
                    withTimeout(apiFetch("/api/products?limit=100"), 15000),
                    withTimeout(apiFetch("/api/collections?limit=100"), 15000)
                ]);

                if (settingsRes && (settingsRes as StoreSettingsDoc).heroTitle !== undefined) {
                    if (active) {
                        setSettings({
                            ...defaultSettings,
                            ...(settingsRes as StoreSettingsDoc),
                        });
                    }
                }

                if (productsRes && (productsRes as any).data) {
                    const mapped = ((productsRes as any).data || []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        image: Array.isArray(p.images) ? p.images[0] : ""
                    }));
                    if (active) setProducts(mapped);
                }

                if (collectionsRes && (collectionsRes as any).data) {
                    const mapped = ((collectionsRes as any).data || []).map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        image: c.image || ""
                    }));
                    if (active) setCollections(mapped);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
                if (active) {
                    setLoadError(err instanceof Error ? err.message : String(err));
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchSettingsAndProducts();
        return () => {
            active = false;
        };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch("/api/settings/home_page_layout", {
                method: "PUT",
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

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("images", file);

        try {
            toast({ title: "Uploading...", description: "Please wait while the banner is being uploaded." });
            const res = await apiFetch("/api/settings/upload", {
                method: "POST",
                body: formData,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res && res.urls && res.urls[0]) {
                const newImages = [...settings.promoBannerImages];
                newImages[index] = res.urls[0];
                updateSetting("promoBannerImages", newImages);
                toast({ title: "Upload successful", description: "Banner image updated." });
            }
        } catch (err) {
            console.error("Upload failed", err);
            toast({ title: "Upload failed", description: "Could not upload image. Please try using a URL instead.", variant: "destructive" });
        }
    };

    if (loading) return <div className="py-20 text-center">Loading settings...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {loadError && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-4 text-sm">
                    {loadError}
                </div>
            )}
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
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700">Banner Images</label>
                        {settings.promoBannerImages.map((url, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Banner {idx + 1}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => updateSetting("promoBannerImages", settings.promoBannerImages.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <LinkIcon className="h-3 w-3" /> Image URL
                                        </label>
                                        <Input 
                                            value={url} 
                                            placeholder="https://example.com/image.jpg"
                                            onChange={(e) => {
                                                const newImages = [...settings.promoBannerImages];
                                                newImages[idx] = e.target.value;
                                                updateSetting("promoBannerImages", newImages);
                                            }}
                                            className="h-10 rounded-xl bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Upload className="h-3 w-3" /> Direct Upload
                                        </label>
                                        <div className="relative h-10 w-full bg-white border border-slate-200 rounded-xl flex items-center px-3 cursor-pointer hover:border-orange-500 transition-all">
                                            <Upload className="h-4 w-4 text-slate-400 mr-2" />
                                            <span className="text-xs text-slate-500 truncate">Choose file...</span>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => handleBannerUpload(e, idx)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {url && (
                                    <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                                        <img src={getImageUrl(url)} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full">
                                            Preview
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button 
                            variant="outline" 
                            onClick={() => updateSetting("promoBannerImages", [...settings.promoBannerImages, ""])}
                            className="w-full h-12 rounded-xl border-dashed border-2 gap-2 text-slate-500 hover:text-orange-600 hover:border-orange-600"
                        >
                            <Plus className="h-4 w-4" /> Add New Banner Slot
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
