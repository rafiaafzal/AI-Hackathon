import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { UserProfile } from "@/lib/profile";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  profile_json: UserProfile | null;
  created_at: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("cn_user")?.value;

    if (!userId) {
      return null;
    }

    // Do not select or return interest_vector to clients
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, profile_json, created_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as SessionUser;
  } catch (err: unknown) {
    console.error("[getCurrentUser] Error fetching current user session:", err);
    return null;
  }
}
