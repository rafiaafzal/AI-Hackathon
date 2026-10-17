import { supabaseAdmin } from "@/lib/supabase";
import { UserProfile } from "@/lib/profile";

export interface RankedArticle {
  id: string;
  url: string;
  title: string;
  source: string | null;
  published_at: string | null;
  summary: string | null;
  topics: string[] | null;
  similarity: number;
}

export interface UserRankPreview {
  user: {
    id: string;
    name: string;
    profile: UserProfile | null;
  };
  articles: RankedArticle[];
}

export async function getRankedArticlesForUser(
  userId: string
): Promise<UserRankPreview | null> {
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, name, profile_json, interest_vector")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    console.error("[rank-preview] User not found or DB error:", userError);
    return null;
  }

  const interestVector = user.interest_vector;

  if (!interestVector) {
    return {
      user: {
        id: user.id,
        name: user.name ?? "Reader",
        profile: user.profile_json as UserProfile | null,
      },
      articles: [],
    };
  }

  // Call match_articles RPC with match_count = 12
  const { data: matched, error: rpcError } = await supabaseAdmin.rpc(
    "match_articles",
    {
      query_embedding: interestVector,
      match_count: 12,
      since_hours: 96,
    }
  );

  if (rpcError) {
    console.error("[rank-preview] RPC match_articles error:", rpcError);
    // Fallback: load latest 12 articles if RPC fails or migration pending
    const { data: fallbackArticles } = await supabaseAdmin
      .from("articles")
      .select("id, url, title, source, published_at, summary, topics")
      .order("published_at", { ascending: false })
      .limit(12);

    return {
      user: {
        id: user.id,
        name: user.name ?? "Reader",
        profile: user.profile_json as UserProfile | null,
      },
      articles: (fallbackArticles || []).map((a) => ({
        ...a,
        similarity: 0.5,
      })),
    };
  }

  return {
    user: {
      id: user.id,
      name: user.name ?? "Reader",
      profile: user.profile_json as UserProfile | null,
    },
    articles: (matched as RankedArticle[]) || [],
  };
}
