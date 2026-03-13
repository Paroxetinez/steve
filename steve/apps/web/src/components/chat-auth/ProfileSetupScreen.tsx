"use client";

import AppShell from "@/components/app-shell/AppShell";
import { buildInstallAppPath } from "@/lib/authRedirects";
import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import {
  requestAvatarUploadTarget,
  uploadFileToSignedUrl,
} from "@/lib/media/uploadTargets";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, Plus, Camera } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ProfileSetupScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { sessionToken, sessionReady } = useSessionToken();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nickname: "",
    gender: "",
    year: "",
    month: "",
    day: "",
    city: "",
    avatarUrl: "",
    avatarObjectKey: null as string | null,
  });
  const [uploading, setUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      router.replace("/login");
    }
  }, [router, sessionReady, sessionToken]);

  const profile = useQuery(
    api.chatProfiles.getMyProfile,
    sessionToken ? { sessionToken } : "skip",
  );
  const upsertMyProfile = useMutation(api.chatProfiles.upsertMyProfile);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function replacePreviewUrl(nextUrl: string | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (nextUrl?.startsWith("blob:")) {
      previewUrlRef.current = nextUrl;
    }
  }

  useEffect(() => {
    if (!profile) return;
    replacePreviewUrl(null);

    const [year, month, day] = (profile.birthday ?? "").split("-");
    setFormData((prev) => ({
      ...prev,
      nickname: profile.nickname ?? prev.nickname,
      gender: profile.gender ?? prev.gender,
      city: profile.city ?? prev.city,
      year: year ?? prev.year,
      month: month ?? prev.month,
      day: day ?? prev.day,
      avatarUrl: profile.avatarUrl ?? prev.avatarUrl,
      avatarObjectKey: profile.avatarObjectKey ?? prev.avatarObjectKey,
    }));
  }, [profile]);

  const isFormComplete = useMemo(
    () =>
      !!(
        formData.nickname &&
        formData.gender &&
        formData.year &&
        formData.month &&
        formData.day &&
        formData.city
      ),
    [formData],
  );

  async function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file || !sessionToken) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      alert(t.profileSetup.invalidImageType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t.profileSetup.imageTooLarge);
      return;
    }

    setUploading(true);
    const previousAvatarUrl = formData.avatarUrl;
    const previousAvatarObjectKey = formData.avatarObjectKey;
    const previewUrl = URL.createObjectURL(file);
    replacePreviewUrl(previewUrl);
    setFormData((prev) => ({
      ...prev,
      avatarUrl: previewUrl,
      avatarObjectKey: null,
    }));

    try {
      const target = await requestAvatarUploadTarget({
        sessionToken,
        contentType: file.type,
      });
      await uploadFileToSignedUrl({
        uploadUrl: target.uploadUrl,
        file,
      });

      setFormData((prev) => ({
        ...prev,
        avatarUrl: target.publicUrl,
        avatarObjectKey: target.objectKey,
      }));
    } catch (error) {
      console.error("Avatar upload failed:", error);
      replacePreviewUrl(previousAvatarUrl.startsWith("blob:") ? previousAvatarUrl : null);
      setFormData((prev) => ({
        ...prev,
        avatarUrl: previousAvatarUrl,
        avatarObjectKey: previousAvatarObjectKey,
      }));
      alert(t.profileSetup.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  async function handleNext() {
    if (!sessionToken || !isFormComplete) return;

    const birthday = `${formData.year}-${formData.month}-${formData.day}`;
    await upsertMyProfile({
      sessionToken,
      nickname: formData.nickname,
      gender: formData.gender,
      birthday,
      city: formData.city,
      avatarObjectKey: formData.avatarObjectKey || undefined,
    });

    router.push(buildInstallAppPath());
  }

  return (
    <AppShell withBottomNav={false}>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <Link href="/login">
            <ChevronLeft className="size-6 mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-black mb-2">{t.profileSetup.title}</h1>
          <p className="text-sm text-gray-500">{t.profileSetup.subtitle}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
          {/* Avatar Upload */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploading}
              className="relative size-24 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white overflow-hidden hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Plus className="size-8 text-gray-400" strokeWidth={2} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="size-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">{t.profileSetup.nicknameLabel}</label>
              <input
                type="text"
                placeholder={t.profileSetup.nicknamePlaceholder}
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">{t.profileSetup.genderLabel}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-black outline-none focus:border-black transition-colors appearance-none"
              >
                <option value="">{t.profileSetup.genderPlaceholder}</option>
                <option value="male">{t.profileSetup.male}</option>
                <option value="female">{t.profileSetup.female}</option>
                <option value="other">{t.profileSetup.other}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">{t.profileSetup.birthdayLabel}</label>
              <div className="flex gap-3">
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-black outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value="">{t.profileSetup.yearPlaceholder}</option>
                  {Array.from({ length: 50 }, (_, i) => 2007 - i).map((year) => (
                    <option key={year} value={`${year}`}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-black outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value="">{t.profileSetup.monthPlaceholder}</option>
                  {Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, "0")).map(
                    (month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ),
                  )}
                </select>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-black outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value="">{t.profileSetup.dayPlaceholder}</option>
                  {Array.from({ length: 31 }, (_, i) => `${i + 1}`.padStart(2, "0")).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">{t.profileSetup.cityLabel}</label>
              <input
                type="text"
                placeholder={t.profileSetup.cityPlaceholder}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            disabled={!isFormComplete || uploading}
            onClick={handleNext}
            className={`w-full py-4 rounded-xl font-medium transition-colors ${
              isFormComplete && !uploading
                ? "bg-black text-white cursor-pointer"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {uploading ? t.common.loading : t.profileSetup.continueButton}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
