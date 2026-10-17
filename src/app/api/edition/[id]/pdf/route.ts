import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { generatePrintToken } from "@/lib/pdf/token";
import { renderEditionPdf } from "@/lib/pdf/render";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: editionId } = await params;
    if (!editionId) {
      return NextResponse.json(
        { ok: false, error: "Edition ID is required" },
        { status: 400 }
      );
    }

    // Load edition and verify ownership
    const { data: editionRecord, error: editionError } = await supabaseAdmin
      .from("editions")
      .select("id, user_id, edition_date, layout_json")
      .eq("id", editionId)
      .maybeSingle();

    if (editionError || !editionRecord || editionRecord.user_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Edition not found" },
        { status: 404 }
      );
    }

    // Build print URL with HMAC token
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "http");
    const origin = `${proto}://${host}`;

    const token = generatePrintToken(editionId);
    const printUrl = `${origin}/print/${editionId}?token=${token}`;

    // Render PDF
    const pdfBuffer = await renderEditionPdf(printUrl);

    // Record PDF signal for this user
    try {
      await supabaseAdmin.from("signals").insert({
        user_id: user.id,
        type: "pdf",
        value: 1,
      });
    } catch (signalErr: unknown) {
      console.warn("[api/edition/pdf] Failed to record pdf signal:", signalErr);
    }

    const editionDate =
      editionRecord.edition_date || new Date().toISOString().slice(0, 10);
    const filename = `chai-and-news-${editionDate}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/edition/pdf] Error generating PDF:", err);
    return NextResponse.json(
      { ok: false, error: `Failed to generate PDF: ${message}` },
      { status: 500 }
    );
  }
}
