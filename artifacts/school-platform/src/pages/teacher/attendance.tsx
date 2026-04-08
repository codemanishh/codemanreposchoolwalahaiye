import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Check, X, Clock, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, addDays, subDays } from "date-fns";

interface Student {
  id: number;
  aadhaarNumber: string;
  firstName: string;
  name: string;
  className: string;
  rollNumber: string;
}

type AttendanceStatus = "present" | "absent" | "leave";

interface AttendanceRecord {
  aadhaarNumber: string;
  firstName: string;
  status: AttendanceStatus;
  remarks?: string;
}

interface AttendanceSummary {
  alreadySubmitted: boolean;
  lastSubmittedBy: string | null;
  lastSubmittedAt: string | null;
  records: { aadhaarNumber: string; status: AttendanceStatus; remarks?: string }[];
}

export default function TeacherAttendance() {
  const [, params] = useRoute("/teacher/class/:classId/attendance");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const className = params?.classId ? decodeURIComponent(params.classId) : "";
  const token = localStorage.getItem("teacher_token");
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load students for the class
  useEffect(() => {
    if (!className) return;
    setLoadingStudents(true);
    fetch(`/api/teacher/class/${encodeURIComponent(className)}/students`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data: Student[]) => setStudents(data))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to load students" }))
      .finally(() => setLoadingStudents(false));
  }, [className]);

  // Load all curriculum subjects for the class
  useEffect(() => {
    if (!className) return;
    setLoadingSubjects(true);
    fetch(`/api/teacher/subjects/${encodeURIComponent(className)}`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data: string[]) => {
        setSubjects(data);
        if (data.length > 0 && !selectedSubject) setSelectedSubject(data[0]);
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to load subjects" }))
      .finally(() => setLoadingSubjects(false));
  }, [className]);

  // Initialize attendance state when students load
  useEffect(() => {
    if (students.length > 0) {
      setAttendance((prev) => {
        const next: Record<string, AttendanceRecord> = {};
        for (const s of students) {
          next[s.aadhaarNumber] = prev[s.aadhaarNumber] ?? {
            aadhaarNumber: s.aadhaarNumber,
            firstName: s.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "",
            status: "present",
          };
        }
        return next;
      });
    }
  }, [students]);

  // Load existing attendance when subject or date changes
  const loadExistingAttendance = useCallback(async (subject: string, date: string) => {
    if (!subject || !date || !className) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(
        `/api/teacher/attendance/class/${encodeURIComponent(className)}/subject/${encodeURIComponent(subject)}/date/${date}`,
        { headers: authHeaders },
      );
      if (!res.ok) return;
      const data: AttendanceSummary = await res.json();
      setSummary(data);

      if (data.alreadySubmitted && data.records.length > 0) {
        // Pre-populate with existing attendance
        setAttendance((prev) => {
          const next = { ...prev };
          for (const r of data.records) {
            if (r.aadhaarNumber && next[r.aadhaarNumber]) {
              next[r.aadhaarNumber] = { ...next[r.aadhaarNumber], status: r.status, remarks: r.remarks };
            }
          }
          return next;
        });
      }
    } catch {
      // ignore
    } finally {
      setLoadingSummary(false);
    }
  }, [className]);

  useEffect(() => {
    if (selectedSubject && attendanceDate) {
      loadExistingAttendance(selectedSubject, attendanceDate);
    }
  }, [selectedSubject, attendanceDate]);

  const handleStatusChange = (aadhaarNumber: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [aadhaarNumber]: { ...prev[aadhaarNumber], status } }));
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = { ...next[key], status };
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      toast({ variant: "destructive", title: "Select a subject first" });
      return;
    }
    setSubmitting(true);
    try {
      const records = students.map((s) => ({
        aadhaarNumber: s.aadhaarNumber,
        firstName: s.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "",
        status: attendance[s.aadhaarNumber]?.status ?? "present",
        remarks: attendance[s.aadhaarNumber]?.remarks,
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ className, subject: selectedSubject, attendanceDate, records }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Attendance submitted", description: `${data.upserted} student(s) recorded` });
        // Refresh summary
        await loadExistingAttendance(selectedSubject, attendanceDate);
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Error", description: err.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter((a) => a.status === "present").length;
  const absentCount = Object.values(attendance).filter((a) => a.status === "absent").length;
  const leaveCount = Object.values(attendance).filter((a) => a.status === "leave").length;

  const isLoading = loadingStudents || loadingSubjects;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/teacher/dashboard")} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">Class {className} – Attendance</h1>
            <p className="text-xs text-gray-500">{students.length} students enrolled</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* Controls: Subject + Date */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                {subjects.length === 0 ? (
                  <p className="text-sm text-red-500">No subjects configured for this class. Please set up curriculum in the admin portal.</p>
                ) : (
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Date Picker with prev/next arrows */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAttendanceDate((d) => format(subDays(parseISO(d), 1), "yyyy-MM-dd"))}
                    className="p-1.5 rounded hover:bg-gray-100 border"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => setAttendanceDate((d) => format(addDays(parseISO(d), 1), "yyyy-MM-dd"))}
                    disabled={attendanceDate >= format(new Date(), "yyyy-MM-dd")}
                    className="p-1.5 rounded hover:bg-gray-100 border disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Already-submitted banner */}
            {loadingSummary && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking existing attendance…
              </div>
            )}
            {!loadingSummary && summary?.alreadySubmitted && summary.lastSubmittedBy && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Attendance for this day was last submitted by <strong>{summary.lastSubmittedBy}</strong>
                  {summary.lastSubmittedAt && (
                    <> on {format(new Date(summary.lastSubmittedAt), "dd MMM yyyy, h:mm a")}</>
                  )}. You can still update it.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats + mark-all */}
        {students.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-sm px-3 py-1">
              ✓ Present: {presentCount}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-sm px-3 py-1">
              ✗ Absent: {absentCount}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-sm px-3 py-1">
              ○ Leave: {leaveCount}
            </Badge>
            <div className="ml-auto flex gap-2">
              <button onClick={() => markAll("present")} className="text-xs px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50">All Present</button>
              <button onClick={() => markAll("absent")} className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">All Absent</button>
            </div>
          </div>
        )}

        {/* Student List */}
        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No students enrolled in Class {className}.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedSubject ? `${selectedSubject} – ` : ""}Students ({students.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 pl-4">Roll</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center w-40">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const status = attendance[student.aadhaarNumber]?.status ?? "present";
                    return (
                      <TableRow key={student.aadhaarNumber} className={
                        status === "present" ? "bg-green-50/30" :
                        status === "absent" ? "bg-red-50/30" : "bg-yellow-50/30"
                      }>
                        <TableCell className="font-mono text-sm pl-4 text-gray-500">{student.rollNumber}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleStatusChange(student.aadhaarNumber, "present")}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                status === "present"
                                  ? "bg-green-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> P
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.aadhaarNumber, "absent")}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                status === "absent"
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700"
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> A
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.aadhaarNumber, "leave")}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                status === "leave"
                                  ? "bg-yellow-500 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" /> L
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {students.length > 0 && (
          <div className="flex gap-3 pb-8">
            <Button variant="outline" onClick={() => navigate("/teacher/dashboard")} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedSubject || subjects.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : summary?.alreadySubmitted ? "Update Attendance" : "Submit Attendance"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
