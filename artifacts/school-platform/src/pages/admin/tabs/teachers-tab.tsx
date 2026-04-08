import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyRound, Plus, RefreshCw, Search, Trash2, UserRound } from "lucide-react";

type Teacher = {
  id: number;
  name: string;
  aadhaarNumber: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function TeachersTab() {
  const { authHeaders, token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPasswordInfo, setNewPasswordInfo] = useState<{ name: string; aadhaarNumber: string; plainPassword: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    aadhaarNumber: "",
    email: "",
    phone: "",
    password: "",
  });

  const requestHeaders = authHeaders.Authorization ? (authHeaders as Record<string, string>) : undefined;

  const loadTeachers = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/school/teachers", { headers: requestHeaders });
      if (!res.ok) throw new Error("Failed to load teachers");
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load teachers" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredTeachers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return teachers;
    return teachers.filter((teacher) => {
      return (
        teacher.name.toLowerCase().includes(needle)
        || (teacher.aadhaarNumber || "").includes(needle)
        || String(teacher.id).includes(needle)
        || (teacher.email || "").toLowerCase().includes(needle)
      );
    });
  }, [search, teachers]);

  const createTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Name is required" });
      return;
    }

    if (!/^\d{12}$/.test(form.aadhaarNumber)) {
      toast({ variant: "destructive", title: "Aadhaar must be 12 digits" });
      return;
    }

    if (form.password && !/^\d{9}$/.test(form.password)) {
      toast({ variant: "destructive", title: "Password must be 9 digits" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/school/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(requestHeaders || {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          aadhaarNumber: form.aadhaarNumber,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          password: form.password.trim() || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to create teacher");
      }

      setIsAddOpen(false);
      setForm({ name: "", aadhaarNumber: "", email: "", phone: "", password: "" });
      setNewPasswordInfo({
        name: payload.name,
        aadhaarNumber: payload.aadhaarNumber,
        plainPassword: payload.plainPassword,
      });
      toast({ title: "Teacher created" });
      await loadTeachers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Could not create teacher" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshPassword = async (teacher: Teacher) => {
    try {
      const res = await fetch(`/api/school/teachers/${teacher.id}/refresh-password`, {
        method: "POST",
        headers: requestHeaders,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to refresh password");
      }

      setNewPasswordInfo({
        name: teacher.name,
        aadhaarNumber: teacher.aadhaarNumber,
        plainPassword: payload.plainPassword,
      });
      toast({ title: "Password refreshed", description: `New 9-digit password generated for ${teacher.name}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Could not refresh password" });
    }
  };

  const deleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`Delete teacher ${teacher.name}?`)) return;

    try {
      const res = await fetch(`/api/school/teachers/${teacher.id}`, {
        method: "DELETE",
        headers: requestHeaders,
      });

      if (!res.ok) {
        throw new Error("Failed to delete teacher");
      }

      toast({ title: "Teacher deleted" });
      await loadTeachers();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete teacher" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold font-display">Teachers</h2>
          <p className="text-sm text-gray-500">Manage teacher details, Aadhaar identifiers, and 9-digit passwords.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Teacher
        </Button>
      </div>

      {newPasswordInfo && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-900">
              <KeyRound className="w-4 h-4" /> Teacher Password (Save Now)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-950">
            <p><strong>Name:</strong> {newPasswordInfo.name}</p>
            <p><strong>Aadhaar:</strong> {newPasswordInfo.aadhaarNumber}</p>
            <p><strong>9-digit password:</strong> <span className="font-mono font-semibold">{newPasswordInfo.plainPassword}</span></p>
            <p className="text-xs text-emerald-800 mt-2">This value is shown one time only after create or password refresh.</p>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Search by teacher name, teacher ID, Aadhaar, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-sm text-gray-500">Loading teachers...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-sm text-gray-500">No teachers found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Aadhaar</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-mono">{teacher.id}</TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell className="font-mono">{teacher.aadhaarNumber}</TableCell>
                    <TableCell>{teacher.email || "-"}</TableCell>
                    <TableCell>{teacher.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.isActive ? "default" : "secondary"}>{teacher.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => refreshPassword(teacher)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Reset 9-digit Password
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteTeacher(teacher)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="w-4 h-4" /> Add Teacher
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={createTeacher}>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Teacher full name"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Aadhaar Number (12 digits)</Label>
              <Input
                value={form.aadhaarNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                placeholder="123412341234"
                inputMode="numeric"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>9-digit Password (optional)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                placeholder="Leave blank to auto-generate"
                inputMode="numeric"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="teacher@school.edu"
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create Teacher"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
