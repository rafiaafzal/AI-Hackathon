import crypto from "crypto";

export function generatePrintToken(editionId: string): string {
  const secret = process.env.CRON_SECRET || "";
  return crypto.createHmac("sha256", secret).update(editionId).digest("hex");
}

export function verifyPrintToken(
  editionId: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;
  const expected = generatePrintToken(editionId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, "utf-8"),
      Buffer.from(expected, "utf-8")
    );
  } catch {
    return false;
  }
}
