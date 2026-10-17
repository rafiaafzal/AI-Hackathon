export interface TopicStyle {
  color: string;
  bg: string;
  border: string;
  emoji: string;
  label: string;
}

export const TOPIC_STYLES: Record<string, { color: string; emoji: string }> = {
  technology: { color: "#2F5D8A", emoji: "💻" },
  ai: { color: "#2F5D8A", emoji: "🤖" },
  world: { color: "#5B4B8A", emoji: "🌍" },
  pakistan: { color: "#2E7D4F", emoji: "🇵🇰" },
  politics: { color: "#8A3B3B", emoji: "🏛️" },
  business: { color: "#9A6B1F", emoji: "📈" },
  finance: { color: "#9A6B1F", emoji: "💰" },
  cricket: { color: "#1F7A7A", emoji: "🏏" },
  sports: { color: "#1F7A7A", emoji: "⚽" },
  science: { color: "#3B6E8F", emoji: "🔬" },
  health: { color: "#A84A6A", emoji: "🏥" },
  climate: { color: "#4E7D32", emoji: "🌱" },
  culture: { color: "#8A5A2B", emoji: "🎨" },
  startups: { color: "#C2571A", emoji: "🚀" },
};

export function getTopicStyle(rawTopic?: string | null): TopicStyle {
  if (!rawTopic) {
    return {
      color: "#8A5A2B",
      bg: "#FAF5EC",
      border: "#8A5A2B",
      emoji: "📰",
      label: "News",
    };
  }

  const normalized = rawTopic.toLowerCase().trim();
  const matched = TOPIC_STYLES[normalized];

  const color = matched?.color || "#8A5A2B";
  const emoji = matched?.emoji || "📰";
  const label =
    normalized === "ai"
      ? "AI"
      : normalized === "pakistan"
      ? "Pakistan"
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return {
    color,
    bg: `${color}14`,
    border: color,
    emoji,
    label,
  };
}

export function getTopicColor(rawTopic?: string | null): string {
  return getTopicStyle(rawTopic).color;
}

export function getTopicEmoji(rawTopic?: string | null): string {
  return getTopicStyle(rawTopic).emoji;
}
