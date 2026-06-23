"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PreviewImage } from "@/components/ui/preview-image";
import { useCastingProfile } from "@/components/providers/casting-profile-provider";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-[10px] font-medium text-text-secondary mb-1 block";

interface CastingSettingsContentProps {
  email: string;
  displayName: string;
}

export function CastingSettingsContent({
  email,
  displayName,
}: CastingSettingsContentProps) {
  const { initials, settings, updateSettings, setProfilePhotoFromFile } =
    useCastingProfile();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const saveProfile = () => {
    updateSettings({
      castingOfficeName: settings.castingOfficeName.trim(),
      address: settings.address.trim(),
      phoneNumber: settings.phoneNumber.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    await setProfilePhotoFromFile(file);
  };

  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordReset = async () => {
    setPasswordError(null);
    setPasswordMessage(null);

    if (!newPassword.trim()) {
      setPasswordError("Enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error ?? "Something went wrong. Please try again.");
        setPasswordLoading(false);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(data.message ?? "Password updated successfully.");
      setPasswordLoading(false);
    } catch {
      setPasswordError("Something went wrong. Please try again.");
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Manage your casting profile and account security.
        </p>
      </div>

      <Card padding="sm">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Profile photo
        </p>
        <div className="flex items-center gap-4 mb-4">
          {settings.profilePhotoUrl ? (
            <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-border shrink-0">
              <PreviewImage
                src={settings.profilePhotoUrl}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <Avatar initials={initials} size="lg" />
          )}
          <div>
            <p className="text-sm font-medium text-text-primary">{displayName}</p>
            <p className="text-xs text-text-secondary mt-0.5">{email}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-xs gap-1.5 mt-2"
              onClick={() => photoInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload photo
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
            />
          </div>
        </div>

        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-3 pt-3 border-t border-border/60">
          Casting office
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="casting-email">Email</label>
            <input
              id="casting-email"
              type="email"
              value={email}
              readOnly
              className={`${inputClass} bg-bg-sidebar text-text-secondary cursor-not-allowed`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="casting-office-name">
              Casting office name
            </label>
            <input
              id="casting-office-name"
              type="text"
              value={settings.castingOfficeName}
              onChange={(e) =>
                updateSettings({ castingOfficeName: e.target.value })
              }
              className={inputClass}
              placeholder="Morrison Casting"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="casting-address">Address</label>
            <input
              id="casting-address"
              type="text"
              value={settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
              className={inputClass}
              placeholder="Street, city, state, zip"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="casting-phone">Phone number</label>
            <input
              id="casting-phone"
              type="tel"
              value={settings.phoneNumber}
              onChange={(e) => updateSettings({ phoneNumber: e.target.value })}
              className={inputClass}
              placeholder="(323) 555-0142"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button type="button" size="sm" className="h-8 text-xs" onClick={saveProfile}>
            Save changes
          </Button>
          {profileSaved && (
            <span className="text-xs text-success">Profile saved.</span>
          )}
        </div>
      </Card>

      <Card padding="sm">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Password reset
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {passwordError && (
          <p className="text-xs text-danger mt-2">{passwordError}</p>
        )}
        {passwordMessage && (
          <p className="text-xs text-success mt-2">{passwordMessage}</p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 text-xs mt-4"
          onClick={handlePasswordReset}
          disabled={passwordLoading}
        >
          {passwordLoading ? "Updating..." : "Update password"}
        </Button>
      </Card>
    </div>
  );
}
