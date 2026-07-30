import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

type FormValues = {
  firstName: string;
  lastName?: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Signup = () => {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch } = useForm<FormValues>();

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    const ordered: Array<{ label: string; message?: string }> = [
      { label: "First Name", message: errors.firstName?.message ? String(errors.firstName.message) : undefined },
      { label: "Last Name", message: errors.lastName?.message ? String(errors.lastName.message) : undefined },
      { label: "Mobile Number", message: errors.phone?.message ? String(errors.phone.message) : undefined },
      { label: "Email", message: errors.email?.message ? String(errors.email.message) : undefined },
      { label: "Password", message: errors.password?.message ? String(errors.password.message) : undefined },
      { label: "Confirm Password", message: errors.confirmPassword?.message ? String(errors.confirmPassword.message) : undefined },
    ];

    const shown = ordered.filter((x) => x.message);
    if (!shown.length) {
      toast({ title: "Invalid signup details", description: "Please check the form and try again.", variant: "destructive" });
      return;
    }

    shown.forEach((x) => {
      toast({ title: x.label, description: x.message!, variant: "destructive" });
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (values.password !== values.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signup({ email: values.email, password: values.password, firstName: values.firstName, lastName: values.lastName, phone: values.phone });
      toast({ title: "Account created", description: "Welcome!" });
      navigate("/");
    } catch (e) {
      toast({ title: "Signup failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f4e5]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-orange-900">Sign Up</h1>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input
              placeholder="First name"
              {...register("firstName", {
                required: "First name is required",
                setValueAs: (v) => String(v ?? "").trim(),
                pattern: { value: /^[A-Za-z]+(?: [A-Za-z]+)*$/, message: "First name must contain alphabets only" },
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input
              placeholder="Last name"
              {...register("lastName", {
                setValueAs: (v) => String(v ?? "").trim(),
                validate: (val) => {
                  if (!val) return true;
                  return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(val) || "Last name must contain alphabets only";
                },
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="Mobile number"
              {...register("phone", {
                required: "Mobile number is required",
                setValueAs: (v) => String(v ?? "").replace(/\D/g, "").slice(0, 10),
                pattern: { value: /^[6-9]\d{9}$/, message: "Mobile number must be 10 digits and start with 6-9" },
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              placeholder="you@gmail.com"
              {...register("email", {
                required: "Email is required",
                setValueAs: (v) => String(v ?? "").trim().toLowerCase(),
                pattern: { value: /^[A-Za-z0-9._%+-]+@gmail\.com$/i, message: "Email must end with gmail.com" },
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              placeholder="8-16 characters, letters and numbers"
              {...register("password", {
                required: "Password is required",
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/,
                  message: "Password must be 8-16 characters and alphanumeric",
                },
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <Input
              type="password"
              placeholder="Repeat password"
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (val) => val === watch("password") || "Passwords do not match",
              })}
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-orange-700 hover:bg-orange-800 text-white">
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-sm mt-4">
          Already have an account? <Link to="/login" className="text-orange-700 underline">Login</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
