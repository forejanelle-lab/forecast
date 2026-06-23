"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

interface DeleteConversationModalProps {
  displayName: string;
  projectTitle: string;
  deleting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConversationModal({
  displayName,
  projectTitle,
  deleting = false,
  error = null,
  onConfirm,
  onClose,
}: DeleteConversationModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleting, onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card padding="md" className="w-full max-w-sm animate-fade-in">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Delete conversation?
        </h3>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          Delete your conversation with{" "}
          <strong className="text-text-primary">{displayName}</strong> about{" "}
          <strong className="text-text-primary">{projectTitle}</strong>? This cannot be
          undone.
        </p>
        {error && (
          <p className="text-xs text-danger mb-3 leading-snug">{error}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="danger"
            size="sm"
            className="h-8 text-xs"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete conversation"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
