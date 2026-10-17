export interface EditionItem {
  articleId: string;
  url: string;
  title: string;
  source: string | null;
  publishedAt: string | null;
  summary: string | null;
  topics: string[];
  reason: string;
  readMinutes: number;
}

export interface EditionSection {
  key: string;
  label: string;
  items: EditionItem[];
}

export interface Edition {
  id: string;
  date: string; // YYYY-MM-DD
  editionNumber: number;
  readerName: string;
  theme: string;
  lead: EditionItem & { blurb: string };
  sections: EditionSection[];
  inBrief: EditionItem[];
  takeaways: string[];
  discovery?: EditionItem & { whyNew: string };
  changes?: string[];
}
