"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from "@/components/ui/dialog";
import {
  bulkCreateTeamInvites,
  type BulkTeamInviteResult,
} from "../_actions/team-invite";

type Stage = "idle" | "preview" | "done";

interface ParsedRow {
  rowNum: number;
  email: string;
  name: string;
  role: string;
  error: string | null;
}

const VALID_ROLES = new Set(["admin", "manager"]);

function parseRows(rawRows: Record<string, string>[]): ParsedRow[] {
  return rawRows
    .filter((row) => Object.values(row).some((v) => v?.toString().trim()))
    .map((row, idx) => {
      const email = (row["Email"] ?? row["email"] ?? "").toString().trim();
      const name = (row["Name"] ?? row["name"] ?? "").toString().trim();
      const rawRole = (row["Role"] ?? row["role"] ?? "").toString().trim().toLowerCase();

      let error: string | null = null;
      if (!email) error = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        error = `"${email}" is not a valid email address`;
      else if (!rawRole) error = "Role is required (Admin or Manager)";
      else if (!VALID_ROLES.has(rawRole))
        error = `"${row["Role"] ?? rawRole}" must be Admin or Manager`;

      return { rowNum: idx + 2, email, name, role: rawRole, error };
    });
}

function downloadTemplate() {
  import("xlsx").then((XLSX) => {
    const wb = XLSX.utils.book_new();

    const instructions: (string | null)[][] = [
      ["OpsFluency Team Member Import — Instructions"],
      [null],
      ["Column", "Required?", "Notes"],
      ["Name", "Optional", "Full name, e.g. Jane Smith"],
      ["Email", "REQUIRED", "Work email address for the admin or manager."],
      ["Role", "REQUIRED", 'Must be exactly "Admin" or "Manager" (case-insensitive).'],
      [null],
      ["Tips"],
      ["— Each email generates a unique invite link you share with the recipient."],
      ["— Duplicate emails (already have an unclaimed invite) are skipped."],
      ["— Admins have full org access. Managers are scoped to their departments."],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 72 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const data: string[][] = [
      ["Name", "Email", "Role"],
      ["Jane Smith", "jane@yourcompany.com", "Manager"],
      ["Carlos Reyes", "carlos@yourcompany.com", "Admin"],
    ];
    const wsData = XLSX.utils.aoa_to_sheet(data);
    wsData["!cols"] = [{ wch: 22 }, { wch: 32 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsData, "Team");

    XLSX.writeFile(wb, "team-invite-template.xlsx");
  });
}

export function TeamBulkUploadClient() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<BulkTeamInviteResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function resetDialog() {
    setStage("idle");
    setParsedRows([]);
    setResult(null);
    setParseError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    setOpen(false);
    setTimeout(resetDialog, 300);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      import("xlsx").then((XLSX) => {
        try {
          const data = new Uint8Array(ev.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });

          const sheetName =
            wb.SheetNames.find((n) => n.toLowerCase() !== "instructions") ??
            wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
            defval: "",
          });

          if (rows.length === 0) {
            setParseError("The file appears to be empty.");
            return;
          }

          const parsed = parseRows(rows);
          if (parsed.length === 0) {
            setParseError("No data rows found in the file.");
            return;
          }

          setParsedRows(parsed);
          setStage("preview");
        } catch {
          setParseError("Could not read the file. Make sure it's a valid .xlsx or .csv.");
        }
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function handleImport() {
    const valid = parsedRows.filter((r) => !r.error);
    if (valid.length === 0) return;

    startTransition(async () => {
      const res = await bulkCreateTeamInvites(
        valid.map((r) => ({ email: r.email, name: r.name || undefined, role: r.role })),
      );
      setResult(res);
      setStage("done");
    });
  }

  const validCount = parsedRows.filter((r) => !r.error).length;
  const errorCount = parsedRows.filter((r) => r.error).length;

  return (
    <>
      <button
        onClick={() => { resetDialog(); setOpen(true); }}
        className="flex items-center gap-2 rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-4 py-2 text-sm font-semibold text-dc-text-2 hover:bg-dc-overlay"
      >
        <FileSpreadsheet className="size-4" strokeWidth={2} />
        Bulk upload
      </button>

      <Dialog open={open} onClose={handleClose} size="2xl">
        <div className="flex items-center justify-between">
          <DialogTitle>
            {stage === "done" ? "Import complete" : "Bulk invite team members"}
          </DialogTitle>
          <button type="button" onClick={handleClose} className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          {stage === "idle" && (
            <div className="flex flex-col gap-6">
              <div className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-3">
                <p className="text-sm font-medium text-dc-text">How it works</p>
                <ol className="mt-2 flex flex-col gap-1 text-xs text-dc-text-3">
                  <li>1. Download the template and fill in names, emails, and roles.</li>
                  <li>2. Upload the file — we&apos;ll validate each row.</li>
                  <li>3. Confirm the import and copy each invite link from Pending invites.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-3 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20"
                >
                  <Download className="size-4" strokeWidth={2} />
                  Download template (.xlsx)
                </button>

                <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8 text-center hover:border-(--color-brand)/50 hover:bg-(--color-brand)/5">
                  <Upload className="size-6 text-dc-text-3" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-dc-text">
                    Click to upload your file
                  </span>
                  <span className="text-xs text-dc-text-3">.xlsx or .csv accepted</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>

                {parseError && (
                  <p className="rounded-lg border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-2 text-sm text-(--color-signal-urgent)">
                    {parseError}
                  </p>
                )}
              </div>
            </div>
          )}

          {stage === "preview" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="size-3.5" />
                  {validCount} ready to import
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1 text-xs font-semibold text-(--color-signal-urgent)">
                    <AlertCircle className="size-3.5" />
                    {errorCount} row{errorCount !== 1 ? "s" : ""} will be skipped
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-auto rounded-xl border border-[color:var(--dc-edge)]">
                <table className="w-full min-w-[28rem] text-xs">
                  <thead className="sticky top-0 bg-dc-raised">
                    <tr className="border-b border-[color:var(--dc-edge)]">
                      <th className="px-3 py-2 text-left font-semibold text-dc-text-3">Row</th>
                      <th className="px-3 py-2 text-left font-semibold text-dc-text-3">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-dc-text-3">Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-dc-text-3">Role</th>
                      <th className="px-3 py-2 text-left font-semibold text-dc-text-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--dc-edge)]">
                    {parsedRows.map((row) => (
                      <tr key={row.rowNum} className={row.error ? "bg-(--color-signal-urgent)/5" : ""}>
                        <td className="px-3 py-2 text-dc-text-3">{row.rowNum}</td>
                        <td className="px-3 py-2 text-dc-text">{row.name || <span className="italic text-dc-text-3">—</span>}</td>
                        <td className="px-3 py-2 text-dc-text">{row.email || <span className="text-(--color-signal-urgent)">—</span>}</td>
                        <td className="px-3 py-2 capitalize text-dc-text">{row.role || "—"}</td>
                        <td className="px-3 py-2">
                          {row.error ? (
                            <span className="text-(--color-signal-urgent)">{row.error}</span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" onClick={resetDialog} className="self-start text-xs text-dc-text-3 underline hover:text-dc-text">
                Upload a different file
              </button>
            </div>
          )}

          {stage === "done" && result && (
            <div className="flex flex-col gap-4">
              {result.ok ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                    <CheckCircle className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {result.created} invite{result.created !== 1 ? "s" : ""} created. Copy each link from the Pending invites list.
                    </p>
                  </div>
                  {result.skipped.length > 0 && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {result.skipped.length} row{result.skipped.length !== 1 ? "s" : ""} skipped
                      </p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {result.skipped.map((s) => (
                          <li key={s.row} className="text-xs text-amber-700 dark:text-amber-400">
                            Row {s.row}: {s.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-4 py-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)" />
                  <div>
                    <p className="text-sm font-medium text-(--color-signal-urgent)">Import failed</p>
                    <p className="mt-0.5 text-xs text-(--color-signal-urgent)/80">
                      {result.error.message ?? "An unexpected error occurred."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogActions>
          {stage === "idle" && (
            <button type="button" onClick={handleClose} className="rounded-lg border border-[color:var(--dc-edge)] px-4 py-2 text-sm text-dc-text-2 hover:bg-dc-overlay">
              Cancel
            </button>
          )}
          {stage === "preview" && (
            <>
              <button type="button" onClick={handleClose} className="rounded-lg border border-[color:var(--dc-edge)] px-4 py-2 text-sm text-dc-text-2 hover:bg-dc-overlay">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isPending || validCount === 0}
                className="flex items-center gap-2 rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
              >
                {isPending ? "Importing…" : `Import ${validCount} invite${validCount !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
          {stage === "done" && (
            <button type="button" onClick={handleClose} className="rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover)">
              Done
            </button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
