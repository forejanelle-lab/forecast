"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchAuditionMaterialBlob,
} from "@/lib/role-audition-material-client";
import { downloadBlob } from "@/lib/audition-submission-files-storage";
import { getMediaFileKind } from "@/lib/media-file-kind";
import { cn } from "@/lib/utils";
import type { RoleAuditionFile } from "@/types";
import {
  Download,
  Eye,
  FileAudio,
  FileText,
  FileVideo,
  ImageIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { RoleAuditionMaterialViewer } from "@/components/actor/role-audition-material-viewer";

function materialIcon(type: RoleAuditionFile["type"]) {
  if (type === "video") return <FileVideo className="h-3.5 w-3.5" />;
  if (type === "audio") return <FileAudio className="h-3.5 w-3.5" />;
  if (type === "image") return <ImageIcon className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function isDirectMediaUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  );
}

interface RoleAuditionMaterialsSectionProps {
  auditionId: string;
  materials: RoleAuditionFile[];
}

export function RoleAuditionMaterialsSection({
  auditionId,
  materials,
}: RoleAuditionMaterialsSectionProps) {
  const [preview, setPreview] = useState<RoleAuditionFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingFileName, setLoadingFileName] = useState<string | null>(null);
  const [errorFileName, setErrorFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resolvePreviewUrl = async (material: RoleAuditionFile): Promise<string | null> => {
    if (material.fileUrl && isDirectMediaUrl(material.fileUrl)) {
      return material.fileUrl;
    }

    const blob = await fetchAuditionMaterialBlob(auditionId, material.fileName);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  };

  const handleView = async (material: RoleAuditionFile) => {
    setLoadingFileName(material.fileName);
    setErrorFileName(null);
    try {
      const url = await resolvePreviewUrl(material);
      if (!url) {
        setErrorFileName(material.fileName);
        return;
      }
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(url);
      setPreview(material);
    } finally {
      setLoadingFileName(null);
    }
  };

  const handleDownload = async (material: RoleAuditionFile) => {
    setLoadingFileName(material.fileName);
    setErrorFileName(null);
    try {
      if (material.fileUrl && isDirectMediaUrl(material.fileUrl)) {
        const anchor = document.createElement("a");
        anchor.href = material.fileUrl;
        anchor.download = material.fileName;
        anchor.click();
        return;
      }

      const blob = await fetchAuditionMaterialBlob(auditionId, material.fileName);
      if (!blob) {
        setErrorFileName(material.fileName);
        return;
      }
      downloadBlob(blob, material.fileName);
    } finally {
      setLoadingFileName(null);
    }
  };

  const closePreview = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreview(null);
  };

  if (materials.length === 0) return null;

  return (
    <Card padding="sm">
      <CardHeader className="mb-2">
        <CardTitle className="text-sm">Audition Materials</CardTitle>
        <FileText className="h-3.5 w-3.5 text-text-secondary" />
      </CardHeader>
      <p className="text-xs text-text-secondary mb-3">
        Scripts, sides, and reference files from casting for this audition.
      </p>
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {materials.map((material) => {
          const isLoading = loadingFileName === material.fileName;
          const hasError = errorFileName === material.fileName;

          return (
            <li
              key={`${material.label}-${material.fileName}`}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-sidebar text-text-secondary",
                )}
              >
                {materialIcon(material.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">{material.label}</p>
                <p className="text-xs text-text-secondary truncate">{material.fileName}</p>
                {hasError && (
                  <p className="text-[10px] text-danger mt-0.5">
                    File not available — ask casting to re-upload materials.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  disabled={isLoading}
                  onClick={() => handleView(material)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  disabled={isLoading}
                  onClick={() => handleDownload(material)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {preview && previewUrl && (
        <div className="mt-3">
          <RoleAuditionMaterialViewer
            label={preview.label}
            fileName={preview.fileName}
            fileUrl={previewUrl}
            onClose={closePreview}
          />
        </div>
      )}
    </Card>
  );
}
