import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { generateEdition } from "@/lib/edition/generate";

export const maxDuration = 60;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const edition = await generateEdition(user.id);

    return NextResponse.json({
      ok: true,
      editionId: edition.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/edition/generate] Error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
