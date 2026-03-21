import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useListSchools, useCreateSchool, useDeleteSchool, useUpdateSchool, School } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout-admin";
import { Plus, Edit, Trash2, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Switch as Toggle } from "@/components/ui/switch";

const createSchoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SuperAdminDashboard() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: schools = [], isLoading, refetch } = useListSchools({
    request: { headers: authHeaders }
  });
  
  const { mutate: createSchool, isPending: isCreating } = useCreateSchool({
    request: { headers: authHeaders }
  });
  
  const { mutate: deleteSchool } = useDeleteSchool({
    request: { headers: authHeaders }
  });

  const { mutate: updateSchool } = useUpdateSchool({
    request: { headers: authHeaders }
  });

  const form = useForm<z.infer<typeof createSchoolSchema>>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: { name: "", slug: "", username: "", password: "" }
  });

  const onSubmit = (data: z.infer<typeof createSchoolSchema>) => {
    createSchool({ data }, {
      onSuccess: () => {
        toast({ title: "School Created Successfully" });
        setIsCreateOpen(false);
        form.reset();
        refetch();
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: "Failed to create school" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this school?")) {
      deleteSchool({ schoolId: id }, {
        onSuccess: () => {
          toast({ title: "School Deleted" });
          refetch();
        }
      });
    }
  };

  const toggleStatus = (school: School) => {
    updateSchool({ schoolId: school.id, data: { isActive: !school.isActive } }, {
      onSuccess: () => {
        toast({ title: `School marked as ${!school.isActive ? 'Active' : 'Inactive'}` });
        refetch();
      }
    });
  };

  return (
    <AdminLayout portal="superadmin">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Registered Schools</h1>
          <p className="text-gray-500 mt-1">Manage all school accounts on the platform.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Onboard New School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Onboard New School</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input {...form.register("name")} placeholder="e.g. Springfield High" />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input {...form.register("slug")} placeholder="springfield-high" />
                <p className="text-xs text-gray-500">Used for public website: /school/slug</p>
              </div>
              <div className="space-y-2">
                <Label>Admin Username</Label>
                <Input {...form.register("username")} placeholder="admin_springfield" />
              </div>
              <div className="space-y-2">
                <Label>Admin Password</Label>
                <Input type="password" {...form.register("password")} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create School Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-xl border-gray-200 overflow-hidden rounded-2xl">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>School Name</TableHead>
              <TableHead>URL Slug</TableHead>
              <TableHead>Admin Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading schools...</TableCell></TableRow>
            ) : schools.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No schools found.</TableCell></TableRow>
            ) : (
              schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      {school.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a href={`/school/${school.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                      /{school.slug} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </TableCell>
                  <TableCell>{school.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Toggle checked={school.isActive} onCheckedChange={() => toggleStatus(school)} />
                      <span className={`text-sm ${school.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {school.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(school.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
}
