import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, LogIn } from "lucide-react";

export default function TeacherLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [schoolId, setSchoolId] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: parseInt(schoolId),
          aadhaarNumber,
          password,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Login failed");
        }

        const text = await res.text();
        throw new Error(text || `Login failed (${res.status})`);
      }

      const { token, role, user } = await res.json();
      localStorage.setItem("teacher_token", token);
      localStorage.setItem("teacher_user", JSON.stringify({ ...user, role }));

      toast({ title: "Login successful!", description: `Welcome, ${user.name}` });
      setLocation("/teacher/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast({ variant: "destructive", title: "Login Failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Teacher Login</CardTitle>
          <CardDescription>
            Sign in to mark attendance and manage classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{12}"
                placeholder="12-digit Aadhaar number"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolId">School ID</Label>
              <Input
                id="schoolId"
                type="number"
                placeholder="Enter your school ID"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="9-digit password"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 9))}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Use the 9-digit password assigned by your school admin.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !schoolId || aadhaarNumber.length !== 12 || password.length !== 9}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-gray-500">
            <p>
              Forgot your password?
              <br />
              Contact your school administrator for a new 9-digit password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
