import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetSchoolProfile, useUpdateSchoolProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

export default function SchoolProfileTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const requestHeaders = authHeaders.Authorization ? authHeaders as Record<string, string> : undefined;
  
  const { data: profile, isLoading } = useGetSchoolProfile({
    request: { headers: requestHeaders }
  });
  
  const { mutate: updateProfile, isPending } = useUpdateSchoolProfile({
    request: { headers: requestHeaders }
  });

  const form = useForm({
    defaultValues: profile || {}
  });
  const registerAny = form.register as any;

  useEffect(() => {
    if (profile) form.reset(profile);
  }, [profile, form]);

  const onSubmit = (data: any) => {
    updateProfile({ data }, {
      onSuccess: () => toast({ title: "Profile updated successfully!" }),
      onError: () => toast({ variant: "destructive", title: "Update failed" })
    });
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold font-display">Public Website Information</h2>
        <Button type="submit" disabled={isPending} className="shadow-md">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="font-semibold text-lg border-l-4 border-primary pl-3">Basic Info</h3>
          
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input {...form.register("tagline")} placeholder="e.g. Empowering minds for the future" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input {...form.register("logoUrl")} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Hero Image URL</Label>
              <Input {...form.register("heroImageUrl")} placeholder="https://..." />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Years of Experience</Label>
            <Input type="number" {...form.register("yearsOfExperience", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-semibold text-lg border-l-4 border-primary pl-3">Contact Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...form.register("phone")} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea {...form.register("address")} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Map Location URL</Label>
            <Input
              {...form.register("mapUrl")}
              placeholder="https://www.google.com/maps/..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...form.register("city")} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...form.register("state")} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-gray-100">
        <h3 className="font-semibold text-lg border-l-4 border-primary pl-3">Content Sections</h3>
        
        <div className="space-y-2">
          <Label>About Us</Label>
          <Textarea {...form.register("about")} rows={4} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Mission</Label>
            <Textarea {...form.register("mission")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Vision</Label>
            <Textarea {...form.register("vision")} rows={3} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Principal's Message</Label>
            <Textarea {...form.register("principalMessage")} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Founder's Message</Label>
            <Textarea {...form.register("founderMessage")} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>President's Message</Label>
            <Textarea {...form.register("presidentMessage")} rows={4} />
          </div>
        </div>
      </div>
      
      <div className="space-y-6 pt-6 border-t border-gray-100">
        <h3 className="font-semibold text-lg border-l-4 border-primary pl-3">Additional Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Fee Structure (HTML Table allowed)</Label>
            <Textarea {...form.register("feeStructure")} rows={6} className="font-mono text-sm" placeholder="<table>..." />
          </div>
          <div className="space-y-2">
            <Label>Facilities (HTML List allowed)</Label>
            <Textarea {...form.register("facilities")} rows={6} className="font-mono text-sm" placeholder="<ul>..." />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-base">Social Media URLs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input {...form.register("socialFacebook")} placeholder="https://facebook.com/your-school" />
            </div>
            <div className="space-y-2">
              <Label>Twitter/X URL</Label>
              <Input {...form.register("socialTwitter")} placeholder="https://x.com/your-school" />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input {...registerAny("socialInstagram")} placeholder="https://instagram.com/your-school" />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input {...form.register("socialYoutube")} placeholder="https://youtube.com/@your-school" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" disabled={isPending} className="shadow-lg">
          {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </form>
  );
}
