/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-page-custom-font */
import React from "react";
import QRCode from "qrcode";
import { Edition, EditionSection } from "@/lib/edition/types";

interface PrintEditionProps {
  edition: Edition;
}

async function generateQrDataUrl(url: string): Promise<string> {
  if (!url) return "";
  try {
    return await QRCode.toDataURL(url, {
      width: 52,
      margin: 1,
      color: {
        dark: "#1B1A17",
        light: "#FFFDF8",
      },
    });
  } catch (err: unknown) {
    console.error("[PrintEdition] Failed to generate QR code for URL:", url, err);
    return "";
  }
}

function formatEditionDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

function formatArticleDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return "";
}

export default async function PrintEdition({ edition }: PrintEditionProps) {
  // Collect all URLs needing QR codes: lead, all section stories, discovery
  const urlsToQr: string[] = [];
  if (edition.lead?.url) urlsToQr.push(edition.lead.url);
  for (const sec of edition.sections || []) {
    for (const item of sec.items || []) {
      if (item.url) urlsToQr.push(item.url);
    }
  }
  if (edition.discovery?.url) urlsToQr.push(edition.discovery.url);

  // Generate QR codes concurrently
  const qrEntries = await Promise.all(
    urlsToQr.map(async (url) => {
      const dataUrl = await generateQrDataUrl(url);
      return [url, dataUrl] as const;
    })
  );
  const qrMap = new Map<string, string>(qrEntries);

  // Divide sections: First section's first 2-3 items go to page 1
  const firstSection = (edition.sections || [])[0];
  const page1Count = firstSection ? Math.min(3, firstSection.items.length) : 0;
  const page1Secondary = firstSection ? firstSection.items.slice(0, page1Count) : [];
  const firstSectionLeftover = firstSection ? firstSection.items.slice(page1Count) : [];

  const remainingSections: EditionSection[] = [
    ...(firstSectionLeftover.length > 0
      ? [{ ...firstSection, items: firstSectionLeftover }]
      : []),
    ...(edition.sections || []).slice(1),
  ].filter((s) => s.items && s.items.length > 0);

  const formattedDate = formatEditionDate(edition.date);
  const readerName = edition.readerName || "Reader";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4;
              margin: 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #FFFDF8 !important;
              color: #1B1A17;
              font-family: 'Source Serif 4', Georgia, serif;
              font-size: 9.5pt;
              line-height: 1.42;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-edition-root {
              background-color: #FFFDF8;
              color: #1B1A17;
              min-height: 100vh;
              width: 100%;
            }

            /* Page break helper */
            .page-break-after {
              page-break-after: always;
              break-after: page;
            }

            /* Masthead */
            .masthead {
              text-align: center;
              margin-bottom: 8px;
            }
            .masthead-title {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 38pt;
              font-weight: 900;
              letter-spacing: -0.5px;
              margin: 0;
              padding: 0;
              line-height: 1.05;
              color: #1B1A17;
            }
            .double-rule {
              height: 5px;
              border-top: 2px solid #1B1A17;
              border-bottom: 1px solid #1B1A17;
              margin: 6px 0 4px 0;
            }
            .thin-rule {
              border-top: 1px solid #D9CFBF;
              margin: 6px 0;
            }
            .masthead-meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: 'Inter', sans-serif;
              font-size: 7.5pt;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #6B655C;
              padding: 2px 0;
            }
            .masthead-tagline {
              font-family: 'Playfair Display', Georgia, serif;
              font-style: italic;
              font-size: 8.5pt;
              text-transform: none;
              letter-spacing: 0;
              color: #8A5A2B;
            }

            /* Theme line */
            .theme-line {
              text-align: center;
              font-family: 'Playfair Display', Georgia, serif;
              font-style: italic;
              font-size: 11pt;
              color: #1B1A17;
              margin: 6px 0 10px 0;
              padding-bottom: 6px;
              border-bottom: 1px solid #D9CFBF;
            }

            /* Page 1 Grid */
            .page1-top {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 5mm;
              margin-bottom: 8px;
            }

            /* Lead Story */
            .lead-story {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .lead-headline {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 20pt;
              font-weight: 700;
              line-height: 1.15;
              margin: 0 0 6px 0;
              color: #1B1A17;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .lead-blurb {
              font-family: 'Source Serif 4', Georgia, serif;
              font-size: 10.5pt;
              font-style: italic;
              line-height: 1.35;
              color: #3A3834;
              margin: 0 0 6px 0;
              border-left: 2px solid #9B1C1C;
              padding-left: 8px;
            }
            .story-meta {
              font-family: 'Inter', sans-serif;
              font-size: 7pt;
              font-weight: 600;
              color: #6B655C;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 5px;
            }
            .story-meta-source {
              color: #1B1A17;
            }
            .story-summary {
              font-family: 'Source Serif 4', Georgia, serif;
              font-size: 9pt;
              line-height: 1.38;
              color: #1B1A17;
              margin: 0 0 6px 0;
              text-align: justify;
            }
            .story-reason {
              font-family: 'Inter', sans-serif;
              font-size: 7pt;
              color: #6B655C;
              background-color: #F8F4EE;
              border-left: 2px solid #D9CFBF;
              padding: 3px 6px;
              margin-top: 4px;
              font-style: italic;
            }

            /* QR code block */
            .story-footer-row {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 8px;
              margin-top: 4px;
            }
            .qr-box {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
            }
            .qr-img {
              width: 38px;
              height: 38px;
              display: block;
            }
            .qr-text {
              font-family: 'Inter', sans-serif;
              font-size: 5.5pt;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: #6B655C;
              margin-top: 1px;
              white-space: nowrap;
            }

            /* Three Things You Learned Box */
            .takeaways-box {
              border: 1.5px solid #1B1A17;
              background: #FFFDF8;
              padding: 8px 10px;
              display: flex;
              flex-direction: column;
            }
            .takeaways-badge {
              font-family: 'Inter', sans-serif;
              font-size: 6.5pt;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #9B1C1C;
              margin-bottom: 2px;
            }
            .takeaways-heading {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 11pt;
              font-weight: 700;
              line-height: 1.2;
              margin: 0 0 6px 0;
              color: #1B1A17;
              border-bottom: 1px solid #D9CFBF;
              padding-bottom: 4px;
            }
            .takeaways-list {
              margin: 0;
              padding-left: 14px;
              font-family: 'Source Serif 4', Georgia, serif;
              font-size: 8pt;
              line-height: 1.35;
              color: #1B1A17;
            }
            .takeaways-list li {
              margin-bottom: 6px;
            }
            .takeaways-list li:last-child {
              margin-bottom: 0;
            }

            /* Page 1 Secondary Stories Deck */
            .page1-secondary-header {
              font-family: 'Inter', sans-serif;
              font-size: 7.5pt;
              font-weight: 700;
              text-transform: uppercase;
              font-variant: small-caps;
              letter-spacing: 0.1em;
              color: #9B1C1C;
              border-bottom: 1px solid #1B1A17;
              padding-bottom: 2px;
              margin: 8px 0 6px 0;
            }
            .page1-secondary-grid {
              display: grid;
              grid-template-columns: repeat(${Math.max(1, page1Secondary.length)}, 1fr);
              gap: 5mm;
            }
            .secondary-story-card {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .secondary-headline {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 11.5pt;
              font-weight: 700;
              line-height: 1.2;
              margin: 0 0 4px 0;
              color: #1B1A17;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            /* Following Pages (Multi-column layout) */
            .columns-container {
              column-count: 3;
              column-gap: 5mm;
              column-rule: 1px solid #D9CFBF;
            }
            .section-block {
              margin-bottom: 10px;
            }
            .section-label {
              font-family: 'Inter', sans-serif;
              font-size: 8pt;
              font-weight: 700;
              text-transform: uppercase;
              font-variant: small-caps;
              letter-spacing: 0.12em;
              color: #9B1C1C;
              border-bottom: 1.5px solid #1B1A17;
              padding-bottom: 2px;
              margin: 10px 0 6px 0;
              break-after: avoid;
              page-break-after: avoid;
            }
            .story-card {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 1px solid #D9CFBF;
            }
            .story-headline {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 11.5pt;
              font-weight: 700;
              line-height: 1.2;
              margin: 0 0 4px 0;
              color: #1B1A17;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            /* Drop Cap on the first story of each section */
            .first-story .drop-cap::first-letter {
              font-family: 'Playfair Display', Georgia, serif;
              float: left;
              font-size: 2.9em;
              line-height: 0.78;
              padding-top: 2px;
              padding-right: 5px;
              padding-bottom: 0px;
              font-weight: 700;
              color: #9B1C1C;
            }

            /* In Brief section */
            .in-brief-box {
              break-inside: avoid;
              page-break-inside: avoid;
              border-top: 1.5px solid #1B1A17;
              margin-top: 10px;
              padding-top: 4px;
              margin-bottom: 8px;
            }
            .in-brief-title {
              font-family: 'Inter', sans-serif;
              font-size: 8pt;
              font-weight: 700;
              text-transform: uppercase;
              font-variant: small-caps;
              letter-spacing: 0.12em;
              color: #9B1C1C;
              margin-bottom: 4px;
            }
            .in-brief-list {
              list-style: square;
              margin: 0;
              padding-left: 14px;
              font-size: 8pt;
              line-height: 1.35;
            }
            .in-brief-item {
              margin-bottom: 4px;
            }
            .in-brief-headline {
              font-weight: 600;
              color: #1B1A17;
            }
            .in-brief-source {
              color: #6B655C;
              font-family: 'Inter', sans-serif;
              font-size: 7pt;
              margin-left: 4px;
            }

            /* Rabbit Hole box */
            .discovery-box {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 1px solid #D9CFBF;
              background-color: #FAF6EE;
              padding: 8px 10px;
              margin-top: 10px;
              margin-bottom: 8px;
            }
            .discovery-badge {
              font-family: 'Inter', sans-serif;
              font-size: 6.5pt;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #9B1C1C;
              margin-bottom: 2px;
            }
            .discovery-headline {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 11pt;
              font-weight: 700;
              line-height: 1.2;
              margin: 0 0 4px 0;
              color: #1B1A17;
            }

            /* Print Footer */
            .print-footer {
              break-inside: avoid;
              page-break-inside: avoid;
              border-top: 1px solid #D9CFBF;
              margin-top: 14px;
              padding-top: 6px;
              text-align: center;
              font-family: 'Inter', sans-serif;
              font-size: 7pt;
              color: #6B655C;
              letter-spacing: 0.04em;
            }
          `,
        }}
      />
      <div className="print-edition-root">
        {/* ================= PAGE 1 ================= */}
        <div className="page-break-after">
          {/* Masthead */}
          <header className="masthead">
            <h1 className="masthead-title">Chai &amp; News</h1>
            <div className="double-rule" />
            <div className="masthead-meta">
              <span>{formattedDate}</span>
              <span className="masthead-tagline">
                Your morning paper, brewed fresh. &bull; Edition No. {edition.editionNumber}
              </span>
              <span>Prepared for {readerName}</span>
            </div>
            <div className="thin-rule" />
          </header>

          {/* Theme line */}
          {edition.theme && (
            <div className="theme-line">&ldquo;{edition.theme}&rdquo;</div>
          )}

          {/* Page 1 Top: Lead story (2 cols) + Takeaways Box (1 col) */}
          <div className="page1-top">
            {/* Lead Story */}
            <article className="lead-story">
              <div>
                <div className="story-meta">
                  <span className="story-meta-source">
                    {edition.lead.source || "News"}
                  </span>
                  {edition.lead.publishedAt && (
                    <span> &bull; {formatArticleDate(edition.lead.publishedAt)}</span>
                  )}
                  {edition.lead.readMinutes && (
                    <span> &bull; {edition.lead.readMinutes} min read</span>
                  )}
                </div>

                <h2 className="lead-headline">{edition.lead.title}</h2>

                {edition.lead.blurb && (
                  <div className="lead-blurb">{edition.lead.blurb}</div>
                )}

                {edition.lead.summary && (
                  <p className="story-summary">{edition.lead.summary}</p>
                )}
              </div>

              <div>
                {edition.lead.reason && (
                  <div className="story-reason">
                    Why this story: {edition.lead.reason}
                  </div>
                )}

                <div className="story-footer-row">
                  <span style={{ fontSize: "7pt", color: "#6B655C" }}>
                    Chai &amp; News Lead Report
                  </span>
                  {qrMap.get(edition.lead.url) && (
                    <div className="qr-box">
                      <img
                        src={qrMap.get(edition.lead.url)}
                        alt="Read online"
                        className="qr-img"
                      />
                      <span className="qr-text">Read online</span>
                    </div>
                  )}
                </div>
              </div>
            </article>

            {/* Three things you learned today */}
            {edition.takeaways && edition.takeaways.length > 0 ? (
              <aside className="takeaways-box">
                <span className="takeaways-badge">Daily Takeaways</span>
                <h3 className="takeaways-heading">
                  Three things you learned today
                </h3>
                <ol className="takeaways-list">
                  {edition.takeaways.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ol>
              </aside>
            ) : (
              <div />
            )}
          </div>

          {/* Page 1 Secondary Stories */}
          {page1Secondary.length > 0 && (
            <div>
              <div className="page1-secondary-header">
                {firstSection?.label || "Front Page Reports"}
              </div>
              <div className="page1-secondary-grid">
                {page1Secondary.map((story) => {
                  const qr = qrMap.get(story.url);
                  return (
                    <article key={story.articleId} className="secondary-story-card">
                      <div>
                        <div className="story-meta">
                          <span className="story-meta-source">
                            {story.source || "Report"}
                          </span>
                          {story.publishedAt && (
                            <span> &bull; {formatArticleDate(story.publishedAt)}</span>
                          )}
                          {story.readMinutes && (
                            <span> &bull; {story.readMinutes}m</span>
                          )}
                        </div>
                        <h4 className="secondary-headline">{story.title}</h4>
                        {story.summary && (
                          <p className="story-summary">{story.summary}</p>
                        )}
                      </div>
                      <div>
                        {story.reason && (
                          <div className="story-reason">
                            Why: {story.reason}
                          </div>
                        )}
                        {qr && (
                          <div className="story-footer-row">
                            <span />
                            <div className="qr-box">
                              <img
                                src={qr}
                                alt="Read online"
                                className="qr-img"
                              />
                              <span className="qr-text">Read online</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================= FOLLOWING PAGES ================= */}
        {remainingSections.length > 0 && (
          <div className="columns-container">
            {remainingSections.map((sec) => (
              <section key={sec.key || sec.label} className="section-block">
                <div className="section-label">{sec.label}</div>
                {sec.items.map((story, idx) => {
                  const isFirst = idx === 0;
                  const qr = qrMap.get(story.url);
                  return (
                    <article
                      key={story.articleId}
                      className={`story-card ${isFirst ? "first-story" : ""}`}
                    >
                      <div className="story-meta">
                        <span className="story-meta-source">
                          {story.source || "Dispatch"}
                        </span>
                        {story.publishedAt && (
                          <span> &bull; {formatArticleDate(story.publishedAt)}</span>
                        )}
                        {story.readMinutes && (
                          <span> &bull; {story.readMinutes}m</span>
                        )}
                      </div>
                      <h4 className="story-headline">{story.title}</h4>
                      {story.summary && (
                        <p className={`story-summary ${isFirst ? "drop-cap" : ""}`}>
                          {story.summary}
                        </p>
                      )}
                      {story.reason && (
                        <div className="story-reason">Why: {story.reason}</div>
                      )}
                      {qr && (
                        <div className="story-footer-row">
                          <span />
                          <div className="qr-box">
                            <img
                              src={qr}
                              alt="Read online"
                              className="qr-img"
                            />
                            <span className="qr-text">Read online</span>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            ))}

            {/* In Brief list */}
            {edition.inBrief && edition.inBrief.length > 0 && (
              <div className="in-brief-box">
                <div className="in-brief-title">In Brief</div>
                <ul className="in-brief-list">
                  {edition.inBrief.map((item) => (
                    <li key={item.articleId} className="in-brief-item">
                      <span className="in-brief-headline">{item.title}</span>
                      {item.source && (
                        <span className="in-brief-source">({item.source})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rabbit hole of the day box for discovery */}
            {edition.discovery && (
              <div className="discovery-box">
                <div className="discovery-badge">Rabbit hole of the day</div>
                <div className="story-meta">
                  <span className="story-meta-source">
                    {edition.discovery.source || "Discovery"}
                  </span>
                  {edition.discovery.publishedAt && (
                    <span>
                      {" "}
                      &bull; {formatArticleDate(edition.discovery.publishedAt)}
                    </span>
                  )}
                </div>
                <h4 className="discovery-headline">{edition.discovery.title}</h4>
                {edition.discovery.summary && (
                  <p className="story-summary">{edition.discovery.summary}</p>
                )}
                {edition.discovery.whyNew && (
                  <div className="story-reason">
                    Why this discovery: {edition.discovery.whyNew}
                  </div>
                )}
                {qrMap.get(edition.discovery.url) && (
                  <div className="story-footer-row">
                    <span />
                    <div className="qr-box">
                      <img
                        src={qrMap.get(edition.discovery.url)}
                        alt="Read online"
                        className="qr-img"
                      />
                      <span className="qr-text">Read online</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <footer className="print-footer">
              Printed fresh for {readerName} &bull; chai-and-news
            </footer>
          </div>
        )}
      </div>
    </>
  );
}
