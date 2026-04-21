import Link from "next/link";

export default function Home() {
  return (
    <main
      id="main"
      className="flex-1 flex flex-col items-center justify-center px-6 py-24 gap-8 text-center background"
    >
      <div className="max-w-2xl flex flex-col items-center gap-6">
        <span
          className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-widest rounded-full border border-dc-edge text-dc-text-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Pre-launch
        </span>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          OpsFluency
        </h1>
        <p className="text-lg md:text-xl text-dc-text-2 leading-relaxed">
          Frontline knowledge and engagement for multilingual warehouse and
          manufacturing teams. Bilingual SOPs, QR-triggered learning,
          departmental communication — one system.
        </p>
        <div className="flex items-center gap-3 pt-4">
          <Link
            href="/sign-in"
            className="px-6 py-3 rounded-md bg-[var(--color-brand)] text-[#0C0E14] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md border border-dc-edge text-dc-text hover:bg-dc-raised transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
