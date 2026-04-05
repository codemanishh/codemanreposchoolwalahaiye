import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useListStudents, useCreateStudent, useDeleteStudent, useUpdateStudent } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserPlus, Upload, Search, RotateCcw, Edit, X, FileSpreadsheet, CheckCircle2, AlertCircle, Users, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function StudentsTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [passwordStudent, setPasswordStudent] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [uploadResult, setUploadResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: students = [], refetch } = useListStudents({ request: { headers: authHeaders } });
  const { mutate: createStudent, isPending } = useCreateStudent({ request: { headers: authHeaders } });
  const { mutate: deleteStudent } = useDeleteStudent({ request: { headers: authHeaders } });
  const { mutate: updateStudent, isPending: isUpdating } = useUpdateStudent({ request: { headers: authHeaders } });

  const addForm = useForm({ defaultValues: { name: "", aadhaarNumber: "", rollNumber: "", className: "", section: "", fatherName: "", phone: "" } });
  const editForm = useForm<any>({});

  const classes = [...new Set(students.map(s => s.className).filter(Boolean))].sort();

  const filtered = students.filter(s => {
    const matchSearch = !search
      || s.name.toLowerCase().includes(search.toLowerCase())
      || s.rollNumber.includes(search)
      || ((s as any).aadhaarNumber || "").includes(search);
    const matchClass = !classFilter || s.className === classFilter;
    return matchSearch && matchClass;
  });

  const onAdd = (data: any) => {
    createStudent({ data }, {
      onSuccess: () => {
        toast({ title: "Student Added", description: `Default password: 111111` });
        setIsAddOpen(false);
        addForm.reset();
        refetch();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error?.error || "Roll number may already exist" })
    });
  };

  const onEdit = (data: any) => {
    updateStudent({ studentId: editStudent.id, data }, {
      onSuccess: () => {
        toast({ title: "Student Updated" });
        setEditStudent(null);
        refetch();
      }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete student "${name}"? This will also remove all their results.`)) {
      deleteStudent({ studentId: id }, {
        onSuccess: () => { toast({ title: "Student Deleted" }); refetch(); }
      });
    }
  };

  const handleResetPassword = async (id: number, name: string) => {
    if (!confirm(`Reset ${name}'s password to 111111?`)) return;
    try {
      const res = await fetch(`${BASE}/api/school/students/${id}/reset-password`, {
        method: "POST",
        headers: authHeaders as Record<string, string>
      });
      if (res.ok) {
        toast({ title: "Password Reset", description: `${name}'s password has been reset to 111111` });
        refetch();
      } else {
        toast({ variant: "destructive", title: "Failed to reset password" });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    }
  };

  const handleBulkUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${BASE}/api/school/students/upload`, {
        method: "POST",
        headers: authHeaders as Record<string, string>,
        body: formData
      });
      const data = await res.json();
      setUploadResult(data);
      if (data.inserted > 0) refetch();
      toast({ title: `Imported ${data.inserted} students`, description: data.errors.length > 0 ? `${data.errors.length} rows had errors` : "All rows imported successfully" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSetPassword = async () => {
    if (!passwordStudent) return;
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Invalid password", description: "Password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch(`${BASE}/api/school/students/${passwordStudent.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders as Record<string, string>),
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: "destructive", title: "Failed", description: data?.error || "Could not update password" });
        return;
      }

      toast({ title: "Password Updated", description: `${passwordStudent.name}'s password has been changed.` });
      setPasswordStudent(null);
      setNewPassword("");
      setConfirmPassword("");
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const formatPhoneForUi = (value: string | null | undefined) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return `+91-${digits}`;
    return value || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display">Student Directory</h2>
          <p className="text-sm text-gray-500">{students.length} total students</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`${BASE}/templates/sample-students-upload.xlsx`} download>
            <Button variant="outline" className="text-sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Sample Excel
            </Button>
          </a>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={isUploading} className="text-sm">
            <Upload className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : "Bulk Upload Excel"}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleBulkUpload(e.target.files[0]); }} />
          <Button onClick={() => setIsAddOpen(true)} className="text-sm">
            <UserPlus className="w-4 h-4 mr-2" /> Add Student
          </Button>
        </div>
      </div>

      {/* Excel upload result */}
      {uploadResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="font-medium text-sm">{uploadResult.inserted} students imported successfully</span>
            <button onClick={() => setUploadResult(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          {uploadResult.errors.length > 0 && (
            <div className="space-y-1">
              {uploadResult.errors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" /> {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Excel format hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 items-start text-sm text-blue-800">
        <FileSpreadsheet className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
        <span>Excel columns for bulk upload (Aadhaar required, 12 digits): <code className="bg-blue-100 px-1 rounded">name, aadhaar_number, roll_number, class_name, section, father_name, phone</code></span>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or roll number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
        {(search || classFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setClassFilter(""); }}>
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{students.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Students</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{students.filter(s => s.hasChangedPassword).length}</p>
          <p className="text-xs text-gray-500 mt-1">Changed Password</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{students.filter(s => !s.hasChangedPassword).length}</p>
          <p className="text-xs text-gray-500 mt-1">Using Default</p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-20">Roll No.</TableHead>
              <TableHead>Aadhaar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Father's Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Password</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {search || classFilter ? "No students match your search." : "No students added yet."}
                </TableCell>
              </TableRow>
            ) : filtered.map(s => (
              <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-mono font-medium text-gray-700">{s.rollNumber}</TableCell>
                <TableCell className="font-mono text-gray-700">{(s as any).aadhaarNumber || "—"}</TableCell>
                <TableCell className="font-semibold text-gray-900">{s.name}</TableCell>
                <TableCell>{s.className}{s.section ? ` - ${s.section}` : ""}</TableCell>
                <TableCell className="text-gray-600">{s.fatherName || "—"}</TableCell>
                <TableCell className="text-gray-600">{formatPhoneForUi((s as any).phone)}</TableCell>
                <TableCell>
                  {s.hasChangedPassword ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">✓ Updated</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Default</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" title="Edit" onClick={() => { setEditStudent(s); editForm.reset(s); }} className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Reset password to 111111" onClick={() => handleResetPassword(s.id, s.name)} className="h-8 w-8 p-0 hover:bg-amber-50 text-amber-600">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Set custom password"
                      onClick={() => {
                        setPasswordStudent(s);
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="h-8 w-8 p-0 hover:bg-purple-50 text-purple-600"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(s.id, s.name)} className="h-8 w-8 p-0 hover:bg-red-50 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
            Showing {filtered.length} of {students.length} students
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Add New Student</DialogTitle></DialogHeader>
          <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2"><Label>Full Name *</Label><Input {...addForm.register("name")} placeholder="Rahul Sharma" required /></div>
              <div className="space-y-1"><Label>Aadhaar Number *</Label><Input {...addForm.register("aadhaarNumber")} placeholder="12 digits" maxLength={12} required /></div>
              <div className="space-y-1"><Label>Roll Number *</Label><Input {...addForm.register("rollNumber")} placeholder="52" required /></div>
              <div className="space-y-1"><Label>Phone (10 digits)</Label><Input {...addForm.register("phone")} placeholder="9876543210" /></div>
              <div className="space-y-1"><Label>Class</Label><Input {...addForm.register("className")} placeholder="10" /></div>
              <div className="space-y-1"><Label>Section</Label><Input {...addForm.register("section")} placeholder="A" /></div>
              <div className="space-y-1 col-span-2"><Label>Father's Name</Label><Input {...addForm.register("fatherName")} /></div>
            </div>
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">Default password will be <strong>111111</strong>. Student must change it on first login.</p>
            <Button type="submit" className="w-full" disabled={isPending}>{isPending ? "Adding..." : "Add Student"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={!!editStudent} onOpenChange={open => !open && setEditStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5" /> Edit Student</DialogTitle></DialogHeader>
          {editStudent && (
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Full Name</Label><Input {...editForm.register("name")} /></div>
                <div className="space-y-1"><Label>Aadhaar Number</Label><Input {...editForm.register("aadhaarNumber")} /></div>
                <div className="space-y-1"><Label>Roll Number</Label><Input value={editStudent.rollNumber} disabled className="bg-gray-50 text-gray-400" /></div>
                <div className="space-y-1"><Label>Phone (10 digits)</Label><Input {...editForm.register("phone")} placeholder="9876543210" /></div>
                <div className="space-y-1"><Label>Class</Label><Input {...editForm.register("className")} /></div>
                <div className="space-y-1"><Label>Section</Label><Input {...editForm.register("section")} /></div>
                <div className="space-y-1 col-span-2"><Label>Father's Name</Label><Input {...editForm.register("fatherName")} /></div>
                <div className="space-y-1 col-span-2"><Label>Mother's Name</Label><Input {...editForm.register("motherName")} /></div>
                <div className="space-y-1 col-span-2"><Label>Address</Label><Input {...editForm.register("address")} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog
        open={!!passwordStudent}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordStudent(null);
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Set Student Password
            </DialogTitle>
          </DialogHeader>
          {passwordStudent && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-gray-600">
                Student: <span className="font-semibold text-gray-900">{passwordStudent.name}</span> ({passwordStudent.rollNumber})
              </p>
              <div className="space-y-1">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-1">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetPassword} disabled={isSavingPassword} className="flex-1">
                  {isSavingPassword ? "Saving..." : "Update Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordStudent(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
