import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();

const RSS_FEEDS = [
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
  },
];


const CATEGORY_TERMS = {
  technology: ["technology", "artificial intelligence", "software", "gadgets", "computer"],
  sports: ["sports", "cricket", "football", "tennis", "olympic"],
  business: ["business", "finance", "economy", "stock", "market"],
  politics: ["politics", "government", "election", "minister", "parliament"],
  science: ["science", "space", "research", "nasa", "discovery"],
  health: ["health", "medicine", "healthcare", "hospital", "disease"],
  entertainment: ["movies", "cinema", "entertainment", "music", "actor"],
};

const NEWS_API_QUERIES = {
  technology: "technology OR artificial intelligence OR software",
  sports: "sports OR cricket OR football",
  business: "business OR finance OR economy",
  politics: "politics OR government OR election",
  science: "science OR space OR research",
  health: "health OR medicine OR healthcare",
  entertainment: "movies OR cinema OR music",
};

function matchesCategory(article, category) {
  const terms = CATEGORY_TERMS[category];

  if (!terms) {
    return `${article.title} ${article.description || ""}`
      .toLowerCase()
      .includes(category);
  }

  const text = `${article.title} ${article.description || ""}`
    .toLowerCase();

  return terms.some((term) => text.includes(term));
}

async function fetchNewsApi(category) {
  if (!process.env.NEWS_API_KEY) {
    console.warn("NEWS_API_KEY is missing. Skipping NewsAPI.");
    return [];
  }

  const response = await axios.get(
    "https://newsapi.org/v2/everything",
    {
      timeout: 15000,
      params: {
        q: NEWS_API_QUERIES[category] || category,
        language: "en",
        sortBy: "publishedAt",
        pageSize: 50,
        apiKey: process.env.NEWS_API_KEY,
      },
    }
  );

  if (response.data.status !== "ok") {
    throw new Error("NewsAPI request failed.");
  }

  return (response.data.articles || []).map((article) => ({
    ...article,
    source: article.source || { name: "NewsAPI" },
  }));
}

async function fetchRss(category) {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const data = await parser.parseURL(feed.url);

      return data.items.map((item) => ({
        source: { name: feed.name },
        author: item.creator || item.author || null,
        title: item.title || "",
        description: item.contentSnippet || item.content || "",
        url: item.link || "",
        urlToImage: item.enclosure?.url || null,
        publishedAt: item.isoDate || item.pubDate || null,
        content: item.content || item.contentSnippet || "",
      }));
    })
  );

  const articles = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      console.warn(
        `${RSS_FEEDS[index].name} RSS failed:`,
        result.reason?.message
      );
    }
  });

  return articles.filter(
    (article) =>
      article.title &&
      article.url &&
      matchesCategory(article, category)
  );
}

function normalizeUrl(articleUrl) {
  try {
    const url = new URL(articleUrl);

    url.hash = "";

    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "fbclid",
      "gclid",
    ].forEach((key) => url.searchParams.delete(key));

    return url.toString().replace(/\/$/, "");
  } catch {
    return articleUrl;
  }
}

export async function fetchNewsForCategory(category = "India") {
  const normalizedCategory = String(category).trim().toLowerCase();

  if (!normalizedCategory) {
    throw new Error("News category is required.");
  }

  const [newsApiResult, rssResult] = await Promise.allSettled([
    fetchNewsApi(normalizedCategory),
    fetchRss(normalizedCategory),
  ]);

  if (
    newsApiResult.status === "rejected" &&
    rssResult.status === "rejected"
  ) {
    throw new Error("Unable to fetch news from any source.");
  }

  if (newsApiResult.status === "rejected") {
    console.warn("NewsAPI failed:", newsApiResult.reason?.message);
  }

  if (rssResult.status === "rejected") {
    console.warn("RSS fetching failed:", rssResult.reason?.message);
  }

  const newsApiArticles =
    newsApiResult.status === "fulfilled" ? newsApiResult.value : [];

  const rssArticles =
    rssResult.status === "fulfilled" ? rssResult.value : [];

  const uniqueArticles = new Map();

  [...newsApiArticles, ...rssArticles].forEach((article) => {
    if (!article?.url) return;

    const key = normalizeUrl(article.url);

    if (!uniqueArticles.has(key)) {
      uniqueArticles.set(key, article);
    }
  });

  const articles = [...uniqueArticles.values()].sort(
    (a, b) =>
      new Date(b.publishedAt || 0).getTime() -
      new Date(a.publishedAt || 0).getTime()
  );

  return {
    status: "ok",
    totalResults: articles.length,
    articles,
  };
}
