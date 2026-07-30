"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { ADDRESS_STATE_OPTIONS, isAlphabeticName } from "@/lib/address-options";
import { ChevronLeft, MapPin, Trash2, Edit2, Plus } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface Address {
    id: string;
    label: "HOME" | "WORK";
    name: string;
    phone: string;
    pincode: string;
    locality: string;
    addressLine: string;
    city: string;
    state: string;
    landmark?: string;
    altPhone?: string;
}

export default function ManageAddresses() {
    const { token, user, logout } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [addressForm, setAddressForm] = useState({
        name: "",
        phone: "",
        pincode: "",
        locality: "",
        addressLine: "",
        city: "",
        state: "",
        landmark: "",
        altPhone: "",
        label: "HOME" as Address["label"],
    });

    const fetchAddresses = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await apiFetch('/api/users/addresses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if ((res as any)?.data?.addresses) {
                setAddresses((res as any).data.addresses as Address[]);
            }
        } catch (e) {
            console.error("Failed to fetch addresses", e);
            toast({ title: "Failed to load addresses", description: String(e) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [token]);

    const resetAddressForm = () => {
        setAddressForm({
            name: "", phone: "", pincode: "", locality: "", addressLine: "",
            city: "", state: "", landmark: "", altPhone: "", label: "HOME"
        });
        setEditingAddressId(null);
        setIsAddingAddress(false);
    };

    const updateAddressField = (field: keyof typeof addressForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setAddressForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSaveAddress = async () => {
        if (!token) return;
        const normalizedName = addressForm.name.trim();
        const normalizedState = addressForm.state.trim();

        if (!isAlphabeticName(normalizedName)) {
            toast({
                title: "Invalid name",
                description: "Address name must contain alphabets only.",
                variant: "destructive",
            });
            return;
        }

        if (!ADDRESS_STATE_OPTIONS.includes(normalizedState as (typeof ADDRESS_STATE_OPTIONS)[number])) {
            toast({
                title: "Invalid state",
                description: "Please choose a state from the list only.",
                variant: "destructive",
            });
            return;
        }

        try {
            if (editingAddressId) {
                const res = await apiFetch(`/api/users/addresses/${editingAddressId}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ address: addressForm }),
                });
                if ((res as any)?.data?.addresses) setAddresses((res as any).data.addresses as Address[]);
            } else {
                const res = await apiFetch('/api/users/addresses', {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ address: addressForm }),
                });
                if ((res as any)?.data?.addresses) setAddresses((res as any).data.addresses as Address[]);
            }
            toast({ title: editingAddressId ? "Address updated" : "Address saved" });
            resetAddressForm();
        } catch (e) {
            toast({ title: "Error", description: String(e) });
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!token) return;
        try {
            const res = await apiFetch(`/api/users/addresses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if ((res as any)?.data?.addresses) setAddresses((res as any).data.addresses as Address[]);
            toast({ title: "Address removed" });
        } catch (e) {
            toast({ title: "Error", description: String(e) });
        }
    };

    if (!user) return null;

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

                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h1 className="text-2xl font-bold text-slate-900">Manage Addresses</h1>
                        {!isAddingAddress && (
                            <Button
                                onClick={() => {
                                    setEditingAddressId(null);
                                    setIsAddingAddress(true);
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-bold rounded-xl"
                            >
                                <Plus className="h-4 w-4" />
                                Add New
                            </Button>
                        )}
                    </div>

                    {isAddingAddress ? (
                        <Card className="bg-white rounded-2xl shadow-md border-none overflow-hidden">
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <h2 className="text-lg font-bold text-slate-900">{editingAddressId ? "Edit Address" : "Add New Address"}</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={addressForm.name}
                                            onChange={updateAddressField("name")}
                                            placeholder="Full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Phone</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={addressForm.phone}
                                            onChange={updateAddressField("phone")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Pincode</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={addressForm.pincode}
                                            onChange={updateAddressField("pincode")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Locality</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={addressForm.locality}
                                            onChange={updateAddressField("locality")}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Address (Area and Street)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={addressForm.addressLine}
                                        onChange={updateAddressField("addressLine")}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">City</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={addressForm.city}
                                            onChange={updateAddressField("city")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">State</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            value={addressForm.state}
                                            onChange={updateAddressField("state")}
                                        >
                                            <option value="">Select state</option>
                                            {ADDRESS_STATE_OPTIONS.map((state) => (
                                                <option key={state} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3 pt-4">
                                    <Button
                                        onClick={handleSaveAddress}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 rounded-xl"
                                    >
                                        {editingAddressId ? "Update Address" : "Save Address"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            resetAddressForm();
                                        }}
                                        className="md:w-32 py-6 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="py-20 text-center text-slate-400">Fetching your addresses...</div>
                            ) : addresses.length === 0 ? (
                                <Card className="bg-white rounded-2xl p-12 text-center shadow-sm border-none">
                                    <MapPin className="mx-auto h-12 w-12 text-slate-100 mb-4" />
                                    <p className="text-slate-500 mb-6">You haven't saved any addresses yet.</p>
                                    <Button
                                        onClick={() => {
                                            setEditingAddressId(null);
                                            setIsAddingAddress(true);
                                        }}
                                        className="bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold px-8 rounded-xl"
                                    >
                                        Add your first address
                                    </Button>
                                </Card>
                            ) : (
                                addresses.map((addr) => (
                                    <Card key={addr.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${addr.label === "HOME" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                                                        {addr.label}
                                                    </span>
                                                    <p className="font-bold text-slate-900">{addr.name}</p>
                                                    <p className="text-slate-500 font-medium">{addr.phone}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingAddressId(addr.id);
                                                            setAddressForm({ ...addr });
                                                            setIsAddingAddress(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                                                    >
                                                        <Edit2 className="h-4 w-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                                                {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
