console.log("build-seo running");

// scripts/build-seo.mjs
import fs from "node:fs";
import path from "node:path";

const SITE = "https://letterpatternsolver.com";
const OUT_ROOT = "."; // write into repo root for Pages
const ANSWERS_PATH = path.join("data", "answers.txt");

// ---- helpers ----
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readWordList(p) {
  // Handles either newline-separated OR single-line space-separated lists
  const raw = fs.readFileSync(p, "utf8").trim();
  return raw.split(/\s+/).map(w => w.trim().toLowerCase()).filter(Boolean);
}

function writeFile(p, contents) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, contents);
}

function pageHtml({ title, canonical, description, h1, introHtml, words, related }) {
  const wordLis = words.map(w => `<li>${w}</li>`).join("");
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
    :root { color-scheme: light dark; }
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0}
    header,footer{padding:12px 16px;background:rgba(127,127,127,.12)}
    header a, footer a{margin-right:12px}
    main{max-width:980px;margin:0 auto;padding:16px}
    .meta{opacity:.8}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    @media (max-width:820px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media (max-width:560px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    ul{padding-left:18px;margin:8px 0}
    .card{padding:12px 14px;border:1px solid rgba(127,127,127,.25);border-radius:10px}
  </style>
</head>
<body>
<header>
  <a href="/">Solver</a>
  <a href="/5-letter-word-lists/">Word lists</a>
  <a href="/about/">About</a>
  <a href="/privacy/">Privacy</a>
  <a href="/contact/">Contact</a>
</header>

<main>
  <h1>${escapeHtml(h1)}</h1>
  <div class="card">
    ${introHtml}
    <p class="meta"><strong>Total:</strong> ${words.length}</p>
  </div>

  <h2>Words</h2>
  <div class="grid"><ul>${wordLis}</ul></div>

  <h2>Related</h2>
  <ul>${relatedLis}</ul>

  <p class="meta">Tip: For more control (known letters, exclusions, positions), use the <a href="/">solver</a>.</p>
</main>

<footer>
  <a href="/privacy/">Privacy Policy</a>
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

function writePageDir(urlPath, html) {
  const dir = path.join(OUT_ROOT, urlPath.replace(/^\/|\/$/g, ""));
  writeFile(path.join(dir, "index.html"), html);
}

// ---- build ----
const answers = readWordList(ANSWERS_PATH).filter(w => w.length === 5);

// A–Z prefix pages
const prefixPages = [];
for (const ch of "abcdefghijklmnopqrstuvwxyz") {
  const words = answers.filter(w => w.startsWith(ch)).sort();
  if (words.length < 15) continue; // avoid thin pages

  const urlPath = slugPrefix(ch);
  prefixPages.push(urlPath);

  const canonical = `${SITE}${urlPath}`;
  const title = `5-letter words starting with ${ch.toUpperCase()}`;
  writePageDir(urlPath, pageHtml({
    title,
    canonical,
    description: `${title}. Browse the word list and narrow puzzles faster.`,
    h1: title,
    introHtml: `<p>Browse <strong>5-letter words starting with ${ch.toUpperCase()}</strong>. Useful for Wordle-style puzzles and pattern matching.</p>
<p>Combine this with excluded letters in the solver to narrow results quickly.</p>`,
    words,
    related: [
      { href: "/5-letter-word-lists/", text: "All 5-letter word lists" },
      { href: "/", text: "Open the solver" },
    ]
  }));
}

// Curated suffix pages (start conservative)
const suffixes = ["er","ed","ly","al","el","st","th","es","s"];
const suffixPages = [];
for (const suf of suffixes) {
  const words = answers.filter(w => w.endsWith(suf)).sort();
  if (words.length < 30) continue;

  const urlPath = slugSuffix(suf);
  suffixPages.push(urlPath);

  const canonical = `${SITE}${urlPath}`;
  const title = `5-letter words ending in ${suf.toUpperCase()}`;
  writePageDir(urlPath, pageHtml({
    title,
    canonical,
    description: `${title}. Browse the word list and filter patterns faster.`,
    h1: title,
    introHtml: `<p>Browse <strong>5-letter words ending in ${suf.toUpperCase()}</strong>.</p>
<p>Tip: endings often constrain vowel placement—use the solver to lock the middle letters.</p>`,
    words,
    related: [
      { href: "/5-letter-word-lists/", text: "All 5-letter word lists" },
      { href: "/", text: "Open the solver" },
    ]
  }));
}

// Hub page
const hubUrl = "/5-letter-word-lists/";
const prefixLinks = prefixPages
  .map(p => `<li><a href="${p}">Starting with ${p.at(-2).toUpperCase()}</a></li>`)
  .join("");
const suffixLinks = suffixPages
  .map(p => `<li><a href="${p}">Ending in ${p.split("-").at(-1).replaceAll("/","").toUpperCase()}</a></li>`)
  .join("");

writePageDir(hubUrl, `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>5-letter word lists | LetterPatternSolver</title>
  <meta name="description" content="Browse curated 5-letter word lists by starting letter and common endings." />
  <link rel="canonical" href="${SITE}${hubUrl}" />
  <meta name="robots" content="index,follow" />
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0}
    header,footer{padding:12px 16px;background:rgba(127,127,127,.12)}
    header a, footer a{margin-right:12px}
    main{max-width:980px;margin:0 auto;padding:16px}
    .cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    @media (max-width:700px){.cols{grid-template-columns:1fr}}
    .card{padding:12px 14px;border:1px solid rgba(127,127,127,.25);border-radius:10px}
  </style>
</head>
<body>
<header>
  <a href="/">Solver</a>
  <a href="/5-letter-word-lists/">Word lists</a>
  <a href="/about/">About</a>
  <a href="/privacy/">Privacy</a>
  <a href="/contact/">Contact</a>
</header>
<main>
  <h1>5-letter word lists</h1>
  <p>These curated pages target common searches (starting letters and popular endings). For full pattern control, use the <a href="/">solver</a>.</p>

  <div class="cols">
    <div class="card">
      <h2>Starting letter</h2>
      <ul>${prefixLinks}</ul>
    </div>
    <div class="card">
      <h2>Common endings</h2>
      <ul>${suffixLinks}</ul>
    </div>
  </div>
</main>
<footer><a href="/privacy/">Privacy Policy</a></footer>
</body></html>`);

// Build sitemap.xml including hub + generated pages + core pages
const urls = [
  "/",
  hubUrl,
  "/about/",
  "/privacy/",
  "/contact/",
  ...prefixPages,
  ...suffixPages
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}
</urlset>
`;
writeFile(path.join(OUT_ROOT, "sitemap.xml"), sitemap);

console.log(`Generated: ${prefixPages.length} prefix pages, ${suffixPages.length} suffix pages, hub, and sitemap.xml`);
