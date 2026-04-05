import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, Trash2, Sparkles, RefreshCw } from "lucide-react";

type SubjectItem = {
  id: number;
  subjectName: string;
  displayOrder: number;
};

type CurriculumClass = {
  id: number;
  className: string;
  displayOrder: number;
  subjects: SubjectItem[];
};

export default function CurriculumTab() {
  const { authHeaders, token } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<CurriculumClass[]>([]);
  const [classNoInput, setClassNoInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectDrafts, setSubjectDrafts] = useState<Record<number, string>>({});

  const requestHeaders = authHeaders.Authorization
    ? (authHeaders as Record<string, string>)
    : undefined;

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.displayOrder - b.displayOrder),
    [items],
  );

  const loadCurriculum = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/school/curriculum", {
        headers: requestHeaders,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setLoadError(true);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addClassByNumber = async () => {
    const classNo = Number(classNoInput);
    if (!Number.isFinite(classNo) || classNo < 1 || classNo > 20) {
      toast({ title: "Invalid class no", description: "Please enter a class number between 1 and 20", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/school/curriculum/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(requestHeaders || {}) },
        body: JSON.stringify({ classNo }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to add class");
      }
      setItems((prev) => [...prev, { ...payload, subjects: [] }]);
      toast({ title: "Class Added", description: `Class ${classNo} added successfully.` });
      setClassNoInput("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not add class", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateClassName = async (classId: number, className: string, displayOrder: number) => {
    const trimmed = className.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`/api/school/curriculum/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(requestHeaders || {}) },
        body: JSON.stringify({ className: trimmed, displayOrder }),
      });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.map((c) => c.id === classId ? { ...c, className: trimmed } : c));
      toast({ title: "Class Updated" });
    } catch {
      toast({ title: "Error", description: "Could not update class", variant: "destructive" });
    }
  };

  const deleteClass = async (classId: number) => {
    try {
      const res = await fetch(`/api/school/curriculum/classes/${classId}`, {
        method: "DELETE",
        headers: requestHeaders,
      });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((c) => c.id !== classId));
      toast({ title: "Class Deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete class", variant: "destructive" });
    }
  };

  const addSubject = async (classId: number) => {
    const subjectName = (subjectDrafts[classId] || "").trim();
    if (!subjectName) return;

    const classItem = items.find((c) => c.id === classId);
    if (classItem?.subjects.some((s) => s.subjectName.trim().toLowerCase() === subjectName.toLowerCase())) {
      toast({ title: "Duplicate Subject", description: `"${subjectName}" already exists in this class`, variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`/api/school/curriculum/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(requestHeaders || {}) },
        body: JSON.stringify({ subjectName }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed");
      setSubjectDrafts((prev) => ({ ...prev, [classId]: "" }));
      setItems((prev) => prev.map((c) => c.id === classId ? { ...c, subjects: [...c.subjects, payload] } : c));
      toast({ title: "Subject Added" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not add subject", variant: "destructive" });
    }
  };

  const deleteSubject = async (subjectId: number) => {
    try {
      const res = await fetch(`/api/school/curriculum/subjects/${subjectId}`, {
        method: "DELETE",
        headers: requestHeaders,
      });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.map((c) => ({ ...c, subjects: c.subjects.filter((s) => s.id !== subjectId) })));
    } catch {
      toast({ title: "Error", description: "Could not delete subject", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" /> Curriculum Setup
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter class number (for example 1, 2, 3...) and press Enter to add permanently. Classes auto-arrange in ascending order.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 items-start sm:items-end">
          <div className="space-y-1">
            <Label>Enter Class No.</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={classNoInput}
              onChange={(e) => setClassNoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addClassByNumber();
                }
              }}
              className="w-44"
              placeholder="e.g. 4"
            />
          </div>
          <Button onClick={addClassByNumber} disabled={saving} className="h-10">
            <Plus className="w-4 h-4 mr-2" /> {saving ? "Adding..." : "Add Class"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading curriculum...</span>
        </div>
      ) : loadError ? (
        <div className="text-center py-12 bg-red-50 border border-dashed border-red-200 rounded-xl">
          <p className="text-red-600 font-medium mb-3">Failed to load curriculum. The server may be slow — please retry.</p>
          <Button variant="outline" onClick={loadCurriculum} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
          <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No classes yet. Enter class number above and press Enter to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedItems.map((classItem) => (
            <Card key={classItem.id} className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={classItem.className}
                    onChange={(e) => {
                      const next = e.target.value;
                      setItems((prev) => prev.map((c) => c.id === classItem.id ? { ...c, className: next } : c));
                    }}
                    onBlur={() => updateClassName(classItem.id, classItem.className, classItem.displayOrder)}
                    className="font-semibold"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteClass(classItem.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Delete class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subjects</p>
                  {classItem.subjects.length === 0 ? (
                    <p className="text-sm text-gray-400">No subjects added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {classItem.subjects.map((subject) => (
                        <span key={subject.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1 border border-gray-200">
                          {subject.subjectName}
                          <button onClick={() => deleteSubject(subject.id)} className="text-red-500 hover:text-red-700" title="Remove subject">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add subject (e.g. Mathematics)"
                    value={subjectDrafts[classItem.id] || ""}
                    onChange={(e) => setSubjectDrafts((prev) => ({ ...prev, [classItem.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubject(classItem.id);
                      }
                    }}
                  />
                  <Button onClick={() => addSubject(classItem.id)} size="icon" title="Add Subject">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
