// ===========================================================
// PROFILE EDIT PAGE — OVOU-inspired dark theme
// ===========================================================
// Lets authenticated users update their digital card content.
// All form logic is unchanged; only the visual theme is updated
// to match the dark OVOU aesthetic across the app.
// ===========================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, getErrorMessage } from "../../services/api";
import { Profile, Link as CardLink } from "../../types";
import { Button, DarkInput, DarkAlert } from "../../components/ui";
import {
  HiOutlineChevronLeft,
  HiOutlineCamera,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCreditCard,
} from "react-icons/hi";

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

// ── Dark section wrapper ─────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-800 border border-surface-600 rounded-3xl p-6 space-y-4">
      <h2 className="font-semibold text-white text-base">{title}</h2>
      {children}
    </section>
  );
}

// ── Dark textarea wrapper ────────────────────────────────────
const DARK_INPUT_CLS =
  "w-full px-4 py-3 rounded-xl border border-surface-600 bg-surface-800 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-all duration-200";

function DarkTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`${DARK_INPUT_CLS} resize-none`}
      />
      {maxLength && (
        <p className="text-xs text-gray-600 text-right">
          {value.length}/{maxLength}
        </p>
      )}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

// ── Dark select wrapper ──────────────────────────────────────
function DarkSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <select value={value} onChange={onChange} className={DARK_INPUT_CLS}>
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            className="bg-surface-800 text-white"
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    jobTitle: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    bio: "",
    imageUrl: "",
    whatsapp: "",
    links: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2 MB");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const { imageUrl } = await profileApi.uploadPhoto(file);
      updateField("imageUrl", imageUrl);
      setSuccess("Profile photo updated successfully!");
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
          whatsapp: profile.whatsapp || "",
          links: profile.links || [],
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const updateField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const addLink = () =>
    setFormData((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        { type: "custom", label: "", url: "", order: prev.links.length },
      ],
    }));

  const updateLink = (index: number, field: keyof CardLink, value: string) => {
    setFormData((prev) => {
      const newLinks = [...prev.links];
      newLinks[index] = { ...newLinks[index], [field]: value };
      if (field === "type") {
        const found = LINK_TYPES.find((t) => t.value === value);
        if (found && !newLinks[index].label)
          newLinks[index].label = found.label;
      }
      return { ...prev, links: newLinks };
    });
  };

  const removeLink = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      links: prev.links
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, order: i })),
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      // Step 1: Validate and extract valid links (must have both label and URL)
      const validLinks = formData.links.filter((l) => l.url && l.label);

      // Step 2: Send update to backend
      const updatedProfile = await profileApi.updateProfile({
        ...formData,
        links: validLinks,
      });

      // Step 3: Update local state with the returned profile data
      // This ensures the form reflects exactly what the backend saved
      setFormData({
        fullName: updatedProfile.fullName || "",
        jobTitle: updatedProfile.jobTitle || "",
        company: updatedProfile.company || "",
        phone: updatedProfile.phone || "",
        email: updatedProfile.email || "",
        website: updatedProfile.website || "",
        bio: updatedProfile.bio || "",
        imageUrl: updatedProfile.imageUrl || "",
        whatsapp: updatedProfile.whatsapp || "",
        links: updatedProfile.links || [],
      });

      // Step 4: Show success message with details
      // useEffect will auto-dismiss after 5 seconds
      setSuccess(
        `✓ Profile saved successfully! Updated ${validLinks.length} link${validLinks.length !== 1 ? "s" : ""}.`,
      );

      // Auto-scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Show error message to user
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);

      // Keep error visible until user manually closes it
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-surface-600 border-t-brand-500" />
          <p className="mt-3 text-sm text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Sticky Header ────────────────────────────────── */}
      <nav className="bg-surface-800 border-b border-surface-600 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-xl bg-surface-700 border border-surface-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-surface-500 transition-all"
            aria-label="Back to dashboard"
          >
            <HiOutlineChevronLeft className="text-lg" />
          </button>
          <div className="flex items-center gap-2">
            <HiOutlineCreditCard className="text-brand-400 text-lg" />
            <h1 className="font-bold text-white">Edit Profile</h1>
          </div>
        </div>
      </nav>

      <form
        onSubmit={handleSave}
        className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-16"
      >
        {error && <DarkAlert message={error} type="error" />}
        {success && <DarkAlert message={success} type="success" />}

        {/* ── Identity ──────────────────────────────────── */}
        <Section title="Identity">
          {/* Avatar upload */}
          <div className="flex items-center gap-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full flex-shrink-0 overflow-hidden
                bg-surface-700 border-2 border-surface-500 hover:border-brand-500/60
                flex items-center justify-center transition-all group"
            >
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-brand-400">
                  {formData.fullName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <HiOutlineCamera className="text-white text-xl" />
              </div>
            </button>

            <div className="space-y-2">
              <Button
                type="button"
                variant="dark"
                className="text-sm py-2 px-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </Button>
              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => updateField("imageUrl", "")}
                  className="block text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-gray-600">
                JPG, PNG or GIF · max 2 MB
              </p>
            </div>
          </div>

          <DarkInput
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Jane Smith"
            required
          />
          <DarkInput
            label="Job Title"
            value={formData.jobTitle || ""}
            onChange={(e) => updateField("jobTitle", e.target.value)}
            placeholder="Software Engineer"
          />
          <DarkInput
            label="Company"
            value={formData.company || ""}
            onChange={(e) => updateField("company", e.target.value)}
            placeholder="Acme Corp"
          />
          <DarkTextarea
            label="Bio"
            value={formData.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="A short description about yourself…"
            rows={3}
            maxLength={500}
          />
        </Section>

        {/* ── Contact Details ──────────────────────────── */}
        <Section title="Contact Details">
          <DarkInput
            label="Phone"
            value={formData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+250 788 000 000"
            type="tel"
          />
          <DarkInput
            label="Email"
            value={formData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="you@example.com"
            type="email"
          />
          <DarkInput
            label="Website"
            value={formData.website || ""}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="https://yourwebsite.com"
            type="url"
          />
          <DarkInput
            label="WhatsApp Number"
            value={formData.whatsapp || ""}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            placeholder="250788000000"
          />
          <p className="text-xs text-gray-600 -mt-2 px-1">
            Digits only, with country code. No + sign.
          </p>
        </Section>

        {/* ── Social Links ─────────────────────────────── */}
        <section className="bg-surface-800 border border-surface-600 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-base">Links</h2>
            <button
              type="button"
              onClick={addLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-700 border border-surface-600
                text-gray-300 hover:text-white hover:border-surface-500 text-sm font-medium transition-all"
            >
              <HiOutlinePlus className="text-base" /> Add Link
            </button>
          </div>

          {formData.links.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-4 border border-dashed border-surface-600 rounded-2xl">
              No links yet. Add your social profiles or website links.
            </p>
          )}

          {formData.links.map((link, index) => (
            <div
              key={index}
              className="p-4 bg-surface-700 border border-surface-600 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Link {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                >
                  <HiOutlineTrash className="text-sm" /> Remove
                </button>
              </div>
              <DarkSelect
                label="Platform"
                value={link.type}
                onChange={(e) => updateLink(index, "type", e.target.value)}
                options={LINK_TYPES}
              />
              <DarkInput
                label="Display Label"
                value={link.label}
                onChange={(e) => updateLink(index, "label", e.target.value)}
                placeholder="My LinkedIn"
              />
              <DarkInput
                label="URL"
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                type="url"
              />
            </div>
          ))}
        </section>

        {/* ── Save / Cancel ─────────────────────────────── */}
        <div className="flex gap-3 pb-4">
          <Button type="submit" isLoading={isSaving} fullWidth className="py-3">
            Save Profile
          </Button>
          <Button
            type="button"
            variant="dark"
            onClick={() => navigate("/dashboard")}
            className="py-3 px-5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
