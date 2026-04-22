// v1.0.0
// Contact form API stub. Validates the payload with the shared Zod
// schema, logs it server-side, and returns 200. Email delivery is not
// wired up for MVP; the log captures it for now.

import { NextResponse } from "next/server";
import { z } from "zod";

import { ContactFormSchema } from "@/lib/contact/schema";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Body must be JSON." } },
      { status: 400 },
    );
  }

  try {
    const parsed = ContactFormSchema.parse(payload);
    console.log("[contact] new submission", {
      name: parsed.name,
      email: parsed.email,
      company: parsed.company,
      employees: parsed.employees,
      messageLength: parsed.message.length,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", details: error.issues } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL" } },
      { status: 500 },
    );
  }
}
