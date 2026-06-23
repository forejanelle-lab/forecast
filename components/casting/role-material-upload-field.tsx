"use client";

import { Plus, X } from "lucide-react";

export interface MaterialFile {
  id: string;
  file: File;
  previewUrl?: string;
}

export function createMaterialFileId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function MaterialUploadField({
  id,
  label,
  description,
  accept,
  icon,
  files,
  onAdd,
  onRemove,
  showImagePreview = false,
}: {
  id: string;
  label: string;
  description: string;
  accept: string;
  icon: React.ReactNode;
  files: MaterialFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  showImagePreview?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    onAdd(Array.from(selected));
    e.target.value = "";
  };

  return (
    <div className="rounded-lg border border-border/60 bg-bg-sidebar/30 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-text-secondary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{label}</p>
            {files.length > 0 && (
              <span className="text-[10px] font-medium text-accent">
                {files.length} uploaded
              </span>
            )}
          </div>
          {description && <p className="text-xs text-text-secondary">{description}</p>}
        </div>
      </div>

      <input
        id={id}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />

      <label
        htmlFor={id}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-text-secondary hover:border-accent/50 hover:bg-bg-primary hover:text-text-primary transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Upload {label.toLowerCase()}
      </label>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-bg-primary px-3 py-2"
            >
              {showImagePreview && item.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-10 w-10 rounded-md object-cover shrink-0 border border-border/60"
                />
              )}
              <span className="text-xs text-text-primary truncate flex-1 min-w-0">
                {item.file.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-text-secondary hover:text-text-primary shrink-0"
                aria-label={`Remove ${item.file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
