<h1 align="center">
  <a href="https://complite.jcubic.pl/" target="_blank" rel="noopener">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/jcubic/complite/blob/master/.github/logo-dark.svg?raw=true" />
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/jcubic/complite/blob/master/.github/logo-light.svg?raw=true" />
      <img alt="Complite Elventy starter logo" src="https://github.com/jcubic/complite/blob/master/.github/logo-light.svg?raw=true" height="400" />
    </picture>
  </a>
</h1>

[![CI/CD](https://github.com/jcubic/complite/actions/workflows/ci.yaml/badge.svg)](https://github.com/jcubic/complite/actions/workflows/ci.yaml)
[![Complite GitHub repo](https://img.shields.io/badge/github-repo-orange?logo=github)](https://github.com/jcubic/complite)
[![LICENSE MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jcubic/complite/blob/master/LICENSE)

**A complete Eleventy blogging solution. SEO / GEO / AI ready.**

Zero client-side JavaScript by default. Full dark mode. SEO-ready with JSON-LD, Open Graph,
sitemaps, and RSS. GEO-optimized with structured data for local and global discoverability.
AI-ready with llms.txt, content negotiation, and machine-readable markdown views.
Full-text search powered by SQLite and PHP. An optional PHP contact form with honeypot
anti-spam. Everything you need to start writing — nothing you need to strip out.

## Features

- **Eleventy 3** with ESM, Liquid templates, and Markdown blog posts
- **CSS-first dark mode** — three-layer priority system using CSS `:has()` with radio buttons,
  no JavaScript required for theme switching
- **Full-text search** — SQLite FTS5 index built at compile time, PHP search handler with
  fuzzy matching cascade and BM25 ranking
- **JSON-LD structured data** — Person, WebSite, BlogPosting, BreadcrumbList, FAQPage schemas
- **Open Graph and Twitter Cards** — full meta tags for social sharing
- **Dynamic social card images** — SVG-based OG images generated per blog post
- **RSS 2.0 feed** with XSL stylesheet for human-readable browser rendering
- **XML sitemap** with automatic `lastmod` from git history
- **llms.txt** — LLM agent discovery with per-page markdown views
- **Content negotiation** — serve markdown to clients that send `Accept: text/markdown`
  (Apache `.htaccess`)
- **Syntax highlighting** — Prism via `@11ty/eleventy-plugin-syntaxhighlight` with theme colors
  that follow the dark mode system
- **HTML and CSS minification** in production (html-minifier-next + Terser for inline JS,
  clean-css for external stylesheets)
- **Computed modified dates** from git history with a global site-wide floor
- **PHP contact form** — honeypot anti-spam, input sanitization, open redirect prevention,
  mock email fallback for local development
- **Docker setup** for local development with PHP and Apache
- **Clean URLs** — directory-style (`/blog/my-post/` not `/blog/my-post.html`)
- **No client-side JavaScript required** — JS only adds localStorage theme persistence and
  mobile navigation; everything works without it
- **ESLint** for Markdown files
- **GitHub Actions** CI workflow

## Quick Start

**Requirements:** Node.js 18+ and npm.

```
git clone https://github.com/jcubic/complite.git
cd complite
npm install
npm run dev
```

The dev server starts at `http://localhost:8080/`. Edit files in `src/` and the site rebuilds
automatically.

### Build for production

```
npm run build
```

The output goes to `_site/`. It is a fully self-contained static site that can be deployed to
any static hosting provider.

## Configuration

All site metadata lives in `src/_data/`:

- **`site.json`** — site title, description, URL, language, default author, email, founding date
- **`users.json`** — author profiles keyed by nickname (name, bio, photo, social links)
- **`person.json`** — JSON-LD Person schema for the site owner

Update `site.json` with your domain before deploying. The `url` field is used for canonical URLs,
Open Graph tags, sitemaps, and RSS.

The `modified` field in `site.json` is a site-wide floor date. Update it whenever a non-content
change (CSS, layout, config) affects all pages — this ensures the sitemap reflects the change.

## Writing Posts

Create Markdown files in `src/blog/posts/`. Each post needs front matter:

- `title` — post title
- `description` — used in meta tags and post cards
- `date` — publication date (YYYY-MM-DD)
- `author` — nickname matching a key in `users.json`
- `tags` — array of tags (these generate tag archive pages automatically)
- `keywords` — comma-separated, used in meta keywords tag

Optional front matter:

- `modified` — explicit last-modified date (overrides git-inferred date)
- `featuredImage` — path to cover image (used in Open Graph meta tags only, not displayed
  in the article body)
- `unlisted: true` — adds `noindex, nofollow` and excludes from collections
- `faq` — array of `{question, answer}` objects, generates FAQPage JSON-LD schema

## Search

complite includes a full-text search system powered by SQLite FTS5 and PHP.

### How it works

1. **At build time**, Eleventy runs `scripts/build-search-index.mjs` after generating the site.
   The script walks all HTML files in `_site/`, extracts titles and content (stripping
   navigation, headers, footers), and inserts them into a SQLite database with an FTS5 virtual
   table using the `unicode61` tokenizer.

2. **At request time**, the PHP search handler (`src/static/search/index.php`) reads the
   built HTML search page and replaces a `<!-- search-results-placeholder -->` comment with
   search results. It uses a three-tier fuzzy search cascade:
   - **Tier 1:** FTS5 MATCH with all terms ANDed using prefix expansion (`"word"*`)
   - **Tier 2:** FTS5 MATCH with terms ORed using prefix expansion (if AND returned nothing)
   - **Tier 3:** SQL `LIKE` fallback for partial substring matching

   Results are ranked using FTS5's `bm25()` function, and matching context is extracted via
   `snippet()` with `<mark>` highlighting.

### Environment control

Search indexing is controlled by the `SEARCH_INDEX` environment variable:

| Scenario | Command | Behavior |
|----------|---------|----------|
| Production build (default) | `npm run build` | Index is built automatically |
| Development (default) | `npm run dev` | No indexing (faster rebuilds) |
| Force indexing in dev | `SEARCH_INDEX=1 npm run dev` | Index is built on every rebuild |
| Disable indexing entirely | `SEARCH_INDEX=0 npm run build` | No index even in production |

The search page at `/search/` works without the index — it displays a message asking the user
to rebuild with indexing enabled. This means development mode works normally without waiting
for index rebuilds.

### Requirements

The search page requires:
- **PHP 8.0+** with the SQLite3 extension (included by default in most PHP builds)
- **Apache** with `mod_rewrite` for the `/search/` → `index.php` rewrite

The `.htaccess` file blocks direct access to the `search.db` file (returns 403 Forbidden).

### Without search

If you don't need search, set `SEARCH_INDEX=0` in your build environment and remove the
search icon from the nav partial. The rest of the site is unaffected.

## Dark Mode

The theme system has three layers of priority, each overriding the one below:

1. **System preference** (CSS only) — `@media (prefers-color-scheme: dark)` applies dark
   variables automatically. No JavaScript needed.
2. **JavaScript `data-theme` attribute** — on page load, JavaScript reads the user's saved
   preference from localStorage and sets `data-theme="dark"` or `data-theme="light"` on `<html>`.
   This overrides the system preference.
3. **CSS `:has()` radio buttons** (CSS only, highest priority) — the theme toggle is a pair of
   hidden radio inputs. When a user clicks the sun/moon label, CSS `:has(#mode_dark:checked)`
   or `:has(#mode_light:checked)` applies the correct variables instantly, with no JavaScript
   involved.

The result: the site works fully without JavaScript (system preference), clicking the toggle
works without JavaScript (CSS `:has()`), and JavaScript only adds persistence across page loads
via localStorage.

## SEO

### JSON-LD

Structured data is injected as `application/ld+json` script blocks:

- **Homepage** — `@graph` with Person, WebPage, WebSite, BreadcrumbList
- **Blog posts** — `@graph` with Person, BlogPosting (dates, author, headline, image,
  speakable), WebPage, Blog, WebSite, BreadcrumbList
- **Author pages** — Person with sameAs links, ProfilePage

Add `faq` to a post's front matter to generate a FAQPage schema automatically.

### Open Graph and Twitter Cards

Every page outputs `og:title`, `og:description`, `og:image`, `og:url`, and `og:type`. Blog
posts additionally include `article:published_time`, `article:modified_time`, and
`article:author`. Twitter Card tags use `summary_large_image`.

### Sitemap

`/sitemap.xml` is generated from all pages. The `lastmod` date is computed from the newer of
the page's git commit date and the global `site.modified` floor. Pages with
`eleventyExcludeFromCollections` or `unlisted: true` are excluded.

### RSS

`/feed.xml` is an RSS 2.0 feed with an Atom self-link. It includes a
[pretty-feed XSL stylesheet](/src/static/pretty-feed.xsl) so the feed is human-readable in
browsers. Post links include UTM parameters for tracking.

### robots.txt

The default `robots.txt` allows all crawlers including AI bots (GPTBot, ClaudeBot,
Google-Extended, Applebot-Extended). Edit `src/static/robots.txt` to restrict access.

## llms.txt

The site generates [llms.txt](https://llmstxt.org/) for LLM agent discovery:

- `/llms.txt` — index with site description and links to all pages in markdown format
- `/blog/{slug}.md` — raw markdown for each blog post
- `/about.md`, `/blog.md`, `/contact.md`, `/privacy.md` — markdown views of static pages
- `/llms-full.txt` — full text of the entire site in one file

Content negotiation via `.htaccess` also serves the markdown version when a client sends
`Accept: text/markdown`.

## Social Cards

Blog posts get auto-generated Open Graph images via
[`eleventy-plugin-svg-social-card`](https://github.com/jcubic/eleventy-plugin-svg-social-card).
The plugin renders the SVG template in `src/card/social-card.svg` with per-post data (title,
author, date) in a headless Chromium and screenshots it to a 1200×630 PNG. The `{% card "emit" %}`
shortcode in `head.liquid` returns the URL for `og:image` and `twitter:image` meta tags.

Customize the card design by editing the SVG template. A static fallback image
(`src/static/img/social-card.png`) is used for non-article pages.

## Contact Form (PHP)

The contact form is the only feature that requires a server-side runtime. Everything else is
purely static.

**Requirements for the contact form:** Apache with `mod_rewrite` and `mod_headers`, PHP 8.0+,
and Composer.

### Setup

Install PHP dependencies:

```
composer install
```

Copy the example config and edit it with your email:

```
cp api/config.example.json api/config.json
```

Edit `api/config.json`:

```json
{
    "contact_email": "you@example.com",
    "site_url": "https://yourdomain.com/"
}
```

If `api/config.json` is missing, the contact form will display an error telling the user to set
up the configuration.

### How it works

- The contact page is output as `.php` (not `.html`) so it can inject form feedback messages
- Eleventy generates the HTML, and a thin PHP wrapper reads it and replaces a
  `<!-- form-message-placeholder -->` comment with success/error messages
- The form handler (`api/contact/index.php`) validates input, checks the honeypot field, sanitizes
  headers against injection, and sends the email via PHP `mail()`
- On local development without a mail server, emails are saved to `api/mail/` as HTML files
  (mock mail fallback)
- Bot attempts are logged to `api/logs/bot.log`

### Security

- Honeypot hidden field to catch bots
- Header injection prevention (`sanitizeHeader()` strips CR/LF)
- Open redirect prevention (`sanitizeRedirectUrl()` validates path prefix)
- `config.json`, `api/lib/`, `api/logs/`, and `api/mail/` are blocked by `.htaccess`

### Without PHP

If you don't need the contact form or search, and deploy to a platform without PHP (Netlify,
Vercel, Cloudflare Pages), simply remove the `src/contact/` and `src/static/search/` directories
and the `api/` directory. The rest of the site works as a purely static site with no server-side
dependencies.

## Local Development with Docker

Docker provides a local Apache + PHP environment for testing the contact form, search,
`.htaccess` rules, and content negotiation.

**Requirements:** Docker and Docker Compose.

```
npm run build
docker compose up -d
```

The site is available at `http://localhost:8080/`. The `_site/` directory is mounted as a
volume, so rebuilding with `npm run build` updates the site without restarting the container.

To stop:

```
docker compose down
```

## Content Negotiation (.htaccess)

The included `.htaccess` file provides:

- Markdown content negotiation — `Accept: text/markdown` serves `.md` files
- HTTP `Link` headers pointing to the sitemap and llms.txt
- Search page rewrite — `/search/` routes to `index.php`
- Custom 404 page
- Security rules blocking access to config files, PHP libraries, logs, vendor directory,
  and `.db` files

This requires Apache with `mod_rewrite` and `mod_headers`. If you deploy to Nginx, Netlify,
Vercel, or another platform, you will need equivalent configuration for your server.

## Project Structure

```
complite/
├── .eleventy.js                 # Eleventy configuration (collections, filters, transforms)
├── package.json
├── composer.json                # PHP dependencies (only needed for contact form)
├── Dockerfile                   # Apache + PHP for local dev
├── docker-compose.yaml
├── api/                         # PHP backend (contact form)
│   ├── contact/index.php        # Form handler
│   ├── lib/common.php           # Shared utilities (config, email, security)
│   ├── config.example.json      # Copy to config.json with your settings
│   └── logs/                    # Bot attempt logs (gitignored)
├── scripts/                     # Build and validation scripts
│   ├── build-search-index.mjs   # SQLite FTS5 indexer (runs after build)
│   ├── validate-jsonld.mjs
│   └── validate-social-card.mjs
├── src/
│   ├── _data/                   # Site metadata
│   │   ├── site.json            # Title, URL, description, author
│   │   ├── users.json           # Author profiles
│   │   └── person.json          # JSON-LD Person schema
│   ├── _includes/
│   │   ├── head.liquid          # <head> with meta, OG, fonts, CSS
│   │   ├── layouts/             # Page layouts (base, home, article, blog, author, ...)
│   │   └── partials/            # Reusable components (nav, footer, post-card, schemas, ...)
│   ├── blog/posts/              # Markdown blog articles
│   ├── authors/                 # Author profile pages
│   ├── static/                  # Copied to output root
│   │   ├── css/style.css        # Single stylesheet with dark mode variables
│   │   ├── css/prism-tomorrow.css # Syntax highlighting (uses CSS variables)
│   │   ├── favicon/             # Favicon set (SVG, PNG, ICO, webmanifest)
│   │   ├── img/                 # Images and avatars
│   │   ├── search/index.php     # PHP search handler (fuzzy FTS5 + LIKE fallback)
│   │   ├── .htaccess            # Content negotiation + security + search rewrite
│   │   ├── robots.txt
│   │   ├── pretty-feed.xsl     # RSS stylesheet
│   │   └── contact/index.php   # PHP wrapper for form messages
│   ├── card/social-card.svg     # OG image SVG template
│   ├── index.liquid             # Homepage
│   ├── search.liquid            # Search page
│   ├── about.md                 # About page
│   ├── privacy.md               # Privacy policy
│   ├── 404.md                   # Not found page
│   ├── sitemap.liquid           # XML sitemap
│   ├── feed.liquid              # RSS feed
│   ├── llms.txt.liquid          # LLM discovery index
│   ├── llms-posts.liquid        # Per-post markdown views
│   ├── llms-full.txt.liquid     # Full site text
│   └── src.11tydata.js          # Computed modified dates from git
└── _site/                       # Build output (gitignored)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with live reload |
| `npm run build` | Production build to `_site/` (includes search index) |
| `npm run watch` | Build and watch for changes (no server) |
| `npm run lint` | Lint Markdown files with ESLint |

## License

Copyright (c) 2026 [Jakub T. Jankiewicz](https://jakub.jankiewicz.org/)

Released under the MIT License. See [LICENSE](LICENSE) for details.
