import type { Browser } from "puppeteer-core";

export async function renderEditionPdf(url: string): Promise<Buffer> {
  let browser: Browser | null = null;

  try {
    if (process.env.NODE_ENV !== "production") {
      const puppeteer = await import("puppeteer");
      browser = (await puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })) as unknown as Browser;
    } else {
      const chromium = (await import("@sparticuz/chromium")).default;
      const puppeteerCore = await import("puppeteer-core");
      const executablePath = await chromium.executablePath();

      browser = await puppeteerCore.default.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close().catch((err: unknown) => {
        console.error("[renderEditionPdf] Error closing browser:", err);
      });
    }
  }
}
