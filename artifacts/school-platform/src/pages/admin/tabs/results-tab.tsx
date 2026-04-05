import { useState } from "react";
import { useUploadResults, useListResults } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileSpreadsheet, Trash2, Search, Filter, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 border-green-200",
  "A": "bg-blue-100 text-blue-800 border-blue-200",
  "B+": "bg-teal-100 text-teal-800 border-teal-200",
  "B": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "C": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "D": "bg-orange-100 text-orange-800 border-orange-200",
  "F": "bg-red-100 text-red-800 border-red-200",
};

export default function ResultsTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: results = [], refetch } = useListResults({ request: { headers: authHeaders } });
  const { mutate: upload, isPending } = useUploadResults({ request: { headers: authHeaders } });

  const classes = [...new Set(results.map(r => (r as any).className).filter(Boolean))].sort();
  const examTypes = [...new Set(results.map(r => r.examType).filter(Boolean))].sort();

  const filtered = results.filter(r => {
    const matchSearch = !search
      || (r as any).studentName?.toLowerCase().includes(search.toLowerCase())
      || r.rollNumber?.includes(search)
      || ((r as any).aadhaarNumber || "").includes(search);
    const matchClass = !classFilter || (r as any).className === classFilter;
    const matchExam = !examFilter || r.examType === examFilter;
    return matchSearch && matchClass && matchExam;
  });

  const handleUpload = () => {
    if (!file) return;
    upload({ data: { file } }, {
      onSuccess: (res) => {
        toast({ title: "Upload Successful", description: `Inserted ${res.inserted} records${res.errors?.length ? `, ${res.errors.length} errors` : ""}.` });
        setFile(null);
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Upload Failed" })
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this result record?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${BASE}/api/school/results/${id}`, {
        method: "DELETE",
        headers: authHeaders as Record<string, string>
      });
      if (res.ok) {
        toast({ title: "Result Deleted" });
        refetch();
      }
    } catch {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setDeleting(null);
    }
  };

  const totalMarks = filtered.reduce((s, r) => s + (r.marks || 0), 0);
  const totalMax = filtered.reduce((s, r) => s + (r.maxMarks || 0), 0);
  const pct = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="p-5 bg-blue-50/60 border-blue-100">
        <h3 className="font-semibold flex items-center mb-3 text-blue-900 text-sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Upload Results via Excel
        </h3>
        <p className="text-xs text-blue-700 mb-3">
          Required columns: <code className="bg-blue-100 px-1 rounded">aadhaar_number, first_name, subject, marks, max_marks, grade, exam_type, exam_date, remarks</code> (add <code className="bg-blue-100 px-1 rounded">class_name</code> when same Aadhaar has multiple class records)
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <a href={`${BASE}/templates/sample-results-upload.xlsx`} download>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Sample Excel
            </Button>
          </a>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-xs bg-white text-sm" />
          <Button onClick={handleUpload} disabled={!file || isPending} size="sm">
            <UploadCloud className="w-4 h-4 mr-2" /> {isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{results.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Records</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{new Set(results.map(r => r.rollNumber)).size}</p>
          <p className="text-xs text-gray-500 mt-1">Students</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{examTypes.length}</p>
          <p className="text-xs text-gray-500 mt-1">Exam Types</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{filtered.length > 0 ? pct + "%" : "—"}</p>
          <p className="text-xs text-gray-500 mt-1">{(classFilter || examFilter) ? "Filtered Avg" : "Overall Avg"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input placeholder="Search by name, roll no, or aadhaar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 text-sm h-9" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 h-9">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
        <select value={examFilter} onChange={e => setExamFilter(e.target.value)} className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 h-9">
          <option value="">All Exams</option>
          {examTypes.map(e => <option key={e} value={e!}>{e}</option>)}
        </select>
        {(search || classFilter || examFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setClassFilter(""); setExamFilter(""); }} className="h-9">
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-20">Roll No.</TableHead>
              <TableHead>Aadhaar</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Exam Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-center">Marks</TableHead>
              <TableHead className="text-center">%</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-gray-400">
                  {search || classFilter || examFilter ? "No results match your filter." : "No results uploaded yet."}
                </TableCell>
              </TableRow>
            ) : filtered.map(r => {
              const pctVal = r.maxMarks ? Math.round((r.marks! / r.maxMarks!) * 100) : 0;
              const grade = r.grade || "";
              const gradeClass = GRADE_COLORS[grade] || "bg-gray-100 text-gray-700 border-gray-200";
              return (
                <TableRow key={r.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm">{r.rollNumber}</TableCell>
                  <TableCell className="font-mono text-sm">{(r as any).aadhaarNumber || "—"}</TableCell>
                  <TableCell className="font-medium">{(r as any).studentName || "—"}</TableCell>
                  <TableCell className="text-sm text-gray-600">{(r as any).className || "—"}</TableCell>
                  <TableCell><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{r.examType}</span></TableCell>
                  <TableCell className="font-medium">{r.subject}</TableCell>
                  <TableCell className="text-center font-bold">{r.marks} <span className="text-gray-400 font-normal text-xs">/ {r.maxMarks}</span></TableCell>
                  <TableCell className="text-center text-sm">{pctVal}%</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${gradeClass}`}>{grade || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleDelete(r.id!)}
                      disabled={deleting === r.id}
                      className="h-7 w-7 p-0 text-destructive hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
            Showing {filtered.length} of {results.length} records
          </div>
        )}
      </div>
    </div>
  );
}
