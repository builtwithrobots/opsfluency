"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Check, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createHrContact, updateHrContact, deleteHrContact } from "../_actions";

export interface HrContactRow {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  sort_order: number;
}

interface ContactFormState {
  name: string;
  title: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: ContactFormState = { name: "", title: "", email: "", phone: "" };

function ContactForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ContactFormState;
  onSave: (values: ContactFormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [values, setValues] = useState(initial);
  const set = (k: keyof ContactFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Name *</label>
          <input
            value={values.name}
            onChange={set("name")}
            placeholder="e.g. Maria Garcia"
            maxLength={100}
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Title *</label>
          <input
            value={values.title}
            onChange={set("title")}
            placeholder="e.g. HR Manager"
            maxLength={100}
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={set("email")}
            placeholder="maria@company.com"
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-dc-text-2">Phone</label>
          <input
            type="tel"
            value={values.phone}
            onChange={set("phone")}
            placeholder="+1 (555) 000-0000"
            maxLength={30}
            className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button plain onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button
          color="brand"
          onClick={() => onSave(values)}
          disabled={saving || !values.name.trim() || !values.title.trim()}
        >
          {saving ? "Saving…" : <><Check className="size-3.5" /> Save</>}
        </Button>
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
  deleting,
}: {
  contact: HrContactRow;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const initials = contact.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised p-4">
      <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-dc-text-3" aria-hidden />

      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400"
        aria-hidden
      >
        {contact.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={contact.photo_url} alt="" className="size-10 rounded-full object-cover" />
          : initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dc-text">{contact.name}</p>
        <p className="truncate text-xs text-dc-text-3">{contact.title}</p>
        {contact.email && <p className="truncate text-xs text-dc-text-2 mt-0.5">{contact.email}</p>}
        {contact.phone && <p className="text-xs text-dc-text-2 mt-0.5">{contact.phone}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-dc-text-3 hover:text-dc-text hover:bg-dc-surface transition-colors"
          aria-label={`Edit ${contact.name}`}
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="rounded-md p-1.5 text-dc-text-3 hover:text-(--color-signal-urgent) hover:bg-(--color-signal-urgent)/10 transition-colors disabled:opacity-50"
          aria-label={`Delete ${contact.name}`}
        >
          {deleting ? <X className="size-3.5 animate-pulse" /> : <Trash2 className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function HrContactsClient({ initial }: { initial: HrContactRow[] }) {
  const [contacts, setContacts] = useState<HrContactRow[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(values: ContactFormState) {
    setError(null);
    startTransition(async () => {
      const res = await createHrContact({
        name: values.name.trim(),
        title: values.title.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        sort_order: contacts.length,
      });
      if (!res.ok) { setError("Could not save contact. Please try again."); return; }
      setContacts((prev) => [
        ...prev,
        {
          id: res.data.id,
          name: values.name.trim(),
          title: values.title.trim(),
          email: values.email.trim() || null,
          phone: values.phone.trim() || null,
          photo_url: null,
          sort_order: prev.length,
        },
      ]);
      setAdding(false);
    });
  }

  function handleEdit(id: string, values: ContactFormState) {
    setError(null);
    startTransition(async () => {
      const res = await updateHrContact(id, {
        name: values.name.trim(),
        title: values.title.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
      });
      if (!res.ok) { setError("Could not update contact. Please try again."); return; }
      setContacts((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, name: values.name.trim(), title: values.title.trim(), email: values.email.trim() || null, phone: values.phone.trim() || null }
            : c,
        ),
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteHrContact(id);
      setDeletingId(null);
      if (!res.ok) { setError("Could not delete contact. Please try again."); return; }
      setContacts((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-lg border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)">
          {error}
        </p>
      )}

      {contacts.length === 0 && !adding && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--dc-edge)] px-6 py-10 text-center">
          <p className="text-sm font-medium text-dc-text">No HR contacts yet</p>
          <p className="text-xs text-dc-text-3">
            Add contacts and they&apos;ll appear as cards at the bottom of every onboarding SOP.
          </p>
          <Button color="brand" className="mt-3" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add first contact
          </Button>
        </div>
      )}

      {contacts.map((contact) =>
        editingId === contact.id ? (
          <ContactForm
            key={contact.id}
            initial={{ name: contact.name, title: contact.title, email: contact.email ?? "", phone: contact.phone ?? "" }}
            onSave={(values) => handleEdit(contact.id, values)}
            onCancel={() => setEditingId(null)}
            saving={isPending}
          />
        ) : (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={() => setEditingId(contact.id)}
            onDelete={() => handleDelete(contact.id)}
            deleting={deletingId === contact.id}
          />
        ),
      )}

      {adding ? (
        <ContactForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          saving={isPending}
        />
      ) : (
        contacts.length > 0 && (
          <div>
            <Button plain onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Add contact
            </Button>
          </div>
        )
      )}
    </div>
  );
}
