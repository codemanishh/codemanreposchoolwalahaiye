import { useState, type ReactNode } from "react";
import { useGetSchoolGallery, useAddGalleryImage, useDeleteGalleryImage, useGetSchoolProfile, useUpdateSchoolProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, CheckCircle2, Globe, Home, Info, Layers, Image, ChevronRight, PanelTop, LayoutGrid, BadgeInfo } from "lucide-react";

type SectionOption = {
  key: string;
  label: string;
  description: string;
  icon: ReactNode;
  profileField?: "logoUrl" | "heroImageUrl";
  galleryCategory?: string;
};

type SectionGroup = {
  key: string;
  page: string;
  description: string;
  icon: ReactNode;
  options: SectionOption[];
};

const SECTION_GROUPS: SectionGroup[] = [
  {
    key: "home",
    page: "Home Page",
    description: "Update the homepage banner and the school identity shown in shared areas.",
    icon: <Home className="w-4 h-4" />,
    options: [
      { key: "hero", label: "Hero / Banner Image", description: "Full-width background image on the homepage", icon: <PanelTop className="w-4 h-4" />, profileField: "heroImageUrl" },
      { key: "logo", label: "School Logo", description: "Circular logo shown in header and footer", icon: <Globe className="w-4 h-4" />, profileField: "logoUrl" },
    ],
  },
  {
    key: "about",
    page: "About Us Page",
    description: "Control the images used to introduce the school story and staff.",
    icon: <Info className="w-4 h-4" />,
    options: [
      { key: "about-main", label: "About Section Photo", description: "Photo shown beside the school description", icon: <BadgeInfo className="w-4 h-4" />, galleryCategory: "about-main" },
      { key: "about-team", label: "Team / Staff Photo", description: "Group photo of the school team", icon: <Globe className="w-4 h-4" />, galleryCategory: "about-team" },
    ],
  },
  {
    key: "messages",
    page: "Messages Page",
    description: "Manage profile photos shown with Principal, Founder, and President messages.",
    icon: <BadgeInfo className="w-4 h-4" />,
    options: [
      { key: "msg-principal", label: "Principal Photo", description: "Photo shown inside Principal quote", icon: <Globe className="w-4 h-4" />, galleryCategory: "msg-principal" },
      { key: "msg-founder", label: "Founder Photo", description: "Photo shown inside Founder quote", icon: <Globe className="w-4 h-4" />, galleryCategory: "msg-founder" },
      { key: "msg-president", label: "President Photo", description: "Photo shown inside President quote", icon: <Globe className="w-4 h-4" />, galleryCategory: "msg-president" },
    ],
  },
  {
    key: "facility",
    page: "Facility Page",
    description: "Organize facility-specific visuals for campus infrastructure and activities.",
    icon: <Layers className="w-4 h-4" />,
    options: [
      { key: "facility-digital", label: "Digital Class Room", description: "Image for digital classroom facility", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-digital" },
      { key: "facility-transport", label: "Transportation", description: "Image for transport facility", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-transport" },
      { key: "facility-computer", label: "Computer Lab", description: "Image for computer lab", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-computer" },
      { key: "facility-sports", label: "Sports", description: "Image for sports facility", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-sports" },
      { key: "facility-cocurr", label: "Co-curricular Activities", description: "Image for co-curricular activities", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-cocurr" },
      { key: "facility-library", label: "Library", description: "Image for library", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-library" },
      { key: "facility-water", label: "RO Water", description: "Image for RO water facility", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-water" },
      { key: "facility-lab", label: "Science Lab", description: "Image for science lab", icon: <LayoutGrid className="w-4 h-4" />, galleryCategory: "facility-lab" },
    ],
  },
  {
    key: "gallery",
    page: "Gallery Page",
    description: "Manage the public photo gallery and event images shown to visitors.",
    icon: <Image className="w-4 h-4" />,
    options: [
      { key: "gallery-events", label: "Events Photos", description: "Add photos to the main photo gallery", icon: <Image className="w-4 h-4" />, galleryCategory: "__gallery__" },
    ],
  },
];

const ALL_OPTIONS: SectionOption[] = SECTION_GROUPS.flatMap((group) => group.options);

export default function GalleryTab() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();

  const [selectedPageKey, setSelectedPageKey] = useState<string>(SECTION_GROUPS[0].key);
  const [selectedKey, setSelectedKey] = useState<string>("hero");
  const [newUrl, setNewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, refetch: refetchProfile } = useGetSchoolProfile({ request: { headers: authHeaders } });
  const { mutate: updateProfile } = useUpdateSchoolProfile({ request: { headers: authHeaders } });
  const { data: images = [], refetch: refetchGallery } = useGetSchoolGallery({ request: { headers: authHeaders } });
  const { mutate: addImage } = useAddGalleryImage({ request: { headers: authHeaders } });
  const { mutate: deleteImage } = useDeleteGalleryImage({ request: { headers: authHeaders } });

  const selectedPage = SECTION_GROUPS.find((group) => group.key === selectedPageKey) ?? SECTION_GROUPS[0];
  const selectedOption = ALL_OPTIONS.find((option) => option.key === selectedKey) ?? ALL_OPTIONS[0];
  const selectedGroup = SECTION_GROUPS.find((group) => group.options.some((option) => option.key === selectedKey)) ?? SECTION_GROUPS[0];

  const currentValue = selectedOption.profileField
    ? (profile?.[selectedOption.profileField] ?? "")
    : images
        .filter((img) => img.caption === `__section__:${selectedOption.galleryCategory}` || (selectedOption.galleryCategory === "__gallery__" && !img.caption?.startsWith("__section__:")))
        .map((img) => img.url)[0] ?? "";

  const sectionImages = selectedOption.galleryCategory === "__gallery__"
    ? images.filter((img) => !img.caption?.startsWith("__section__:"))
    : images.filter((img) => img.caption === `__section__:${selectedOption.galleryCategory}`);

  const selectPage = (pageKey: string) => {
    const nextPage = SECTION_GROUPS.find((group) => group.key === pageKey);
    if (!nextPage) return;

    setSelectedPageKey(pageKey);
    setSelectedKey(nextPage.options[0]?.key ?? selectedKey);
    setNewUrl("");
    setCaption("");
  };

  const selectOption = (optionKey: string) => {
    setSelectedKey(optionKey);
    setNewUrl("");
    setCaption("");
  };

  const imageCountByOption = (option: SectionOption) => {
    if (option.profileField) {
      return profile?.[option.profileField] ? 1 : 0;
    }

    if (option.galleryCategory === "__gallery__") {
      return images.filter((img) => !img.caption?.startsWith("__section__:")).length;
    }

    return images.filter((img) => img.caption === `__section__:${option.galleryCategory}`).length;
  };

  const handleSave = () => {
    if (!newUrl) return;
    setIsSaving(true);

    if (selectedOption.profileField) {
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
        },
      });
      return;
    }

    if (selectedOption.galleryCategory) {
      const captionValue = selectedOption.galleryCategory === "__gallery__"
        ? caption
        : `__section__:${selectedOption.galleryCategory}`;

      addImage({ data: { url: newUrl, caption: captionValue } }, {
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
        },
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
          <Globe className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Website Image Manager</h2>
          <span className="ml-1 text-sm text-gray-400">change any image on your school website</span>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Choose Website Screen</Label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {SECTION_GROUPS.map((group) => {
                const isActive = group.key === selectedPage.key;

                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => selectPage(group.key)}
                    className={`rounded-2xl border p-4 text-left transition-all ${isActive ? "border-yellow-400 bg-yellow-50 shadow-sm" : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/60"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-yellow-400 text-gray-900" : "bg-gray-100 text-gray-600"}`}>
                        {group.icon}
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {group.options.length} section{group.options.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="font-semibold text-gray-900">{group.page}</p>
                      <p className="text-sm text-gray-500">{group.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70">
              <div className="border-b border-gray-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="text-yellow-500">{selectedPage.icon}</span>
                  {selectedPage.page}
                </div>
                <p className="mt-1 text-sm text-gray-500">Pick the exact subsection you want to change.</p>
              </div>

              <div className="p-2">
                {selectedPage.options.map((option) => {
                  const isActive = option.key === selectedKey;
                  const count = imageCountByOption(option);

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => selectOption(option.key)}
                      className={`mb-2 flex w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition-colors last:mb-0 ${isActive ? "border-yellow-400 bg-yellow-50" : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-yellow-400 text-gray-900" : "bg-gray-100 text-gray-500"}`}>
                          {option.icon}
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? "text-gray-900" : "text-gray-800"}`}>{option.label}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{option.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-3">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 shadow-sm">
                          {count} item{count !== 1 ? "s" : ""}
                        </span>
                        {isActive ? <CheckCircle2 className="h-4 w-4 text-yellow-500" /> : <ChevronRight className="h-4 w-4 text-gray-300" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span>{selectedGroup.page}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-yellow-600">{selectedOption.label}</span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedOption.label}</h3>
                    <p className="mt-1 text-sm text-gray-500">{selectedOption.description}</p>
                  </div>
                  <div className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                    {selectedOption.profileField ? "Single image" : selectedOption.galleryCategory === "__gallery__" ? "Multi image gallery" : "Section image"}
                  </div>
                </div>
              </div>

              {currentValue && (
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Current Image</Label>
                  <div className="relative h-48 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    <img src={currentValue} alt="Current" className="h-full w-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
                      <p className="truncate text-xs text-white">{currentValue}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col items-end gap-3 sm:flex-row">
                  <div className="w-full flex-1 space-y-1.5">
                    <Label className="text-sm font-semibold">
                      {selectedOption.profileField ? "New Image URL" : "Image URL"}
                    </Label>
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="rounded-xl"
                    />
                  </div>
                  {selectedOption.galleryCategory === "__gallery__" && (
                    <div className="w-full flex-1 space-y-1.5">
                      <Label className="text-sm font-semibold">Caption (Optional)</Label>
                      <Input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="e.g. Annual Sports Day"
                        className="rounded-xl"
                      />
                    </div>
                  )}
                  <Button onClick={handleSave} disabled={isSaving || !newUrl} className="shrink-0 rounded-xl">
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {selectedOption.profileField ? "Update Image" : "Add Image"}
                  </Button>
                </div>

                {newUrl && (
                  <div className="relative mt-4 h-40 overflow-hidden rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50">
                    <img
                      src={newUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <p className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-600">Preview</p>
                    </div>
                  </div>
                )}
              </div>

              {(selectedOption.galleryCategory === "__gallery__" || (selectedOption.galleryCategory && sectionImages.length > 0)) && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedOption.galleryCategory === "__gallery__" ? "Gallery Images" : `${selectedOption.label} — All Uploaded`}
                    </h3>
                    {sectionImages.length > 0 && (
                      <span className="text-sm text-gray-400">{sectionImages.length} image{sectionImages.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                    {sectionImages.map((img) => (
                      <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all hover:shadow-xl">
                        <img src={img.url} alt={img.caption || "Image"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="truncate text-xs font-medium text-white">{img.caption?.startsWith("__section__:") ? "" : img.caption}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => deleteImage({ imageId: img.id }, { onSuccess: () => refetchGallery() })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {sectionImages.length === 0 && (
                      <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-gray-400">
                        No images added yet for this section.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
