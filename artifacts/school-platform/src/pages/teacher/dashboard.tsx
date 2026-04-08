import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Calendar, BookOpen, Trash2, Plus } from "lucide-react";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduleSubject = {
  id: number;
  subject: string;
};

type DaySchedule = {
  day: string;
  dayOfWeek: number;
  subjects: ScheduleSubject[];
};

type ScheduleResponse = {
  className: string;
  days: DaySchedule[];
  availableSubjects: string[];
};

type ScheduleHistoryEntry = {
  id: number;
  createdAt: string;
  action: "add" | "remove";
  dayOfWeek: number;
  day: string;
  subject: string;
  updaterName: string;
  updaterPhone: string;
  note: string;
};

type ScheduleHistoryResponse = {
  latestUpdater: { name: string; phone: string; at: string } | null;
  history: ScheduleHistoryEntry[];
};

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const teacher = JSON.parse(localStorage.getItem("teacher_user") || "{}");
  const token = localStorage.getItem("teacher_token");

  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [history, setHistory] = useState<ScheduleHistoryEntry[]>([]);
  const [latestUpdater, setLatestUpdater] = useState<ScheduleHistoryResponse["latestUpdater"]>(null);
  const [changeNote, setChangeNote] = useState("");
  const [updaterName, setUpdaterName] = useState<string>(teacher?.name || "");
  const [updaterPhone, setUpdaterPhone] = useState<string>("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const authHeaders = token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : undefined;

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSchedule(selectedClass);
      fetchScheduleHistory(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes", {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0]);
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load classes" });
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSchedule = async (className: string) => {
    setLoadingSchedule(true);
    try {
      const res = await fetch(`/api/teacher/schedule/${className}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data: ScheduleResponse = await res.json();
        setSchedule(data.days || []);
        setAvailableSubjects(data.availableSubjects || []);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load schedule" });
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchScheduleHistory = async (className: string) => {
    try {
      const res = await fetch(`/api/teacher/schedule-history/${className}`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data: ScheduleHistoryResponse = await res.json();
      setLatestUpdater(data.latestUpdater);
      setHistory(data.history || []);
    } catch {
      // non-blocking, keep UI functional
    }
  };

  const ensureUpdaterFields = () => {
    const normalizedPhone = updaterPhone.replace(/\D/g, "");
    if (!updaterName.trim() || !normalizedPhone) {
      toast({
        variant: "destructive",
        title: "Updater details required",
        description: "Please enter updater name and phone before changing timetable.",
      });
      return null;
    }
    return { updaterName: updaterName.trim(), updaterPhone: normalizedPhone };
  };

  const handleAddSubjectToDay = async (dayOfWeek: number, subject: string) => {
    const updater = ensureUpdaterFields();
    if (!updater) return;
    try {
      const res = await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: { ...(authHeaders || {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          className: selectedClass,
          subject,
          dayOfWeek,
          updaterName: updater.updaterName,
          updaterPhone: updater.updaterPhone,
          note: changeNote.trim(),
        }),
      });
      if (res.ok) {
        toast({ title: "Subject added", description: `${subject} added for ${DAYS[dayOfWeek]}` });
        fetchSchedule(selectedClass);
        fetchScheduleHistory(selectedClass);
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Error", description: err.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    const updater = ensureUpdaterFields();
    if (!updater) return;
    try {
      const res = await fetch(`/api/teacher/schedule/${scheduleId}`, {
        method: "DELETE",
        headers: { ...(authHeaders || {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          updaterName: updater.updaterName,
          updaterPhone: updater.updaterPhone,
          note: changeNote.trim(),
        }),
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Subject removed from schedule" });
        fetchSchedule(selectedClass);
        fetchScheduleHistory(selectedClass);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacher_token");
    localStorage.removeItem("teacher_user");
    setLocation("/teacher/login");
  };

  const handleStartAttendance = () => {
    if (!selectedClass) {
      toast({ variant: "destructive", title: "Error", description: "Please select a class" });
      return;
    }
    setLocation(`/teacher/class/${encodeURIComponent(selectedClass)}/attendance`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {teacher.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Select Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {classes.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`p-3 rounded-lg font-semibold text-sm md:text-base transition-all border-2 ${
                        selectedClass === cls
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-200 hover:border-primary"
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>

                {selectedClass && (
                  <Button
                    onClick={handleStartAttendance}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Mark Attendance for Class {selectedClass}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Management */}
        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Class {selectedClass} - Weekly Schedule
              </CardTitle>
              <CardDescription>
                Add or remove day-wise subjects. Add options only come from school curriculum subjects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Updater name"
                  value={updaterName}
                  onChange={(e) => setUpdaterName(e.target.value)}
                />
                <Input
                  placeholder="Updater phone"
                  value={updaterPhone}
                  onChange={(e) => setUpdaterPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                />
                <Input
                  placeholder="Short change note (optional)"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value.slice(0, 300))}
                />
              </div>

              <div className="mb-5 rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm">
                <p className="font-semibold text-blue-900">Latest Timetable Update</p>
                {latestUpdater ? (
                  <p className="text-blue-800">
                    {latestUpdater.name} ({latestUpdater.phone}) at {new Date(latestUpdater.at).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-blue-700">No update history yet.</p>
                )}
              </div>

              {loadingSchedule ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {schedule.map((daySchedule) => (
                    <div
                      key={daySchedule.dayOfWeek}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <h3 className="font-semibold text-center mb-3 text-sm md:text-base">
                        {daySchedule.day}
                      </h3>

                      <div className="space-y-2 mb-4 min-h-[80px]">
                        {daySchedule.subjects.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">No subjects</p>
                        ) : (
                          daySchedule.subjects.map((item: ScheduleSubject) => {
                            return (
                              <div
                                key={`${daySchedule.dayOfWeek}-${item.subject}-${item.id}`}
                                className="bg-white rounded p-2 text-xs md:text-sm flex justify-between items-center gap-1"
                              >
                                <span className="flex-1">{item.subject}</span>
                                {item.id > 0 && (
                                  <button
                                    onClick={() => handleDeleteSchedule(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <AddSubjectForm
                        daySubjects={daySchedule.subjects.map((s) => s.subject)}
                        availableSubjects={availableSubjects}
                        onAdd={(subject) => handleAddSubjectToDay(daySchedule.dayOfWeek, subject)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Timetable Change History</h4>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">No history yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {history.map((entry) => (
                      <div key={entry.id} className="text-xs md:text-sm bg-white border rounded p-2">
                        <p className="font-medium text-gray-900">
                          {entry.action === "add" ? "Added" : "Removed"} {entry.subject} on {entry.day}
                        </p>
                        <p className="text-gray-600">
                          By {entry.updaterName} ({entry.updaterPhone}) at {new Date(entry.createdAt).toLocaleString()}
                        </p>
                        {entry.note ? <p className="text-gray-500">Note: {entry.note}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AddSubjectForm({
  onAdd,
  availableSubjects,
  daySubjects,
}: {
  onAdd: (subject: string) => void;
  availableSubjects: string[];
  daySubjects: string[];
}) {
  const addable = availableSubjects.filter((s) => !daySubjects.some((d) => d.toLowerCase() === s.toLowerCase()));
  const [subject, setSubject] = useState<string>(addable[0] || "");

  useEffect(() => {
    setSubject((prev) => {
      if (prev && addable.includes(prev)) return prev;
      return addable[0] || "";
    });
  }, [availableSubjects.join("|"), daySubjects.join("|")]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onAdd(subject);
      setSubject("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full text-xs md:text-sm h-8 rounded border border-input bg-background px-2"
        disabled={addable.length === 0}
      >
        {addable.length === 0 ? (
          <option value="">No more subjects available</option>
        ) : (
          addable.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))
        )}
      </select>
      <Button type="submit" size="sm" className="w-full h-7 text-xs" disabled={!subject.trim() || addable.length === 0}>
        <Plus className="w-3 h-3 mr-1" />
        Add
      </Button>
    </form>
  );
}
