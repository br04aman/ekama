"use client";

import CouponManager from "@/components/admin/CouponManager";
import StoreSettings from "@/components/admin/StoreSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog, DialogContent
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, getImageUrl } from "@/lib/api";
import {
    Edit2,
    ExternalLink,
    LayoutDashboard,
    LogOut,
    Package,
    Plus,
    Settings,
    ShoppingBag,
    Tags,
    Ticket,
    Trash2,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Types from original Admin.tsx
interface AdminOrder {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerEmail?: string;
  name?: string;
  shippingAddress?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    adminProductId?: string;
  }>;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  collection: string;
  inStock: boolean;
  stockQuantity: number;
  rating?: number;
  reviewCount?: number;
  adminProductId?: string;
  siddhAvailable?: boolean;
  tags?: string[];
  specifications?: Record<string, string>;
  images?: string[];
  createdAt?: string;
  isEnabled?: boolean;
}

interface Collection {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  isActive?: boolean;
}

type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  collection: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  adminProductId: string;
  siddhAvailable: boolean;
  tags: string;
  specifications: string;
  imageFile1?: FileList;
  imageFile2?: FileList;
  imageFile3?: FileList;
  imageFile4?: FileList;
  imageFile5?: FileList;
};

const glassCard = "bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.65)] rounded-2xl";
const glassPanel = "bg-white/10 backdrop-blur-3xl border border-white/25 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)] ring-1 ring-white/10";
const glassTable = "bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl overflow-hidden";

const AdminClient = () => {
  const { user, token, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [activeProducts, setActiveProducts] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [selectedCollection, setSelectedCollection] = useState('all');
  // New collection state
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [addingCollection, setAddingCollection] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    slug: '',
    description: '',
    existingImage: '',
    imageFile: null as File | null
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<ProductFormValues>();

  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
      fetchCollections();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeSection === 'products') fetchProducts();
    if (activeSection === 'customers') fetchCustomers();
    if (activeSection === 'orders') fetchOrders();
  }, [activeSection, selectedCollection]);

  const fetchDashboardStats = async () => {
    try {
      const res = await apiFetch('/api/products?limit=1');
      setActiveProducts((res as any)?.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await apiFetch('/api/collections?limit=100');
      setCollections((res as any)?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const query = selectedCollection === 'all' 
        ? '/api/products?limit=50' 
        : `/api/products?limit=50&collection=${selectedCollection}`;
      const res = await apiFetch(query);
      setProducts((res as any)?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await apiFetch('/api/admin/orders');
      if (res?.success) setOrders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await apiFetch('/api/admin/users/customers');
      setCustomers((res as any)?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await apiFetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Product deleted successfully.' });
      fetchProducts();
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  // Collection handlers
  const toUrlKey = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSaveCollection = async (keepEditing: boolean) => {
    if (!collectionForm.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a collection name.', variant: 'destructive' });
      return;
    }
    setAddingCollection(true);
    try {
      const formData = new FormData();
      formData.append('name', collectionForm.name);
      formData.append('description', collectionForm.description);
      formData.append('slug', collectionForm.slug || toUrlKey(collectionForm.name));
      if (collectionForm.imageFile) {
        formData.append('image', collectionForm.imageFile);
      }

      const endpoint = editingCollectionId ? `/api/admin/collections/${editingCollectionId}` : '/api/admin/collections';
      const method = editingCollectionId ? 'PATCH' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: 'Success', description: `Collection ${editingCollectionId ? 'updated' : 'created'} successfully.` });
      
      if (!keepEditing) {
        setShowAddCollection(false);
        setEditingCollectionId(null);
        setCollectionForm({ name: '', slug: '', description: '', existingImage: '', imageFile: null });
      }
      
      fetchCollections(); // Refresh the list
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setAddingCollection(false);
    }
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete collection "${name}"? This action cannot be undone!`);
    if (!confirmed) return;
    try {
      await apiFetch(`/api/admin/collections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Collection deleted successfully.' });
      fetchCollections();
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiFetch("/api/payments/update-order-status", {
        method: "POST",
        body: JSON.stringify({ orderId, status }),
      });
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        toast({ title: 'Success', description: `Order status updated to ${status}.` });
      }
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const onProductSubmit = async (values: ProductFormValues) => {
    setAddingProduct(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key.startsWith('imageFile')) {
          const files = value as FileList;
          if (files && files[0]) formData.append('images', files[0]);
        } else if (key === 'tags') {
          const tagsArray = (value as string).split(',').map(t => t.trim()).filter(Boolean);
          formData.append('tags', JSON.stringify(tagsArray));
        } else if (key === 'specifications') {
          const specs: Record<string, string> = {};
          (value as string).split('\n').forEach(line => {
            const [k, v] = line.split(':').map(s => s.trim());
            if (k && v) specs[k] = v;
          });
          formData.append('specifications', JSON.stringify(specs));
        } else {
          formData.append(key, String(value));
        }
      });

      const endpoint = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
      const method = editingProductId ? 'PATCH' : 'POST';

      await apiFetch(endpoint, {
        method,
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: 'Success', description: `Product ${editingProductId ? 'updated' : 'added'} successfully.` });
      setShowAddProduct(false);
      setEditingProductId(null);
      reset();
      fetchProducts();
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setAddingProduct(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
    { label: 'Orders', key: 'orders', icon: ShoppingBag },
    { label: 'Products', key: 'products', icon: Package },
    { label: 'Collections', key: 'categories', icon: Tags },
    { label: 'Customers', key: 'customers', icon: Users },
    { label: 'Coupons', key: 'coupons', icon: Ticket },
    { label: 'Settings', key: 'configuration', icon: Settings },
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-lg font-bold">E</div>
          <div>
            <div className="font-bold">Ekama Admin</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Workspace</div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { logout(); router.push('/admin'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-slate-900 capitalize">{activeSection}</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-slate-900">{user?.firstName || 'Admin'}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">System Administrator</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
              {user?.firstName?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Active Products', value: activeProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Pending Orders', value: orders.filter(o => o.status === 'Processing').length, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Total Customers', value: customers.length, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Active Coupons', value: 0, icon: Ticket, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-5">
                      <div className={`${stat.bg} ${stat.color} p-4 rounded-xl`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Orders Table */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-white font-bold">Recent Activity</h2>
                  <Button variant="ghost" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest" onClick={() => setActiveSection('orders')}>
                    View All Orders
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                        <th className="px-6 py-4 text-left">Order ID</th>
                        <th className="px-6 py-4 text-left">Customer</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-left">Total</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordersLoading ? (
                        <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading orders...</td></tr>
                      ) : orders.length === 0 ? (
                        <tr><td colSpan={5} className="p-10 text-center text-slate-400">No recent orders</td></tr>
                      ) : (
                        orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">#{order.id.slice(-6).toUpperCase()}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{order.customerName || 'Guest'}</div>
                              <div className="text-[10px] text-slate-400">{order.customerEmail}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                                order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">₹{order.totalAmount}</td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="sm" className="font-bold text-orange-600" onClick={() => setSelectedOrder(order)}>VIEW</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'orders' && (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
               <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-white font-bold">All Customer Orders</h2>
                  <div className="flex gap-2">
                    <Input placeholder="Search orders..." className="h-9 w-64 bg-white/10 border-white/20 text-white text-xs" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">ID</th>
                        <th className="px-6 py-4 text-left">Customer</th>
                        <th className="px-6 py-4 text-left">Items</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-left">Payment</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">#{order.id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{order.customerName || 'Guest'}</div>
                            <div className="text-[10px] text-slate-400">{order.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{order.items?.length || 0} items</td>
                          <td className="px-6 py-4">
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="text-[10px] font-bold border-none bg-transparent focus:ring-0 uppercase cursor-pointer"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                              {order.paymentMethod === 'cod' ? 'COD' : order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" className="font-bold text-orange-600" onClick={() => setSelectedOrder(order)}>DETAILS</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>
          )}

          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <select 
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="all">All Collections</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Button onClick={() => { setShowAddProduct(true); setEditingProductId(null); reset(); }} className="bg-orange-600 hover:bg-orange-700 h-12 rounded-xl px-6 font-bold gap-2">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </div>

              {showAddProduct && (
                <Card className="border-none shadow-md overflow-hidden rounded-2xl bg-white mb-8">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white font-bold">{editingProductId ? 'Edit Product' : 'New Product'}</h2>
                    <Button variant="ghost" onClick={() => setShowAddProduct(false)} className="text-white hover:bg-white/10"><X className="h-5 w-5" /></Button>
                  </div>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit(onProductSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                          <Input {...register('name', { required: true })} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection</label>
                          <select {...register('collection', { required: true })} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium">
                            <option value="">Select collection</option>
                            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                        <textarea {...register('description')} className="w-full min-h-[120px] bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                          <Input type="number" {...register('price', { required: true })} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Price (₹)</label>
                          <Input type="number" {...register('originalPrice')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Qty</label>
                          <Input type="number" {...register('stockQuantity')} className="h-12 rounded-xl" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Image {i}</label>
                            <div className="relative group aspect-square rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-all">
                              <Plus className="h-6 w-6 text-slate-300 group-hover:text-orange-500" />
                              <input type="file" {...register(`imageFile${i}` as any)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={addingProduct} className="flex-1 bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl font-bold shadow-lg shadow-orange-100">
                          {addingProduct ? 'SAVING...' : (editingProductId ? 'UPDATE PRODUCT' : 'CREATE PRODUCT')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)} className="h-14 px-8 rounded-2xl font-bold border-2">CANCEL</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                        <th className="px-6 py-4 text-left">Product</th>
                        <th className="px-6 py-4 text-left">Collection</th>
                        <th className="px-6 py-4 text-left">Price</th>
                        <th className="px-6 py-4 text-left">Stock</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productsLoading ? (
                        <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading products...</td></tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                <img src={getImageUrl(p.images?.[0])} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[10px] text-slate-400">ID: {p.adminProductId || p.id.slice(0, 8)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{collections.find(c => c.id === p.collection)?.name || p.collection}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">₹{p.price}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {p.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-orange-600" onClick={() => {
                                  setEditingProductId(p.id);
                                  setShowAddProduct(true);
                                  // Populate form (simplified)
                                  reset({
                                    name: p.name,
                                    price: p.price,
                                    collection: p.collection,
                                    inStock: p.inStock,
                                    stockQuantity: p.stockQuantity,
                                    adminProductId: p.adminProductId
                                  } as any);
                                }}><Edit2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'categories' && (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Store Collections</h2>
                  <Button onClick={() => {
                    setShowAddCollection(true);
                    setEditingCollectionId(null);
                    setCollectionForm({ name: '', slug: '', description: '', existingImage: '', imageFile: null });
                  }} className="bg-orange-600 hover:bg-orange-700 h-12 rounded-xl px-6 font-bold gap-2">
                    <Plus className="h-4 w-4" /> Create Collection
                  </Button>
                </div>

                {/* Add/Edit Collection Form */}
                {showAddCollection && (
                  <Card className="border-none shadow-md overflow-hidden rounded-2xl bg-white mb-8">
                    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                      <h2 className="text-white font-bold">{editingCollectionId ? 'Edit Collection' : 'New Collection'}</h2>
                      <Button variant="ghost" onClick={() => setShowAddCollection(false)} className="text-white hover:bg-white/10"><X className="h-5 w-5" /></Button>
                    </div>
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection Name</label>
                            <Input 
                              value={collectionForm.name}
                              onChange={(e) => setCollectionForm({...collectionForm, name: e.target.value, slug: toUrlKey(e.target.value)})}
                              className="h-12 rounded-xl"
                              placeholder="Enter collection name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">URL Slug</label>
                            <Input 
                              value={collectionForm.slug}
                              onChange={(e) => setCollectionForm({...collectionForm, slug: e.target.value})}
                              className="h-12 rounded-xl"
                              placeholder="url-friendly-slug"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                          <textarea 
                            value={collectionForm.description}
                            onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
                            className="w-full min-h-[100px] bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter a short description..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection Image</label>
                          <div className="relative group aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-all">
                            {(collectionForm.existingImage || collectionForm.imageFile) ? (
                              <img 
                                src={collectionForm.imageFile ? URL.createObjectURL(collectionForm.imageFile) : getImageUrl(collectionForm.existingImage)} 
                                className="w-full h-full object-cover" 
                                alt="Preview" 
                              />
                            ) : (
                              <div className="flex flex-col items-center">
                                <Plus className="h-8 w-8 text-slate-300 mb-2" />
                                <p className="text-slate-400 text-sm">Click to upload image</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setCollectionForm({...collectionForm, imageFile: e.target.files[0]});
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button 
                            onClick={() => handleSaveCollection(false)} 
                            disabled={addingCollection} 
                            className="flex-1 bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl font-bold shadow-lg shadow-orange-100"
                          >
                            {addingCollection ? 'SAVING...' : (editingCollectionId ? 'UPDATE COLLECTION' : 'CREATE COLLECTION')}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowAddCollection(false)} 
                            className="h-14 px-8 rounded-2xl font-bold border-2"
                          >
                            CANCEL
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map(c => (
                    <Card key={c.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white group">
                      <div className="aspect-[2/1] bg-slate-100 relative overflow-hidden">
                        {c.image && <img src={getImageUrl(c.image)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <h3 className="text-white font-bold text-lg">{c.name}</h3>
                          <p className="text-white/70 text-xs">{c.slug || c.id}</p>
                        </div>
                      </div>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex gap-1">
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-orange-600"
                            onClick={() => {
                              setEditingCollectionId(c.id);
                              setShowAddCollection(true);
                              setCollectionForm({
                                name: c.name,
                                slug: c.slug || toUrlKey(c.name),
                                description: (c as any).description || '',
                                existingImage: c.image || '',
                                imageFile: null
                              });
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600"
                            onClick={() => handleDeleteCollection(c.id, c.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Link href={`/collections/${c.id}`} className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1">
                          VIEW STORE <ExternalLink className="h-3 w-3" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
             </div>
          )}

          {activeSection === 'customers' && (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <div className="bg-slate-900 px-6 py-4">
                <h2 className="text-white font-bold">Registered Customers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-left">Email</th>
                      <th className="px-6 py-4 text-left">Phone</th>
                      <th className="px-6 py-4 text-left">Joined</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customersLoading ? (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading customers...</td></tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{c.firstName} {c.lastName}</td>
                          <td className="px-6 py-4 text-slate-600">{c.email}</td>
                          <td className="px-6 py-4 text-slate-600">{c.phone || '-'}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 uppercase">Active</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeSection === 'coupons' && <CouponManager />}
          {activeSection === 'configuration' && <StoreSettings />}
        </div>
      </main>

      {/* Order Detail Modal */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none bg-[#f1f3f6]">
          {selectedOrder && (
            <div className="flex flex-col">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Order Details</div>
                    <h2 className="text-2xl font-bold">#{selectedOrder.id.slice(-8).toUpperCase()}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Placed On</div>
                    <div className="text-sm font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                      <p className="text-sm font-bold uppercase text-orange-400">{selectedOrder.status}</p>
                   </div>
                   <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</p>
                      <p className="text-sm font-bold uppercase">{selectedOrder.paymentMethod === 'cod' ? 'COD' : selectedOrder.paymentStatus}</p>
                   </div>
                   <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                      <p className="text-sm font-bold text-green-400">₹{selectedOrder.totalAmount}</p>
                   </div>
                   <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Method</p>
                      <p className="text-sm font-bold uppercase">{selectedOrder.paymentMethod || 'Razorpay'}</p>
                   </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Info</h3>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                       <p className="font-bold text-slate-900">{selectedOrder.customerName || 'Guest'}</p>
                       <p className="text-sm text-slate-500 mt-1">{selectedOrder.customerEmail}</p>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Shipping Address</h3>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                       <p className="text-sm text-slate-600 leading-relaxed">{selectedOrder.shippingAddress || 'No address provided'}</p>
                    </div>
                  </section>
                </div>

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Order Items</h3>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              {item.adminProductId && <div className="text-[10px] text-indigo-600 font-bold">SKU: {item.adminProductId}</div>}
                            </td>
                            <td className="px-6 py-4 text-slate-500">Qty: {item.quantity}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">₹{item.price * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClient;
