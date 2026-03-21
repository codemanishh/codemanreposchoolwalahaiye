import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSchoolLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { School, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function SchoolAdminLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { mutate: doLogin, isPending } = useSchoolLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    doLogin({ data }, {
      onSuccess: (res) => {
        toast({ title: "Welcome back!", description: "Successfully logged into school portal." });
        login(res.token, "/admin");
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Login Failed", description: err.error?.error || "Invalid credentials." });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
          <School className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-center text-3xl font-display font-extrabold text-gray-900">
          School Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage your school's website and data
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-2xl border-0 ring-1 ring-gray-200">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your school administrator credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">School Username</Label>
                <Input id="username" {...register("username")} placeholder="school_admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full text-lg h-12" disabled={isPending}>
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
