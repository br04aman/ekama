import Header from "@/components/Header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { ChevronLeft, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfileInfo = () => {
    const { user, logout, updateUser } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });

    if (!user) return null;

    useEffect(() => {
        setForm({
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            phone: user.phone ?? "",
        });
    }, [user]);

    const validateForm = () => {
        const normalizedFirstName = form.firstName.trim();
        const normalizedLastName = form.lastName.trim();
        const normalizedPhone = form.phone.replace(/\D/g, "").slice(0, 10);
        let isValid = true;

        if (!normalizedFirstName || !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(normalizedFirstName)) {
            toast({
                title: "Invalid first name",
                description: "First name must contain alphabets only.",
                variant: "destructive",
            });
            isValid = false;
        }

        if (normalizedLastName && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(normalizedLastName)) {
            toast({
                title: "Invalid last name",
                description: "Last name must contain alphabets only.",
                variant: "destructive",
            });
            isValid = false;
        }

        if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
            toast({
                title: "Invalid mobile number",
                description: "Mobile number must be 10 digits and start with 6-9.",
                variant: "destructive",
            });
            isValid = false;
        }

        return isValid;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setIsSaving(true);
            const response = await apiFetch("/api/users/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    phone: form.phone.replace(/\D/g, "").slice(0, 10),
                }),
            });

            updateUser(response.data.user);
            setIsEditing(false);
            toast({
                title: "Profile updated",
                description: "Your profile information has been saved successfully.",
            });
        } catch (error) {
            toast({
                title: "Unable to update profile",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
            <Header />
            <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-8 md:py-12">
                <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center justify-center h-10 w-10 bg-white rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-6 shadow-sm border border-slate-100 transition-all"
                >
                    <ChevronLeft className="h-6 w-6 pr-0.5" />
                </button>

                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between gap-4 px-1">
                        <h1 className="text-2xl font-bold text-slate-900">Profile Information</h1>
                        <Button
                            type="button"
                            variant={isEditing ? "outline" : "default"}
                            className={isEditing ? "rounded-xl" : "rounded-xl bg-orange-600 hover:bg-orange-700"}
                            onClick={() => {
                                if (isEditing) {
                                    setForm({
                                        firstName: user.firstName ?? "",
                                        lastName: user.lastName ?? "",
                                        phone: user.phone ?? "",
                                    });
                                }
                                setIsEditing((prev) => !prev);
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                            {isEditing ? "Cancel" : "Edit Profile"}
                        </Button>
                    </div>

                    <Card className="bg-white rounded-2xl shadow-md border-none overflow-hidden">
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-100">
                                <Avatar className="h-24 w-24 ring-4 ring-orange-50">
                                    <AvatarFallback className="text-2xl bg-orange-100 text-orange-700 font-bold">
                                        {user?.firstName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-900">
                                        {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Guest User"}
                                    </p>
                                    <p className="text-sm text-slate-500">Sacred Customer</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">First Name</p>
                                    {isEditing ? (
                                        <Input
                                            value={form.firstName}
                                            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50"
                                            placeholder="Enter first name"
                                        />
                                    ) : (
                                        <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {user.firstName || "Not provided"}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Last Name</p>
                                    {isEditing ? (
                                        <Input
                                            value={form.lastName}
                                            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50"
                                            placeholder="Enter last name"
                                        />
                                    ) : (
                                        <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {user.lastName || "Not provided"}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Email Address</p>
                                    <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {user.email ?? "Not provided"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Mobile Number</p>
                                    {isEditing ? (
                                        <Input
                                            value={form.phone}
                                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50"
                                            placeholder="Enter mobile number"
                                            inputMode="numeric"
                                        />
                                    ) : (
                                        <p className="text-base font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {user.phone || "Not provided"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                {isEditing && (
                                    <Button
                                        type="button"
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl border border-red-100 transition-all active:scale-95"
                                    onClick={() => {
                                        logout();
                                        navigate("/login");
                                    }}
                                >
                                    Logout from Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default ProfileInfo;
