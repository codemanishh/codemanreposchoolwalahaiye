import { useState } from "react";
import { AdminLayout } from "@/components/layout-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolProfileTab from "./tabs/profile-tab";
import StudentsTab from "./tabs/students-tab";
import ResultsTab from "./tabs/results-tab";
import NotificationsTab from "./tabs/notifications-tab";
import GalleryTab from "./tabs/gallery-tab";
import TopStudentsTab from "./tabs/top-students-tab";
import CurriculumTab from "./tabs/curriculum-tab";

export default function SchoolAdminDashboard() {
  return (
    <AdminLayout portal="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">School Management</h1>
        <p className="text-gray-500 mt-1">Manage your website content, students, and academic results.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-7 w-full h-14 bg-gray-200/50 p-1 rounded-xl mb-8">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Profile & Website</TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Students</TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Results</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Gallery</TabsTrigger>
          <TabsTrigger value="top-students" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Top Students</TabsTrigger>
          <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md font-medium text-sm">Curriculum</TabsTrigger>
        </TabsList>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <TabsContent value="profile" className="mt-0 outline-none"><SchoolProfileTab /></TabsContent>
          <TabsContent value="students" className="mt-0 outline-none"><StudentsTab /></TabsContent>
          <TabsContent value="results" className="mt-0 outline-none"><ResultsTab /></TabsContent>
          <TabsContent value="notifications" className="mt-0 outline-none"><NotificationsTab /></TabsContent>
          <TabsContent value="gallery" className="mt-0 outline-none"><GalleryTab /></TabsContent>
          <TabsContent value="top-students" className="mt-0 outline-none"><TopStudentsTab /></TabsContent>
          <TabsContent value="curriculum" className="mt-0 outline-none"><CurriculumTab /></TabsContent>
        </div>
      </Tabs>
    </AdminLayout>
  );
}
