"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { PreviewImage } from "@/components/ui/preview-image";
import { markCastingOnboardingComplete } from "@/lib/casting-onboarding-storage";
import {
  profilePhotoFromFile,
  writeStoredCastingSettings,
} from "@/lib/casting-settings-storage";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import {
  formatUsPhoneInput,
  isCompleteUsPhone,
} from "@/lib/phone-mask";
import { getInitials } from "@/lib/user";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-sm font-medium text-text-primary mb-1.5 block";

interface CastingOnboardingFormProps {
  userId: string;
  displayName: string;
}

export function CastingOnboardingForm({
  userId,
  displayName,
}: CastingOnboardingFormProps) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const initials = getInitials(displayName);

  const [officeName, setOfficeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    officeName.trim().length > 0 &&
    isCompleteUsPhone(phoneNumber) &&
    location.trim().length > 0;

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    const { dataUrl, fileName } = await profilePhotoFromFile(file);
    setPhotoUrl(dataUrl);
    setPhotoFileName(fileName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    writeStoredCastingSettings({
      castingOfficeName: officeName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: location.trim(),
      profilePhotoUrl: photoUrl,
      profilePhotoFileName: photoFileName,
    });
    await markCastingOnboardingComplete(userId);
    emitClientStoreChange();
    router.push("/casting");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Set up your casting office
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Complete your casting office details to set up your workspace. We use this
          information to verify your office and help prevent impersonation on Fore
          Cast.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className={labelClass}>Profile photo (optional)</p>
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-border shrink-0">
                <PreviewImage
                  src={photoUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <Avatar initials={initials} size="lg" />
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1.5"
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

        <div>
          <label className={labelClass} htmlFor="onboarding-office-name">
            Casting office name
          </label>
          <input
            id="onboarding-office-name"
            type="text"
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            placeholder="Morrison Casting"
            className={inputClass}
            required
            autoComplete="organization"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-office-phone">
            Casting office number
          </label>
          <input
            id="onboarding-office-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatUsPhoneInput(e.target.value))}
            placeholder="(323) 555-0142"
            className={inputClass}
            required
            autoComplete="tel"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-office-location">
            Casting office location
          </label>
          <LocationAutocomplete
            id="onboarding-office-location"
            value={location}
            onChange={setLocation}
            placeholder="Street, city, state, zip"
            required
          />
        </div>

        <p className="text-xs text-text-secondary rounded-lg border border-border/60 bg-bg-sidebar/40 px-3 py-2.5 leading-relaxed">
          We use this information to verify your casting office and help prevent
          impersonation on our platform.
        </p>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!canSubmit || loading}
        >
          {loading ? "Submitting..." : "Submit and Continue"}
        </Button>
      </form>
    </div>
  );
}
