import axios from "axios";
import { sendNewsAlert } from "../services/alertService.js";

export const getNews = async (req, res) => {
  try {

     const category = req.query.category || "India";
    
        const categorySearch = {
      technology:
        "technology OR artificial intelligence OR software OR gadgets",

      sports:
        "sports OR cricket OR football",

      business:
        "business OR finance OR economy OR stock market",

      politics:
        "politics OR government OR election",

      science:
        "science OR space OR research",

      health:
        "health OR medicine OR healthcare",

      entertainment:
        "movies OR cinema OR entertainment OR music",
    };

    const response = await axios.get(
      "https://newsapi.org/v2/everything",
      {
        params: {
          q: categorySearch[category] || category,
          language: "en",
          sortBy: "publishedAt",
          apiKey: process.env.NEWS_API_KEY,
        },
      }
    );

    const articles = response.data.articles || [];

if (articles.length > 0) {
  await sendNewsAlert(articles[0], category);
}

    res.json(response.data);
  } catch (error) {
    console.error("News fetch error:", error.message);

    res.status(500).json({
      message: "Failed to fetch news",
    });
  }
};