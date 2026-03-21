import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuperadminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function SuperAdminLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { mutate: doLogin, isPending } = useSuperadminLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    doLogin({ data }, {
      onSuccess: (res) => {
        toast({ title: "Welcome back!", description: "Successfully logged in as Super Admin." });
        login(res.token, "/superadmin");
      },
      onError: (err) => {
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: err.error?.error || "Invalid credentials." 
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-secondary/20 mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-center text-3xl font-display font-extrabold text-gray-900">
          Super Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage schools and platform settings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-2xl border-0 ring-1 ring-gray-200">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  {...register("username")} 
                  className={errors.username ? "border-destructive" : ""}
                  placeholder="admin"
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  {...register("password")} 
                  className={errors.password ? "border-destructive" : ""}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full text-lg h-12 font-semibold" disabled={isPending}>
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
