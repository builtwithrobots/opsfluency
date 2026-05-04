import { type NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  convertSopFromImage,
  convertSopFromPdf,
  convertSopFromText,
  type ChunkProgressEvent,
} from "@/lib/ai/sop-conversion";
import { recommendTemplate } from "@/lib/ai/template-recommender";
import type { GlossaryRow } from "@/lib/types/glossary";
import {
  ALLOWED_SOP_TRANSITIONS,
  SOP_UPLOADS_BUCKET,
  isImageMime,
  isPdfMime,
  type SopStatus,
} from "@/lib/types/sop";

export const maxDuration = 300;

const ParamsSchema = z.object({ id: z.string().uuid() });

function sseFrame(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Validate route params.
  const rawParams = await params;
  const parsed = ParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: { code: "INVALID_INPUT" } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const sop_id = parsed.data.id;

  // Authenticate before opening the stream — send a plain JSON error for
  // auth failures so the client can distinguish 401/403 from stream errors.
  let companyContext: Awaited<ReturnType<typeof getCompanyContext>>;
  try {
    companyContext = await getCompanyContext("manager");
  } catch (e) {
    if (e instanceof AuthError) {
      const status = e.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response(
        JSON.stringify({ error: { code: e.code } }),
        { status, headers: { "Content-Type": "application/json" } },
      );
    }
    throw e;
  }
  const { supabase, company_id } = companyContext;

  // Verify SOP ownership and current status.
  const { data: sop } = await supabase
    .from("sops")
    .select("id, status")
    .eq("id", sop_id)
    .eq("company_id", company_id)
    .maybeSingle();

  if (!sop) {
    return new Response(
      JSON.stringify({ error: { code: "NOT_FOUND" } }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  if (sop.status !== "draft") {
    return new Response(
      JSON.stringify({ error: { code: "INVALID_TRANSITION", message: `Cannot convert from status ${sop.status}` } }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  // Load the latest version before opening the stream.
  const { data: version } = await supabase
    .from("sop_versions")
    .select("id, original_file_url")
    .eq("sop_id", sop_id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version?.original_file_url) {
    return new Response(
      JSON.stringify({ error: { code: "NOT_FOUND", message: "No upload found" } }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const versionId = version.id;
  const originalFileUrl = version.original_file_url as string;

  // Abort controller tied to the client connection. When the browser
  // navigates away mid-stream, request.signal fires and we stop Sonnet calls.
  const abortController = new AbortController();
  request.signal.addEventListener("abort", () => abortController.abort());

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        try {
          controller.enqueue(sseFrame(event, data));
        } catch {
          // Stream already closed — client disconnected.
        }
      }

      try {
        // Download the original file. Admin client — storage RLS path uses
        // requesting_company_id() which only works via Clerk JWT; we already
        // verified tenant scope above, so service-role write is justified.
        const admin = getAdminClient();
        const { data: blob, error: dlErr } = await admin.storage
          .from(SOP_UPLOADS_BUCKET)
          .download(originalFileUrl);

        if (dlErr || !blob) {
          send("error", { code: "INTERNAL", message: `Download failed: ${dlErr?.message ?? "no blob"}` });
          controller.close();
          return;
        }

        const fileBuf = Buffer.from(await blob.arrayBuffer());
        const mimeType = blob.type || "application/octet-stream";

        // Load glossary.
        const { data: glossaryData } = await supabase
          .from("glossary_terms")
          .select("term_en, definition_en, term_es, definition_es")
          .eq("company_id", company_id);
        const glossary = (glossaryData ?? []) as GlossaryRow[];

        // Translate ChunkProgressEvents into SSE events.
        function onChunkProgress(event: ChunkProgressEvent) {
          if (event.type === "chunk_start") {
            send("chunk_start", {
              chunk: event.index + 1,
              total: event.total,
              label: event.label,
            });
          } else {
            send("chunk_done", {
              chunk: event.index + 1,
              total: event.total,
            });
          }
        }

        // Dispatch to the right conversion path by MIME type.
        let result;
        if (isPdfMime(mimeType)) {
          result = await convertSopFromPdf({
            pdfBase64: fileBuf.toString("base64"),
            pdfBuffer: fileBuf,
            glossary,
            sopId: sop_id,
            companyId: company_id,
            signal: abortController.signal,
            onChunkProgress,
          });
        } else if (isImageMime(mimeType)) {
          result = await convertSopFromImage({
            imageBase64: fileBuf.toString("base64"),
            mimeType,
            glossary,
            sopId: sop_id,
            companyId: company_id,
            signal: abortController.signal,
            onChunkProgress,
          });
        } else {
          result = await convertSopFromText({
            documentText: fileBuf.toString("utf-8"),
            glossary,
            sopId: sop_id,
            companyId: company_id,
            signal: abortController.signal,
            onChunkProgress,
          });
        }

        if (!result.ok) {
          send("error", {
            code: result.error.code,
            message: result.error.message,
            retry_allowed: result.error.retry_allowed,
            duration_ms: result.error.duration_ms,
            attempt: result.error.attempt,
            model: result.error.model,
          });
          controller.close();
          return;
        }

        const conv = result.data;

        // Signal that the glossary flagging phase is starting.
        send("flagging_start", { chunks_total: conv.chunks_total });

        // Write content + flagged terms to sop_versions.
        // Run template recommendation in parallel — fire-safe, failures ignored.
        const [vErr, templateRec] = await Promise.all([
          admin
            .from("sop_versions")
            .update({ content_en: conv.markdown, flagged_terms: conv.flagged_terms })
            .eq("id", versionId)
            .then((r) => r.error),
          recommendTemplate(conv.markdown, { sopId: sop_id, companyId: company_id }),
        ]);

        if (vErr) {
          send("error", { code: "INTERNAL", message: vErr.message });
          controller.close();
          return;
        }

        if (templateRec) {
          await admin
            .from("sops")
            .update({ template_recommendation: templateRec })
            .eq("id", sop_id)
            .eq("company_id", company_id);
        }

        // Status transitions — race-safe: each update only fires if the
        // current status matches the expected `from` value.
        const target: SopStatus =
          conv.flagged_terms.length === 0 ? "pending_translation" : "pending_terms";

        if (!ALLOWED_SOP_TRANSITIONS["draft"].includes("pending_terms")) {
          send("error", { code: "INVALID_TRANSITION" });
          controller.close();
          return;
        }

        const { data: t1, error: t1Err } = await admin
          .from("sops")
          .update({ status: "pending_terms" })
          .eq("id", sop_id)
          .eq("status", "draft")
          .select("id")
          .maybeSingle();

        if (t1Err) {
          send("error", { code: "INTERNAL", message: t1Err.message });
          controller.close();
          return;
        }
        if (!t1) {
          send("error", { code: "STATUS_CHANGED", message: "SOP status changed concurrently" });
          controller.close();
          return;
        }

        if (target === "pending_translation") {
          await admin
            .from("sops")
            .update({ status: "pending_translation" })
            .eq("id", sop_id)
            .eq("status", "pending_terms");
        }

        revalidatePath(`/dashboard/sops/${sop_id}`);
        revalidatePath("/dashboard/sops");

        send("done", { status: target, flagged_count: conv.flagged_terms.length });
        controller.close();
      } catch (e) {
        if (!abortController.signal.aborted) {
          send("error", {
            code: "INTERNAL",
            message: e instanceof Error ? e.message : "Unexpected error",
          });
        }
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
