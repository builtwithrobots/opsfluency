import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { SOP_STARTER_TEMPLATES } from "@/lib/templates/index";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const template = SOP_STARTER_TEMPLATES.find((t) => t.id === id);
  if (!template) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "templates", template.filename);

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ buffer });
    return NextResponse.json({ html: result.value });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}
