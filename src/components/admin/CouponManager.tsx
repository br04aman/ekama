"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Ticket, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minCartValue: number;
    isActive: boolean;
    createdAt: string;
}

const CouponManager = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    const [form, setForm] = useState({
        code: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: '',
        minCartValue: '0',
        isActive: true
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/api/admin/coupons');
            setCoupons(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load coupons.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                code: form.code,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                minCartValue: Number(form.minCartValue),
                isActive: form.isActive
            };

            if (editingId) {
                await apiFetch(`/api/admin/coupons/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast({ title: "Success", description: "Coupon updated." });
            } else {
                await apiFetch('/api/admin/coupons', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast({ title: "Success", description: "Coupon created." });
            }

            setEditingId(null);
            setShowForm(false);
            resetForm();
            fetchCoupons();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save coupon.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            toast({ title: "Success", description: "Coupon deleted." });
            fetchCoupons();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete coupon.",
                variant: "destructive"
            });
        }
    };

    const resetForm = () => {
        setForm({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minCartValue: '0',
            isActive: true
        });
    };

    if (loading) return <div className="py-20 text-center">Loading coupons...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Manage Coupons</h1>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700 gap-2">
                        <Plus className="h-4 w-4" /> Create New Coupon
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="border-none shadow-md overflow-hidden rounded-2xl bg-white">
                    <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
                        <Ticket className="h-5 w-5 text-orange-500" />
                        <h2 className="text-white font-bold">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Coupon Code</label>
                                    <Input 
                                        placeholder="e.g. EKAMA10"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        className="h-12 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Discount Type</label>
                                    <select 
                                        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={form.discountType}
                                        onChange={e => setForm({ ...form, discountType: e.target.value as any })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">
                                        Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                                    </label>
                                    <Input 
                                        type="number"
                                        value={form.discountValue}
                                        onChange={e => setForm({ ...form, discountValue: e.target.value })}
                                        className="h-12 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Min Cart Value (₹)</label>
                                    <Input 
                                        type="number"
                                        value={form.minCartValue}
                                        onChange={e => setForm({ ...form, minCartValue: e.target.value })}
                                        className="h-12 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                                <Switch 
                                    checked={form.isActive} 
                                    onCheckedChange={val => setForm({ ...form, isActive: val })}
                                />
                                <span className="text-sm font-bold text-slate-700">Coupon Active</span>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 flex-1 h-12 rounded-xl font-bold">
                                    {editingId ? 'Update Coupon' : 'Create Coupon'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                                    className="h-12 rounded-xl px-8"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {coupons.map((coupon) => (
                    <Card key={coupon.id} className="border-none shadow-sm overflow-hidden rounded-2xl bg-white group">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-xl ${coupon.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                    <Ticket className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-slate-900">{coupon.code}</h3>
                                        {coupon.isActive ? (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactive</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-tight">
                                        <span>
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                        </span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>Min Order: ₹{coupon.minCartValue}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                                    onClick={() => {
                                        setEditingId(coupon.id);
                                        setForm({
                                            code: coupon.code,
                                            discountType: coupon.discountType,
                                            discountValue: String(coupon.discountValue),
                                            minCartValue: String(coupon.minCartValue),
                                            isActive: coupon.isActive
                                        });
                                        setShowForm(true);
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                    onClick={() => handleDelete(coupon.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!loading && coupons.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <Ticket className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No coupons created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManager;
