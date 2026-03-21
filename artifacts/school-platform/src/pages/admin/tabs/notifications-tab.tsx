import { useState } from "react";
import { useGetSchoolNotifications, useCreateNotification, useDeleteNotification } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export default function NotificationsTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: notices = [], refetch } = useGetSchoolNotifications({ request: { headers: authHeaders } });
  const { mutate: createNotice, isPending } = useCreateNotification({ request: { headers: authHeaders } });
  const { mutate: deleteNotice } = useDeleteNotification({ request: { headers: authHeaders } });

  const handleCreate = () => {
    if(!title || !content) return;
    createNotice({ data: { title, content } }, {
      onSuccess: () => {
        toast({ title: "Notification Published" });
        setTitle(""); setContent("");
        refetch();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="font-bold text-lg mb-4 flex items-center"><BellRing className="w-5 h-5 mr-2 text-primary" /> Create Notice</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Notice Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Holiday on Friday" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} />
            </div>
            <Button onClick={handleCreate} disabled={isPending} className="w-full">Publish Notice</Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-bold text-xl font-display">Recent Notifications</h3>
        {notices.length === 0 ? (
          <p className="text-gray-500 italic">No notifications published.</p>
        ) : notices.map(n => (
          <Card key={n.id} className="relative overflow-hidden group">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{n.title}</h4>
                  <p className="text-xs text-gray-500 flex items-center mt-1 mb-3">
                    <CalendarDays className="w-3 h-3 mr-1" /> {format(new Date(n.createdAt), "MMM dd, yyyy")}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{n.content}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteNotice({ notificationId: n.id }, { onSuccess: () => refetch() })}
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
