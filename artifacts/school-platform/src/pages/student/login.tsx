import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits"),
  firstName: z.string().min(1, "First name is required"),
  password: z.string().min(1, "Password is required"),
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function StudentLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsPending(true);
    try {
      const res = await fetch(`${BASE}/api/auth/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber: data.aadhaarNumber,
          firstName: data.firstName.trim().toLowerCase(),
          password: data.password,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: "destructive", title: "Login Failed", description: payload?.error || "Invalid credentials." });
        return;
      }

      toast({ title: "Login Successful", description: "Welcome to the student portal." });
      login(payload.token, "/student");
    } catch {
      toast({ variant: "destructive", title: "Login Failed", description: "Network error." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://pixabay.com/get/g1e35bbb35d6b6a73dc83f3ddb93060934d551a3e5b2bf822ba4069f6b51251a82594254689a52cb02bb4cc07562486cc25db540f31bf20d270f53b41e6e005a7_1280.jpg')] bg-cover bg-center flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.5)] mb-6 border-4 border-white/10">
          <GraduationCap className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-center text-4xl font-display font-bold text-white tracking-tight drop-shadow-md">
          Student Portal
        </h2>
        <p className="mt-3 text-center text-gray-200 text-lg font-medium drop-shadow">
          Access your academic records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
          <div className="h-2 w-full bg-primary"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-center text-secondary">Sign In</CardTitle>
            <CardDescription className="text-center text-gray-500">Use Aadhaar Number + lowercase first name + password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber" className="text-secondary font-semibold">Aadhaar Number</Label>
                <Input id="aadhaarNumber" {...register("aadhaarNumber")} placeholder="e.g. 999900001111" className="h-12 bg-white" maxLength={12} inputMode="numeric" />
                {errors.aadhaarNumber && <p className="text-sm text-destructive">{errors.aadhaarNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-secondary font-semibold">First Name (lowercase)</Label>
                <Input id="firstName" {...register("firstName")} placeholder="e.g. manish" className="h-12 bg-white" />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-secondary font-semibold">Password</Label>
                <Input id="password" type="password" {...register("password")} placeholder="••••••••" className="h-12 bg-white" />
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold tracking-wide mt-4 shadow-lg shadow-primary/30" disabled={isPending}>
                {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "ACCESS PORTAL"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
