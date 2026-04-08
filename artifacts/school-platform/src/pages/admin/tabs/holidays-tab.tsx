import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

type Holiday = {
  id: number;
  title: string;
  holidayDate: string;
  description: string | null;
};

export default function HolidaysTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const requestHeaders = authHeaders.Authorization ? (authHeaders as Record<string, string>) : undefined;

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school/holidays", { headers: requestHeaders });
      if (!res.ok) throw new Error("Failed to load holidays");
      const data = await res.json();
      setHolidays(Array.isArray(data) ? data : []);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load holidays" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !holidayDate) {
      toast({ variant: "destructive", title: "Title and date are required" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/school/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(requestHeaders || {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          holidayDate,
          description: description.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create holiday");

      setTitle("");
      setHolidayDate("");
      setDescription("");
      toast({ title: "Holiday added" });
      await loadHolidays();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Could not add holiday" });
    } finally {
      setSaving(false);
    }
  };

  const deleteHoliday = async (id: number, name: string) => {
    if (!confirm(`Delete holiday '${name}'?`)) return;

    try {
      const res = await fetch(`/api/school/holidays/${id}`, {
        method: "DELETE",
        headers: requestHeaders,
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Holiday deleted" });
      await loadHolidays();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete holiday" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> Add School Holiday
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1 md:col-span-1">
              <Label>Holiday Name</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali Break" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Date</Label>
              <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
            </div>
            <Button type="submit" disabled={saving} className="md:col-span-1">
              <Plus className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Add Holiday"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-gray-500">No holidays added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Holiday</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono">{h.holidayDate}</TableCell>
                    <TableCell className="font-medium">{h.title}</TableCell>
                    <TableCell>{h.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => deleteHoliday(h.id, h.title)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
