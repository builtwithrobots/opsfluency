"use client";

import { FileText, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { TagPickerModal } from "@/components/dashboard/TagPickerModal";
import type { Tag } from "@/lib/types/tags";
import type { SopStatus } from "@/lib/types/sop";

import { setSopTags } from "@/app/dashboard/tags/_actions/tags";

const STATUS_LABEL: Record<SopStatus, { label: string; color: Parameters<typeof Badge>[0]["color"] }> = {
  draft:               { label: "Draft",               color: "zinc" },
  pending_terms:       { label: "Pending Terms",        color: "signal-warn" },
  pending_translation: { label: "Pending Translation",  color: "signal-info" },
  pending_approval:    { label: "Pending Approval",     color: "signal-hub" },
  published:           { label: "Published",            color: "signal-ok" },
  archived:            { label: "Archived",             color: "signal-neutral" },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export interface SopRowWithTags {
  id: string;
  title: string;
  status: SopStatus;
  updated_at: string;
  archived_at: string | null;
  departments: { id: string; name: string } | null;
  tags: Tag[];
}

interface Props {
  sops: SopRowWithTags[];
  allTags: Tag[];
  qrByTargetId: Record<string, string>;
}

/**
 * SOP list with tag management. Keeps the SOP page as a Server Component
 * while adding client interactivity for the tag picker modal.
 */
export function SopListClient({ sops, allTags, qrByTargetId }: Props) {
  const [tagsModal, setTagsModal] = useState<SopRowWithTags | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-2">
        {sops.map((sop) => (
          <SopRowItem
            key={sop.id}
            sop={sop}
            qrId={qrByTargetId[sop.id] ?? null}
            onManageTags={() => setTagsModal(sop)}
          />
        ))}
      </ul>

      {tagsModal && (
        <TagPickerModal
          open
          title={`Labels — "${tagsModal.title}"`}
          allTags={allTags}
          currentTagIds={tagsModal.tags.map((t) => t.id)}
          onClose={() => setTagsModal(null)}
          onSave={(tagIds) => setSopTags({ sopId: tagsModal.id, tagIds })}
        />
      )}
    </>
  );
}

function SopRowItem({
  sop,
  qrId,
  onManageTags,
}: {
  sop: SopRowWithTags;
  qrId: string | null;
  onManageTags: () => void;
}) {
  const meta = STATUS_LABEL[sop.status];

  return (
    <li className="group/row rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface transition-colors hover:bg-dc-raised">
      <div className="flex items-center gap-4 px-4 py-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <FileText className="size-5" strokeWidth={1.75} />
        </span>

        <Link
          href={`/dashboard/sops/${sop.id}`}
          className="min-w-0 flex-1"
        >
          <p className="truncate font-medium text-dc-text group-hover/row:text-(--color-brand) transition-colors">
            {sop.title}
          </p>
          <p className="mt-0.5 text-xs text-dc-text-3">
            {sop.departments?.name ?? "No department"}
            <span className="mx-1.5">·</span>
            Updated {new Date(sop.updated_at).toLocaleDateString()}
          </p>
        </Link>

        <Badge color={meta.color} dot>{meta.label}</Badge>

        {/* Tag pills */}
        {sop.tags.length > 0 && (
          <div className="hidden items-center gap-1 sm:flex">
            {[...sop.tags].sort((a, b) => a.name_en.localeCompare(b.name_en)).slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `${tag.color}18`,
                  borderColor: `${tag.color}40`,
                  color: tag.color,
                }}
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden
                />
                <span lang="en">{tag.name_en}</span>
              </span>
            ))}
            {sop.tags.length > 3 && (
              <span className="text-xs text-dc-text-3">+{sop.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Manage tags button — always visible, tooltip on hover */}
        <button
          type="button"
          onClick={onManageTags}
          title="Add a label"
          aria-label={`Add a label to ${sop.title}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-dc-text-3 transition-colors hover:bg-dc-overlay hover:text-dc-text"
        >
          <TagIcon className="size-4" strokeWidth={1.75} aria-hidden />
        </button>

        {qrId ? (
          <span
            aria-label="QR thumbnail"
            className="hidden shrink-0 rounded-md bg-white p-1 sm:block"
          >
            <QRCodeSVG
              value={`${APP_URL}/s/${qrId}`}
              size={48}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
          </span>
        ) : (
          <span aria-hidden className="hidden size-[48px] shrink-0 sm:block" />
        )}
      </div>
    </li>
  );
}
