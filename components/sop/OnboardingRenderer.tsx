import { renderMarkdown } from "@/lib/sop/markdown";

export interface HrContact {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
}

interface Props {
  content: string;
  contacts?: HrContact[];
  lang?: string;
}

function ContactCard({ contact }: { contact: HrContact }) {
  const initials = contact.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised p-4">
      {contact.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={contact.photo_url}
          alt=""
          className="size-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400"
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dc-text">{contact.name}</p>
        <p className="truncate text-xs text-dc-text-3">{contact.title}</p>

        {(contact.email || contact.phone) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-2.5 py-1 text-xs font-medium text-dc-text-2 hover:text-dc-text transition-colors"
              >
                <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-2.5 py-1 text-xs font-medium text-dc-text-2 hover:text-dc-text transition-colors"
              >
                <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />
                </svg>
                {contact.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Onboarding template renderer.
 * Welcome banner at the top, HR contact cards at the bottom so new
 * hires know exactly who to reach out to with questions.
 */
export function OnboardingRenderer({ content, contacts = [], lang }: Props) {
  return (
    <div lang={lang}>
      {/* Welcome banner */}
      <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <svg
              className="size-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Welcome guide</p>
            <p className="mt-0.5 text-xs text-dc-text-2">
              Take your time. Ask your manager if anything is unclear.
            </p>
          </div>
        </div>
      </div>

      {renderMarkdown(content, { className: "max-w-none" })}

      {/* HR contact cards */}
      {contacts.length > 0 && (
        <section aria-labelledby="hr-contacts-heading" className="mt-8 border-t border-[color:var(--dc-edge)] pt-6">
          <h2
            id="hr-contacts-heading"
            className="mb-4 text-xs font-semibold tracking-widest text-dc-text-3 uppercase"
          >
            Questions? Contact HR
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
