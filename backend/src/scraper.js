
const cheerio = require("cheerio");
const fs = require("fs");

const SITE = "https://fitgirl-repacks.site";

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

function clean(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(url, base) {
  if (!url) return null;

  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") + "/";
  return parsed.href;
}

function extractField(lines, labels) {
  for (const line of lines) {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(
        `(?:^|\\s)${escaped}\\s*:\\s*(.+)$`,
        "i"
      );

      const match = line.match(regex);

      if (match && clean(match[1])) {
        return clean(match[1]);
      }
    }
  }

  return null;
}

async function getHTML(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30000)
  });

  const html = await response.text();

  console.log("HTTP:", response.status);
  console.log("URL:", response.url);
  console.log("HTML size:", html.length);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  if (!/<html[\s>]/i.test(html)) {
    throw new Error("Response is not an HTML document.");
  }

  if (
    /cf-challenge|challenge-platform|just a moment/i.test(
      html.slice(0, 20000)
    )
  ) {
    throw new Error("Cloudflare challenge detected.");
  }

  return html;
}

// Check whether a URL looks like an individual WordPress post.
function isGamePostUrl(url, rankingUrl) {
  try {
    const parsed = new URL(url);
    const ranking = new URL(rankingUrl);

    if (parsed.hostname !== ranking.hostname) {
      return false;
    }

    if (parsed.search) return false;

    const pathname = parsed.pathname;

    if (pathname === "/" || pathname === ranking.pathname) {
      return false;
    }

    const segments = pathname.split("/").filter(Boolean);

    // FitGirl post URLs are expected to be single-slug URLs.
    if (segments.length !== 1) return false;

    const slug = segments[0].toLowerCase();

    const excluded = [
      "about",
      "contact",
      "privacy-policy",
      "popular-repacks-of-the-year",
      "category",
      "tag",
      "author",
      "feed",
      "wp-json",
      "wp-admin",
      "wp-login"
    ];

    if (excluded.includes(slug)) return false;

    if (/^(category|tag|author|page)-/.test(slug)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Extract game links in ranking-page document order.
async function getRankingLinks(rankingUrl) {
  const html = await getHTML(rankingUrl);
  const $ = cheerio.load(html);

  console.log("Page title:", $("title").text());

  const selectors = [
    ".entry-content",
    ".post-content",
    ".article-content",
    "article",
    "main",
    "#content"
  ];

  let content = null;
  let selectedSelector = null;

  for (const selector of selectors) {
    const element = $(selector).first();

    if (
      element.length &&
      element.find("a[href]").length > 0
    ) {
      content = element;
      selectedSelector = selector;
      break;
    }
  }

  if (!content) {
    // Save HTML for inspection if the layout is different.
    fs.writeFileSync("debug-ranking.html", html);

    throw new Error(
      "Ranking content not found. HTML saved to debug-ranking.html"
    );
  }

  console.log("Selected selector:", selectedSelector);
  console.log(
    "Total links inside content:",
    content.find("a[href]").length
  );

  const links = [];
  const seen = new Set();

  function addCandidate(element) {
    const anchor = $(element);

    const rawUrl = anchor.attr("href");

    const url = absoluteUrl(rawUrl, rankingUrl);

    const name = clean(
      anchor.text() ||
      anchor.attr("title") ||
      anchor.find("img").attr("alt")
    );

    if (!url || !name) return;

    if (!isGamePostUrl(url, rankingUrl)) return;

    const normalized = normalizeUrl(url);

    if (seen.has(normalized)) return;

    seen.add(normalized);

    links.push({
      name,
      url: normalized
    });
  }

  // First priority: links inside ranking list items.
  content.find("ol li, ul li").each((index, element) => {
    const anchor = $(element)
      .find("a[href]")
      .filter((i, a) => {
        const href = absoluteUrl($(a).attr("href"), rankingUrl);
        return href && isGamePostUrl(href, rankingUrl);
      })
      .first();

    if (anchor.length) {
      addCandidate(anchor[0]);
    }
  });

  // Fallback: other individual post links in the article.
  if (links.length < 150) {
    content.find("a[href]").each((index, element) => {
      addCandidate(element);
    });
  }

  console.log("Game links found:", links.length);

  console.log(
    "First 10 game links:",
    links.slice(0, 10)
  );

  if (!links.length) {
    fs.writeFileSync("debug-ranking.html", html);

    throw new Error(
      "No game post links found. Inspect debug-ranking.html."
    );
  }

  if (links.length < 150) {
    console.warn(
      `WARNING: Only ${links.length} candidate links found, not 150.`
    );
  }

  return links.slice(0, 150);
}

// Extract images including lazy-loaded images.
function extractImages($, scope, pageUrl) {
  const images = [];

  const candidates = [
    $("meta[property='og:image']").attr("content"),
    $("meta[name='twitter:image']").attr("content")
  ];

  scope.find("img").each((index, element) => {
    const img = $(element);

    candidates.push(
      img.attr("data-src"),
      img.attr("data-lazy-src"),
      img.attr("data-original"),
      img.attr("src")
    );

    const srcset = img.attr("srcset");

    if (srcset) {
      candidates.push(
        srcset.split(",")[0].trim().split(/\s+/)[0]
      );
    }
  });

  for (const candidate of candidates) {
    const url = absoluteUrl(candidate, pageUrl);

    if (
      url &&
      !images.includes(url) &&
      !/\.(svg|gif)$/i.test(url)
    ) {
      images.push(url);
    }
  }

  return images;
}

// Extract individual game metadata.
async function getGameDetails(gameLink, rank) {
  const html = await getHTML(gameLink.url);
  const $ = cheerio.load(html);

  const article = $("article").first();

  const content =
    article.find(".entry-content").first().length
      ? article.find(".entry-content").first()
      : $(".entry-content").first();

  const scope = content.length
    ? content
    : article.length
      ? article
      : $("main");

  const title =
    clean(article.find("h1.entry-title").first().text()) ||
    clean($("meta[property='og:title']").attr("content")) ||
    gameLink.name;

  const images = extractImages($, scope, gameLink.url);

  const description =
    clean($("meta[property='og:description']").attr("content")) ||
    clean($("meta[name='description']").attr("content")) ||
    clean(scope.find("p").first().text()) ||
    null;

  // Preserve paragraph/list boundaries for metadata extraction.
  const lines = [];

  scope.find("p, li, tr, h2, h3").each((index, element) => {
    const text = $(element).text();

    text.split(/\r?\n/).forEach(line => {
      const value = clean(line);

      if (value) lines.push(value);
    });
  });

  const paragraphs = scope.find("p")
    .map((index, element) => clean($(element).text()))
    .get()
    .filter(Boolean);

  const metadata = {
    developer: extractField(lines, [
      "Company",
      "Developer",
      "Developers"
    ]),

    publisher: extractField(lines, [
      "Publisher",
      "Publishers"
    ]),

    genres: extractField(lines, [
      "Genres/Tags",
      "Genres",
      "Genre"
    ]),

    languages: extractField(lines, [
      "Languages",
      "Language"
    ]),

    gameVersion: extractField(lines, [
      "Game version",
      "Version"
    ]),

    originalSize: extractField(lines, [
      "Original Size"
    ]),

    repackSize: extractField(lines, [
      "Repack Size"
    ])
  };

  const canonical =
    $("link[rel='canonical']").attr("href") ||
    gameLink.url;

    function extractMagnetUrls($) {
  const magnets = [];

  $("a[href]").each((index, element) => {
    const href = $(element).attr("href");

    if (href && href.startsWith("magnet:?")) {
      magnets.push({
        title: clean($(element).text()),
        magnetUrl: href
      });
    }
  });

  return [...new Map(
    magnets.map(item => [item.magnetUrl, item])
  ).values()];
}

  return {
    id: rank,
    rank,

    name: title,

    logo: images[0] || null,
    images,

    description,

    pageUrl: absoluteUrl(canonical, gameLink.url),

    publishedAt:
      $("meta[property='article:published_time']").attr("content") ||
      null,

    metadata,

    specifications: {
      minimum: null,
      recommended: null
    },

    // Not populated by this metadata scraper.
    magnetUrl: extractMagnetUrls($),

    paragraphs
  };
}

// Main scraper.
async function scrapeTop150() {
  const rankingUrl = process.env.FITGIRL_TOP150_URL;

  if (!rankingUrl) {
    throw new Error(
      "FITGIRL_TOP150_URL is missing from .env"
    );
  }

  const parsed = new URL(rankingUrl);

  if (
    parsed.hostname !== "fitgirl-repacks.site" &&
    parsed.hostname !== "www.fitgirl-repacks.site"
  ) {
    throw new Error("Invalid FitGirl ranking URL.");
  }

  console.log("\n================================");
  console.log("FITGIRL TOP 150 SCRAPER");
  console.log("================================\n");

  console.log("Ranking page:", rankingUrl);

  const links = await getRankingLinks(rankingUrl);

  console.log(`\nProcessing ${links.length} games...\n`);

  const games = [];
  const errors = [];

  for (let i = 0; i < links.length; i++) {
    const gameLink = links[i];

    console.log(
      `[${i + 1}/${links.length}] ${gameLink.name}`
    );

    try {
      const game = await getGameDetails(
        gameLink,
        i + 1
      );

      games.push(game);

      console.log("  SUCCESS:", game.name);
      console.log("  SUCCESS:", game.magnetUrl);

    } catch (error) {
      console.error("  FAILED:", error.message);

      errors.push({
        rank: i + 1,
        name: gameLink.name,
        url: gameLink.url,
        error: error.message
      });
    }

    if (i < links.length - 1) {
      await sleep(
        Math.max(
          1000,
          Number(process.env.SCRAPE_DELAY_MS) || 1000
        )
      );
    }
  }

  const result = {
    source: SITE,
    rankingPage: rankingUrl,

    scrapedAt: new Date().toISOString(),

    requestedGames: 150,
    candidateGames: links.length,
    totalGames: games.length,

    complete: games.length === 150 && links.length === 150,

    errors,

    games
  };

  console.log("\n================================");
  console.log("SCRAPING COMPLETED");
  console.log("================================");

  console.log("Candidate games:", links.length);
  console.log("Successfully scraped:", games.length);
  console.log("Failed:", errors.length);

  return result;
}

module.exports = {
  scrapeTop150
};
