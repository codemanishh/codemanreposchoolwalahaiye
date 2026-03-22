import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useListSchools, useCreateSchool, useDeleteSchool, useUpdateSchool, School } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout-admin";
import { Plus, Edit, Trash2, Building2, ExternalLink, Eye, EyeOff, CheckCircle, XCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const createSchema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().min(1, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  username: z.string().min(1, "Username required"),
  password: z.string().min(6, "Min 6 characters"),
});

const editSchema = z.object({
  name: z.string().min(1, "Name required"),
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export default function SuperAdminDashboard() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [showPw, setShowPw] = useState(false);

  const { data: schools = [], isLoading, refetch } = useListSchools({ request: { headers: authHeaders } });
  const { mutate: createSchool, isPending: isCreating } = useCreateSchool({ request: { headers: authHeaders } });
  const { mutate: deleteSchool } = useDeleteSchool({ request: { headers: authHeaders } });
  const { mutate: updateSchool, isPending: isUpdating } = useUpdateSchool({ request: { headers: authHeaders } });

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", slug: "", username: "", password: "" }
  });

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  const onCreateSubmit = (data: z.infer<typeof createSchema>) => {
    createSchool({ data }, {
      onSuccess: () => {
        toast({ title: "School Onboarded", description: `${data.name} is now live at /school/${data.slug}` });
        setIsCreateOpen(false);
        createForm.reset();
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Slug or username may already be taken" })
    });
  };

  const onEditSubmit = (data: z.infer<typeof editSchema>) => {
    if (!editSchool) return;
    const payload: any = { name: data.name };
    if (data.email) payload.email = data.email;
    if (data.phone) payload.phone = data.phone;
    if (data.city) payload.city = data.city;
    if (data.state) payload.state = data.state;
    if (data.password && data.password.length >= 6) payload.password = data.password;

    updateSchool({ schoolId: editSchool.id, data: payload }, {
      onSuccess: () => {
        toast({ title: "School Updated" });
        setEditSchool(null);
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Update Failed" })
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Permanently delete "${name}"? This will remove all students and data.`)) {
      deleteSchool({ schoolId: id }, {
        onSuccess: () => { toast({ title: "School Deleted" }); refetch(); }
      });
    }
  };

  const toggleStatus = (school: School) => {
    updateSchool({ schoolId: school.id, data: { isActive: !school.isActive } }, {
      onSuccess: () => {
        toast({ title: `School ${!school.isActive ? "Activated" : "Deactivated"}` });
        refetch();
      }
    });
  };

  const openEdit = (school: School) => {
    setEditSchool(school);
    editForm.reset({
      name: school.name,
      username: school.username,
      password: "",
      email: school.email || "",
      phone: school.phone || "",
      city: school.city || "",
      state: school.state || "",
    });
    setShowPw(false);
  };

  const activeCount = schools.filter(s => s.isActive).length;

  return (
    <AdminLayout portal="superadmin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registered Schools</h1>
          <p className="text-gray-500 text-sm mt-0.5">{schools.length} schools · {activeCount} active</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Onboard New School
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-primary">{schools.length}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Total Schools</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Active</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-400">{schools.length - activeCount}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Inactive</p>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden rounded-2xl">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>School Name</TableHead>
              <TableHead>URL Slug</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">Loading schools...</TableCell></TableRow>
            ) : schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No schools onboarded yet. Click "Onboard New School" to get started.</p>
                </TableCell>
              </TableRow>
            ) : schools.map(school => (
              <TableRow key={school.id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {school.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900">{school.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <a href={`/school/${school.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                    /{school.slug} <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-600">{school.username}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {[school.city, school.state].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(school)} className="flex items-center gap-1.5 group">
                    {school.isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-500" />
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">Inactive</Badge>
                      </>
                    )}
                  </button>
                </TableCell>
                <TableCell className="text-xs text-gray-400">
                  {school.createdAt ? format(new Date(school.createdAt), "dd MMM yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(school)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" title="Edit school">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(school.id, school.name)} className="h-8 w-8 p-0 text-destructive hover:bg-red-50" title="Delete school">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create School Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Onboard New School</DialogTitle></DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>School Name *</Label>
              <Input {...createForm.register("name")} placeholder="Maa Saraswati Vidya Mandir" />
              {createForm.formState.errors.name && <p className="text-xs text-red-500">{createForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>URL Slug *</Label>
              <Input {...createForm.register("slug")} placeholder="msvmsiwan" />
              <p className="text-xs text-gray-400">Public URL: /school/<strong>{createForm.watch("slug") || "slug"}</strong></p>
              {createForm.formState.errors.slug && <p className="text-xs text-red-500">{createForm.formState.errors.slug.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Admin Username *</Label>
                <Input {...createForm.register("username")} placeholder="school_admin" />
              </div>
              <div className="space-y-1">
                <Label>Admin Password *</Label>
                <Input type="password" {...createForm.register("password")} placeholder="Min 6 chars" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create School Account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit School Dialog */}
      <Dialog open={!!editSchool} onOpenChange={open => !open && setEditSchool(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5" /> Edit School</DialogTitle></DialogHeader>
          {editSchool && (
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>School Name</Label>
                <Input {...editForm.register("name")} />
              </div>
              <div className="space-y-1">
                <Label>URL Slug</Label>
                <Input value={editSchool.slug} disabled className="bg-gray-50 text-gray-400" />
                <p className="text-xs text-gray-400">Slug cannot be changed after creation</p>
              </div>
              <div className="space-y-1">
                <Label>Admin Username</Label>
                <Input {...editForm.register("username")} disabled className="bg-gray-50 text-gray-400" />
              </div>
              <div className="space-y-1">
                <Label>New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} {...editForm.register("password")} placeholder="New password (min 6 chars)" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...editForm.register("email")} placeholder="school@email.com" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input {...editForm.register("phone")} placeholder="9999999999" />
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input {...editForm.register("city")} />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input {...editForm.register("state")} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
