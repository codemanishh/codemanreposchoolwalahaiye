import { useState } from "react";
import { useForm } from "react-hook-form";
import { useListStudents, useCreateStudent, useDeleteStudent } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserPlus } from "lucide-react";

export default function StudentsTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: students = [], refetch } = useListStudents({ request: { headers: authHeaders } });
  const { mutate: createStudent, isPending } = useCreateStudent({ request: { headers: authHeaders } });
  const { mutate: deleteStudent } = useDeleteStudent({ request: { headers: authHeaders } });

  const form = useForm({
    defaultValues: {
      name: "", rollNumber: "", className: "", section: "", fatherName: ""
    }
  });

  const onSubmit = (data: any) => {
    createStudent({ data }, {
      onSuccess: () => {
        toast({ title: "Student Added" });
        setIsOpen(false);
        form.reset();
        refetch();
      }
    });
  };

  const handleDelete = (id: number) => {
    if(confirm("Delete student?")) {
      deleteStudent({ studentId: id }, {
        onSuccess: () => { toast({ title: "Deleted" }); refetch(); }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">Student Directory</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input {...form.register("name")} required /></div>
                <div className="space-y-2"><Label>Roll Number</Label><Input {...form.register("rollNumber")} required /></div>
                <div className="space-y-2"><Label>Class</Label><Input {...form.register("className")} /></div>
                <div className="space-y-2"><Label>Section</Label><Input {...form.register("section")} /></div>
                <div className="space-y-2 col-span-2"><Label>Father's Name</Label><Input {...form.register("fatherName")} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>Save Student</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Roll No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class & Section</TableHead>
              <TableHead>Father's Name</TableHead>
              <TableHead>Password Setup</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6">No students found.</TableCell></TableRow>
            ) : students.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono">{s.rollNumber}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.className} - {s.section}</TableCell>
                <TableCell>{s.fatherName}</TableCell>
                <TableCell>
                  {s.hasChangedPassword ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Done</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Default (111111)</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
