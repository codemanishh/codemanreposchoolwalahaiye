import { useState } from "react";
import { AdminLayout } from "@/components/layout-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Copy } from "lucide-react";
import SchoolProfileTab from "./tabs/profile-tab";
import StudentsTab from "./tabs/students-tab";
import ResultsTab from "./tabs/results-tab";
import NotificationsTab from "./tabs/notifications-tab";
import GalleryTab from "./tabs/gallery-tab";
import TopStudentsTab from "./tabs/top-students-tab";
import CurriculumTab from "./tabs/curriculum-tab";
import TeachersTab from "./tabs/teachers-tab";
import HolidaysTab from "./tabs/holidays-tab";

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const schoolId = user?.schoolId ?? user?.id;

  const handleCopySchoolId = async () => {
    if (!schoolId) return;
    try {
      await navigator.clipboard.writeText(String(schoolId));
      toast({ title: "School ID copied", description: `School ID ${schoolId} copied to clipboard.` });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Could not copy School ID." });
    }
  };

  return (
    <AdminLayout portal="admin">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-display font-bold text-gray-900">School Management</h1>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="text-gray-500">Manage your website content, students, and academic results.</p>
          {schoolId ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-amber-900">School ID</span>
              <span className="font-mono text-base font-semibold text-amber-950">{schoolId}</span>
              <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={handleCopySchoolId}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-9 w-full h-auto md:h-14 bg-gray-200/50 p-1 rounded-xl mb-8 gap-1">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Profile & Website</TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Students</TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Results</TabsTrigger>
          <TabsTrigger value="teachers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Teachers</TabsTrigger>
          <TabsTrigger value="holidays" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Holidays</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Gallery</TabsTrigger>
          <TabsTrigger value="top-students" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Top Students</TabsTrigger>
          <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Curriculum</TabsTrigger>
        </TabsList>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <TabsContent value="profile" className="mt-0 outline-none"><SchoolProfileTab /></TabsContent>
          <TabsContent value="students" className="mt-0 outline-none"><StudentsTab /></TabsContent>
          <TabsContent value="results" className="mt-0 outline-none"><ResultsTab /></TabsContent>
          <TabsContent value="teachers" className="mt-0 outline-none"><TeachersTab /></TabsContent>
          <TabsContent value="holidays" className="mt-0 outline-none"><HolidaysTab /></TabsContent>
          <TabsContent value="notifications" className="mt-0 outline-none"><NotificationsTab /></TabsContent>
          <TabsContent value="gallery" className="mt-0 outline-none"><GalleryTab /></TabsContent>
          <TabsContent value="top-students" className="mt-0 outline-none"><TopStudentsTab /></TabsContent>
          <TabsContent value="curriculum" className="mt-0 outline-none"><CurriculumTab /></TabsContent>
        </div>
      </Tabs>
    </AdminLayout>
  );
}
