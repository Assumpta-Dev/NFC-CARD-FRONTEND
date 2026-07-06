import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, getErrorMessage } from "../../services/api";
import { Profile, Link as CardLink } from "../../types";
import { Button, DarkInput, DarkAlert, Select, Textarea, PanelCard } from "../../components/ui";
import { IconEdit, IconPlus, IconTrash } from "../../components/icons/DashboardIcons";

const LINK_TYPES = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "github", label: "GitHub" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "custom", label: "Custom Link" },
];

type FormData = Omit<Profile, "id" | "userId">;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PanelCard padding className="space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h2>
      {children}
    </PanelCard>
  );
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    jobTitle: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    bio: "",
    imageUrl: "",
    coverImageUrl: "",
    whatsapp: "",
    links: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be smaller than 5 MB"); return; }
    try {
      setIsSaving(true);
      setError("");
      const { imageUrl } = await profileApi.uploadPhoto(file);
      updateField("imageUrl", imageUrl);
      setSuccess("Photo uploaded! Click Save Profile to apply.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Cover image must be smaller than 5 MB"); return; }
    try {
      setIsSaving(true);
      setError("");
      const { coverImageUrl } = await profileApi.uploadCoverPhoto(file);
      updateField("coverImageUrl", coverImageUrl);
      setSuccess("Cover photo uploaded! Click Save Profile to apply.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    profileApi
      .getProfile()
      .then((profile) => {
        setFormData({
          fullName: profile.fullName || "",
          jobTitle: profile.jobTitle || "",
          company: profile.company || "",
          phone: profile.phone || "",
          email: profile.email || "",
          website: profile.website || "",
          bio: profile.bio || "",
          imageUrl: profile.imageUrl || "",
          coverImageUrl: profile.coverImageUrl || "",
          whatsapp: profile.whatsapp || "",
          links: profile.links || [],
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const addLink = () =>
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { type: "custom", label: "", url: "", order: prev.links.length }],
    }));

  const updateLink = (index: number, field: keyof CardLink, value: string) => {
    setFormData((prev) => {
      const newLinks = [...prev.links];
      newLinks[index] = { ...newLinks[index], [field]: value };
      if (field === "type") {
        const found = LINK_TYPES.find((t) => t.value === value);
        if (found && !newLinks[index].label) newLinks[index].label = found.label;
      }
      return { ...prev, links: newLinks };
    });
  };

  const removeLink = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i })),
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const validLinks = formData.links
        .filter((l) => l.url.trim() && l.label.trim())
        .map((l, i) => ({ ...l, order: i }));

      const toNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

      const updatedProfile = await profileApi.updateProfile({
        fullName: formData.fullName.trim() || undefined,
        jobTitle: toNull(formData.jobTitle),
        company: toNull(formData.company),
        phone: toNull(formData.phone),
        email: toNull(formData.email),
        website: toNull(formData.website),
        bio: toNull(formData.bio),
        imageUrl: formData.imageUrl && formData.imageUrl.trim() ? formData.imageUrl.trim() : null,
        whatsapp: toNull(formData.whatsapp),
        links: validLinks,
      });

      setFormData({
        fullName: updatedProfile.fullName || "",
        jobTitle: updatedProfile.jobTitle || "",
        company: updatedProfile.company || "",
        phone: updatedProfile.phone || "",
        email: updatedProfile.email || "",
        website: updatedProfile.website || "",
        bio: updatedProfile.bio || "",
        imageUrl: updatedProfile.imageUrl || "",
        coverImageUrl: updatedProfile.coverImageUrl || "",
        whatsapp: updatedProfile.whatsapp || "",
        links: updatedProfile.links || [],
      });

      setSuccess("✓ Profile saved successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(getErrorMessage(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-surface-600 border-t-brand-500" />
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-4 pb-16">
        {error && <DarkAlert message={error} type="error" />}
        {success && <DarkAlert message={success} type="success" />}

        {/* ── Identity ──────────────────────────────────── */}
        <Section title="Identity">
          {/* Profile photo */}
          <div className="flex items-center gap-5">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full flex-shrink-0 overflow-hidden bg-white dark:bg-gray-900 shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center justify-center transition-all group"
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-brand-400">
                  {formData.fullName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <IconEdit size={20} className="text-white" />
              </div>
            </button>
            <div className="space-y-2">
              <Button type="button" variant="dark" className="text-sm py-2 px-4" onClick={() => fileInputRef.current?.click()}>
                Upload Photo
              </Button>
              {formData.imageUrl && (
                <button type="button" onClick={() => updateField("imageUrl", "")} className="block text-xs text-red-400 hover:text-red-300 transition-colors">
                  Remove photo
                </button>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF · max 5 MB</p>
            </div>
          </div>

          {/* Cover photo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Cover Photo</label>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative w-full h-28 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-500 transition-colors flex items-center justify-center bg-gray-50 dark:bg-gray-950"
            >
              {formData.coverImageUrl ? (
                <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <p className="text-xs text-gray-400">Click to upload cover photo</p>
              )}
            </div>
            {formData.coverImageUrl && (
              <button type="button" onClick={() => updateField("coverImageUrl", "")} className="text-xs text-red-400 hover:text-red-300">
                Remove cover
              </button>
            )}
          </div>

          <DarkInput label="Full Name" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Jane Smith" />
          <DarkInput label="Job Title" value={formData.jobTitle || ""} onChange={(e) => updateField("jobTitle", e.target.value)} placeholder="Software Engineer" />
          <DarkInput label="Company" value={formData.company || ""} onChange={(e) => updateField("company", e.target.value)} placeholder="Acme Corp" />
          <Textarea compactLabel label="Bio" value={formData.bio || ""} onChange={(e) => updateField("bio", e.target.value)} placeholder="A short description about yourself…" rows={3} maxLength={500} />
        </Section>

        {/* ── Contact Details ──────────────────────────── */}
        <Section title="Contact Details">
          <DarkInput label="Phone" value={formData.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="+250 788 000 000" type="tel" />
          <DarkInput label="Email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" />
          <DarkInput label="Website" value={formData.website || ""} onChange={(e) => updateField("website", e.target.value)} placeholder="https://yourwebsite.com" />
          <DarkInput label="WhatsApp Number" value={formData.whatsapp || ""} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="250788000000" />
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 px-1">Digits only, with country code. No + sign.</p>
        </Section>

        {/* ── Social Links ─────────────────────────────── */}
        <PanelCard padding className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Links</h2>
            <Button type="button" variant="secondary" onClick={addLink} className="gap-1.5 py-1.5 text-sm">
              <IconPlus size={16} /> Add Link
            </Button>
          </div>

          {formData.links.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              No links yet. Add your social profiles or website links.
            </p>
          )}

          {formData.links.map((link, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3 dark:border-gray-800 dark:bg-gray-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Link {index + 1}</span>
                <button type="button" onClick={() => removeLink(index)} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors">
                  <IconTrash size={14} /> Remove
                </button>
              </div>
              <Select compactLabel label="Platform" value={link.type} onChange={(e) => updateLink(index, "type", e.target.value)} options={LINK_TYPES} />
              <DarkInput label="Display Label" value={link.label} onChange={(e) => updateLink(index, "label", e.target.value)} placeholder="My LinkedIn" />
              <DarkInput label="URL" value={link.url} onChange={(e) => updateLink(index, "url", e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
            </div>
          ))}
        </PanelCard>

        {/* ── Save / Cancel ─────────────────────────────── */}
        <div className="flex gap-3 pb-4">
          <Button type="submit" isLoading={isSaving} fullWidth className="py-3">Save Profile</Button>
          <Button type="button" variant="dark" onClick={() => navigate("/dashboard")} className="py-3 px-5">Cancel</Button>
        </div>
      </form>
    </div>
  );
}
