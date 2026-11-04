
require("dotenv").config();

const express = require("express");
const { scrapeTop150 } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 3000;

let cachedData = null;
let lastUpdated = null;
let refreshPromise = null;

const CACHE_TTL =
  (Number(process.env.CACHE_TTL_MINUTES) || 360) * 60 * 1000;

app.use(express.json());

async function refreshData(force = false) {
  const cacheValid =
    cachedData &&
    lastUpdated &&
    Date.now() - lastUpdated < CACHE_TTL;

  if (!force && cacheValid) {
    return cachedData;
  }

  // Avoid duplicate simultaneous scraping jobs.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const data = await scrapeTop150();

      cachedData = data;
      lastUpdated = Date.now();

      return data;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// API home
app.get("/", (req, res) => {
  res.json({
    name: "FitGirl Game Metadata API",
    version: "1.0.0",
    status: "running",
    endpoints: [
      "GET /health",
      "GET /api/games",
      "GET /api/games/:rank",
      "POST /api/refresh"
    ]
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    cached: Boolean(cachedData),
    refreshing: Boolean(refreshPromise),
    lastUpdated: lastUpdated
      ? new Date(lastUpdated).toISOString()
      : null
  });
});

// Return all 150 game records
app.get("/api/games", async (req, res) => {
  try {
    const refresh = req.query.refresh === "true";

    const data = await refreshData(refresh);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Return a particular ranked game
app.get("/api/games/:rank", async (req, res) => {
  try {
    const data = await refreshData();

    const rank = Number(req.params.rank);

    if (!Number.isInteger(rank) || rank < 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid ranking position"
      });
    }

    const game = data.games.find(
      item => item.rank === rank
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found"
      });
    }

    res.json({
      success: true,
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually refresh metadata
app.post("/api/refresh", async (req, res) => {
  try {
    const data = await refreshData(true);

    res.json({
      success: true,
      message: "Scraping completed",
      totalGames: data.totalGames,
      scrapedAt: data.scrapedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log("FitGirl Metadata API Started");
  console.log(`http://localhost:${PORT}`);
  console.log("--------------------------------");
});
