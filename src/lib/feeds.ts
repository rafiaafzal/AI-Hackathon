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
  // World
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

  // Pakistan & Politics
  {
    name: 'Dawn',
    url: 'https://www.dawn.com/feeds/home',
    topics: ['pakistan', 'politics'],
  },
  {
    name: 'Express Tribune',
    url: 'https://tribune.com.pk/feed/home',
    topics: ['pakistan', 'politics'],
  },
  {
    name: 'Dawn Business',
    url: 'https://www.dawn.com/feeds/business',
    topics: ['business', 'pakistan'],
  },

  // Technology, AI & Startups
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    topics: ['technology', 'startups'],
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    topics: ['technology', 'startups', 'ai'],
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
    name: 'BBC Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    topics: ['technology', 'ai'],
  },
  {
    name: 'MIT Tech Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    topics: ['ai', 'technology'],
  },

  // Business & Finance
  {
    name: 'BBC Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    topics: ['business', 'finance'],
  },
  {
    name: 'Guardian Business',
    url: 'https://www.theguardian.com/uk/business/rss',
    topics: ['business', 'finance'],
  },

  // Science & Climate
  {
    name: 'BBC Science & Environment',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    topics: ['science', 'climate'],
  },
  {
    name: 'Guardian Science',
    url: 'https://www.theguardian.com/science/rss',
    topics: ['science'],
  },
  {
    name: 'Guardian Environment',
    url: 'https://www.theguardian.com/environment/rss',
    topics: ['climate'],
  },

  // Health
  {
    name: 'BBC Health',
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    topics: ['health'],
  },
  {
    name: 'Guardian Health',
    url: 'https://www.theguardian.com/society/health/rss',
    topics: ['health'],
  },

  // Culture
  {
    name: 'Guardian Culture',
    url: 'https://www.theguardian.com/culture/rss',
    topics: ['culture'],
  },

  // Sports & Cricket
  {
    name: 'ESPNcricinfo',
    url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    topics: ['cricket', 'sports'],
  },
  {
    name: 'Guardian Sport',
    url: 'https://www.theguardian.com/sport/rss',
    topics: ['sports'],
  },
];
