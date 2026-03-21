import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetStudentProfile, useGetStudentResults, useGetStudentNotifications, useChangeStudentPassword } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, BookOpen, Bell, UserCircle, KeyRound, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useGetStudentProfile({ request: { headers: authHeaders } });
  const { data: results = [], isLoading: resultsLoading } = useGetStudentResults({ request: { headers: authHeaders } });
  const { data: notices = [], isLoading: noticesLoading } = useGetStudentNotifications({ request: { headers: authHeaders } });
  
  const { mutate: changePassword, isPending: passwordChanging } = useChangeStudentPassword({ request: { headers: authHeaders } });

  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new !== pwForm.confirm) return toast({ variant: "destructive", title: "Passwords do not match" });
    
    changePassword({ data: { currentPassword: pwForm.current, newPassword: pwForm.new } }, {
      onSuccess: () => {
        toast({ title: "Password updated successfully!" });
        setPwForm({ current: "", new: "", confirm: "" });
        refetchProfile();
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update password. Check current password." })
    });
  };

  if (profileLoading) return <AdminLayout portal="student"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout portal="student">
      {profile && !profile.hasChangedPassword && (
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-900 shadow-sm rounded-xl">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <AlertTitle className="font-bold text-red-800">Action Required: Update Your Password</AlertTitle>
          <AlertDescription>
            You are using the default password. For security reasons, please go to the Settings tab and change your password immediately.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Welcome, {profile?.name}</h1>
        <p className="text-gray-500 mt-1">{profile?.schoolName} • Roll No: {profile?.rollNumber}</p>
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-14 bg-white shadow-sm p-1 rounded-xl mb-8 border border-gray-100">
          <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Results</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm flex items-center"><UserCircle className="w-4 h-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="notices" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm flex items-center"><Bell className="w-4 h-4 mr-2" /> Notices</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm flex items-center"><KeyRound className="w-4 h-4 mr-2" /> Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="mt-0 outline-none">
          <Card className="rounded-2xl shadow-xl border-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-xl">Academic Performance</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Marks Obtained</TableHead>
                    <TableHead className="text-center">Max Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No results published yet.</TableCell></TableRow>
                  ) : results.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.examType}</TableCell>
                      <TableCell>{r.subject}</TableCell>
                      <TableCell>{r.examDate}</TableCell>
                      <TableCell className="text-center font-bold text-lg text-primary">{r.marks}</TableCell>
                      <TableCell className="text-center text-gray-500">{r.maxMarks}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-white font-bold text-sm">
                          {r.grade}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-0 outline-none">
          <Card className="rounded-2xl shadow-xl border-gray-100">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-xl">Enrollment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Full Name</p>
                  <p className="text-lg font-bold text-gray-900">{profile?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Roll Number</p>
                  <p className="text-lg font-bold font-mono text-gray-900">{profile?.rollNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Class & Section</p>
                  <p className="text-lg font-bold text-gray-900">{profile?.className} - {profile?.section}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Enrollment Date</p>
                  <p className="text-lg font-medium text-gray-900">{profile?.enrollmentDate || "N/A"}</p>
                </div>
                <div className="col-span-1 md:col-span-2 border-t pt-6 mt-2">
                  <h4 className="font-semibold text-lg mb-4 text-gray-900">Guardian Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Father's Name</p>
                      <p className="font-medium">{profile?.fatherName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Contact Phone</p>
                      <p className="font-medium">{profile?.phone || "N/A"}</p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm text-gray-500 font-medium mb-1">Registered Address</p>
                      <p className="font-medium">{profile?.address || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices" className="mt-0 outline-none">
          <div className="space-y-4">
            {notices.length === 0 ? (
               <Card className="rounded-2xl p-12 text-center text-gray-500">No notices from the school.</Card>
            ) : notices.map(n => (
              <Card key={n.id} className="rounded-xl border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl text-gray-900 mb-2">{n.title}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                  <p className="text-sm text-gray-400 mt-4 font-medium">Published on {format(new Date(n.createdAt), "MMMM dd, yyyy")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-0 outline-none">
          <Card className="rounded-2xl shadow-xl border-gray-100 max-w-xl mx-auto">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-xl">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={pwForm.new} onChange={e => setPwForm({...pwForm, new: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} required />
                </div>
                <Button type="submit" className="w-full shadow-md" disabled={passwordChanging}>
                  {passwordChanging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />} 
                  Update Security Credentials
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </AdminLayout>
  );
}
