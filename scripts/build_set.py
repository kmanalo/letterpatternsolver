from pathlib import Path
from html import escape


SITE = "https://letterpatternsolver.com"
ROOT = Path(__file__).resolve().parent.parent
ANSWERS_PATH = ROOT / "data" / "answers.txt"
CORE_PAGES = [
    "/",
    "/about.html",
    "/privacy.html",
    "/contact.html",
    "/terms.html",
]
CURATED_SUFFIXES = ["er", "ed", "ly", "al", "el", "st", "th", "es", "s"]
CURATED_MIDDLE_LETTERS = ["a", "e", "i", "o", "u", "r", "s", "t"]
CURATED_PAIRS = [
    ("r", "e"),
    ("a", "e"),
    ("s", "t"),
    ("a", "r"),
    ("o", "e"),
    ("i", "e"),
]


def read_word_list(path: Path) -> list[str]:
    return [word.strip().lower() for word in path.read_text().split() if word.strip()]


def write_file(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents)


def page_html(*, title: str, canonical: str, description: str, h1: str, intro_html: str, words: list[str], related: list[dict[str, str]]) -> str:
    word_cards = "".join(f'<li class="word-card">{escape(word)}</li>' for word in words)
    related_links = "".join(
        f'<li><a href="{escape(item["href"], quote=True)}">{escape(item["text"])}</a></li>'
        for item in related
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description, quote=True)}" />
  <link rel="canonical" href="{escape(canonical, quote=True)}" />
  <meta name="robots" content="index,follow" />
  <style>
    :root{{
      --bg:#eef2f3;
      --card:#ffffff;
      --text:#12343b;
      --muted:#587077;
      --border:#d0d7dc;
      --accent:#1f5a64;
    }}
    *{{box-sizing:border-box}}
    body{{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6}}
    header,footer{{padding:16px 20px;background:rgba(255,255,255,.8);border-bottom:1px solid var(--border)}}
    footer{{border-top:1px solid var(--border);border-bottom:none;margin-top:28px}}
    nav{{max-width:1040px;margin:0 auto}}
    nav a, footer a{{margin-right:14px;color:var(--accent);text-decoration:none;font-weight:600}}
    main{{max-width:1040px;margin:0 auto;padding:24px 20px}}
    .card{{padding:18px 20px;border:1px solid var(--border);border-radius:14px;background:var(--card);box-shadow:0 10px 30px rgba(0,0,0,.05)}}
    .meta{{color:var(--muted)}}
    .word-grid{{list-style:none;padding:0;margin:12px 0 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}}
    .word-card{{padding:10px 12px;border-radius:10px;background:#f2f6f7;border:1px solid var(--border);font-weight:700;text-align:center;letter-spacing:.06em}}
    .split{{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:start}}
    .related{{padding-left:18px;margin:10px 0 0}}
    @media (max-width:820px){{.word-grid{{grid-template-columns:repeat(3,minmax(0,1fr))}}.split{{grid-template-columns:1fr}}}}
    @media (max-width:560px){{.word-grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
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
  <h1>{escape(h1)}</h1>
  <div class="split">
    <div class="card">
      {intro_html}
      <p class="meta"><strong>Total matches:</strong> {len(words)}</p>
      <h2>Word list</h2>
      <ul class="word-grid">{word_cards}</ul>
    </div>
    <aside class="card">
      <h2>Related pages</h2>
      <ul class="related">{related_links}</ul>
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
</html>"""


def slug_prefix(ch: str) -> str:
    return f"/5-letter-words-starting-with-{ch}/"


def slug_suffix(suffix: str) -> str:
    return f"/5-letter-words-ending-in-{suffix}/"


def slug_middle(ch: str) -> str:
    return f"/5-letter-words-with-{ch}-in-the-middle/"


def slug_contains_pair(a: str, b: str) -> str:
    return f"/5-letter-words-with-{a}-and-{b}/"


def write_page_dir(url_path: str, html: str) -> None:
    target = ROOT / url_path.strip("/") / "index.html"
    write_file(target, html)


def build() -> None:
    answers = sorted(word for word in read_word_list(ANSWERS_PATH) if len(word) == 5)
    generated_urls: list[str] = []
    prefix_pages: list[str] = []
    suffix_pages: list[str] = []
    middle_pages: list[str] = []
    pair_pages: list[str] = []

    def add_generated_page(url_path: str, **kwargs: str | list[str] | list[dict[str, str]]) -> None:
        write_page_dir(url_path, page_html(**kwargs))
        generated_urls.append(url_path)

    for ch in "abcdefghijklmnopqrstuvwxyz":
        words = [word for word in answers if word.startswith(ch)]
        if len(words) < 15:
            continue
        url_path = slug_prefix(ch)
        prefix_pages.append(url_path)
        title = f"5-letter words starting with {ch.upper()}"
        add_generated_page(
            url_path,
            title=title,
            canonical=f"{SITE}{url_path}",
            description=f"{title}. Browse the list, then use the solver to narrow by position or excluded letters.",
            h1=title,
            intro_html=(
                f"<p>Browse <strong>5-letter words starting with {ch.upper()}</strong>. "
                "These pages are useful when you know the first letter but still need to narrow the rest of the pattern.</p>"
                "<p>After browsing this list, use the solver to lock in exact positions, include extra letters, "
                "or remove gray-letter candidates.</p>"
            ),
            words=words,
            related=[
                {"href": "/5-letter-word-lists/", "text": "All 5-letter word lists"},
                {"href": slug_middle("a"), "text": "5-letter words with A in the middle"},
                {"href": "/", "text": "Open the solver"},
            ],
        )

    for suffix in CURATED_SUFFIXES:
        words = [word for word in answers if word.endswith(suffix)]
        if len(words) < 30:
            continue
        url_path = slug_suffix(suffix)
        suffix_pages.append(url_path)
        title = f"5-letter words ending in {suffix.upper()}"
        add_generated_page(
            url_path,
            title=title,
            canonical=f"{SITE}{url_path}",
            description=f"{title}. Browse the list and use endings to narrow puzzle guesses faster.",
            h1=title,
            intro_html=(
                f"<p>Browse <strong>5-letter words ending in {suffix.upper()}</strong>. "
                "Ending patterns are especially useful when you know the final tile or a common suffix.</p>"
                "<p>Tip: combine this ending with a middle-letter filter or excluded letters to cut the list down quickly.</p>"
            ),
            words=words,
            related=[
                {"href": "/5-letter-word-lists/", "text": "All 5-letter word lists"},
                {"href": slug_contains_pair("r", "e"), "text": "5-letter words with R and E"},
                {"href": "/", "text": "Open the solver"},
            ],
        )

    for ch in CURATED_MIDDLE_LETTERS:
        words = [word for word in answers if word[2] == ch]
        if len(words) < 25:
            continue
        url_path = slug_middle(ch)
        middle_pages.append(url_path)
        title = f"5-letter words with {ch.upper()} in the middle"
        add_generated_page(
            url_path,
            title=title,
            canonical=f"{SITE}{url_path}",
            description=f"{title}. Browse middle-letter matches and move into the solver for tighter filtering.",
            h1=title,
            intro_html=(
                f"<p>Browse <strong>5-letter words with {ch.upper()} in the middle</strong>. "
                "This pattern is common in Wordle-style searches when the third tile is known.</p>"
                "<p>If you also know the starting letter, ending letter, or excluded letters, open the solver to narrow this list further.</p>"
            ),
            words=words,
            related=[
                {"href": "/5-letter-word-lists/", "text": "All 5-letter word lists"},
                {"href": slug_prefix('s'), "text": "5-letter words starting with S"},
                {"href": "/", "text": "Open the solver"},
            ],
        )

    for a, b in CURATED_PAIRS:
        words = [word for word in answers if a in word and b in word]
        if len(words) < 35:
            continue
        url_path = slug_contains_pair(a, b)
        pair_pages.append(url_path)
        title = f"5-letter words with {a.upper()} and {b.upper()}"
        add_generated_page(
            url_path,
            title=title,
            canonical=f"{SITE}{url_path}",
            description=f"{title}. Browse matching words, then filter by position with the solver.",
            h1=title,
            intro_html=(
                f"<p>Browse <strong>5-letter words with {a.upper()} and {b.upper()}</strong>. "
                "This is helpful when you know two included letters but not their positions yet.</p>"
                "<p>Use the solver if one of those letters has a fixed position or if you want to remove extra letters from the candidate list.</p>"
            ),
            words=words,
            related=[
                {"href": "/5-letter-word-lists/", "text": "All 5-letter word lists"},
                {"href": slug_suffix('er'), "text": "5-letter words ending in ER"},
                {"href": "/", "text": "Open the solver"},
            ],
        )

    prefix_links = "".join(
        f'<li><a href="{page}">Starting with {page.strip("/").split("-")[-1].upper()}</a></li>'
        for page in prefix_pages
    )
    suffix_links = "".join(
        f'<li><a href="{page}">Ending in {page.strip("/").split("-")[-1].upper()}</a></li>'
        for page in suffix_pages
    )
    middle_links = "".join(
        f'<li><a href="{page}">Middle letter {page.strip("/").split("-")[4].upper()}</a></li>'
        for page in middle_pages
    )
    pair_links = "".join(
        f'<li><a href="{page}">Contains {page.strip("/").split("-")[4].upper()} and {page.strip("/").split("-")[6].upper()}</a></li>'
        for page in pair_pages
    )

    hub_url = "/5-letter-word-lists/"
    write_page_dir(
        hub_url,
        f"""<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>5-letter word lists | LetterPatternSolver</title>
  <meta name="description" content="Browse curated 5-letter word lists by starting letter, ending, middle letter, and included letter pairs." />
  <link rel="canonical" href="{SITE}{hub_url}" />
  <meta name="robots" content="index,follow" />
  <style>
    :root{{
      --bg:#eef2f3;
      --card:#ffffff;
      --text:#12343b;
      --border:#d0d7dc;
      --accent:#1f5a64;
    }}
    body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:var(--bg);color:var(--text)}}
    header,footer{{padding:16px 20px;background:rgba(255,255,255,.8);border-bottom:1px solid var(--border)}}
    footer{{border-top:1px solid var(--border);border-bottom:none;margin-top:28px}}
    nav,main{{max-width:1040px;margin:0 auto}}
    nav a, footer a{{margin-right:14px;color:var(--accent);text-decoration:none;font-weight:600}}
    main{{padding:24px 20px}}
    .cols{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}
    @media (max-width:700px){{.cols{{grid-template-columns:1fr}}}}
    .card{{padding:18px 20px;border:1px solid var(--border);border-radius:14px;background:var(--card);box-shadow:0 10px 30px rgba(0,0,0,.05)}}
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
      <ul>{prefix_links}</ul>
    </div>
    <div class="card">
      <h2>Common endings</h2>
      <ul>{suffix_links}</ul>
    </div>
    <div class="card">
      <h2>Middle letter</h2>
      <ul>{middle_links}</ul>
    </div>
    <div class="card">
      <h2>Contains both letters</h2>
      <ul>{pair_links}</ul>
    </div>
  </div>
</main>
<footer>
  <a href="/privacy.html">Privacy Policy</a>
  <a href="/about.html">About</a>
  <a href="/contact.html">Contact</a>
  <a href="/terms.html">Terms</a>
</footer>
</body></html>""",
    )
    generated_urls.append(hub_url)

    urls = CORE_PAGES + generated_urls
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "\n".join(f"  <url><loc>{SITE}{url}</loc></url>" for url in urls)
    sitemap += "\n</urlset>\n"
    write_file(ROOT / "sitemap.xml", sitemap)

    print(
        "Generated:",
        f"{len(prefix_pages)} prefix pages,",
        f"{len(suffix_pages)} suffix pages,",
        f"{len(middle_pages)} middle-letter pages,",
        f"{len(pair_pages)} pair pages,",
        "hub, and sitemap.xml",
    )


if __name__ == "__main__":
    build()
