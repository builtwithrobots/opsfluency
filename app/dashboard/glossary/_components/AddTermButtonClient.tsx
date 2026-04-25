"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { createGlossaryTerm } from "../_actions/glossary";

import { EMPTY_DRAFT, TermFormFields, type TermDraft } from "./TermFormFields";

interface Props {
  variant?: "brand" | "outline";
}

export function AddTermButtonClient({ variant = "brand" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TermDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patch(p: Partial<TermDraft>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.term_en.trim() || !draft.term_es.trim()) {
      setError("English and Spanish terms are both required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await createGlossaryTerm(draft);
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      setDraft(EMPTY_DRAFT);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {variant === "brand" ? (
        <Button color="brand" onClick={() => setOpen(true)}>
          <Plus data-slot="icon" strokeWidth={2} />
          Add term
        </Button>
      ) : (
        <Button outline onClick={() => setOpen(true)}>
          <Plus data-slot="icon" strokeWidth={2} />
          Add term manually
        </Button>
      )}

      <Dialog open={open} onClose={close} size="2xl">
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add a glossary term</DialogTitle>
          <DialogDescription>
            New terms apply to every future SOP translation. Leave the definition fields blank
            if the bilingual pair speaks for itself.
          </DialogDescription>

          <DialogBody>
            <TermFormFields draft={draft} onChange={patch} disabled={isPending} />

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)"
              >
                {error}
              </p>
            )}
          </DialogBody>

          <DialogActions>
            <Button plain type="button" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="brand"
              disabled={isPending || !draft.term_en.trim() || !draft.term_es.trim()}
            >
              {isPending ? "Saving…" : "Add term"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
