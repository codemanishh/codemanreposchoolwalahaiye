import { useState } from "react";
import { useGetSchoolGallery, useAddGalleryImage, useDeleteGalleryImage } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2 } from "lucide-react";

export default function GalleryTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const { data: images = [], refetch } = useGetSchoolGallery({ request: { headers: authHeaders } });
  const { mutate: addImage, isPending } = useAddGalleryImage({ request: { headers: authHeaders } });
  const { mutate: deleteImage } = useDeleteGalleryImage({ request: { headers: authHeaders } });

  const handleAdd = () => {
    if(!url) return;
    addImage({ data: { url, caption } }, {
      onSuccess: () => {
        toast({ title: "Image added to gallery" });
        setUrl(""); setCaption("");
        refetch();
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-sm font-medium">Image URL</label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://images.unsplash.com/..." />
        </div>
        <div className="flex-1 space-y-1 w-full">
          <label className="text-sm font-medium">Caption (Optional)</label>
          <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Annual Sports Day" />
        </div>
        <Button onClick={handleAdd} disabled={isPending || !url} className="w-full sm:w-auto">
          <ImagePlus className="w-4 h-4 mr-2" /> Add Image
        </Button>
      </div>

      <div>
        <h3 className="font-bold text-xl font-display mb-6">Gallery Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(img => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-square bg-gray-100">
              <img src={img.url} alt={img.caption || "Gallery image"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-sm font-medium truncate">{img.caption}</p>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="absolute top-2 right-2 w-8 h-8 p-0"
                  onClick={() => deleteImage({ imageId: img.id }, { onSuccess: () => refetch() })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              No images in gallery yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
