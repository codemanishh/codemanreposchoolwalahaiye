import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Calendar, BookOpen, Trash2, Plus } from "lucide-react";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DaySchedule = {
  day: string;
  dayOfWeek: number;
  subjects: string[];
};

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const teacher = JSON.parse(localStorage.getItem("teacher_user") || "{}");
  const token = localStorage.getItem("teacher_token");

  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const authHeaders = token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : undefined;

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSchedule(selectedClass);
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
        const data = await res.json();
        setSchedule(data);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load schedule" });
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleAddSubjectToDay = async (dayOfWeek: number, subject: string) => {
    try {
      const res = await fetch("/api/school/schedule", {
        method: "POST",
        headers: { ...(authHeaders || {}), "Content-Type": "application/json" },
        body: JSON.stringify({ className: selectedClass, subject, dayOfWeek }),
      });
      if (res.ok) {
        toast({ title: "Subject added", description: `${subject} added for ${DAYS[dayOfWeek]}` });
        fetchSchedule(selectedClass);
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Error", description: err.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      const res = await fetch(`/api/school/schedule/${scheduleId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Subject removed from schedule" });
        fetchSchedule(selectedClass);
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
                Set up which subjects are taught on which days of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                          daySchedule.subjects.map((subject: string, idx: number) => {
                            return (
                              <div
                                key={idx}
                                className="bg-white rounded p-2 text-xs md:text-sm flex justify-between items-center gap-1"
                              >
                                <span className="flex-1">{subject}</span>
                                <button
                                  onClick={() => {
                                    // Find the schedule ID for this subject/day
                                    console.log("Delete subject:", subject, "day:", daySchedule.dayOfWeek);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <AddSubjectForm
                        onAdd={(subject) => handleAddSubjectToDay(daySchedule.dayOfWeek, subject)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AddSubjectForm({ onAdd }: { onAdd: (subject: string) => void }) {
  const [subject, setSubject] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onAdd(subject);
      setSubject("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Subject name"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="text-xs md:text-sm h-8"
      />
      <Button type="submit" size="sm" className="w-full h-7 text-xs" disabled={!subject.trim()}>
        <Plus className="w-3 h-3 mr-1" />
        Add
      </Button>
    </form>
  );
}
