import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Plus, Pencil, Trash2, X, Check, GraduationCap, RefreshCw } from "lucide-react";

type TopStudent = {
  id: number;
  name: string;
  className: string;
  percentage: string;
  message: string | null;
  photoUrl: string | null;
  displayOrder: number;
};

type FormState = {
  name: string;
  className: string;
  percentage: string;
  message: string;
  photoUrl: string;
  displayOrder: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  className: "",
  percentage: "",
  message: "",
  photoUrl: "",
  displayOrder: "0",
};

export default function TopStudentsTab() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchStudents = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/school/top-students", { headers: authHeaders, signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStudents(data);
    } catch {
      setLoadError(true);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, displayOrder: String(students.length) });
    setShowForm(true);
  };

  const openEdit = (s: TopStudent) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      className: s.className,
      percentage: s.percentage,
      message: s.message ?? "",
      photoUrl: s.photoUrl ?? "",
      displayOrder: String(s.displayOrder),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.className.trim() || !form.percentage.trim()) {
      toast({ title: "Validation", description: "Name, Class, and Percentage are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      className: form.className.trim(),
      percentage: form.percentage.trim(),
      message: form.message.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
      displayOrder: parseInt(form.displayOrder) || 0,
    };
    try {
      const url = editingId ? `/api/school/top-students/${editingId}` : "/api/school/top-students";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: editingId ? "Updated!" : "Added!", description: `${payload.name} has been saved.` });
      closeForm();
      fetchStudents();
    } catch {
      toast({ title: "Error", description: "Could not save student", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/school/top-students/${id}`, { method: "DELETE", headers: authHeaders });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Removed", description: `${name} removed from top students.` });
      fetchStudents();
    } catch {
      toast({ title: "Error", description: "Could not delete student", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const avatarUrl = (name: string, photoUrl: string | null) => {
    if (photoUrl) return photoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EAB308&color=1f2937&size=128&bold=true`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Top Students
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Showcase your school's star performers in a carousel on the public website.</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-yellow-600" />
              {editingId ? "Edit Student" : "Add Top Student"}
            </h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Student Name *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Aarav Sharma"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Class *</label>
              <Input
                value={form.className}
                onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                placeholder="e.g. Class 10-A"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Percentage / Score *</label>
              <Input
                value={form.percentage}
                onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))}
                placeholder="e.g. 98.5%"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">School Message / Congratulations</label>
              <Textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={2}
                placeholder="e.g. Congratulations Aarav! Your hard work and dedication have made us proud. Keep shining!"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Photo URL <span className="font-normal text-gray-400">(optional)</span></label>
              <Input
                value={form.photoUrl}
                onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
                placeholder="https://... (leave blank for auto-avatar)"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Display Order</label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-400">Lower number shows first</p>
            </div>

            {/* Photo preview */}
            {(form.photoUrl || form.name) && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Preview</label>
                <img
                  src={avatarUrl(form.name || "?", form.photoUrl || null)}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-5">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save Student"}
            </Button>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading...
        </div>
      ) : loadError ? (
        <div className="text-center py-12 bg-red-50 border-2 border-dashed border-red-200 rounded-xl">
          <p className="text-red-600 font-medium mb-3">Failed to load students. Server may be slow — please retry.</p>
          <Button variant="outline" onClick={fetchStudents} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No top students added yet.</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Student" to feature your school's best performers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map((s, index) => (
            <Card key={s.id} className="overflow-hidden group hover:shadow-lg transition-shadow border border-gray-200">
              <CardContent className="p-0">
                {/* Top color band */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2" />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="relative shrink-0">
                      <img
                        src={avatarUrl(s.name, s.photoUrl)}
                        alt={s.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400"
                      />
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center shadow">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.className}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-bold">
                        🏆 {s.percentage}
                      </div>
                    </div>
                  </div>
                  {s.message && (
                    <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2 border-t border-gray-100 pt-3">
                      "{s.message}"
                    </p>
                  )}
                  {/* Actions */}
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(s)}
                      className="flex-1 h-8 text-xs"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s.id, s.name)}
                      disabled={deletingId === s.id}
                      className="h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      {deletingId === s.id ? (
                        <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
