"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { PreviewImage } from "@/components/ui/preview-image";
import { ActorTrialReferralModal } from "@/components/auth/actor-trial-referral-modal";
import { markActorOnboardingComplete } from "@/lib/actor-onboarding-storage";
import { syncActorTrialFromServer } from "@/lib/actor-trial-storage";
import {
  ACTOR_BASE_LOCATION_OPTIONS,
  ACTOR_LANGUAGE_OPTIONS,
  ACTOR_SKILL_OPTIONS,
} from "@/lib/actor-options";
import { writeStoredDisplayName, writeStoredProfilePhoto } from "@/lib/actor-profile-storage";
import {
  profilePhotoFromFile,
  writeStoredActorSettings,
  type StoredActorHeadshot,
  type StoredActorMedia,
} from "@/lib/actor-settings-storage";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import { getInitials } from "@/lib/user";
import { ImagePlus, Trash2, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-sm font-medium text-text-primary mb-1.5 block";

const sectionClass = "space-y-4 rounded-xl border border-border/60 bg-bg-sidebar/30 p-4";

interface ActorOnboardingFormProps {
  userId: string;
  displayName: string;
  userEmail: string;
}

function defaultLabelFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "Untitled";
}

export function ActorOnboardingForm({
  userId,
  displayName,
  userEmail,
}: ActorOnboardingFormProps) {
  const initials = getInitials(displayName);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [headshots, setHeadshots] = useState<StoredActorHeadshot[]>([]);
  const [videos, setVideos] = useState<StoredActorMedia[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [playingAgeMin, setPlayingAgeMin] = useState("");
  const [playingAgeMax, setPlayingAgeMax] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [height, setHeight] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialError, setTrialError] = useState("");

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    const { dataUrl, fileName } = await profilePhotoFromFile(file);
    setPhotoUrl(dataUrl);
    setPhotoFileName(fileName);
  };

  const handleHeadshotAdd = async (file: File | undefined) => {
    if (!file || headshots.length >= 2) return;
    const { dataUrl, fileName } = await profilePhotoFromFile(file);
    setHeadshots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: defaultLabelFromFile(file),
        previewUrl: dataUrl,
        fileName,
        featured: prev.length === 0,
      },
    ]);
  };

  const handleVideoAdd = async (file: File | undefined) => {
    if (!file || videos.length >= 2) return;
    const { dataUrl } = await profilePhotoFromFile(file);
    setVideos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: defaultLabelFromFile(file),
        type: "video",
        previewUrl: dataUrl,
        fileName: file.name,
        category: "video",
      },
    ]);
  };

  const completeOnboarding = async (referralName: string, referralEmail: string) => {
    setLoading(true);
    setTrialError("");

    try {
      const referralRes = await fetch("/api/auth/actor-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referredName: referralName,
          referredEmail: referralEmail,
        }),
      });

      const referralData = await referralRes.json();

      if (!referralRes.ok) {
        setTrialError(referralData.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      syncActorTrialFromServer({
        referredName: referralData.referredName ?? referralName,
        referredEmail: referralData.referredEmail ?? referralEmail,
        trialStartedAt: referralData.trialStartedAt,
        trialEndsAt: referralData.trialEndsAt,
        membership: "PREMIUM",
      });

      const profileRes = await fetch("/api/auth/onboarding/actor-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim(),
          locations,
          playingAgeMin: playingAgeMin.trim(),
          playingAgeMax: playingAgeMax.trim(),
          height: height.trim(),
          skills,
          languages,
          profilePhotoUrl: photoUrl,
          headshots: headshots.map((h) => ({
            label: h.label,
            url: h.previewUrl,
            fileName: h.fileName,
            featured: h.featured,
          })),
          videos: videos.map((v) => ({
            label: v.label,
            url: v.previewUrl,
            fileName: v.fileName,
          })),
        }),
      });

      if (!profileRes.ok) {
        const profileData = await profileRes.json();
        setTrialError(profileData.error ?? "Failed to save profile. Please try again.");
        setLoading(false);
        return;
      }

      await markActorOnboardingComplete(userId);

      try {
        writeStoredActorSettings({
          bio: bio.trim(),
          locations,
          playingAgeMin: playingAgeMin.trim(),
          playingAgeMax: playingAgeMax.trim(),
          height: height.trim(),
          gender: "",
          unionStatus: "",
          skills,
          languages,
          profilePhotoUrl: photoUrl,
          profilePhotoFileName: photoFileName,
          headshots,
          materials: [],
          videos,
        });
        writeStoredDisplayName(displayName);
        if (photoUrl && photoFileName) {
          writeStoredProfilePhoto(photoUrl, photoFileName);
        }
        emitClientStoreChange();
      } catch (error) {
        console.error("Failed to save actor onboarding settings:", error);
      }

      window.location.assign("/actor");
    } catch (error) {
      console.error("Failed to complete actor onboarding:", error);
      setTrialError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleProfileContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setShowTrialModal(true);
  };

  const handleTrialConfirm = (referralName: string, referralEmail: string) => {
    completeOnboarding(referralName, referralEmail);
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Build your actor profile
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Add your details and videos so casting directors can discover you.
          Everything here is optional — you can update your profile anytime.
        </p>
      </div>

      <form onSubmit={handleProfileContinue} className="space-y-5">
        <div className={sectionClass}>
          <p className="text-sm font-semibold text-text-primary">Profile photo</p>
          <p className="text-xs text-text-secondary mb-3">Optional — shown on your profile and messages.</p>
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-accent/30 shrink-0">
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

        <div className={sectionClass}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">Headshots</p>
            <span className="text-xs text-text-secondary">{headshots.length}/2 max</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">Optional — up to 2 professional headshots.</p>
          <div className="flex flex-wrap gap-3">
            {headshots.map((headshot) => (
              <div key={headshot.id} className="relative group">
                <div className="h-20 w-20 rounded-xl overflow-hidden border border-border/60 bg-bg-primary">
                  <PreviewImage
                    src={headshot.previewUrl}
                    alt={headshot.label}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    setHeadshots((prev) => prev.filter((h) => h.id !== headshot.id))
                  }
                  aria-label="Remove headshot"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {headshots.length < 2 && (
              <button
                type="button"
                onClick={() => headshotInputRef.current?.click()}
                className="h-20 w-20 rounded-xl border border-dashed border-border/80 bg-bg-primary/50 flex flex-col items-center justify-center gap-1 text-text-secondary hover:border-accent/50 hover:text-accent transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">Add</span>
              </button>
            )}
          </div>
          <input
            ref={headshotInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleHeadshotAdd(e.target.files?.[0]);
              if (headshotInputRef.current) headshotInputRef.current.value = "";
            }}
          />
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">Videos</p>
            <span className="text-xs text-text-secondary">{videos.length}/2 max</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Optional — up to 2 additional performance videos.
          </p>
          {videos.length > 0 && (
            <ul className="space-y-2 mb-3">
              {videos.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Video className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <button
                    type="button"
                    className="text-text-secondary hover:text-danger shrink-0"
                    onClick={() =>
                      setVideos((prev) => prev.filter((v) => v.id !== item.id))
                    }
                    aria-label="Remove video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {videos.length < 2 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="h-3.5 w-3.5" />
              Upload video
            </Button>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              handleVideoAdd(e.target.files?.[0]);
              if (videoInputRef.current) videoInputRef.current.value = "";
            }}
          />
        </div>

        <div className={sectionClass}>
          <p className="text-sm font-semibold text-text-primary mb-3">Skills & details</p>

          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="onboarding-skills">Skills</label>
              <MultiSelect
                id="onboarding-skills"
                options={ACTOR_SKILL_OPTIONS}
                value={skills}
                onChange={setSkills}
                placeholder="Select your skills"
                allowOther
                otherPrompt="Enter your skill"
                otherPlaceholder="e.g. Puppetry"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="onboarding-age-min">
                  Playing age (min)
                </label>
                <input
                  id="onboarding-age-min"
                  type="number"
                  min={1}
                  max={99}
                  value={playingAgeMin}
                  onChange={(e) => setPlayingAgeMin(e.target.value)}
                  placeholder="25"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="onboarding-age-max">
                  Playing age (max)
                </label>
                <input
                  id="onboarding-age-max"
                  type="number"
                  min={1}
                  max={99}
                  value={playingAgeMax}
                  onChange={(e) => setPlayingAgeMax(e.target.value)}
                  placeholder="35"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="onboarding-locations">
                Base locations
              </label>
              <MultiSelect
                id="onboarding-locations"
                options={ACTOR_BASE_LOCATION_OPTIONS}
                value={locations}
                onChange={setLocations}
                placeholder="Where you can work from"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="onboarding-height">Height</label>
              <input
                id="onboarding-height"
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="5'10&quot; or 178 cm"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="onboarding-languages">Languages</label>
              <MultiSelect
                id="onboarding-languages"
                options={ACTOR_LANGUAGE_OPTIONS}
                value={languages}
                onChange={setLanguages}
                placeholder="Languages you speak"
                allowOther
                otherPrompt="Enter your language"
                otherPlaceholder="e.g. Swahili"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="onboarding-bio">Bio</label>
              <textarea
                id="onboarding-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell casting directors about your training, experience, and what roles you're seeking..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? "Continuing..." : "Continue"}
        </Button>
      </form>

      {showTrialModal && (
        <ActorTrialReferralModal
          userEmail={userEmail}
          loading={loading}
          error={trialError}
          onConfirm={handleTrialConfirm}
        />
      )}
    </div>
  );
}
