import fs from "node:fs";
import path from "node:path";

const SITE = "https://letterpatternsolver.com";
const OUT_ROOT = ".";
const ANSWERS_PATH = path.join("data", "answers.txt");
const CORE_PAGES = [
  "/",
  "/about.html",
  "/privacy.html",
  "/contact.html",
  "/terms.html",
];
const CURATED_SUFFIXES = ["er", "ed", "ly", "al", "el", "st", "th", "es", "s"];
const CURATED_MIDDLE_LETTERS = ["a", "e", "i", "o", "u", "r", "s", "t"];
const CURATED_PAIRS = [
  ["r", "e"],
  ["a", "e"],
  ["s", "t"],
  ["a", "r"],
  ["o", "e"],
  ["i", "e"],
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readWordList(p) {
  const raw = fs.readFileSync(p, "utf8").trim();
  return raw.split(/\s+/).map(w => w.trim().toLowerCase()).filter(Boolean);
}

function writeFile(p, contents) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, contents);
}

function pageHtml({ title, canonical, description, h1, introHtml, words, related }) {
  const wordCards = words.map(w => `<li class="word-card">${w}</li>`).join("");
  const relatedLis = related.map(r => `<li><a href="${r.href}">${r.text}</a></li>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow" />
  <style>
    :root{
      --bg:#eef2f3;
      --card:#ffffff;
      --text:#12343b;
      --muted:#587077;
      --border:#d0d7dc;
      --accent:#1f5a64;
    }
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6}
    header,footer{padding:16px 20px;background:rgba(255,255,255,.8);border-bottom:1px solid var(--border)}
    footer{border-top:1px solid var(--border);border-bottom:none;margin-top:28px}
    nav{max-width:1040px;margin:0 auto}
    nav a, footer a{margin-right:14px;color:var(--accent);text-decoration:none;font-weight:600}
    main{max-width:1040px;margin:0 auto;padding:24px 20px}
    .card{padding:18px 20px;border:1px solid var(--border);border-radius:14px;background:var(--card);box-shadow:0 10px 30px rgba(0,0,0,.05)}
    .meta{color:var(--muted)}
    .word-grid{list-style:none;padding:0;margin:12px 0 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .word-card{padding:10px 12px;border-radius:10px;background:#f2f6f7;border:1px solid var(--border);font-weight:700;text-align:center;letter-spacing:.06em}
    .split{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:start}
    .related{padding-left:18px;margin:10px 0 0}
    @media (max-width:820px){.word-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.split{grid-template-columns:1fr}}
    @media (max-width:560px){.word-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style>
</head>
<body>
<header>
  <nav>
    <a href="/">Solver</a>
    <a href="/5-letter-word-lists/">Word lists</a>
    <a href="/about.html">About</a>
    <a href="/privacy.html">Privacy</a>
    <a href="/contact.html">Contact</a>
    <a href="/terms.html">Terms</a>
  </nav>
</header>

<main>
  <h1>${escapeHtml(h1)}</h1>
  <div class="split">
    <div class="card">
      ${introHtml}
      <p class="meta"><strong>Total matches:</strong> ${words.length}</p>
      <h2>Word list</h2>
      <ul class="word-grid">${wordCards}</ul>
    </div>
    <aside class="card">
      <h2>Related pages</h2>
      <ul class="related">${relatedLis}</ul>
      <p class="meta">Need exact positions, included letters, or excluded letters? Open the <a href="/">solver</a>.</p>
    </aside>
  </div>
</main>

<footer>
  <a href="/privacy.html">Privacy Policy</a>
  <a href="/about.html">About</a>
  <a href="/contact.html">Contact</a>
  <a href="/terms.html">Terms</a>
</footer>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugPrefix(ch) {
  return `/5-letter-words-starting-with-${ch}/`;
}

function slugSuffix(suf) {
  return `/5-letter-words-ending-in-${suf}/`;
}

function slugMiddle(ch) {
  return `/5-letter-words-with-${ch}-in-the-middle/`;
}

function slugContainsPair(a, b) {
  return `/5-letter-words-with-${a}-and-${b}/`;
}

function writePageDir(urlPath, html) {
  const dir = path.join(OUT_ROOT, urlPath.replace(/^\/|\/$/g, ""));
  writeFile(path.join(dir, "index.html"), html);
}

const answers = readWordList(ANSWERS_PATH).filter(w => w.length === 5);
const generatedUrls = [];

function addGeneratedPage(urlPath, options) {
  writePageDir(urlPath, pageHtml(options));
  generatedUrls.push(urlPath);
}

const prefixPages = [];
for (const ch of "abcdefghijklmnopqrstuvwxyz") {
  const words = answers.filter(w => w.startsWith(ch)).sort();
  if (words.length < 15) continue;

  const urlPath = slugPrefix(ch);
  prefixPages.push(urlPath);
  const title = `5-letter words starting with ${ch.toUpperCase()}`;
  addGeneratedPage(urlPath, {
    title,
    canonical: `${SITE}${urlPath}`,
    description: `${title}. Browse the list, then use the solver to narrow by position or excluded letters.`,
    h1: title,
    introHtml: `<p>Browse <strong>5-letter words starting with ${ch.toUpperCase()}</strong>. These pages are useful when you know the first letter but still need to narrow the rest of the pattern.</p>
<p>After browsing this list, use the solver to lock in exact positions, include extra letters, or remove gray-letter candidates.</p>`,
    words,
    related: [
      { href: "/5-letter-word-lists/", text: "All 5-letter word lists" },
      { href: slugMiddle("a"), text: "5-letter words with A in the middle" },
      { href: "/", text: "Open the solver" },
    ],
  });
}

const suffixPages = [];
for (const suf of CURATED_SUFFIXES) {
  const words = answers.filter(w => w.endsWith(suf)).sort();
  if (words.length < 30) continue;

  const urlPath = slugSuffix(suf);
  suffixPages.push(urlPath);
  const title = `5-letter words ending in ${suf.toUpperCase()}`;
  addGeneratedPage(urlPath, {
    title,
    canonical: `${SITE}${urlPath}`,
    description: `${title}. Browse the list and use endings to narrow puzzle guesses faster.`,
    h1: title,
    introHtml: `<p>Browse <strong>5-letter words ending in ${suf.toUpperCase()}</strong>. Ending patterns are especially useful when you know the final tile or a common suffix.</p>
<p>Tip: combine this ending with a middle-letter filter or excluded letters to cut the list down quickly.</p>`,
    words,
    related: [
      { href: "/5-letter-word-lists/", text: "All 5-letter word lists" },
      { href: slugContainsPair("r", "e"), text: "5-letter words with R and E" },
      { href: "/", text: "Open the solver" },
    ],
  });
}

const middlePages = [];
for (const ch of CURATED_MIDDLE_LETTERS) {
  const words = answers.filter(w => w[2] === ch).sort();
  if (words.length < 25) continue;

  const urlPath = slugMiddle(ch);
  middlePages.push(urlPath);
  const title = `5-letter words with ${ch.toUpperCase()} in the middle`;
  addGeneratedPage(urlPath, {
    title,
    canonical: `${SITE}${urlPath}`,
    description: `${title}. Browse middle-letter matches and move into the solver for tighter filtering.`,
    h1: title,
    introHtml: `<p>Browse <strong>5-letter words with ${ch.toUpperCase()} in the middle</strong>. This pattern is common in Wordle-style searches when the third tile is known.</p>
<p>If you also know the starting letter, ending letter, or excluded letters, open the solver to narrow this list further.</p>`,
    words,
    related: [
      { href: "/5-letter-word-lists/", text: "All 5-letter word lists" },
      { href: slugPrefix("s"), text: "5-letter words starting with S" },
      { href: "/", text: "Open the solver" },
    ],
  });
}

const pairPages = [];
for (const [a, b] of CURATED_PAIRS) {
  const words = answers.filter((w) => w.includes(a) && w.includes(b)).sort();
  if (words.length < 35) continue;

  const urlPath = slugContainsPair(a, b);
  pairPages.push(urlPath);
  const title = `5-letter words with ${a.toUpperCase()} and ${b.toUpperCase()}`;
  addGeneratedPage(urlPath, {
    title,
    canonical: `${SITE}${urlPath}`,
    description: `${title}. Browse matching words, then filter by position with the solver.`,
    h1: title,
    introHtml: `<p>Browse <strong>5-letter words with ${a.toUpperCase()} and ${b.toUpperCase()}</strong>. This is helpful when you know two included letters but not their positions yet.</p>
<p>Use the solver if one of those letters has a fixed position or if you want to remove extra letters from the candidate list.</p>`,
    words,
    related: [
      { href: "/5-letter-word-lists/", text: "All 5-letter word lists" },
      { href: slugSuffix("er"), text: "5-letter words ending in ER" },
      { href: "/", text: "Open the solver" },
    ],
  });
}

const hubUrl = "/5-letter-word-lists/";
const prefixLinks = prefixPages
  .map(p => `<li><a href="${p}">Starting with ${p.at(-2).toUpperCase()}</a></li>`)
  .join("");
const suffixLinks = suffixPages
  .map(p => `<li><a href="${p}">Ending in ${p.split("-").at(-1).replaceAll("/","").toUpperCase()}</a></li>`)
  .join("");
const middleLinks = middlePages
  .map(p => {
    const middleLetter = p.replace(/^\/|\/$/g, "").split("-")[4];
    return `<li><a href="${p}">Middle letter ${middleLetter.toUpperCase()}</a></li>`;
  })
  .join("");
const pairLinks = pairPages
  .map(p => {
    const [, , , , a, , b] = p.replace(/^\/|\/$/g, "").split("-");
    return `<li><a href="${p}">Contains ${a.toUpperCase()} and ${b.toUpperCase()}</a></li>`;
  })
  .join("");

writePageDir(hubUrl, `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>5-letter word lists | LetterPatternSolver</title>
  <meta name="description" content="Browse curated 5-letter word lists by starting letter, ending, middle letter, and included letter pairs." />
  <link rel="canonical" href="${SITE}${hubUrl}" />
  <meta name="robots" content="index,follow" />
  <style>
    :root{
      --bg:#eef2f3;
      --card:#ffffff;
      --text:#12343b;
      --border:#d0d7dc;
      --accent:#1f5a64;
    }
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:var(--bg);color:var(--text)}
    header,footer{padding:16px 20px;background:rgba(255,255,255,.8);border-bottom:1px solid var(--border)}
    footer{border-top:1px solid var(--border);border-bottom:none;margin-top:28px}
    nav,main{max-width:1040px;margin:0 auto}
    nav a, footer a{margin-right:14px;color:var(--accent);text-decoration:none;font-weight:600}
    main{padding:24px 20px}
    .cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    @media (max-width:700px){.cols{grid-template-columns:1fr}}
    .card{padding:18px 20px;border:1px solid var(--border);border-radius:14px;background:var(--card);box-shadow:0 10px 30px rgba(0,0,0,.05)}
  </style>
</head>
<body>
<header>
  <nav>
    <a href="/">Solver</a>
    <a href="/5-letter-word-lists/">Word lists</a>
    <a href="/about.html">About</a>
    <a href="/privacy.html">Privacy</a>
    <a href="/contact.html">Contact</a>
    <a href="/terms.html">Terms</a>
  </nav>
</header>
<main>
  <h1>5-letter word lists</h1>
  <p>These curated pages target common 5-letter word searches: starting letters, common endings, middle-letter patterns, and included-letter combinations. If you need more control, use the <a href="/">solver</a> to filter by exact positions and excluded letters.</p>

  <div class="cols">
    <div class="card">
      <h2>Starting letter</h2>
      <ul>${prefixLinks}</ul>
    </div>
    <div class="card">
      <h2>Common endings</h2>
      <ul>${suffixLinks}</ul>
    </div>
    <div class="card">
      <h2>Middle letter</h2>
      <ul>${middleLinks}</ul>
    </div>
    <div class="card">
      <h2>Contains both letters</h2>
      <ul>${pairLinks}</ul>
    </div>
  </div>
</main>
<footer>
  <a href="/privacy.html">Privacy Policy</a>
  <a href="/about.html">About</a>
  <a href="/contact.html">Contact</a>
  <a href="/terms.html">Terms</a>
</footer>
</body></html>`);
generatedUrls.push(hubUrl);

const urls = [...CORE_PAGES, ...generatedUrls];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}
</urlset>
`;
writeFile(path.join(OUT_ROOT, "sitemap.xml"), sitemap);

console.log(`Generated: ${prefixPages.length} prefix pages, ${suffixPages.length} suffix pages, ${middlePages.length} middle-letter pages, ${pairPages.length} pair pages, hub, and sitemap.xml`);
