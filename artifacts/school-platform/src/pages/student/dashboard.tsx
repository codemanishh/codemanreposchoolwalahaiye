import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetStudentProfile, useGetStudentResults, useGetStudentNotifications, useChangeStudentPassword } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, BookOpen, Bell, UserCircle, KeyRound, Loader2, Printer, TrendingUp, Award, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, Cell, Tooltip } from "recharts";

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 border-green-200",
  "A":  "bg-blue-100 text-blue-800 border-blue-200",
  "B+": "bg-teal-100 text-teal-800 border-teal-200",
  "B":  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "C":  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "D":  "bg-orange-100 text-orange-800 border-orange-200",
  "F":  "bg-red-100 text-red-800 border-red-200",
};

function getOverallGrade(pct: number) {
  if (pct >= 90) return { grade: "A+", color: "text-green-600" };
  if (pct >= 80) return { grade: "A",  color: "text-blue-600" };
  if (pct >= 70) return { grade: "B+", color: "text-teal-600" };
  if (pct >= 60) return { grade: "B",  color: "text-cyan-600" };
  if (pct >= 50) return { grade: "C",  color: "text-yellow-600" };
  if (pct >= 40) return { grade: "D",  color: "text-orange-600" };
  return { grade: "F", color: "text-red-600" };
}

export default function StudentDashboard() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const requestHeaders = authHeaders.Authorization ? (authHeaders as Record<string, string>) : undefined;
  const [examFilter, setExamFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useGetStudentProfile({ request: { headers: requestHeaders } });
  const { data: results = [], isLoading: resultsLoading } = useGetStudentResults({ request: { headers: requestHeaders } });
  const { data: notices = [] } = useGetStudentNotifications({ request: { headers: requestHeaders } });
  const { mutate: changePassword, isPending: passwordChanging } = useChangeStudentPassword({ request: { headers: requestHeaders } });
  const [holidays, setHolidays] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });

  const examTypes = [...new Set(results.map(r => r.examType).filter(Boolean))] as string[];
  const classOptions = [...new Set(results.map(r => String((r as any).className || "").trim()).filter(Boolean))]
    .sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

  const classFiltered = classFilter === "all"
    ? results
    : results.filter(r => String(r.className || "").trim() === classFilter);

  const filteredResults = examFilter === "all"
    ? classFiltered
    : classFiltered.filter(r => r.examType === examFilter);

  const totalMarks = filteredResults.reduce((s, r) => s + (r.marks || 0), 0);
  const totalMax = filteredResults.reduce((s, r) => s + (r.maxMarks || 0), 0);
  const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100) : 0;
  const overallGrade = totalMax > 0 ? getOverallGrade(percentage) : null;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new !== pwForm.confirm) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }
    changePassword({ data: { currentPassword: pwForm.current, newPassword: pwForm.new } }, {
      onSuccess: () => {
        toast({ title: "Password updated successfully!" });
        setPwForm({ current: "", new: "", confirm: "" });
        refetchProfile();
      },
      onError: () => toast({ variant: "destructive", title: "Incorrect current password" })
    });
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const holidayHeaders = authHeaders.Authorization ? (authHeaders as Record<string, string>) : undefined;
    const loadHolidays = async () => {
      try {
        const res = await fetch("/api/student/holidays/upcoming", { headers: holidayHeaders });
        if (!res.ok) return;
        const data = await res.json();
        setHolidays(Array.isArray(data) ? data : []);
      } catch {
        // Keep UI resilient even if holiday endpoint is temporarily unavailable.
      }
    };
    loadHolidays();
  }, [authHeaders.Authorization]);

  useEffect(() => {
    const attendanceHeaders = authHeaders.Authorization ? (authHeaders as Record<string, string>) : undefined;
    const loadAttendance = async () => {
      setAttendanceLoading(true);
      try {
        const res = await fetch("/api/student/attendance/stats", { headers: attendanceHeaders });
        if (!res.ok) return;
        const data = await res.json();
        setAttendanceStats(Array.isArray(data) ? data : []);
      } catch {
        // Keep UI resilient
      } finally {
        setAttendanceLoading(false);
      }
    };
    loadAttendance();
  }, [authHeaders.Authorization]);

  if (profileLoading) return (
    <AdminLayout portal="student">
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout portal="student">
      {profile && !profile.hasChangedPassword && (
        <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-900 rounded-xl">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-bold">Change Your Password</AlertTitle>
          <AlertDescription>
            You are still using the default password <strong>111111</strong>. Go to the Settings tab to update it.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name} 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">{profile?.schoolName} · Class {profile?.className}{profile?.section ? ` - ${profile.section}` : ""} · Roll No: <strong>{profile?.rollNumber}</strong></p>
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid grid-cols-6 w-full h-12 bg-white shadow-sm p-1 rounded-xl mb-8 border border-gray-100">
          <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs sm:text-sm"><BookOpen className="w-4 h-4 mr-1.5 hidden sm:inline" /> Results</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs sm:text-sm"><BookOpen className="w-4 h-4 mr-1.5 hidden sm:inline" /> Attendance</TabsTrigger>
          <TabsTrigger value="holidays" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs sm:text-sm"><CalendarDays className="w-4 h-4 mr-1.5 hidden sm:inline" /> Holidays</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs sm:text-sm"><UserCircle className="w-4 h-4 mr-1.5 hidden sm:inline" /> Profile</TabsTrigger>
          <TabsTrigger value="notices" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs sm:text-sm relative">
            <Bell className="w-4 h-4 mr-1.5 hidden sm:inline" /> Notices
            {notices.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notices.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-xs sm:text-sm"><KeyRound className="w-4 h-4 mr-1.5 hidden sm:inline" /> Settings</TabsTrigger>
        </TabsList>

        {/* ── RESULTS TAB ── */}
        <TabsContent value="results" className="mt-0 outline-none space-y-6 print:block">
          {resultsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : results.length === 0 ? (
            <Card className="rounded-2xl p-16 text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No results published yet.</p>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-primary">{results.length}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Subjects</p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-gray-800">{totalMarks} <span className="text-gray-400 text-lg font-normal">/ {totalMax}</span></p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{examFilter === "all" ? "Total Marks" : `${examFilter} Marks`}</p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-blue-600">{percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Percentage</p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                  {overallGrade ? (
                    <>
                      <p className={`text-3xl font-bold ${overallGrade.color}`}>{overallGrade.grade}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Overall Grade</p>
                    </>
                  ) : <p className="text-gray-300 text-3xl">—</p>}
                </div>
              </div>

              {/* Filter + Print */}
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Class:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setClassFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${classFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"}`}
                  >
                    All Classes
                  </button>
                  {classOptions.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setClassFilter(cls)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${classFilter === cls ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"}`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Filter by Exam:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setExamFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${examFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"}`}
                  >
                    All Exams
                  </button>
                  {examTypes.map(et => (
                    <button
                      key={et}
                      onClick={() => setExamFilter(et)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${examFilter === et ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"}`}
                    >
                      {et}
                    </button>
                  ))}
                </div>
                <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
                    <Printer className="w-4 h-4 mr-2" /> Print Result
                  </Button>
                </div>
              </div>

              {/* Result slip header for print */}
              <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-gray-800">
                <h1 className="text-2xl font-bold">{profile?.schoolName}</h1>
                <h2 className="text-lg font-semibold mt-2">RESULT REPORT CARD</h2>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-left">
                  <div><strong>Name:</strong> {profile?.name}</div>
                  <div><strong>Roll No:</strong> {profile?.rollNumber}</div>
                  <div><strong>Class:</strong> {profile?.className}{profile?.section ? ` - ${profile.section}` : ""}</div>
                </div>
              </div>

              {/* Results Table */}
              <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-100 py-3 px-6 print:hidden">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    {examFilter === "all" ? "All Results" : `${examFilter} Results`}
                    <span className="ml-1 text-sm text-gray-400 font-normal">({filteredResults.length} subjects)</span>
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        {examFilter === "all" && <TableHead className="w-32">Exam Type</TableHead>}
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Marks</TableHead>
                        <TableHead className="text-center">Max</TableHead>
                        <TableHead className="text-center">%</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No results for this exam type.</TableCell></TableRow>
                      ) : filteredResults.map(r => {
                        const pct = r.maxMarks ? Math.round((r.marks! / r.maxMarks!) * 100) : 0;
                        const grade = r.grade || "";
                        const gc = GRADE_COLORS[grade] || "bg-gray-100 text-gray-700 border-gray-200";
                        return (
                          <TableRow key={r.id} className="hover:bg-gray-50">
                            {examFilter === "all" && (
                              <TableCell><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{r.examType}</span></TableCell>
                            )}
                            <TableCell className="font-semibold text-gray-900">{r.subject}</TableCell>
                            <TableCell className="text-gray-500 text-sm">{r.examDate || "—"}</TableCell>
                            <TableCell className="text-center font-bold text-lg text-primary">{r.marks}</TableCell>
                            <TableCell className="text-center text-gray-400">{r.maxMarks}</TableCell>
                            <TableCell className="text-center text-sm">
                              <span className={`font-semibold ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>{pct}%</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`text-xs font-bold ${gc}`}>{grade || "—"}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{r.remarks || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {filteredResults.length > 0 && (
                  <div className="bg-gray-50 border-t p-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="text-sm text-gray-600">
                      <strong>Total:</strong> {totalMarks} / {totalMax}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Percentage:</strong> {percentage.toFixed(1)}%
                    </div>
                    {overallGrade && (
                      <div className="text-sm text-gray-600">
                        <strong>Overall Grade:</strong> <span className={`font-bold ${overallGrade.color}`}>{overallGrade.grade}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Print footer */}
              <div className="hidden print:block mt-8 pt-4 border-t text-sm text-gray-500 flex justify-between">
                <p>Generated on: {new Date().toLocaleDateString()}</p>
                <p>This is a computer-generated report card.</p>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── HOLIDAYS TAB ── */}
        <TabsContent value="holidays" className="mt-0 outline-none">
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <CardHeader className="bg-emerald-50 border-b border-emerald-100">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                <CalendarDays className="w-5 h-5" /> Upcoming School Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {holidays.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming holidays announced yet.</p>
              ) : (
                holidays.map((h) => (
                  <div key={h.id} className="border rounded-lg p-4 bg-white">
                    <p className="font-semibold text-gray-900">{h.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(h.holidayDate), "MMMM dd, yyyy")}</p>
                    {h.description && <p className="text-sm text-gray-700 mt-2">{h.description}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ATTENDANCE TAB ── */}
        <TabsContent value="attendance" className="mt-0 outline-none space-y-6">
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <Award className="w-5 h-5" />
                Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Your attendance is tracked by subject. Teachers mark attendance for each class, and your percentage is calculated and displayed below.
              </p>
              {attendanceLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : attendanceStats.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    📝 No attendance records yet. Teachers will start marking your attendance once they begin using the attendance system.
                  </p>
                </div>
              ) : (
                <>
                  {/* Bar Chart */}
                  <div className="w-full h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceStats}>
                        <XAxis dataKey="subject" fontSize={12} />
                        <YAxis domain={[0, 100]} label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, "Attendance %"]}
                          contentStyle={{ borderRadius: 12, borderColor: "#dbeafe" }}
                        />
                        <Legend />
                        <Bar dataKey="percentage" fill="#3b82f6" name="Attendance %" radius={[8, 8, 0, 0]}>
                          {attendanceStats.map((entry, index) => {
                            let color = "#3b82f6";
                            if (entry.percentage >= 90) color = "#10b981";
                            else if (entry.percentage >= 75) color = "#8b5cf6";
                            else if (entry.percentage >= 60) color = "#f59e0b";
                            else color = "#ef4444";
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Subject Details Table */}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Present Days</TableHead>
                        <TableHead className="text-right">Total Days</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceStats.map((stat, idx) => {
                        const pctColor = stat.percentage >= 90 ? "text-green-600" : 
                                       stat.percentage >= 75 ? "text-blue-600" :
                                       stat.percentage >= 60 ? "text-amber-600" : "text-red-600";
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{stat.subject}</TableCell>
                            <TableCell className="text-right text-sm">{stat.present}</TableCell>
                            <TableCell className="text-right text-sm">{stat.total}</TableCell>
                            <TableCell className={`text-right font-bold text-sm ${pctColor}`}>
                              {stat.percentage}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="mt-0 outline-none">
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-lg">Enrollment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <InfoField label="Full Name" value={profile?.name} />
                <InfoField label="Roll Number" value={profile?.rollNumber} mono />
                <InfoField label="Class & Section" value={`${profile?.className || "—"} ${profile?.section ? `- ${profile.section}` : ""}`} />
                <InfoField label="Enrollment Date" value={profile?.enrollmentDate || "—"} />
                <div className="col-span-1 md:col-span-2 border-t pt-6 mt-2">
                  <h4 className="font-semibold text-gray-800 mb-5">Guardian Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="Father's Name" value={profile?.fatherName || "—"} />
                    <InfoField label="Contact Phone" value={profile?.phone || "—"} />
                    <div className="col-span-1 md:col-span-2">
                      <InfoField label="Registered Address" value={profile?.address || "—"} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NOTICES TAB ── */}
        <TabsContent value="notices" className="mt-0 outline-none">
          <div className="space-y-4">
            {notices.length === 0 ? (
              <Card className="rounded-2xl p-16 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No notices from the school yet.</p>
              </Card>
            ) : notices.map(n => (
              <Card key={n.id} className="rounded-xl border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl text-gray-900 mb-1">{n.title}</h4>
                  <p className="text-xs text-gray-400 mb-3">{format(new Date(n.createdAt), "MMMM dd, yyyy")}</p>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="mt-0 outline-none">
          <Card className="rounded-2xl shadow-sm border-gray-100 max-w-lg mx-auto">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-lg">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} placeholder="Enter current password" required />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={pwForm.new} onChange={e => setPwForm({ ...pwForm, new: e.target.value })} placeholder="At least 6 characters" required />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Re-enter new password" required />
                </div>
                <Button type="submit" className="w-full shadow-md" disabled={passwordChanging}>
                  {passwordChanging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style>{`
        @media print {
          .sidebar, header, nav, [data-radix-tabs-list], button { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </AdminLayout>
  );
}

function InfoField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-base font-semibold text-gray-900 ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}
