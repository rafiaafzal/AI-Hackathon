export { cn } from "cn";

export function toOneSentence(text?: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^([^.!?]+[.!?])(?:\s|$)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}
