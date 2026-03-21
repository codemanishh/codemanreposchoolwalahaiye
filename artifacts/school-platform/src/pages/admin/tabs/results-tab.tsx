import { useState } from "react";
import { useUploadResults, useListResults } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileSpreadsheet, Download } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ResultsTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const { data: results = [], refetch } = useListResults({ request: { headers: authHeaders } });
  const { mutate: upload, isPending } = useUploadResults({ request: { headers: authHeaders } });

  const handleUpload = () => {
    if (!file) return;
    upload({ data: { file } }, {
      onSuccess: (res) => {
        toast({ title: "Upload Success", description: `Inserted ${res.inserted} records.` });
        setFile(null);
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Upload Failed" })
    });
  };

  return (
    <div className="space-y-8">
      <Card className="p-6 bg-blue-50/50 border-blue-100">
        <h3 className="text-lg font-semibold flex items-center mb-4 text-blue-900">
          <FileSpreadsheet className="w-5 h-5 mr-2" /> Upload Results (Excel)
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          Excel file must have headers: <code>roll_number, subject, marks, max_marks, grade, exam_type, exam_date, remarks</code>
        </p>
        <div className="flex items-center space-x-4">
          <Input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            className="max-w-sm bg-white"
          />
          <Button onClick={handleUpload} disabled={!file || isPending} className="shadow-md">
            <UploadCloud className="w-4 h-4 mr-2" />
            {isPending ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold font-display mb-4">Published Results</h2>
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Roll No.</TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6">No results uploaded yet.</TableCell></TableRow>
              ) : results.slice(0, 50).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.rollNumber}</TableCell>
                  <TableCell>{r.examType}</TableCell>
                  <TableCell>{r.subject}</TableCell>
                  <TableCell>{r.marks} / {r.maxMarks}</TableCell>
                  <TableCell className="font-bold">{r.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {results.length > 50 && <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 border-t">Showing top 50 records.</div>}
        </div>
      </div>
    </div>
  );
}
