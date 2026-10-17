export const TOPICS = [
  'world',
  'pakistan',
  'politics',
  'technology',
  'ai',
  'startups',
  'business',
  'finance',
  'cricket',
  'sports',
  'science',
  'health',
  'climate',
  'culture',
] as const;

export type Topic = (typeof TOPICS)[number];

export interface FeedConfig {
  name: string;
  url: string;
  topics: string[];
}

export const FEEDS: FeedConfig[] = [
  {
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    topics: ['world'],
  },
  {
    name: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    topics: ['world'],
  },
  {
    name: 'Dawn',
    url: 'https://www.dawn.com/feeds/home',
    topics: ['pakistan'],
  },
  {
    name: 'Express Tribune',
    url: 'https://tribune.com.pk/feed/home',
    topics: ['pakistan'],
  },
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    topics: ['technology'],
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    topics: ['technology', 'startups'],
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    topics: ['technology'],
  },
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    topics: ['technology', 'science'],
  },
  {
    name: 'ESPNcricinfo',
    url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    topics: ['cricket'],
  },
];
