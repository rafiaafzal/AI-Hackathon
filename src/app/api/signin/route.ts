import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = SignInSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Look up the user by email (case-insensitive)
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("[signin] Supabase lookup error:", error);
      return NextResponse.json(
        { ok: false, error: "Database error" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No paper found for this email. Brew a new one." },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("cn_user", user.id, {
      path: "/",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[signin] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
