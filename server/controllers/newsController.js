import { fetchNewsForCategory } from "../services/newsService.js";

export const getNews = async (req, res) => {
  try {
    const category = String(req.query.category || "India").trim();

    if (!category) {
      return res.status(400).json({
        message: "A news category or search term is required.",
      });
    }

    const result = await fetchNewsForCategory(category);

    return res.status(200).json({
      status: result.status,
      totalResults: result.totalResults,
      articles: result.articles,
    });
  } catch (error) {
    console.error("News fetch error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch news",
    });
  }
};
