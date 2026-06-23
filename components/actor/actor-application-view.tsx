import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PreviewImage } from "@/components/ui/preview-image";
import { ACTOR_APPLICATION_STATUS_LABELS } from "@/lib/application-status";
import { formatDateTime } from "@/lib/utils";
import type { Application, RoleSubmissionItem } from "@/types";
import { FileText, Film, Image as ImageIcon, Mic } from "lucide-react";

const statusVariant: Record<
  string,
  "success" | "warning" | "info" | "accent" | "default" | "danger"
> = {
  submitted: "default",
  audition_viewed: "info",
  reviewing: "info",
  audition_requested: "accent",
  callback: "accent",
  accepted: "success",
  rejected: "danger",
};

function itemIcon(type: RoleSubmissionItem["type"]) {
  if (type === "video") return <Film className="h-3.5 w-3.5" />;
  if (type === "audio") return <Mic className="h-3.5 w-3.5" />;
  if (type === "image") return <ImageIcon className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

export function ActorSubmissionDetails({ application }: { application: Application }) {
  const items = application.items ?? [];

  return (
    <Card padding="sm" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Your submission</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Submitted {formatDateTime(application.submittedAt)}
          </p>
        </div>
        <Badge
          variant={statusVariant[application.status] ?? "default"}
          className="text-[10px] px-2 py-0.5 shrink-0"
        >
          {ACTOR_APPLICATION_STATUS_LABELS[application.status]}
        </Badge>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-text-primary">Submitted materials</h3>
        {items.length === 0 ? (
          <p className="text-xs text-text-secondary mt-1.5">No materials on file.</p>
        ) : (
          <ul className="mt-1.5 divide-y divide-border/60 rounded-lg border border-border/60">
            {items.map((item) => (
              <li
                key={`${item.label}-${item.fileName}`}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-sidebar text-text-secondary overflow-hidden">
                  {item.type === "image" && item.fileUrl ? (
                    <PreviewImage
                      src={item.fileUrl}
                      alt={item.label}
                      width={36}
                      height={36}
                      className="h-9 w-9 object-cover"
                    />
                  ) : (
                    itemIcon(item.type)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">{item.label}</p>
                  <p className="text-[11px] text-text-secondary truncate">{item.fileName}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {application.note && (
        <div className="border-t border-border/60 pt-3">
          <h3 className="text-xs font-semibold text-text-primary">Note to casting</h3>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed whitespace-pre-wrap">
            {application.note}
          </p>
        </div>
      )}
    </Card>
  );
}
