import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  await auth.protect();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-dc-edge">
        <span
          className="font-bold text-xl tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          OpsFluency
        </span>
        <UserButton />
      </header>
      <main
        id="main"
        className="flex-1 flex flex-col items-center justify-center px-6 py-24 gap-4 text-center"
      >
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Manager dashboard
        </h1>
        <p className="max-w-xl text-dc-text-2">
          The SOP import pipeline, glossary manager, worker invitations,
          announcements, monitors, and analytics will live here. We're scaffolding
          the foundation first.
        </p>
      </main>
    </div>
  );
}
