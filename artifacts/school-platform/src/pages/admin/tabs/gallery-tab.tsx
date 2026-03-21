import { useState } from "react";
import { useGetSchoolGallery, useAddGalleryImage, useDeleteGalleryImage, useGetSchoolProfile, useUpdateSchoolProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, CheckCircle2, ChevronDown, Globe, Home, Info, Users, Layers, Image } from "lucide-react";

type SectionOption = {
  key: string;
  label: string;
  description: string;
  profileField?: "logoUrl" | "heroImageUrl";
  galleryCategory?: string;
};

type SectionGroup = {
  page: string;
  icon: React.ReactNode;
  options: SectionOption[];
};

const SECTION_GROUPS: SectionGroup[] = [
  {
    page: "Home Page",
    icon: <Home className="w-4 h-4" />,
    options: [
      { key: "hero", label: "Hero / Banner Image", description: "Full-width background image on the homepage", profileField: "heroImageUrl" },
      { key: "logo", label: "School Logo", description: "Circular logo shown in header and footer", profileField: "logoUrl" },
    ],
  },
  {
    page: "About Us Page",
    icon: <Info className="w-4 h-4" />,
    options: [
      { key: "about-main", label: "About Section Photo", description: "Photo shown beside the school description", galleryCategory: "about-main" },
      { key: "about-team", label: "Team / Staff Photo", description: "Group photo of the school team", galleryCategory: "about-team" },
    ],
  },
  {
    page: "Facility Page",
    icon: <Layers className="w-4 h-4" />,
    options: [
      { key: "facility-digital", label: "Digital Class Room", description: "Image for digital classroom facility", galleryCategory: "facility-digital" },
      { key: "facility-transport", label: "Transportation", description: "Image for transport facility", galleryCategory: "facility-transport" },
      { key: "facility-computer", label: "Computer Lab", description: "Image for computer lab", galleryCategory: "facility-computer" },
      { key: "facility-sports", label: "Sports", description: "Image for sports facility", galleryCategory: "facility-sports" },
      { key: "facility-cocurr", label: "Co-curricular Activities", description: "Image for co-curricular activities", galleryCategory: "facility-cocurr" },
      { key: "facility-library", label: "Library", description: "Image for library", galleryCategory: "facility-library" },
      { key: "facility-water", label: "RO Water", description: "Image for RO water facility", galleryCategory: "facility-water" },
      { key: "facility-lab", label: "Science Lab", description: "Image for science lab", galleryCategory: "facility-lab" },
    ],
  },
  {
    page: "Gallery Page",
    icon: <Image className="w-4 h-4" />,
    options: [
      { key: "gallery-events", label: "Events Photos", description: "Add photos to the main photo gallery", galleryCategory: "__gallery__" },
    ],
  },
];

const ALL_OPTIONS: SectionOption[] = SECTION_GROUPS.flatMap(g => g.options);

export default function GalleryTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();

  const [selectedKey, setSelectedKey] = useState<string>("hero");
  const [newUrl, setNewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, refetch: refetchProfile } = useGetSchoolProfile({ request: { headers: authHeaders } });
  const { mutate: updateProfile } = useUpdateSchoolProfile({ request: { headers: authHeaders } });
  const { data: images = [], refetch: refetchGallery } = useGetSchoolGallery({ request: { headers: authHeaders } });
  const { mutate: addImage } = useAddGalleryImage({ request: { headers: authHeaders } });
  const { mutate: deleteImage } = useDeleteGalleryImage({ request: { headers: authHeaders } });

  const selectedOption = ALL_OPTIONS.find(o => o.key === selectedKey)!;
  const selectedGroup = SECTION_GROUPS.find(g => g.options.some(o => o.key === selectedKey))!;

  const currentValue = selectedOption?.profileField
    ? (profile?.[selectedOption.profileField] ?? "")
    : images
        .filter(img => img.caption === `__section__:${selectedOption?.galleryCategory}` || (selectedOption?.galleryCategory === "__gallery__" && !img.caption?.startsWith("__section__:")))
        .map(img => img.url)[0] ?? "";

  const sectionImages = selectedOption?.galleryCategory === "__gallery__"
    ? images.filter(img => !img.caption?.startsWith("__section__:"))
    : images.filter(img => img.caption === `__section__:${selectedOption?.galleryCategory}`);

  const handleSave = () => {
    if (!newUrl) return;
    setIsSaving(true);

    if (selectedOption?.profileField) {
      updateProfile({ data: { [selectedOption.profileField]: newUrl } as any }, {
        onSuccess: () => {
          toast({ title: `${selectedOption.label} updated!` });
          setNewUrl("");
          refetchProfile();
          setIsSaving(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update" });
          setIsSaving(false);
        }
      });
    } else if (selectedOption?.galleryCategory) {
      const captionVal = selectedOption.galleryCategory === "__gallery__"
        ? caption
        : `__section__:${selectedOption.galleryCategory}`;
      addImage({ data: { url: newUrl, caption: captionVal } }, {
        onSuccess: () => {
          toast({ title: `Image added to ${selectedOption.label}!` });
          setNewUrl("");
          setCaption("");
          refetchGallery();
          setIsSaving(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to add image" });
          setIsSaving(false);
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Section selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center gap-3">
          <Globe className="w-5 h-5 text-yellow-400" />
          <h2 className="text-white font-bold text-lg">Website Image Manager</h2>
          <span className="text-gray-400 text-sm ml-1">— change any image on your school website</span>
        </div>

        <div className="p-6 space-y-5">
          {/* Dropdown selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Select Website Section</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-yellow-400 bg-white transition-colors text-left shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-yellow-500">{selectedGroup?.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{selectedOption?.label}</p>
                    <p className="text-xs text-gray-500">{selectedGroup?.page} &rsaquo; {selectedOption?.description}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                  {SECTION_GROUPS.map(group => (
                    <div key={group.page}>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <span className="text-gray-500">{group.icon}</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{group.page}</span>
                      </div>
                      {group.options.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => { setSelectedKey(opt.key); setNewUrl(""); setCaption(""); setDropdownOpen(false); }}
                          className={`w-full px-5 py-3 text-left hover:bg-yellow-50 transition-colors flex items-center justify-between ${selectedKey === opt.key ? "bg-yellow-50 border-l-4 border-yellow-400" : ""}`}
                        >
                          <div>
                            <p className={`text-sm font-medium ${selectedKey === opt.key ? "text-yellow-700" : "text-gray-800"}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400">{opt.description}</p>
                          </div>
                          {selectedKey === opt.key && <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Current image preview */}
          {currentValue && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Current Image</Label>
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 h-40 relative">
                <img src={currentValue} alt="Current" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
                  <p className="text-white text-xs truncate">{currentValue}</p>
                </div>
              </div>
            </div>
          )}

          {/* URL input */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <Label className="text-sm font-semibold">
                {selectedOption?.profileField ? "New Image URL" : "Image URL"}
              </Label>
              <Input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="rounded-xl"
              />
            </div>
            {selectedOption?.galleryCategory === "__gallery__" && (
              <div className="flex-1 space-y-1.5 w-full">
                <Label className="text-sm font-semibold">Caption (Optional)</Label>
                <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Annual Sports Day" className="rounded-xl" />
              </div>
            )}
            <Button onClick={handleSave} disabled={isSaving || !newUrl} className="shrink-0 rounded-xl">
              <ImagePlus className="w-4 h-4 mr-2" />
              {selectedOption?.profileField ? "Update Image" : "Add Image"}
            </Button>
          </div>

          {/* URL preview of what's being set */}
          {newUrl && (
            <div className="rounded-xl overflow-hidden border-2 border-dashed border-yellow-300 bg-yellow-50 h-36 relative">
              <img src={newUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-yellow-600 text-xs font-medium bg-yellow-50 px-2 py-1 rounded-full">Preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section image grid (for gallery or multi-image sections) */}
      {(selectedOption?.galleryCategory === "__gallery__" || (selectedOption?.galleryCategory && selectedOption.galleryCategory !== "__gallery__" && sectionImages.length > 0)) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900">
              {selectedOption?.galleryCategory === "__gallery__" ? "Gallery Images" : `${selectedOption?.label} — All Uploaded`}
            </h3>
            {sectionImages.length > 0 && (
              <span className="text-sm text-gray-400">{sectionImages.length} image{sectionImages.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sectionImages.map(img => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-square bg-gray-100">
                <img src={img.url} alt={img.caption || "Image"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-medium truncate">{img.caption?.startsWith("__section__:") ? "" : img.caption}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteImage({ imageId: img.id }, { onSuccess: () => refetchGallery() })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {sectionImages.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                No images added yet for this section.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
